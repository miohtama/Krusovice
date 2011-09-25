'use strict';

/*global THREE, window*/

var krusovice = krusovice || {};

krusovice.renderers = krusovice.renderers || {};

/**
 * Show object rendering backend utilizing THREE.js for 3D operations abstraction.
 *
 * Pushes the heavy 3D math for a lib which is designed for this purpose.
 * Also, allow rendering using both 2D accelerated canvas and 3D webGL canvas.
 *
 * Depends on Three.js
 *
 * https://github.com/mrdoob/three.js/tree/master/build
 *
 * API reference
 *
 * https://github.com/mrdoob/three.js/wiki/API-Reference
 *
 * Tutorial
 *
 * http://www.aerotwist.com/lab/getting-started-with-three-js/
 *
 */
krusovice.renderers.Three = function(cfg) {
    $.extend(this, cfg);


    if(!window.THREE) {
        throw "THREE 3d lib is not loaded";
    }
};

krusovice.renderers.Three.prototype = {

    /**
     * @cfg {Object} elem jQuery wrapped DOM element which will contain the show
     */
    elem : null,

    /**
     * @cfg {Number} width Show width in pixels
     */
    width : 0,

    /**
     * @cfg {Number} height Show height in pixels
     */
    height : 0,

    camera : null,

    renderer : null,

    scene : null,


    // Default pixel sizes used for photo quad
    // Will be aspect ratio resized

    PLANE_WIDTH : 512,

    PLANE_HEIGHT : 512,

    setup : function() {

        // Let's assume that we have Field of View of 90 degrees
        // on 16:9 canvas
        var baseAspect = 16/9;
        var baseFOV = 50;

        // http://en.wikipedia.org/wiki/Field_of_view_in_video_games
        // http://www.codinghorror.com/blog/2007/08/widescreen-and-fov.html

        // Default photo aspect ration 1.667

        // set some camera attributes
        var aspect = this.width / this.height,
            near = 0.1,
            far = 10000;

        var fov;

        this.baseScaleLandscape = 1.6;
        this.baseScalePortrait = 1;

        if(aspect == 16/9) {
            fov = 50;
        } else if(aspect == 4/3) {
            fov = 50;
        } else if(aspect== 1/1) {
            fov = 50;
            this.baseScaleLandscape = 1;
            this.baseScalePortrait = 1;
        } else {
            fov = krusovice.utils.calculateFOV(baseAspect, aspect, baseFOV);
        }

        var renderer = new THREE.CanvasRenderer();

        // var renderer = new THREE.WebGLRenderer();

        var camera = new THREE.Camera(fov,
                                      this.width / this.height,
                                      near,
                                      far);

        var scene = new THREE.Scene();

        // Camera is always in fixed position
        camera.position.z = 550;

        // start the renderer
        renderer.setSize(this.width, this.height);

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

    },


    /**
     * Creates a 3D textured rectangle
     *
     * @param src Canvas back buffer used as the source material
     *
     * @param srcWidth Natural width
     *
     * @param srcHeight Natural height
     */
    createQuad : function(src, srcWidth, srcHeight) {

        // http://mrdoob.github.com/three.js/examples/canvas_materials_video.html
        var texture = new THREE.Texture(src);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if(!src.width) {
            throw "createQuad(): Source widht missing when creating 3D presentation";
        }

        var dimensions = krusovice.utils.calculateAspectRatioFit(srcWidth, srcHeight, this.PLANE_WIDTH, this.PLANE_HEIGHT);

        var plane = new THREE.PlaneGeometry(dimensions.width, dimensions.height, 4, 4);

        //console.log("Created plane:" + dimensions.width + " x " + dimensions.height + " srcWidth:" + srcWidth + " srcHeight:" + srcHeight);
        var material = new THREE.MeshBasicMaterial( { map: texture } );

        var mesh = new THREE.Mesh( plane, material );
        mesh.overdraw = true;
        mesh.useQuaternion = true;

        // Add a special fix parameter to make landscape images closer to camera
        // XXX: Think something smarter here.
        if(srcWidth > srcHeight) {
            mesh.baseScale = this.baseScaleLandscape;
        } else {
            mesh.baseScale = this.baseScalePortrait;
        }

        //console.log("Base scale is:"+ mesh.baseScale);


        return mesh;
    },

    /**
     * Make object alive
     */
    wakeUp : function(mesh) {

        if(!mesh) {
            throw "Oh mama, can we call this a null pointer exception?";
        }

        //console.log("Including new mesh on the scene");
        //console.log(mesh);
        this.scene.addObject(mesh);
    },

    farewell : function(mesh) {
        this.scene.removeObject(mesh);
    },


    render : function(frontBuffer) {
        this.renderer.render(this.scene, this.camera);

        /*
        console.log("Got three");
        console.log(this.renderer);

        console.log("Got buffer");
        console.log(frontBuffer);*/

        // blit to actual image output from THREE <canvas> renderer internal buffer
        frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
    },

    /**
     * Get a handle to the background canvas element
     */
    getBackgroundCanvasContext : function() {
        return this.renderer.domElement.getContext("2d");
    }
};
