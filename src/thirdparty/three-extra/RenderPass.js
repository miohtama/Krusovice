define(["krusovice/thirdparty/three-bundle"], function(THREE) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial ) {

	this.scene = scene;
	this.camera = camera;
	this.overrideMaterial = overrideMaterial;

	this.clear = true;
	this.needsSwap = false;

};

THREE.RenderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		this.scene.overrideMaterial = this.overrideMaterial;

		renderer.render( this.scene, this.camera, readBuffer, this.clear );

		this.scene.overrideMaterial = null;

	}

};


THREE.RenderPassDirect = function ( scene, camera, overrideMaterial ) {

    this.scene = scene;
    this.camera = camera;
    this.overrideMaterial = overrideMaterial;

    this.clear = true;
    this.needsSwap = false;

};

THREE.RenderPassDirect.prototype = {

    render: function ( renderer, writeBuffer, readBuffer, delta ) {
        //console.log("Rendo!");
        //THREE.EffectComposer.scene, THREE.EffectComposer.camera,
        renderer.render(this.scene, this.camera, readBuffer, this.clear );
        renderer.render(this.scene, this.camera, writeBuffer, this.clear );
    }

};


});