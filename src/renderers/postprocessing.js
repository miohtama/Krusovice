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
            this.renderer.clear();

            var i;

            for(i=0; i<this.passes.length; i++) {
                var pass = this.passes[i];
                var target = this.renderTarget;
                this.renderPass(pass, target, scene, camera);
            }

            console.log(this.renderer.info);

            if(this.renderer.info.render.faces > 0) {
                console.log("Ok");
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
            var materials = this.getMaterials(scene);

            materials.forEach(function(material) {

                var hint = material.krusoviceMaterialHint;

                if(!hint) {
                    console.log(material);
                    throw new Error("Scene material lacks Krusovice post-processing rendering hints");
                }

                // Is the material layer on or off
                if(layers[hint]) {
                    //console.log("Visible:" + hint);
                    material.visible = true;
                } else {
                    //console.log("invisible:" + hint);
                    material.visible = true;
                }
            });

            this.renderer.render(scene, camera);
        },

        /**
         * Indicate how we are going to utilize the rendering mask
         */
        setMaskMode : function(mode) {

            var context = this.renderer.context;

            if(mode == "fill") {

                // This draw pass will lit stencil pixels, not normal pixels
                context.colorMask(false, false, false, false);
                context.depthMask(false);
                context.enable( context.STENCIL_TEST );
                context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE );
                context.stencilFunc(context.ALWAYS, 1, 0xffffffff );
                this.overrideMaterial = null; // TODO

            }  else if(mode == "clip") {
                // Only draw the effect on the pixels stenciled before
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

            // this.setMaskMode("normal");
            this.renderWorld(renderTarget, scene, camera, { frame : true, photo : false });
            //this.setMaskMode("fill");
            //this.renderWorld(renderTarget, scene, camera, { photo : true });
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