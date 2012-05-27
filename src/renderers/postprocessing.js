/**
 * WebGL post-processing tricks module.
 *
 * These effects are bound to Krusovice world model - what kind of objects there is (photo frame etc.)
 * and cannot be re-used as is.
 *
 */

/*global define, window, jQuery, document, setTimeout, console, $, krusovice */

define(["krusovice/thirdparty/jquery-bundle", "krusovice/thirdparty/three-bundle"],
function($, THREE) {

    "use strict";

    /**
     * Rendering pre- and post-processing effects on the scene.
     */
    function PostProcessor() {
    }

    PostProcessor.prototype = {

        /** THREE rendering instance (not our show renderer) */
        renderer : null,

        /** All polygons will use special material - mostly used for speed in Stencil tests */
        overrideMaterial : null,

        init : function(renderer, width, height) {

            if(!renderer) {
                throw new Error("Must give proper THREE.Renderer instance");
            }

            this.renderer = renderer;
            this.width = width;
            this.height = height;
            this.passes = [];
        },

        /**
         * Add one effect to the chain.
         *
         */
        addPass : function(effect) {
            this.passes.push(effect);
        },

        /**
         * Prepare for rendering. Must be called after all passes have been added to the chain.
         *
         */
        prepare : function() {
            var self = this,
                rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};

            this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, rtParameters);

            this.passes.forEach(function(e) {
                e.init(self.renderer);
            });

            // Set renderer to play along with our stencil buffer pipeline
            this.renderer.autoClear = false;
            //this.autoClearColor = true;
            //this.autoClearDepth = true;
            //this.autoClearStencil = true;
        },

        renderPass : function(pass, renderTarget, scene, camera) {
            pass.render(renderTarget, scene, camera);
        },


        /**
         * Main scene renderer function.
         *
         * Take over rendering control from the main rendering functoin.
         *
         * @param  {Canvas} frontBuffer Where all the result goes
         */
        render : function(frontBuffer, scene, camera) {
            var self = this;

            // color + depth + stencil
            this.renderer.clear(true, true, true);

            var i;

            for(i=0; i<this.passes.length; i++) {
                var pass = this.passes[i];
                var target = this.renderTarget;
                this.renderPass(pass, target, scene, camera);
            }

            // Dump WebGL canvas on 2D canvas
            frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
        },

        /**
         * Monkey-patch the renderer instance to use our functions
         *
         */
        takeOver : function(krusoviceRenderer) {

            var self = this;

            function renderGL(frontBuffer) {
                /*jshint validthis:true */
                self.render(frontBuffer, this.scene, this.camera);
            }

            krusoviceRenderer.renderGL = renderGL;
        }
    };


    /**
     * Base class for post processors
     */
    function PostProcessingPass() {
    }

    PostProcessingPass.prototype = {

        renderer : null,

        /** Fill stencil with 0xff00ff color */
        stencilDebug : false,


        init : function(renderer) {
            this.renderer = renderer;
        },

        /**
         * Iterate scene and extract all materials out of it.
         *
         * XXX: Replace this with your own material registry.
         *
         * XXX: Use https://github.com/mrdoob/three.js/blob/master/src/extras/SceneUtils.js#L13
         */
        getMaterials : function(scene) {

            var materials = [];

            scene.children.forEach(function(child) {

                if(!child.geometry) {
                    // Light or something
                    return;
                }

                child.geometry.materials.forEach(function(material) {
                    if($.inArray(material, materials)) {
                        materials.push(material);
                    }
                });
            });

            return materials;
        },

        /**
         * Render the world with selected options.
         *
         * @param  {THREE.WebGLRenderTarget} renderTarget
         *
         * @oaram {Object} layers { frame : true, photo : true }
         */
        renderWorld : function(renderTarget, scene, camera, layers) {

            //scene.overrideMaterial = this.overrideMaterial;

            // Prepare what is visible in this pass
            //

            THREE.SceneUtils.traverseHierarchy(scene, function(object) {

                if(!(object instanceof THREE.Mesh)) {
                    // Skip lights and stuff
                    return;
                }

                var hint = object.krusoviceTypeHint;

                if(!hint) {
                    console.log(object);
                    throw new Error("Scene object lacks Krusovice post-processing rendering hints");
                }

                // Is the material layer on or off
                if(layers[hint]) {
                    //console.log("Visible:" + hint);
                    object.visible = true;
                } else {
                    //console.log("invisible:" + hint);
                    object.visible = false;
                }
            });

            this.renderer.render(scene, camera);
        },

        /**
         * Indicate how we are going to utilize the rendering mask
         */
        setMaskMode : function(mode) {

            var context = this.renderer.context;

            if(mode == "fill" || mode == "negative-fill") {

                // This draw pass will lit stencil pixels, not normal pixels
                if(this.stencilDebug) {
                    // Render output visually
                    context.colorMask(true, true, true, true);
                } else {
                    // Don't touch RGBA data
                    context.colorMask(false, false, false, false);
                }

                context.depthMask(false);
                context.disable(context.STENCIL_TEST);
                context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE);

                context.stencilFunc(context.ALWAYS, mode == "fill" ? 1 : 0, 0xffffffff );

                this.overrideMaterial = new THREE.MeshBasicMaterial( { color : mode == "fill" ? 0xff00ff : 0x00ff00 } );
            }  else if(mode == "clip") {
                // Only draw the effect on the pixels stenciled before
                context.enable(context.STENCIL_TEST);
                context.stencilFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
                context.stencilOp( context.KEEP, context.KEEP, context.KEEP );
                this.overrideMaterial = null;
            } else {
                // Normal
                context.colorMask(true, true, true, true);
                context.depthMask(true);
                context.disable(context.STENCIL_TEST);
                this.overrideMaterial = null;
            }
        }
    };

    /**
     * WebGL effec composer which renders Sepia + Noise on the image itself
     */
    function SepiaPass(renderer) {
        this.renderer = renderer;
    }

    /**
     *
     *
     */
    $.extend(SepiaPass.prototype, PostProcessingPass.prototype, {

        render : function(renderTarget, scene, camera) {

            if(!this.renderer) {
                throw new Error("Effect was never given a proper Renderer instance");
            }

            // Draw frame as is
            this.setMaskMode("normal");
            this.renderWorld(renderTarget, scene, camera, { frame : true, photo : false });


            // Set mask to photo
            this.setMaskMode("fill");
            this.renderWorld(renderTarget, scene, camera, { photo : true });


            this.setMaskMode("negative-fill");
            this.renderWorld(renderTarget, scene, camera, { frame : true });

            //this.setMaskMode("clip");
            //this.renderWorld(renderTarget, scene, camera, { photo : true });
        }

    });


    // Module exports
    return {
            PostProcessor : PostProcessor,
            SepiaPass : SepiaPass
    };


});