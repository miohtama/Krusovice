/*global define*/

define(["krusovice/thirdparty/three-bundle"], function(THREE) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function( renderer, renderTarget, width, height) {

	this.renderer = renderer;

	this.renderTarget1 = renderTarget;

	if ( this.renderTarget1 === undefined ) {

		this.renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		this.renderTarget1 = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters );

	}

	this.renderTarget2 = this.renderTarget1.clone();

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.passes = [];

	this.copyPass = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );

};

THREE.EffectComposer.prototype = {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

	},

	render: function ( delta ) {


		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		var maskActive = false;

		var i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

		    //console.log("Rendering pass:" + this.passes[i] + " mask:" + maskActive);

			this.passes[ i ].render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );


			if ( this.passes[ i ].needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( this.passes[ i ] instanceof THREE.MaskPass ) {

				maskActive = true;

			}

			if ( this.passes[ i ] instanceof THREE.ClearMaskPass ) {

				maskActive = false;

			}

		}

        //

	},

	reset: function ( renderTarget ) {

		this.renderTarget1 = renderTarget;

		if ( this.renderTarget1 === undefined ) {

			this.renderTarget1 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, this.renderTargetParameters );

		}

		this.renderTarget2 = this.renderTarget1.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		THREE.EffectComposer.quad.scale.set( window.innerWidth, window.innerHeight, 1 );

		THREE.EffectComposer.camera.left = window.innerWidth / - 2;
		THREE.EffectComposer.camera.right = window.innerWidth / 2;
		THREE.EffectComposer.camera.top = window.innerHeight / 2;
		THREE.EffectComposer.camera.bottom = window.innerHeight / - 2;

		THREE.EffectComposer.camera.updateProjectionMatrix();

	}

};

// shared fullscreen quad scene

THREE.EffectComposer.setup = function(width, height) {
    THREE.EffectComposer.geometry = new THREE.PlaneGeometry( 1, 1 );

    //var tex = new THREE.Texture("http://localhost:8000/demos/test-texture-transparent.png", THREE.UVMapping);
    //tex.needsUpdate = true;

    THREE.EffectComposer.quad = new THREE.Mesh( THREE.EffectComposer.geometry, null );
    THREE.EffectComposer.quad.position.z = -100;
    THREE.EffectComposer.quad.scale.set(width, height, 1 );
    THREE.EffectComposer.quad.updateMatrixWorld();
    THREE.EffectComposer.quad.material = new THREE.MeshBasicMaterial(
        {
        //color : 0x008800,
        transparent : true,
        //blending: THREE.AdditiveBlending,
        map: THREE.ImageUtils.loadTexture("/olvi/test-texture-transparent.png")
        });

    THREE.EffectComposer.scene = new THREE.Scene();
    THREE.EffectComposer.scene.addObject( THREE.EffectComposer.quad );

    // shared ortho camera

    THREE.EffectComposer.camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    THREE.EffectComposer.camera.updateMatrixWorld();
}

});