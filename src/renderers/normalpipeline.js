define(["krusovice/thirdparty/three-bundle",
"krusovice/renderers/postprocessing"], function(THREE, postprocessing) {

    "use strict";

    function setupPipeline(renderer) {

        var postprocessor = new postprocessing.PostProcessor({bufferCount : 1});
        postprocessor.init(renderer.renderer, renderer.width, renderer.height);

        debugger;
        var fxaa = postprocessor.createPass(postprocessing.ShaderPass, THREE.FXAAShader);

        fxaa.material.uniforms.resolution.value.set(1 / postprocessor.width, 1 / postprocessor.height);

        // http://localhost:8000/demos/shader.html
        function pipeline(postprocessor, buffers) {

            var renderer = postprocessor.renderer;

            postprocessor.clear(buffers[0], 1.0, 0xff00ff);

            // Draw photo as is to the buffer
            //postprocessor.setMaskMode("normal");
            //postprocessor.renderWorld(buffers[0], {photo: true, frame : true});
            //fxaa.render(buffers[0], null);
            //
            renderer.clear();
            postprocessor.renderWorld(null, {photo: true, frame : true});
        }

        postprocessor.prepare(pipeline);
        postprocessor.takeOver(renderer);
    }

    return {
        setupPipeline : setupPipeline
    };

});