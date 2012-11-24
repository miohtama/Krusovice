/**
 * Krusovice Three.js renderer backend
 */

/*global define, console, jQuery, document, setTimeout, window */

define("krusovice/renderers/three", [
"krusovice/thirdparty/jquery-bundle",
"krusovice/core",
"krusovice/utils",
"krusovice/thirdparty/three-bundle",
"krusovice/renderers/twosidedplane",
"krusovice/renderers/borderplane",
"krusovice/renderers/normalpipeline",
"krusovice/renderers/magicpipeline",
"krusovice/thirdparty/controls/trackball"
], function($, krusovice, utils, THREE, TwoSidedPlaneGeometry, BorderPlaneGeometry, normalPipeline, magicPipeline, TrackballControls) {

'use strict';

krusovice.renderers = krusovice.renderers || {};

/**
 * #ff00ff -> 0xff00ff
 *
 */
function cssToOpenGLColor(cssColor) {
    return parseInt(cssColor.substring(1), 16);
}

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

    /**
     * Count rendered frames.
     *
     * @type {Number}
     */
    frameCounter : 0,

    /** Print Three.js rendering stats for every 30th frame */
    statsDebug : true,

    /**
     * Background fill color we use to fill the renderer before proceeding.
     */
    backgroundColor : 0xaaAAff,

    camera : null,

    renderer : null,

    scene : null,

    hasControls : true,

    /**
     * Install controls for the scene to move camera
     */
    controls : null,

    /**
     * Use WebGL backend
     */
    webGL : true,

    /**
     * Use debug fill materials
     */
    debugFill : false,

    // Default pixel sizes used for photo quad
    // Will be aspect ratio resized

    PLANE_WIDTH : 512,

    PLANE_HEIGHT : 512,


    /**
     * Do (heavy) creation of WebGL context so we don't need to repeat this operation if not necessary
     */
    setupContext : function() {

       console.log("Creating renderer backend");

        var renderer;

        if(this.webGL) {
            // https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js

            var settings  ={
                antialias : true,
                clearColor : 0x008800,
                clearAlpha : 0,
                autoClear : false,
                stencil : true
            };

            renderer = new THREE.WebGLRenderer(settings);
        } else {
            throw new Error("<canvas> 2D backend not supported, because it sucks");
        }

        // start the renderer
        renderer.setSize(this.width, this.height);

        this.renderer = renderer;

    },

    /**
     * Setup the rendering infrastructure
     *
     * @param {Object} world krusovice.Design.world definitions
     *
     * @param  {String} postprocessingPipeline Which postprocessing backend to use. Default is normal.
     *
     */
    setup : function(world, postprocessingPipeline) {

        var renderer;

        if(!postprocessingPipeline) {
            throw new Error("Must give a post-processing pipeline name");
        }

        if(!this.renderer) {
            this.setupContext();
        }

        renderer = this.renderer;

        // XXX: Fix this aspect ratio madness

        // Let's assume that we have Field of View of 90 degrees
        // on 16:9 canvas
        var baseAspect = world.camera.aspectRatio;
        var baseFOV = world.camera.fov;

        // http://en.wikipedia.org/wiki/Field_of_view_in_video_games
        // http://www.codinghorror.com/blog/2007/08/widescreen-and-fov.html

        // Default photo aspect ration 1.667

        // set some camera attributes
        var aspect = this.width / this.height,
            near = world.camera.clip[0],
            far = world.camera.clip[1];

        if(near === undefined || far === undefined) {
            throw new Error("World camera setup error");
        }

        var fov;

        this.baseScaleLandscape = 1.2;
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
            fov = utils.calculateFOV(baseAspect, aspect, baseFOV);
        }

        // var renderer = new THREE.WebGLRenderer();
        var camera = new THREE.PerspectiveCamera(fov,
                                      this.width / this.height,
                                      near,
                                      far);

        var scene = new THREE.Scene();


        // Camera is always in fixed position
        camera.position = utils.toVector(world.camera.position);

        this.scene = scene;

        this.camera = camera;

        this.setupLights(world);

        this.setupShadows(world);

        // Ugh... need to make a registry
        var pipeline = eval(postprocessingPipeline + "Pipeline");

        if(!pipeline) {
            throw new Error("Unknown pipeline:" + pipeline);
        }

        pipeline.setupPipeline(this);

        if(this.hasControls) {
            this.setupControls();
        }

    },

    /**
     * Setup lighting for the photo show.
     *
     * Spotlight is used to create Apple "shiny" effect on photo borders.
     * The parameters are manually tuned with fraed-mesh.js to look good.
     *
     * Photo content itself should react to the light less.
     *
     */
    setupLights : function(world) {

        var scene = this.scene;

        var ambient = new THREE.AmbientLight(world.lights.ambient.color);
        ambient.castShadow = false;
        scene.add(ambient);

        var spotLight = new THREE.SpotLight(world.lights.spot.color);
        spotLight.position.set(utils.toVector(world.lights.spot.position));
        spotLight.castShadow = false;
        scene.add(spotLight);

    },

    /**
     * Make directional light to cast shadows on the background wall.
     *
     * Background wall plane has receiveShadow set,
     * other objects have castShadow set.
     */
    setupShadows : function(world) {

        // This light does not illuminate objects, only
        // casts the shadow for the effect
        var renderer = this.renderer, d = 50000, scene = this.scene;
        var light = new THREE.DirectionalLight(0x0000ff);

        scene.add(light);

        light.position.set(utils.toVector(world.shadows.light)).normalize();

        light.castShadow = true;
        light.onlyShadow = true;

        light.shadowMapWidth = 1024;
        light.shadowMapHeight = 1024;
        light.shadowCameraFov = 45;
        light.shadowMapDarkness = 0.95;

        light.shadowCameraLeft = -d;
        light.shadowCameraRight = d;
        light.shadowCameraTop = d;
        light.shadowCameraBottom = -d;

        light.shadowCameraFar = 100000;
        light.shadowDarkness = 0.9;

        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        renderer.physicallyBasedShading = true;
        renderer.shadowMapEnabled = true;
    },

    /**
     * Do mouse controls
     * @return {[type]} [description]
     */
    setupControls : function() {
        this.controls = new TrackballControls(this.camera, this.elem.get(0));
        this.controls.target.set( 0, 0, 0 );
    },

    updateControls : function() {

        var now = new Date().getTime();

        if(this.lastUpdate) {
            var delta = now - this.lastUpdate;
            this.controls.update(delta);
        }

        this.lastUpdate = now;

    },

    /**
     * Debugging set-up.
     *
     * Used with framed-mesh.js testing.
     *
     * Copied from https://github.com/mrdoob/three.js/blob/master/examples/canvas_geometry_cube.html
     *
     */
    setupSimple : function() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
        this.camera.position.y = 150;
        this.camera.position.z = 500;
        this.scene.add(this.camera);

        this.renderer = new THREE.CanvasRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    },


    setupDebugObjects : function() {

        var scene = this.scene;

        var geometry = new THREE.CubeGeometry( 500, 500, 500 );
        var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: true } );

        for ( var i = 0; i < 100; i ++ ) {

            var cube = new THREE.Mesh( geometry, material );

            cube.scale.y = Math.floor( Math.random() * 2 + 1 );

            cube.position.x = Math.floor( ( Math.random() * 1000 - 500 ) / 50 ) * 50 + 25;
            cube.position.y = ( cube.scale.y * 50 ) / 2;
            cube.position.z = 0;

            scene.add(cube);

        }

    },


    /**
     * Creates a 3D textured rectangle.
     *
     * TODO: Clean up this function
     *
     * @param src Canvas back buffer used as the source material
     *
     * @param srcWidth Natural width
     *
     * @param srcHeight Natural height
     */
    createQuad : function(src, srcWidth, srcHeight, borderColor, hasNoBody) {

        // http://mrdoob.github.com/three.js/examples/canvas_materials_video.html

        var texture;
        var bodyMesh, borderMesh;

        if(this.webGL && src.getContext) {

            // console.log("createQuad(), using src:");
            // console.log(src);

            texture = new THREE.Texture(src, THREE.UVMapping);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearMipMapLinearFilter;
            texture.needsUpdate = true;

        } else {
            texture = new THREE.Texture(src);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        }

        var dimensions = krusovice.utils.calculateAspectRatioFit(srcWidth, srcHeight, this.PLANE_WIDTH, this.PLANE_HEIGHT);

        var borderWidth = 16;
        var x= 0;
        var y= 0;
        if(hasNoBody) {
            dimensions.width += 28;
            dimensions.height += 28;
            borderWidth = 12;
            x = 0;
            y = 0;
        }

        if(borderColor === null) {
            borderWidth = 0;
        }

        var bodyPlane = new TwoSidedPlaneGeometry(dimensions.width, dimensions.height, 4, 4);
        var borderPlane = new BorderPlaneGeometry(dimensions.width, dimensions.height, borderWidth, borderWidth, x, y);


        var filler = new THREE.MeshBasicMaterial({map: texture});

        var border;

        var borderColorHex = cssToOpenGLColor(borderColor || "#eeEEee");

        // Phong shaded borders on webGL
        border = new THREE.MeshPhongMaterial( {shininess: 255, ambient: 0xffffff, color: borderColorHex } );

        // Two sided faces each get their own material
        var material = new THREE.MeshFaceMaterial();

        //bodyPlane.materials[0] = bodyPlane.materials[1] = filler;
        //borderPlane.materials[0] = borderPlane.materials[1] = border;

        // Face materials are set by geometry constructor
        if(this.debugFill) {
            var debugFillRed = new THREE.MeshBasicMaterial( {  color: 0xff0000, wireframe : true } );
            var debugFillBlue = new THREE.MeshBasicMaterial( {  color: 0x0000ff, wireframe : true } );
            bodyMesh = new THREE.Mesh(bodyPlane, new THREE.MeshFaceMaterial([debugFillRed, debugFillRed]));
            borderMesh =  new THREE.Mesh(borderPlane, new THREE.MeshFaceMaterial([debugFillBlue, debugFillBlue]));
        } else {
            bodyMesh = new THREE.Mesh(bodyPlane, new THREE.MeshFaceMaterial([filler, filler]));
            borderMesh =  new THREE.Mesh(borderPlane, new THREE.MeshFaceMaterial([border, border]));
        }

        // Consumed by post-processing
        bodyMesh.krusoviceTypeHint = "photo";

        // Consumed by post-processing
        borderMesh.krusoviceTypeHint = "frame";

        // Create master object which has both photo + frame
        var object = new THREE.Object3D();
        object.add(bodyMesh);
        object.add(borderMesh);

        object.bodyObject = bodyMesh;
        object.borderObject = borderMesh;

        object.useQuaternion = true;

        // Add a special fix parameter to make landscape images closer to camera
        // XXX: Think something smarter here.
        if(srcWidth > srcHeight) {
            object.baseScale = this.baseScaleLandscape;
        } else {
            object.baseScale = this.baseScalePortrait;
        }

        //console.log("Base scale is:"+ mesh.baseScale);
        return object;
    },

    /**
     * Make object alive.
     *
     * TODO: Get rid of effectObject
     */
    wakeUp : function(mesh, effectObject) {

        if(!mesh) {
            throw "Oh mama, can we call this a null pointer exception?";
        }

        if(!mesh.added) {
            this.scene.add(mesh);
            mesh.added = true;
        } else {
            mesh.visible = true;
        }

        //console.log("Including new mesh on the scene");
        //console.log(mesh);
    },

    /**
     * Make sure this object is no longer visible
     */
    farewell : function(mesh, effectObject) {
        // this.scene.removeObject(mesh);
        //console.log("Farewell for object");
        if(mesh) {
            mesh.visible = false;
        }

        if(effectObject) {
            effectObject.visible = false;
        }
    },


    render : function(frontBuffer, time, loudness) {

        if(this.webGL) {
            this.renderGL(frontBuffer, time, loudness);
        } else {
            throw new Error("renderCanvas() no longer supported");
        }

        if(this.controls) {
            this.updateControls();
        }

        this.frameCounter++;
    },

    /**
     * Check if do to stats dumping for this frame
     */
    isDebugOutputFrame : function() {
        return (this.statsDebug && this.frameCounter % 30 === 0);
    },

    renderGL : function(frontBuffer, time) {

        // Let Three.js do its magic
        var scene = this.scene;
        var camera = this.camera;

        this.renderer.clear();
        this.renderer.render(scene, camera, time);

        //frontBuffer.clear();
        frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
        // blit to actual image output from THREE <canvas> renderer internal buffer
    },

    /**
     * Direct access to the renderer <canvas> for providing 2D overlay drawing.
     *
     */
    getCanvas : function() {
        return this.renderer.domElement;
    },

    /**
     * Get a handle to the background canvas element
     */
    getBackgroundCanvasContext : function() {
        return this.renderer.domElement.getContext("2d");
    }
};

});