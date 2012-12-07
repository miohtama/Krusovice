define(["krusovice/thirdparty/three-bundle",
"krusovice/thirdparty/god",
"krusovice/renderers/postprocessing"], function(THREE, mtOlympus, postprocessing) {

    "use strict";

    function setupPipeline(krusoviceRenderer) {

        var postprocessor = new postprocessing.PostProcessor({ bufferCount : 3});
        postprocessor.init(krusoviceRenderer, krusoviceRenderer.width, krusoviceRenderer.height);

        var sepia = postprocessor.createPass(postprocessing.ShaderPass, THREE.SepiaShader);
        var film = postprocessor.createPass(postprocessing.ShaderPass, THREE.FilmShader);
        var copy = postprocessor.createPass(postprocessing.ShaderPass, THREE.CopyShader);
        var blur = postprocessor.createPass(postprocessing.BlurPass);
        var fxaa = postprocessor.createPass(postprocessing.ShaderPass, THREE.FXAAShader);
        var bloom = postprocessor.createPass(postprocessing.BloomPass);
        var blend = postprocessor.createPass(postprocessing.BlenderPass);
        var additiveBlend = postprocessor.createPass(postprocessing.AdditiveBlenderPass);
        var god = postprocessor.createPass(postprocessing.ShaderPass, mtOlympus.Godrays);

        fxaa.material.uniforms.resolution.value.set(1 / postprocessor.width, 1 / postprocessor.height);

        // http://localhost:8000/demos/shader.html
        function pipeline(postprocessor, buffers) {

            if(buffers.length != 3) {
                throw new Error("Prior buffer allocation failed");
            }

            var renderer = postprocessor.renderer;

            postprocessor.clear(buffers[0], 1.0, krusoviceRenderer.backgroundColor);
            postprocessor.clear(buffers[1], 1.0, 0x000000);
            postprocessor.clear(buffers[2], 1.0, 0x000000);

            // Don't do Z-index test for anything further
            var context = postprocessor.renderer.context;
            context.depthFunc(context.ALWAYS);
            context.depthMask(false);

            // Draw photo as is to the buffer
            postprocessor.setMaskMode("normal");

            postprocessor.setMaskMode("normal");

            // Render the normal scene without any effect
            postprocessor.renderWorld(buffers[0], {photo: true, frame : true, background:true});
            //postprocessor.renderWorld(null, {photo: true, frame : true, background:true});


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
            postprocessor.setMaskMode("clip");

            // We render god ray effect now and it should
            // not mess the pixels of photo itself as it is masked awa
            postprocessor.renderWorld(buffers[0], {photo: false, frame : true});
            god.render(buffers[1], buffers[2]);

            // Blend the godrays over the actual image, still honoring the
            // clip mask
            additiveBlend.render(buffers[0], buffers[2], buffers[1]);

            postprocessor.setMaskMode("normal");

            // Output the anti-aliased result to the screen
            fxaa.render(buffers[1], null);

        }

        postprocessor.prepare(pipeline);
        postprocessor.takeOver(krusoviceRenderer);

    }

    return {
        setupPipeline : setupPipeline
    };

});