define(["krusovice/thirdparty/three-bundle"], function(THREE) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.ShaderPass = function( shader, textureID ) {

        this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

        this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

    this.uniforms[ "opacity" ].value = 0.5;
    //this.uniforms[ "tDiffuse" ].value = 0;

        this.material = new THREE.ShaderMaterial( {

                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,
        //blending: THREE.NormalBlending,
        //transparent: true

        } );

        this.renderToScreen = false;

        this.enabled = true;
        this.needsSwap = true;
        this.clear = false;

};

THREE.ShaderPass.prototype = {

        render: function ( renderer, writeBuffer, readBuffer, delta ) {

                if ( this.uniforms[ this.textureID ] ) {

                        this.uniforms[ this.textureID ].texture = readBuffer;

                }

                THREE.EffectComposer.quad.material = this.material;


                if ( this.renderToScreen ) {

                        renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera );

                } else {

                        renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, writeBuffer, this.clear );

                }

        //renderer.clear(false, true, true);

        }

};

return THREE.ShaderPass;

});
