/**
 * WebGL post-processing tricks module.
 *
 * These effects are bound to Krusovice world model - what kind of objects there is (photo frame etc.)
 * and cannot be re-used as is.
 *
 * https://bdsc.webapps.blackberry.com/html5/apis/WebGLRenderingContext.html
 *
 */

/*global define, window, jQuery, document, setTimeout, console, $, krusovice */

define(["krusovice/thirdparty/jquery-bundle", "krusovice/thirdparty/three-bundle"],
function($, THREE) {

    "use strict";

    /**
     * Rendering pre- and post-processing effects on the scene.
     */
    function PostProcessor(cfg) {
        $.extend(this, cfg);
    }

    PostProcessor.prototype = {

        /** How many effect buffers we allocate */
        bufferCount : 1,

        buffers: [],

        /** Function which will take care of magic */
        pipeline : null,

        /** THREE rendering instance (not our show renderer) */
        renderer : null,
        scene : null,
        camera : null,

        /** All polygons will use special material - mostly used for speed in Stencil tests */
        overrideMaterial : null,

        /** Fill stencil with 0xff00ff color */
        stencilDebug : false,

        /** Used by 2d post-processing */
        camera2d : null,
        geometry2d : null,
        quad2d : null,
        scene2d : null,

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
         * Create orthonagonal camera, good for 2D effect purposes.
         *
         * You will write to a hidden bugger and then use it as a texture with this dummy scene.
         * @return {[type]} [description]
         */
        setup2DCamera : function() {
            var width = this.width, height = this.height;

            this.camera2d = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
            this.geometry2d = new THREE.PlaneGeometry(1, 1);
            this.geometry2d.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

            this.quad2d = new THREE.Mesh(this.geometry2d, null);
            this.quad2d.position.z = -100;
            this.quad2d.scale.set(width, height, 1);

            this.scene2d = new THREE.Scene();
            this.scene2d.add(this.quad2d);
            this.scene2d.add(this.camera2d);
        },

        /**
         * Prepare for rendering. Must be called after all passes have been added to the chain.
         *
         */
        prepare : function(pipeline) {

            this.pipeline = pipeline;

            var self = this,
                rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};

            for(var i=0; i<this.bufferCount; i++) {
                this.buffers[i] = new THREE.WebGLRenderTarget(this.width, this.height, rtParameters);
            }

            // Set renderer to play along with our stencil buffer pipeline
            this.renderer.autoClear = false;
            this.autoClearStencil = false;

            this.setup2DCamera();
        },

        /**
         * Indicate how we are going to utilize the rendering mask
         */
        setMaskMode : function(mode) {

            var context = this.renderer.context;

            // This will fill the stencil buffer with 1 or 0
            // for the parts which are drawn. Later this stencil can be used for
            // effect passes
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
                context.enable(context.STENCIL_TEST);
                context.clearStencil(mode == "fill" ? 0 : 1);

                //context.stencilMask(0xffFFffFF);

                context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE); // fail, zfail, zpass
                context.stencilFunc(context.ALWAYS, 1, 0xffFFffFF);

                this.overrideMaterial = new THREE.MeshBasicMaterial({ color : mode == "fill" ? 0xff00ff : 0x00ff00 });

            }  else if(mode == "clip") {
                // Only draw the effect on the pixels stenciled before

                context.enable(context.STENCIL_TEST);
                context.stencilFunc(context.EQUAL, 1, 0xffFFffFF);
                context.stencilOp(context.KEEP, context.KEEP, context.KEEP);

                context.colorMask(true, true, true, true);
                context.depthMask(true);

                this.overrideMaterial = null;

            } else {
                // Normal
                context.colorMask(true, true, true, true);
                context.depthMask(true);
                context.disable(context.STENCIL_TEST);
                this.overrideMaterial = null;
            }
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
         * Render the world scene with selected objects.
         *
         * @param  {THREE.WebGLRenderTarget} renderTarget
         *
         * @oaram {Object} layers { frame : true, photo : true }
         */
        renderWorld : function(renderTarget, layers) {

            //scene.overrideMaterial = this.overrideMaterial;

            // Prepare what is visible in this pass
            //
            var scene = this.scene, camera = this.camera;

            if(!scene) {
                throw new Error("Bad scene");
            }

            if(!camera) {
                throw new Error("Bad camera");
            }

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

            scene.overrideMaterial = this.overrideMaterial;

            if(renderTarget) {
                // buffer
                this.renderer.render(scene, camera, renderTarget);
            } else {
                // screen
                this.renderer.render(scene, camera);
            }
            //
        },

        /**
         * Main scene renderer function.
         *
         * Take over rendering control from the main rendering functoin.
         *
         * @param  {Canvas} frontBuffer Where all the result goes
         */
        render : function(frontBuffer, scene, camera) {

            // XXX: Move
            this.scene = scene;
            this.camera = camera;

            // color + depth + stencil
            this.renderer.clear(true, true, true);

            this.pipeline(this, this.buffers);

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

        postprocessor : null,

        renderer : null,

        uniforms : null,

        /** THREE.js material used on 2D scene quad surface */
        material : null,

        init : function(postprocessor) {
            this.postprocessor = postprocessor;
            this.renderer = postprocessor.renderer;
            this.prepare();
        },

        /**
         * Child classes to override to setup shader code.
         */
        prepare : function() {

        },

        /**
         * Upload shader code to GPU
         */
        prepare2dEffect : function(shader) {

            if(!shader) {
                throw new Error("No shader given");
            }

            this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            this.material = new THREE.ShaderMaterial( {
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
        },

        /**
         * Renders a 2D fragment shader.
         *
         *
         */
        render2dEffect : function(readBuffer, writeBuffer) {
            var postprocessor = this.postprocessor;

            // Use existing real world scene buffer as source for the shader program
            //
            if(this.material.uniforms.tDiffuse) {
                this.material.uniforms.tDiffuse.texture = readBuffer;
            }

            this.postprocessor.quad2d.material = this.material;

            if(writeBuffer) {
                this.renderer.render(postprocessor.scene2d, postprocessor.camera2d, writeBuffer);
            } else {
                this.renderer.render(postprocessor.scene2d, postprocessor.camera2d);
            }
        },

        render : function(source, target) {
            this.render2dEffect(source, target);
        }

    };

    /**
     * WebGL effec composer which renders Sepia + Noise on the image itself
     */
    function SepiaPass() {
    }

    $.extend(SepiaPass.prototype, PostProcessingPass.prototype, {

        prepare : function() {
            var sepia = THREE.ShaderExtras.sepia;
            //var sepia = THREE.ShaderExtras.basic;
            this.prepare2dEffect(sepia);
        }

    });

    function FilmPass() {
    }

    $.extend(FilmPass.prototype, PostProcessingPass.prototype, {

        prepare : function() {
            var film = THREE.ShaderExtras.film;
            this.prepare2dEffect(film);
        }
    });

    function setupPipeline(renderer) {

        var postprocessor = new PostProcessor({ bufferCount : 2});
        postprocessor.init(renderer.renderer, renderer.width, renderer.height);

        var sepia = new SepiaPass();
        var film = new FilmPass();

        sepia.init(postprocessor);
        film.init(postprocessor);

        function pipeline(postprocessor, buffers) {

            if(buffers.length != 2) {
                throw new Error("Prior buffer allocation failed");
            }

            // Draw frame as is
            postprocessor.setMaskMode("normal");
            postprocessor.renderWorld(null, {frame : true, photo : false });

            // Draw photo as is to the buffer
            postprocessor.setMaskMode("normal");
            postprocessor.renderWorld(buffers[0], { photo : true });

            // Mask the target buffer for photo area
            postprocessor.setMaskMode("fill");
            var context = postprocessor.renderer.context;
            context.depthFunc(context.ALWAYS);
            postprocessor.renderWorld(null, { photo : true });

            // Run sepia filter against masked area
            postprocessor.setMaskMode("clip");
            sepia.render(buffers[0], null);

            // Mask the target buffer for photo area
            /*
            postprocessor.setMaskMode("fill");
            var context = postprocessor.renderer.context;
            context.depthFunc(context.ALWAYS);
            postprocessor.renderWorld(buffers[1], { photo : true });

            postprocessor.setMaskMode("clip");
            film.render(buffers[1], null);
            */
        }

        postprocessor.prepare(pipeline);
        postprocessor.takeOver(renderer);

    }


    // Module exports
    return {
            setupPipeline : setupPipeline
    };


});