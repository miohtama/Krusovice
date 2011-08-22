'use strict';

var krusovice = krusovice || {};

/**
 * Show object rendering backend utilizing THREE.js for 3D operations abstraction
 * 
 * Depends on THREE.js
 * 
 * https://github.com/mrdoob/three.js/tree/master/build
 * 
 * Tutorial
 * 
 * http://www.aerotwist.com/lab/getting-started-with-three-js/
 * 
 */
krusovice.Renderer3 = function(cfg) {	
        $.extend(this, cfg);
}

krusovice.Renderer3.prototype = {
		
    /**
     * @cfg {Object} elem jQuery wrapped DOM element which will contain the show 
     */
    elem : null,		
		
    /**
     * @cfg {Number} width Show width in pixels
     */
    width : 512,

    /**
     * @cfg {Number} height Show height in pixels
     */
    height : 288,		
    
    camera : null,
    
    renderer : null,
    
    scene : null,
		
	setup : function() {
	
		// set some camera attributes
		var VIEW_ANGLE = 45,
		    ASPECT = this.width / this.height,
		    NEAR = 0.1,
		    FAR = 10000;


		// get the DOM element to attach to
		// - assume we've got jQuery to hand
		var $container = this.elem;
	
		// create a WebGL renderer, camera
		// and a scene
		var renderer = new THREE.CanvasRenderer();
		var camera = new THREE.Camera(  VIEW_ANGLE,
		                                ASPECT,
		                                NEAR,
		                                FAR  );
		var scene = new THREE.Scene();
	
		// the camera starts at 0,0,0 so pull it back
		camera.position.z = 300;
	
		// start the renderer
		renderer.setSize(this.width, this.height);
	
		// attach the render-supplied DOM element
		//$container.append(renderer.domElement); 
		
		
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		
	},
	
	clear() {
		
	},
	
	
	/**
	 * Creates a 3D textured rectangle
	 * 
	 * @param src Canvas back buffer used as the source material
	 */
	createQuad : function(src) {
		
		// http://mrdoob.github.com/three.js/examples/canvas_materials_video.html
		texture = new THREE.Texture(src);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;

		var plane = new THREE.PlaneGeometry( 480, 204, 4, 4 );

		mesh = new THREE.Mesh( plane, material );
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.5;
		mesh.overdraw = true;
		
		return mesh:
	},
	
	/**
	 * Make object alive
	 */
	surrect : function(mesh) {
		scene.addObject(mesh);
	},
	
	kill : function(mesh) {
		
	},
	
	render : function(frontBuffer) {
		this.renderer.render(this.scene, this.camera);
		
		// blit to actual image output from THREE <canvas> renderer internal buffer
		frontBuffer.drawImage(this.renderer._canvas);
	}
};
