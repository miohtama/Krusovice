/**
 * WebGL post-processing tricks module.
 *
 * These effects are bound to Krusovice world model - what kind of objects there is (photo frame etc.)
 * and cannot be re-used as is.
 *
 * We define a general PostProcessor which is the manager of different post-processing steps.
 *
 * https://bdsc.webapps.blackberry.com/html5/apis/WebGLRenderingContext.html
 *
 */

/*global define, window, jQuery, document, setTimeout, console, $, krusovice */

define(["krusovice/thirdparty/jquery-bundle", "krusovice/thirdparty/three-bundle", "krusovice/thirdparty/god"],
function($, THREE, god) {

    "use strict";

    function traverseHierarchy(root, callback ) {

            var n, i, l = root.children.length;

            for ( i = 0; i < l; i ++ ) {
                    n = root.children[ i ];
                    callback( n );
                    traverseHierarchy( n, callback );
            }
    }


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

        /** Keep internal frame counter */
        frameCounter : 0,

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

        /** Make othonogal projector quad to use a debug material */
        projectorDebug : false,

        /** Use debug fill material on quad2d so we see the projector target even if the render-to-texture fails*/
        materialDebug : false,

        /** Print Three.js rendering stats for every 30th frame */
        statsDebug : true,

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
         * Check if do to stats dumping for this frame
         */
        isDebugOutputFrame : function() {
            return (this.statsDebug && this.frameCounter % 30 === 0);
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

            this.geometry2d = new THREE.PlaneGeometry(2, 2);
            this.camera2d = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            // Enable these to see the polygon on the screen projected,
            // without blocking all the background
            //this.geometry2d.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI / 3 ));
            //this.geometry2d.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 3 ));

            this.quad2d = new THREE.Mesh(this.geometry2d, null);

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
            var scene = this.scene, camera = this.camera,
                visibleCount = 0, hiddenCount = 0;

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
            traverseHierarchy(scene, function(object) {

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
                    visibleCount++;
                } else {
                    //console.log("invisible:" + hint);
                    object.visible = false;
                    hiddenCount++;
                }

                object.scale = new THREE.Vector3(scale, scale, scale);
            });

            scene.overrideMaterial = this.overrideMaterial;

            if(this.isDebugOutputFrame()) {
                console.log("Rendering scene. Visible " + visibleCount + " hidden " + hiddenCount + " objects");
            }

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
         * Take over rendering control from the main rendering function.
         * Run the the custom pipeline function to post-process the results.
         *
         * @param  {Canvas} frontBuffer Where all the result goes
         */
        render : function(frontBuffer, time, loudness, scene, camera) {

            if(this.projectorDebug) {
                this.quad2d.rotation.y += 0.01;
                this.quad2d.rotation.z += 0.1;
                this.quad2d.updateMatrixWorld();
            }

            // XXX: Move
            this.scene = scene;
            this.camera = camera;
            this.time = time;
            this.loudness = loudness;

            // color + depth + stencil
            this.pipeline(this, this.buffers);

            if(this.isDebugOutputFrame()) {
                console.log(JSON.stringify(this.renderer.info));
            }

            this.frameCounter++;

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
                //blending : this.blending,
                transparent : true
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

            if(this.postprocessor.materialDebug) {
                var debugFillRed = new THREE.MeshBasicMaterial( {  color: 0xff0000 } );
                this.Material(debugFillRed);
            } else {
                // Set quad2d texture target
                this.setMaterial(this.material);
            }

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
                this.material.uniforms.tDiffuse.value = readBuffer;
            } else if(this.material.uniforms.texture) {
                // triangleBlur
                this.material.uniforms.texture.value = readBuffer;
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
            this.material.uniforms[name].value = tex;
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
        var screenShader = THREE.CopyShader;
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

        var convolutionShader = THREE.ConvolutionShader;

        this.convolutionUniforms = THREE.UniformsUtils.clone(convolutionShader.uniforms);

        //THREE.BloomPass.blurY = new THREE.Vector2( 0.0, 0.001953125 );

        this.convolutionUniforms.uImageIncrement.value = new THREE.Vector2( 0.001953125, 0.0 );
        this.convolutionUniforms.cKernel.value = THREE.ConvolutionShader.buildKernel(sigma);

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
            this.convolutionUniforms.tDiffuse.value = readBuffer;
            this.convolutionUniforms.uImageIncrement.value = this.blurX;
            this.setMaterial(this.materialConvolution);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetX);
        },

        // Render pass 2 to renderTargetY
        applyPass2 : function() {
            // Render quad with blured scene into texture (convolution pass 2)
            this.setMaterial(this.materialConvolution);
            this.convolutionUniforms.tDiffuse.value = this.renderTargetX;
            this.convolutionUniforms.uImageIncrement.value = this.blurY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetY);
        },

        finalize : function(writeBuffer) {
            // Render original scene with superimposed blur to texture
            // (additive blending
            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.value = this.renderTargetY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        },

        // Check buffer aligment
        testRender : function(readBuffer, writeBuffer) {
            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.value = readBuffer;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        },

        testRender2 : function(readBuffer, writeBuffer) {

            this.convolutionUniforms.tDiffuse.value = readBuffer;
            this.convolutionUniforms.uImageIncrement.value = this.blurX;
            this.setMaterial(this.materialConvolution);
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetX);

            this.setMaterial(this.materialConvolution);
            this.convolutionUniforms.tDiffuse.value = this.renderTargetX;
            this.convolutionUniforms.uImageIncrement.value = this.blurY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, this.renderTargetY);

            this.setMaterial(this.materialScreen);
            this.screenUniforms.tDiffuse.value = this.renderTargetY;
            this.renderer.render(this.postprocessor.scene2d, this.postprocessor.camera2d, writeBuffer);
        }

    });

    /**
     * Render triangle blur in x and y directions on the image
     */
    function BlurPass() {
        this.shader = THREE.TriangleBlurShader;
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
        this.shader = THREE.BlendShader;

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
        this.shader = god.Additive;
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

    return {
        PostProcessor : PostProcessor,
        AdditiveBlenderPass : AdditiveBlenderPass,
        ShaderPass : ShaderPass,
        BlenderPass : BlenderPass,
        BloomPass : BloomPass,
        BlurPass : BlurPass
    };

});
