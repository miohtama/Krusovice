/**
 * Krusovice Three.js renderer backend
 */

/*global define, console, jQuery, document, setTimeout, window */

define("krusovice/renderers/three", [
"krusovice/thirdparty/jquery-bundle",
"krusovice/core",
"krusovice/thirdparty/three-bundle",
"krusovice/renderers/twosidedplane",
"krusovice/renderers/borderplane"
], function($, krusovice, THREE, TwoSidedPlaneGeometry, BorderPlaneGeometry) {

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

    camera : null,

    renderer : null,

    scene : null,

    /**
     * Scene drawing stencil mask objects
     */
    maskScene : null,

    /**
     * Use WebGL backend
     */
    webGL : false,


    /**
     * Run rendered scene thru fragment shader post-processing step
     *
     * @type {Boolean}
     */
    usePostProcessing : false,

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

    setup : function() {

        var renderer;

        if(!this.renderer) {
            this.setupContext();
        }

        renderer = this.renderer;

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
            fov = krusovice.utils.calculateFOV(baseAspect, aspect, baseFOV);
        }

        // var renderer = new THREE.WebGLRenderer();

        var camera = new THREE.PerspectiveCamera(fov,
                                      this.width / this.height,
                                      near,
                                      far);

        var scene = new THREE.Scene();


        // Camera is always in fixed position
        camera.position.z = 650;

        this.scene = scene;
        this.maskScene = new THREE.Scene();
        this.camera = camera;

        var halfWidth = this.width/2, halfHeight=this.height/2;
        this.maskCamera = new THREE.OrthographicCamera( -halfWidth, halfWidth, halfHeight, -halfHeight, -10000, 10000 );

        this.setupLights();
        // this.setupDebugObjects();

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
    setupLights : function() {

        var scene = this.scene;

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, 0.5, -1.0).normalize();
        directionalLight.position.set(1, 1, 0.5).normalize();
        //scene.add(directionalLight);

        var ambient = new THREE.AmbientLight(0xaaAAaa);
        scene.add( ambient );

        var spotLight = new THREE.SpotLight( 0xaaaaaa );
        spotLight.position.set(0, 0, 1200);
        spotLight.castShadow = false;
        scene.add( spotLight );
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
        var bodyMesh = new THREE.Mesh(bodyPlane, new THREE.MeshFaceMaterial([filler, filler]));
        // Consumed by post-processing
        bodyMesh.krusoviceTypeHint = "photo";

        var borderMesh =  new THREE.Mesh(borderPlane, new THREE.MeshFaceMaterial([border, border]));
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
    },

    renderGL : function(frontBuffer, time) {

        // Let Three.js do its magic
        var scene = this.scene;
        var camera = this.camera;

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