/**
 * WebGL pipeline which does not do any special effects
 */
define(["krusovice/thirdparty/three-bundle",
"krusovice/renderers/postprocessing"], function(THREE, postprocessing) {

    "use strict";

    function setupPipeline(renderer) {

        var postprocessor = new postprocessing.PostProcessor();
        postprocessor.init(renderer.renderer, renderer.width, renderer.height);

        var fxaa = postprocessor.createPass(postprocessing.ShaderPass, THREE.FXAAShader);
        var copy = postprocessor.createPass(postprocessing.ShaderPass, THREE.CopyShader);

        fxaa.material.uniforms.resolution.value.set(1 / postprocessor.width, 1 / postprocessor.height);

        function pipeline(postprocessor, buffers) {

            var renderer = postprocessor.renderer;

            // We draw the world directly to the screen
            // and let renderer use native anti-aliasing
            postprocessor.renderer.clear();
            postprocessor.renderWorld(null, {photo: true, frame : true});
            //copy.render(buffers[0], null);

            //console.log(renderer.info);
            //fxaa.render(buffers[0], null);
            //
            //renderer.setClearColor(0xff00ff, 0.5);
            //renderer.clear();
            //postprocessor.renderWorld(null, {photo: true, frame : true});
        }

        postprocessor.prepare(pipeline);
        postprocessor.takeOver(renderer);
    }

    return {
        setupPipeline : setupPipeline
    };

});