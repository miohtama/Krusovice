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

        /**
         * Seconds since show start.
         *
         * @type {Number}
         */
        time : 0,

        /**
         * 0...1 normalized loudness level for post-processing effects
         */
        loudness : 0,

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
            this.renderer.autoClear = true;
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
                rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat};

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
                //context.clearStencil(mode == "fill" ? 0 : 1);

                //context.stencilMask(0xffFFffFF);

                context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE); // fail, zfail, zpass

                if(mode == "fill") {
                    context.stencilFunc(context.ALWAYS, 1, 0xffFFffFF);
                } else {
                    context.stencilFunc(context.ALWAYS, 0, 0xffFFffFF);
                }
                this.overrideMaterial = new THREE.MeshBasicMaterial({ color : mode == "fill" ? 0xff0000 : 0x00ff00 });

                if(this.stencilDebug) {
                    this.overrideMaterial.opacity = 0.5;
                }

            }  else if(mode == "clip") {
                // Only draw the effect on the pixels stenciled before

                context.enable(context.STENCIL_TEST);
                context.stencilFunc(context.EQUAL, 1, 0xffFFffFF);
                context.stencilOp(context.KEEP, context.KEEP, context.KEEP);

                context.colorMask(true, true, true, true);
                context.depthMask(true);

                this.overrideMaterial = null;

            } else if(mode == "normal") {
                // Normal
                context.colorMask(true, true, true, true);
                context.depthMask(true);
                context.disable(context.STENCIL_TEST);
                this.overrideMaterial = null;
            } else {
                throw new Error("Unknown clip mode:" + mode);
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
        renderWorld : function(renderTarget, layers, scale) {

            //scene.overrideMaterial = this.overrideMaterial;

            // Prepare what is visible in this pass
            //
            var scene = this.scene, camera = this.camera;

            if(!scale) {
                scale = 1.0;
            }

            if(!scene) {
                throw new Error("Bad scene");
            }

            if(!camera) {
                throw new Error("Bad camera");
            }

            // Override rendering properties of world objects
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

                object.scale = new THREE.Vector3(scale, scale, scale);
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
        render : function(frontBuffer, time, loudness, scene, camera) {

            // XXX: Move
            this.scene = scene;
            this.camera = camera;
            this.time = time;
            this.loudness = loudness;

            // color + depth + stencil
            // this.renderer.clear(true, true, true);

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

            function renderGL(frontBuffer, time, loudness) {
                /*jshint validthis:true */
                self.render(frontBuffer, time, loudness, this.scene, this.camera);
            }

            krusoviceRenderer.renderGL = renderGL;
        },

        /**
         * Creates a post-processing pass and binds it to this post processor.
         * @param  {Function} klass Constructor
         * @return {Object}       PostProcessor instance
         */
        createPass : function(klass) {

            if(!klass) {
                throw new Error("You must give a PostProcessor constructor as an argument");
            }

            var args = Array.prototype.slice.call(arguments);

            /*jshint newcap:false*/
            var processor = new klass(args[1]); // TODO: pass all arguments here

            processor.init(this);
            return processor;
        },

        /**
         * Copy the contents of a render buffer
         * @param  {THREE.WebGLRenderTarget} readBuffer
         * @param  {THREE.WebGLRenderTarget} writeBuffer
         */
        copyBuffer : function(readBuffer, writeBuffer) {

        },

        /**
         * Clear WebGL render targets.
         *
         * @param {Object} buf WebGLRenderTarget or null for the screen.
         *
         * @param {Number} alpha 0....1  of the background alpha where 0 is 100% transparent.
         */
        clear : function(buf, alpha, color) {

            alpha = alpha !== undefined ? alpha : 0.0;
            color = (color !== undefined) ? color : 0xff00ff;

            // For debugging purposes we set clear color alpha
            if(buf) {
                // texture target
                this.renderer.setClearColorHex(color, alpha);
                this.renderer.clearTarget(buf, true, true, true);
            } else {
                // screen
                this.renderer.setClearColorHex(color, alpha);
                this.renderer.clear(true, true, true);
            }
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

        blending : null,

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

            // var transparent = this.blending ? true : false;

            this.material = new THREE.ShaderMaterial( {
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,
                blending : this.blending,
                transparent : false
            });
        },

        /**
         * Renders a 2D fragment shader.
         *
         *
         */
        render2dEffect : function(readBuffer, writeBuffer) {

            var postprocessor = this.postprocessor;

            this.updateUniforms(readBuffer, writeBuffer);

            this.setMaterial(this.material);

            if(writeBuffer) {
                this.renderer.render(postprocessor.scene2d, postprocessor.camera2d, writeBuffer);
            } else {
                this.renderer.render(postprocessor.scene2d, postprocessor.camera2d);
            }
        },

        /**
         * Set used special render material
         * @param {[type]} material [description]
         */
        setMaterial : function(material) {
            this.postprocessor.quad2d.material = material;
        },

        /**
         * Called for every frame to update shader uniform values.
         *
         */
        updateUniforms : function(readBuffer, writeBuffer) {

            // Use existing real world scene buffer as source for the shader program
            //
            if(this.material.uniforms.tDiffuse) {
                this.material.uniforms.tDiffuse.texture = readBuffer;
            } else if(this.material.uniforms.texture) {
                // triangleBlur
                this.material.uniforms.texture.texture = readBuffer;
            }

            if(this.material.uniforms.time !== undefined) {
                this.material.uniforms.time.value = this.postprocessor.time;
            }

        },

        /**
         * Manually update filter uniform value for next render()
         *
         * @param {String} name  uniform name,
         * @param {Number} value new value
         */
        setUniform : function(name, value) {
            this.material.uniforms[name].value = value;
        },


        setTexture : function(name, tex) {
            this.material.uniforms[name].texture = tex;
        },


        render : function(source, target) {
            this.render2dEffect(source, target);
        }

    };

    /**
     * Render a 2D fragment shader, reading one buffer and writing another.
     *
     * @param {Object} shader One of THREE.ShaderExtras shaders
     */
    function ShaderPass(shader) {

        if(shader) {
            this.shader = shader;
        } else {
            throw new Error("No shader given for ShaderPass");
        }
    }

    $.extend(ShaderPass.prototype, PostProcessingPass.prototype, {

        prepare : function() {
            this.prepare2dEffect(this.shader);
        }
    });


    /**
     * Create a Bloom filter pass.
     *
     * Mostly copy-paste code from Three.js's BloomPass.js
     *
     * https://github.com/mrdoob/three.js/issues/2128
     *
     * @param {[type]} strength   [description]
     * @param {[type]} kernelSize [description]
     * @param {[type]} sigma      [description]
     * @param {[type]} resolution [description]
     */
    function BloomPass(strength, kernelSize, sigma, resolution, width, height) {

        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

        strength = (strength !== undefined) ? strength : 1;

        // Gaussian blur strength
        kernelSize = (kernelSize !== undefined) ? kernelSize : 25;

        // How much highlights get highlighted
        sigma = (sigma !== undefined) ? sigma : 1;

        // XXX: Use higher resolution in HD video creation
        resolution = (resolution !== resolution) ? resolution : 256;

        this.renderTargetX = new THREE.WebGLRenderTarget(resolution, resolution, pars);
        this.renderTargetY = new THREE.WebGLRenderTarget(resolution, resolution, pars);

        // this.renderTargetX = new THREE.WebGLRenderTarget(720, 405, pars);
        // this.renderTargetY = new THREE.WebGLRenderTarget(720, 405, pars);


        // Prepare additive blending stage
        var screenShader = THREE.ShaderExtras.screen;
        this.screenUniforms = THREE.UniformsUtils.clone( screenShader.uniforms );
        this.screenUniforms.opacity.value = strength;
        this.materialScreen = new THREE.ShaderMaterial( {
                uniforms: this.screenUniforms,
                vertexShader: screenShader.vertexShader,
                fragmentShader: screenShader.fragmentShader,
                blending: THREE.AdditiveBlending,
                transparent: true
        });

        // convolution material

        var convolutionShader = THREE.ShaderExtras.convolution;

        this.convolutionUniforms = THREE.UniformsUtils.clone(convolutionShader.uniforms);

        this.convolutionUniforms.uImageIncrement.value = THREE.BloomPass.blurx;
        this.convolutionUniforms.cKernel.value = THREE.ShaderExtras.buildKernel(sigma);

        this.materialConvolution = new THREE.ShaderMaterial( {
            uniforms: this.convolutionUniforms,
            vertexShader:   "#define KERNEL_SIZE " + kernelSize + ".0\n" + convolutionShader.vertexShader,
            fragmentShader: "#define KERNEL_SIZE " + kernelSize + "\n"   + convolutionShader.fragmentShader
        });

        this.blurX = new THREE.Vector2( 1/256, 0.0 );
        this.blurY = new THREE.Vector2( 0.0, 1/256 );
    }

    $.extend(BloomPass.prototype, ShaderPass.prototype, {

        prepare : function() {
        },

        // Render pass 1 to renderTargetX
        applyPass1 : function(readBuffer) {
            this.convolutionUniforms.tDiffuse.texture = readBuffer;
            this.convolutionUniforms.uImageIncrement.value = this.blurX;
            this.setMaterial(this.materialConvolution);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetX);
        },

        // Render pass 2 to renderTargetY
        applyPass2 : function() {
            // Render quad with blured scene into texture (convolution pass 2)
            this.setMaterial(this.materialConvolution);
            this.convolutionUniforms.tDiffuse.texture = this.renderTargetX;
            this.convolutionUniforms.uImageIncrement.value = this.blurY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetY);
        },

        finalize : function(writeBuffer) {
            // Render original scene with superimposed blur to texture
            // (additive blending
            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.texture = this.renderTargetY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        },

        // Check buffer aligment
        testRender : function(readBuffer, writeBuffer) {
            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.texture = readBuffer;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        },

        testRender2 : function(readBuffer, writeBuffer) {

            this.convolutionUniforms.tDiffuse.texture = readBuffer;
            this.convolutionUniforms.uImageIncrement.value = this.blurX;
            this.setMaterial(this.materialConvolution);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetX);

            this.setMaterial(this.materialConvolution);
            this.convolutionUniforms.tDiffuse.texture = this.renderTargetX;
            this.convolutionUniforms.uImageIncrement.value = this.blurY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetY);

            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.texture = this.renderTargetY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        }

    });

    /**
     * Render triangle blur in x and y directions on the image
     */
    function BlurPass() {
        this.shader = THREE.ShaderExtras.triangleBlur;
    }

    $.extend(BlurPass.prototype, ShaderPass.prototype, {

        render : function (readBuffer, immediateBuffer, writeBuffer, strength) {

            var postprocessor = this.postprocessor;

            // var capped = 1 - Math.max(postprocessor.loudness - 0.5, 0) / 0.5;

            console.log("Got loudness:" + postprocessor.loudness);
            strength *= postprocessor.loudness;

            // console.log(strength);
            //console.log(strength);

            var blurAmountX = strength / postprocessor.width;
            var blurAmountY = strength / postprocessor.height;

            // Apply X blur
            this.setUniform("delta", new THREE.Vector2(blurAmountX, 0));
            this.setUniform("texture", readBuffer);
            this.render2dEffect(readBuffer, immediateBuffer);

            // Apply Y blur
            this.setUniform("delta", new THREE.Vector2(0, blurAmountY));
            this.setUniform("texture", immediateBuffer);
            this.render2dEffect(immediateBuffer, writeBuffer);
            //
            //
            //this.render2dEffect(readBuffer, null);

            //this.setMaterial(this.material);
            //this.renderer.render(postprocessor.scene2d, postprocessor.camera2d, writeBuffer);

        }
    });

    /* Mix ratio blending */
    function BlenderPass() {
        //this.shader = THREE.ShaderExtras.mooBlend;
        this.shader = THREE.ShaderExtras.blend;

    }

    $.extend(BlenderPass.prototype, ShaderPass.prototype, {

        render : function (tex1, tex2, writeBuffer) {
            this.setMaterial(this.material);
            this.setTexture("tDiffuse1", tex1);
            this.setTexture("tDiffuse2", tex2);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        }
    });

    /* Additive blending */
    function AdditiveBlenderPass() {
        //this.shader = THREE.ShaderExtras.mooBlend;
        this.shader = THREE.Extras.Shaders.Additive;
    }

    $.extend(AdditiveBlenderPass.prototype, ShaderPass.prototype, {

        render : function (tex1, tex2, writeBuffer) {
            this.setMaterial(this.material);
            this.setTexture("tDiffuse", tex1);
            this.setTexture("tAdd", tex2);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        }
    });

    function expandedEdgeBlur(postprocessor, buffers, context, blur) {
        // XXX: Work-in-progress code to test blur on larger arae
        postprocessor.renderWorld(buffers[0], {photo: true, frame : false}, 1.05);

        postprocessor.stencilDebug = false;
        context.clearStencil(1);
        postprocessor.setMaskMode("fill");
        postprocessor.renderWorld(buffers[0], { photo : true }, 1.025);
        postprocessor.renderWorld(buffers[1], { photo : true }, 1.025);
        postprocessor.renderWorld(buffers[2], { photo : true }, 1.025);


        //renderer.clearTarget(buffers[0], false, true, true);
        postprocessor.setMaskMode("negative-fill");
        postprocessor.renderWorld(buffers[0], { photo : true }, 0.9);
        postprocessor.renderWorld(buffers[1], { photo : true });
        postprocessor.renderWorld(buffers[2], { photo : true });
        postprocessor.setMaskMode("clip");

        //fill.render(buffers[0], buffers[1]);
        blur.render(buffers[0], buffers[1], buffers[2], 10);
    }


    function setupPipeline(renderer) {

        var postprocessor = new PostProcessor({ bufferCount : 3});
        postprocessor.init(renderer.renderer, renderer.width, renderer.height);

        var sepia = postprocessor.createPass(ShaderPass, THREE.ShaderExtras.sepia);
        var film = postprocessor.createPass(ShaderPass, THREE.ShaderExtras.film);
        var copy = postprocessor.createPass(ShaderPass, THREE.ShaderExtras.screen);
        var blur = postprocessor.createPass(BlurPass);
        var fxaa = postprocessor.createPass(ShaderPass, THREE.ShaderExtras.fxaa);
        var bloom = postprocessor.createPass(BloomPass);
        var fill = postprocessor.createPass(ShaderPass, THREE.ShaderExtras.mooBlur2);
        var blend = postprocessor.createPass(BlenderPass);
        var additiveBlend = postprocessor.createPass(AdditiveBlenderPass);
        var god = postprocessor.createPass(ShaderPass, THREE.Extras.Shaders.Godrays);

        fxaa.material.uniforms.resolution.value.set(1 / postprocessor.width, 1 / postprocessor.height);

        /**
         * Render shiny edge around the photo.
         *
         * Dump result to buffer 2.
         */
        function edgeBlur(postprocessor, buffers) {

            var context = postprocessor.renderer.context;

            var expand = 1.05;

            postprocessor.renderWorld(buffers[0], {photo: true, frame : false}, expand);

            context.clearStencil(1);
            postprocessor.setMaskMode("negative-fill");
            postprocessor.renderWorld(buffers[0], { photo : true });
            postprocessor.renderWorld(buffers[1], { photo : true });
            postprocessor.renderWorld(buffers[2], { photo : true });
            postprocessor.setMaskMode("clip");

            //fill.render(buffers[0], buffers[1]);
            blur.render(buffers[0], buffers[1], buffers[2], 10);
        }


        // http://localhost:8000/demos/shader.html
        function pipeline(postprocessor, buffers) {

            if(buffers.length != 3) {
                throw new Error("Prior buffer allocation failed");
            }

            var renderer = postprocessor.renderer;

            // Clean up both buffers for the start
            //postprocessor.clear(buffers[0]);
            //postprocessor.clear(buffers[1]);
            //postprocessor.clear(buffers[2]);

            postprocessor.clear(buffers[0], 1.0, 0x000000);
            postprocessor.clear(buffers[1], 1.0, 0x000000);
            postprocessor.clear(buffers[2], 1.0, 0x000000);

            // Don't do Z-index test for anything further
            var context = postprocessor.renderer.context;
            context.depthFunc(context.ALWAYS);
            context.depthMask(false);

            // Draw photo as is to the buffer
            postprocessor.setMaskMode("normal");
            //postprocessor.renderWorld(buffers[0], { photo : true }, 1.2);

            // Do Bloom
            //bloom.applyPass1(buffers[0]);
            //bloom.applyPass2();

            //postprocessor.renderWorld(buffers[0], {frame : true, photo : false });
            // Postprocessor.renderWorld(buffers[0], {frame : true, photo : false });


            // Create target mask to operate only on photo content, not its frame
            /*
            postprocessor.setMaskMode("fill");
            postprocessor.renderWorld(buffers[0], { photo : true });
            postprocessor.renderWorld(buffers[1], { photo : true });

            // Operate 2D filters only on the area masked by clip
            postprocessor.setMaskMode("clip");
            // Run sepia filter against masked area buffer 0 -> buffer 1
            // sepia.setUniform("amount", 0.5);
            // sepia.render(buffers[0], buffers[1]);

            // Run film filter against masked area buffer 1 -> buffer 0
            // film.setUniform("grayscale", 0);
            // film.setUniform("sIntensity", 0.3);
            // film.setUniform("nIntensity", 0.3);
            // film.render(buffers[1], buffers[0]);

            postprocessor.setMaskMode("normal");
             */
            // Overlay bloom image
            // bloom.finalize(buffers[1]);
            // postprocessor.renderWorld(buffers[2], {photo: false, frame : true});
            //postprocessor.setMaskMode("normal");

            // Mask the target buffer for photo area
            // postprocessor.setMaskMode("fill");
            // postprocessor.renderWorld(buffers[1], { photo : true });

            // Copy buffer 0 to screen with FXAA (fake anti-alias) filtering
            //edgeBlur(postprocessor, buffers);

            postprocessor.setMaskMode("normal");

            // Render the normal scene without any effect
            postprocessor.renderWorld(buffers[0], {photo: true, frame : true});

            // Render the pure photo on empty buffer
            // which will act as the data for god effect
            postprocessor.renderWorld(buffers[1], {photo: true, frame : false});

            // Setup god effect strength based on
            // spectrum VU data
            var capped = postprocessor.loudness;
            god.setUniform("fExposure", 0.2);
            god.setUniform("fClamp", 0.8);
            god.setUniform("fDensity", 0.5*capped);


            // By default we mask the whole buffer so
            // that all pixels get through (stencil=1)
            context.clearStencil(1);
            // Then we mask the area of the photo content
            // in the stencil so that these pixels won't be touched in
            // the next pass
            postprocessor.setMaskMode("negative-fill");
            // Set the clip mask on all buffers
            postprocessor.renderWorld(buffers[1], { photo : true });
            //postprocessor.renderWorld(buffers[1], { photo : true });
            //postprocessor.renderWorld(buffers[2], { photo : true });
            postprocessor.setMaskMode("clip");

            // We render god ray effect now and it should
            // not mess the pixels of photo itself as it is masked awa
            postprocessor.renderWorld(buffers[0], {photo: false, frame : true});
            god.render(buffers[1], buffers[2]);

            // Blend the godrays over the actual image, still honoring the
            // clip mask
            additiveBlend.render(buffers[0], buffers[2], buffers[1]);

            postprocessor.setMaskMode("normal");

            // XXX: Fine-tune god ray blending
            // context.clearStencil(1);
            // postprocessor.clear(buffers[1], 1.0);
            //blend.setUniform("mixRatio", 0);
            //
            //postprocessor.clear(buffers[2], 0, 0x000000);

            // Output the anti-aliased result to the screen
            fxaa.render(buffers[1], null);

        }

        postprocessor.prepare(pipeline);
        postprocessor.takeOver(renderer);

    }


    // Module exports
    return {
            setupPipeline : setupPipeline
    };


});
