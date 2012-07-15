/*global define, console, jQuery, document, setTimeout, window */

define("krusovice/renderers/three", ["krusovice/thirdparty/jquery-bundle", "krusovice/core", "krusovice/thirdparty/three-bundle"], function($, krusovice, THREE) {
'use strict';

krusovice.renderers = krusovice.renderers || {};

function cssToOpenGLColor(cssColor) {
    return parseInt(cssColor.substring(1), 16);
}

/**
 * Copy WebGL buffer.
 *
 * Render a texture on the another using orthogonal scene with 1x1 target texture.
 *
 * @param  {Object} renderer Three.js renderer instance
 * @param  {[type]} target   [description]
 * @param  {[type]} src      [description]
 * @param  {[type]} width    [description]
 * @param  {[type]} height   [description]
 * @return {[type]}          [description]
 */
function copyWebGLBuffer(renderer, target, src, width, height) {


    var geometry = new THREE.PlaneGeometry( 1, 1 );

    //var tex = new THREE.Texture("http://localhost:8000/demos/test-texture-transparent.png", THREE.UVMapping);
    //tex.needsUpdate = true;

    var quad = new THREE.Mesh(geometry);
    quad.position.z = -100;
    quad.scale.set(width, height, 1 );
    quad.updateMatrixWorld();
    quad.material = new THREE.MeshBasicMaterial(
        {
        color : 0x008800,
        transparent : true,
        map: src
        });

    var scene = new THREE.Scene();
    scene.addObject(quad );

    var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    camera.updateMatrixWorld();

    var color = new THREE.Color(0);
    renderer.setClearColor(color, 0);

    renderer.clearTarget(target);
    renderer.render(scene, camera, target, false);
    //renderer.render(scene, camera);
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
     * Set-up image post processing fragment shaders
     *
     *
     */
    setupSepiaComposer : function() {

        THREE.EffectComposer.setup(this.width, this.height);

        var rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};

        this.target = new THREE.WebGLRenderTarget(this.width, this.height, rtParameters);

        var effectFilm = new THREE.FilmPass( 0.35, 0.025, 648, false );
        var effectFilmBW = new THREE.FilmPass( 0.35, 0.5, 2048, true );

        this.target2 = this.target.clone();
        //this.bloomBuffer = this.target.clone();
        //this.bloomBuffer2 = this.target.clone();
        var composer = new THREE.EffectComposer(this.renderer, this.width, this.height);

        var shaderSepia = THREE.ShaderExtras.sepia;
        var effectSepia = new THREE.ShaderPass( shaderSepia );
        effectSepia.uniforms.amount.value = 0.9;
        var renderScene = new THREE.RenderPass(this.scene, this.camera);
        //var renderModel2 = new THREE.RenderPass(this.scene, this.camera);
        //this.maskObject = new THREE.RenderPass(this.maskScene, this.camera);
        //var renderScene = new THREE.TexturePass(composer.renderTarget2);

        composer.addPass(renderScene);
        //composer3.addPass( renderMask );
        //composer.addPass( effectSepia );
        //
        composer.addPass( effectFilm );
        composer.addPass( effectSepia );

        effectSepia.renderToScreen = true;


        this.composer = composer;
        //composer3.addPass( clearMask );
        //composer.addPass( effectVignette );

        //var renderModel = new THREE.RenderPass(this.maskScene, this.maskCamera);
        ///*
        //
        /*
        var maskModel = new THREE.MaskPass(this.maskScene, this.camera);
        var clearMask = new THREE.ClearMaskPass();
        var dotScreen = new THREE.DotScreenPass( new THREE.Vector2( 0, 0 ), 0.5, 0.6 );
        //var effectFilm = new THREE.FilmPass( 0.5, 0.125, 2048, false );
        //effectFilm.renderToScreen = true;

        this.renderModel = renderModel;
        this.maskModel = maskModel;
        this.clearMask = clearMask;
        this.copyPass = new THREE.ShaderPass(THREE.ShaderExtras.screen);

        //renderModel.clear = false;
        maskModel.clear = false;
        clearMask.clear = false;
        renderModel.clear = false;
        renderModel2.clear = false;
        this.maskObject.clear = false;
        //renderScene.clear = false;

        this.copyPass.clear = false;

        this.composer = true;
        var quadMask;

        var plane = new THREE.PlaneGeometry( 1, 1 );
        quadMask = new THREE.Mesh( plane, new THREE.MeshBasicMaterial( { color: 0xffaa00 } )  );
        quadMask.position.z = -300;
        quadMask.scale.set(this.width / 2, this.height/2, 1 );
        this.maskScene.add( quadMask );
        */
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
    createQuad : function(src, srcWidth, srcHeight, borderColor, hasNoBody) {

        // http://mrdoob.github.com/three.js/examples/canvas_materials_video.html

        var texture;

        if(this.webGL && src.getContext) {

            console.log("createQuad(), using src:");
            console.log(src);

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

        var bodyPlane = new THREE.TwoSidedPlaneGeometry(dimensions.width, dimensions.height, 4, 4);
        var borderPlane = new THREE.BorderPlaneGeometry(dimensions.width, dimensions.height, borderWidth, borderWidth, x, y);

        var filler = new THREE.MeshBasicMaterial({map: texture});

        var border;

        var borderColorHex = cssToOpenGLColor(borderColor || "#eeEEee");

        // Phong shaded borders on webGL
        border = new THREE.MeshPhongMaterial( {shininess: 255, ambient: 0xffffff, color: borderColorHex } );

        // Two sided faces each get their own material
        var material = new THREE.MeshFaceMaterial();

        bodyPlane.materials[0] = bodyPlane.materials[1] = filler;
        borderPlane.materials[0] = borderPlane.materials[1] = border;

        var bodyMesh = new THREE.Mesh(bodyPlane, material);
        // Consumed by post-processing
        bodyMesh.krusoviceTypeHint = "photo";

        var borderMesh =  new THREE.Mesh(borderPlane, material);
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
     * XXX: Not used
     *
     * http://superfad.com/missioncontrol/js/superglobe.js
     */
    createBorderLines : function(srcWidth, srcHeight, color) {

        var dimensions = krusovice.utils.calculateAspectRatioFit(srcWidth, srcHeight, this.PLANE_WIDTH, this.PLANE_HEIGHT);

        var plane = new THREE.LinePlaneGeometry(dimensions.width + 32, dimensions.height + 32);

        var material = new THREE.LineBasicMaterial( {
                opacity: 0.8,
                linewidth: 10,
                depthTest: false,
                //blending: THREE.AdditiveBlending,
                transparent : true } );

        material.color.setRGB(1, 0, 1);

        var mesh = new THREE.Line(plane, material);

        mesh.useQuaternion = true;

        return mesh;
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


    setupBloom : function() {
        this.effectBloom = new THREE.BloomPass(this.postProcessingStrength);
    },

    render : function(frontBuffer, time, loudness) {
        if(this.webGL) {
            this.renderGL(frontBuffer, time, loudness);
        } else {
            throw new Error("renderCanvas() no longer supported");
        }
    },

    renderCanvas : function(frontBuffer) {
        var scene = this.scene;
        var camere = this.camera;

        this.renderer.render(this.scene, this.camera);
        frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
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


/**
 * 3D object used to draw border around plane
 *
 * @param {[type]} width          [description]
 * @param {[type]} height         [description]
 * @param {[type]} segmentsWidth  [description]
 * @param {[type]} segmentsHeight [description]
 * @param {[type]} frameWidth     [description]
 * @param {[type]} frameHeight    [description]
 * @param {[type]} ax             Border x width
 * @param {[type]} ay             Border y width
 */
THREE.BorderPlaneGeometry = function (width, height, frameWidth, frameHeight, ax, ay) {

    THREE.Geometry.call( this );

    var ix, iy,
    width_half = width / 2,
    height_half = height / 2,
    normal = new THREE.Vector3( 0, 0, 1 ),
    normal2 = new THREE.Vector3( 0, 0, -1 );

    this.borderFaces = [];
    var self = this;

    function addBorderFace(left, top, right, bottom, v1, v2, v3, v4) {

        if(v4 === undefined) {
            throw "Ooops.";
        }

        var vi = self.vertices.length;

        var uv = [
            new THREE.UV( 0, 0 ),
            new THREE.UV( 0, 1 ),
            new THREE.UV(1, 1),
            new THREE.UV(1, 0 )
        ];

        left -= width_half;
        top -= height_half;
        right -= width_half;
        bottom -= height_half;

        // console.log("face " + left + " " + top + " " + right + " " + bottom + " v1:" + v1 + " v2:" + v2 + " v3:" + v3 + " v4:" + v4);

        self.vertices.push( new THREE.Vector3(ax + left, ay + top,  0));
        self.vertices.push( new THREE.Vector3(ax + right, ay + top, 0));
        self.vertices.push( new THREE.Vector3(ax + right, ay + bottom, 0));
        self.vertices.push( new THREE.Vector3(ax + left, ay + bottom, 0));

        // Create faces for both sides

        var face = new THREE.Face4(vi, vi+1, vi+2, vi+3);
        face.normal.copy( normal );
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
        face.materialIndex = 0;
        self.faces.push( face );
        self.borderFaces.push(face);

        self.faceVertexUvs[0].push( [
                    uv[v1], uv[v2], uv[v3], uv[v4]
                ] );

        face = new THREE.Face4(vi, vi+3, vi+2, vi+1);
        face.normal.copy(normal2);
        face.vertexNormals.push(normal2.clone(), normal2.clone(), normal2.clone(), normal2.clone());
        face.materialIndex = 1;
        self.faces.push(face);
        self.borderFaces.push(face);

        self.faceVertexUvs[0].push( [
                    uv[v1], uv[v3], uv[v2], uv[v1]
                ] );


    }

    if(frameWidth > 0 && frameHeight > 0) {

        // bl
        addBorderFace(-frameWidth, -frameHeight, 0, 0,     0, 0, 2, 0);

        // bottom
        addBorderFace(0, -frameHeight, width, 0, 0,     0, 2, 2, 0);

        // br
        addBorderFace(width, -frameHeight, width+frameWidth, 0,    0, 0, 0, 2);

        // ml
        addBorderFace(-frameWidth, 0, 0, height,    0, 2, 2, 0);

        // tl
        addBorderFace(-frameWidth, height, 0, height+frameHeight,    0, 2, 0, 0);

        // top
        addBorderFace(0, height, width, height+frameHeight,    2, 2, 0, 0);

        // tr
        addBorderFace(width+frameWidth, height+frameHeight, width, height,    0, 0, 2, 0);

        // mr
        addBorderFace(width, 0, width+frameWidth, height,    2, 0, 0, 2);


        //addBorderFace(-frameWidth, -frameHeight, width+frameWidth, 0, 0, 1, 2, 3);
        //addBorderFace(-frameWidth, 0, 0, height, 0, 1, 2, 3);
        //addBorderFace(width, 0, width+frameWidth, height, 0, 1, 2, 3);
        //addBorderFace(-frameWidth, height, width+frameWidth, height+frameHeight, 0, 1, 2, 3);
    }


    var borderMaterial = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdd00dd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading });
    var borderMaterial2 = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x00dd00, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading });

    this.materials = [borderMaterial, borderMaterial2];

    this.computeCentroids();

};


THREE.BorderPlaneGeometry.prototype = new THREE.Geometry();

THREE.BorderPlaneGeometry.prototype.constructor = THREE.BorderPlaneGeometry;

/**
 * Create a two-sided plane
 */
THREE.TwoSidedPlaneGeometry = function ( width, height, segmentsWidth, segmentsHeight, frameWidth, frameHeight) {

    THREE.Geometry.call( this );

    var ix, iy,
    width_half = width / 2,
    height_half = height / 2,
    gridX = segmentsWidth || 1,
    gridY = segmentsHeight || 1,
    gridX1 = gridX + 1,
    gridY1 = gridY + 1,
    segment_width = width / gridX,
    segment_height = height / gridY,
    normal = new THREE.Vector3( 0, 0, 1 ),
    normal2 = new THREE.Vector3( 0, 0, -1 );

    // Add UV coordinates for back fill material
    this.faceVertexUvs.push([]);

    // Body vertices
    for ( iy = 0; iy < gridY1; iy++ ) {
        for ( ix = 0; ix < gridX1; ix++ ) {
            var x = ix * segment_width - width_half;
            var y = iy * segment_height - height_half;
            this.vertices.push(new THREE.Vector3( x, - y, 0 ));
        }
    }

    for ( iy = 0; iy < gridY; iy++ ) {

        for ( ix = 0; ix < gridX; ix++ ) {

            var a = ix + gridX1 * iy;
            var b = ix + gridX1 * ( iy + 1 );
            var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
            var d = ( ix + 1 ) + gridX1 * iy;

            var face = new THREE.Face4( a, b, c, d );
            face.normal.copy( normal );
            face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );

            face.materialIndex = 0;

            this.faces.push( face );
            this.faceVertexUvs[ 0 ].push( [
                        new THREE.UV( ix / gridX, iy / gridY ),
                        new THREE.UV( ix / gridX, ( iy + 1 ) / gridY ),
                        new THREE.UV( ( ix + 1 ) / gridX, ( iy + 1 ) / gridY ),
                        new THREE.UV( ( ix + 1 ) / gridX, iy / gridY )
                    ] );

            // Back side

            face = new THREE.Face4( a, d, c, b );
            face.normal.copy( normal2 );
            face.vertexNormals.push( normal2.clone(), normal2.clone(), normal2.clone(), normal2.clone() );

            face.materialIndex = 1;

            this.faces.push( face );
            this.faceVertexUvs[0].push( [
                        new THREE.UV( ix / gridX, iy / gridY ),
                        new THREE.UV( ( ix + 1 ) / gridX, iy / gridY ),
                        new THREE.UV( ( ix + 1 ) / gridX, ( iy + 1 ) / gridY ),
                        new THREE.UV( ix / gridX, ( iy + 1 ) / gridY )
                    ] );


        }

    }

    var fillMaterial = new THREE.MeshBasicMaterial( {  color: 0xff00ff, wireframe : true } );

    this.materials = [fillMaterial, fillMaterial];

    this.computeCentroids();

};

THREE.TwoSidedPlaneGeometry.prototype = new THREE.Geometry();

THREE.TwoSidedPlaneGeometry.prototype.constructor = THREE.TwoSidedPlaneGeometry;


// http://data-arts.appspot.com/globe/globe.js

// http://superfad.com/missioncontrol/js/superglobe.js

THREE.LinePlaneGeometry = function(width, height) {
    THREE.Geometry.call( this );

    var ix, iy;
    var width_half = width / 2,
    height_half = height / 2,
    gridY = 1,
    gridX = 1,
    normal = new THREE.Vector3( 0, 0, -1 ),
    normal2 = new THREE.Vector3( 0, 0, 1 );

    // Body vertices

    var x = width_half;
    var y = height_half;

    this.vertices.push( new THREE.Vertex( new THREE.Vector3( -x, -y, 0 ) ) );
    this.vertices.push( new THREE.Vertex( new THREE.Vector3( -x, y, 0 ) ) );
    this.vertices.push( new THREE.Vertex( new THREE.Vector3( x, y, 0 ) ) );
    this.vertices.push( new THREE.Vertex( new THREE.Vector3( x, -y, 0 ) ) );
    this.vertices.push( new THREE.Vertex( new THREE.Vector3( -x, -y, 0 ) ) );


};

THREE.LinePlaneGeometry.prototype = new THREE.Geometry();

THREE.LinePlaneGeometry.prototype.constructor = THREE.LinePlaneGeometry;


THREE.CustomShaders = {
    'alphaedge' : {
      uniforms: {
            "color" : { type: "v3", value: new THREE.Vector3(1, 0, 1) },
            "intensity" : { type: "f", value: 0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        "uniform vec3 color;",
        "uniform float intensity;",
         'void main() {',
          'float distance = dot(vUv, vUv);',
          'float e = intensity * distance;',
          'vec4 add = vec4(color.x, color.y, color.z, e*0.8);',
          //'vec4 mix = vec4(gl_FragColor.r + color.x /2.0, 0.5, 0.5, 1);',
          //'vec4 clamped = vec4(clamp(add.x, add.y, add.z, e));',
          'gl_FragColor = add;',
        '}'
      ].join('\n')
    }
  };

});
