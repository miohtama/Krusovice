/*global define, console, jQuery, document, setTimeout */

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
                autoClear : false
            };

            renderer = new THREE.WebGLRenderer(settings);
        } else {
            renderer = new THREE.CanvasRenderer();
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

        var camera = new THREE.Camera(fov,
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

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.x = 0;
        directionalLight.position.y = 0.5;
        directionalLight.position.z = -1.0;
        directionalLight.position.normalize();

        scene.add( directionalLight );

        var ambient = new THREE.AmbientLight(0x888888);
        scene.add( ambient );

    },

    /**
     * Set-up image post processing fragment shaders
     *
     *
     */
    setupComposer : function() {

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

        var plane = new THREE.FramedPlaneGeometry(dimensions.width, dimensions.height, 4, 4, borderWidth, borderWidth, hasNoBody, x, y);

        var filler = new THREE.MeshBasicMaterial( {  map: texture } );

        var border;

        var borderColorHex = cssToOpenGLColor(borderColor || "#eeEEee");

        if(this.webGL) {
            // Phong shaded borders on webGL
            border = new THREE.MeshPhongMaterial( {
                ambient: 0x999999,
                color: borderColorHex,
                specular: 0xffFFff,
                shininess: 30,
                shading: THREE.SmoothShading
             });
        } else {

            // XXX: White on white issue
            if(borderColorHex == 0xffFFff) {
                borderColorHex = 0x999999;
            }

            // Flat borders on <canvas>
            border = new THREE.MeshLambertMaterial( {
                color: borderColorHex,
                shading : THREE.FlatShading });
        }

        var material = new THREE.MeshFaceMaterial();


        // Debug material
        //var material = new THREE.MeshBasicMaterial({color : 0xff00ff, wireframe:true});

        plane.materials[0] = plane.materials[1] = filler;
        plane.materials[2] = plane.materials[3] = border;

        var mesh = new THREE.Mesh(plane, material);

        if(!this.webGL) {
            // <canvas> 3d face gap elimimination
            // XXX: When fading out, set overdraw = false
            filler.overdraw = true;
            material.overdraw = true;
            mesh.overdraw = true;
        }

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
     * Make object alive
     */
    wakeUp : function(mesh, effectObject) {

        if(!mesh) {
            throw "Oh mama, can we call this a null pointer exception?";
        }

        if(!mesh.added) {
            this.scene.add(mesh);

            if(effectObject) {
                 this.maskScene.addObject(effectObject);
            }

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

    render : function(frontBuffer) {
        if(this.webGL) {
            this.renderGL(frontBuffer);
        } else {
            this.renderCanvas(frontBuffer);
        }
    },

    renderCanvas : function(frontBuffer) {
        var scene = this.scene;
        var camere = this.camera;

        this.renderer.render(this.scene, this.camera);
        frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
    },

    renderPostProcessing : function(frontBuffer) {


        console.log("renderPostProcessing()");

        // Let Three.js do its magic
        var scene = this.scene;
        var camere = this.camera;
        var r = this.renderer;

        /*
        r.autoClear = false;
        var color = new THREE.Color(0);
        r.setClearColor(color, 0);
        r.clear();

        var r = this.renderer;
        var read = this.target;
        var write = this.target2;
        var bloomBuffer  = this.bloomBuffer;
        var bloomBuffer2  = this.bloomBuffer2;
        */
       
        //renderer.setViewport(0, halfHeight, halfWidth, halfHeight );
        //
        this.renderer.clear();
        this.composer.render(0.01);

    },

    renderGL : function(frontBuffer) {

        // Let Three.js do its magic
        var scene = this.scene;
        var camere = this.camera;

        // XXX: Clean up rendering code to separate methods

        if(!this.usePostProcessing) {

            var gl = this.renderer.context;

            var r = this.renderer;
            var read = this.target;
            var write = this.target2;
            var bloomBuffer  = this.bloomBuffer;
            var bloomBuffer2  = this.bloomBuffer2;

            //r.clearTarget(read);

            // Clear target to 100% alpha
            r.autoClear = false;
            var color = new THREE.Color(0);
            r.setClearColor(color, 0);
            r.clear();

            //gl.blendEquation(gl.FUNC_ADD );
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            //gl.enable(gl.BLEND);

            //context.clearColor(0xff00ff);

            r.clearTarget(bloomBuffer);
            r.clearTarget(read);
            r.clearTarget(write);
            r.clearTarget(bloomBuffer2);

            //r.setClearColor(0xffFFff, 0);
            //r.autoClear = false;
            //r.clear();


            //r.render(this.maskScene);
            //r.render(this.scene);


            // Make copy of the orignal rendering
            //r.clearTarget(bloomBuffer, true, true, true);

            /*
            this.copyPass.render(r, this.bloomBuffer, read, 0);

            // Clear depth buffer so that mask object will not Z conflict with real obj
            r.clearTarget(read, false, true, true);
            //r.clearTarget(read);
            //r.clearTarget(write, true, true, true);

            this.maskModel.render(r, bloomBuffer2, read, 0);
            // XXX: WTF... whyyy? Can't understand.
            // Haapala will spank me.
            this.copyPass.render(r, bloomBuffer2, read, 0);
            //this.renderer.render(this.scene, this.camera);
            this.clearMask.render(r);

            // Now have bloomable content in read buffer
            //r.clearTarget(this.bloomBuffer);
            //this.copyPass.render(r, write, this.bloomBuffer, 0);

            //this.effectBloom.render(r, write, this.bloomBuffer, 0);

            // Place actual image
            //this.copyPass.render(r, write, bloomBuffer, 0);
            this.copyPass.render(r, write, bloomBuffer, 0);
            //this.copyPass.render(r, write, bloomBuffer2, 0);
            */
            // Place bloom overlay
            //this.copyPass.render(r, write, this.bloomBuffer, 0);

            //r.clearTarget(write, true, true, true);
            //r.clearTarget(read, true, true, true);

            //this.copyPass.render(r, read, this.bloomBuffer, 0);
            //this.copyPass.render(r, write, this.bloomBuffer, 0);
            //context.stencilFunc( context.EQUAL, 1, 0xffffffff );
            //this.copyPass.render(r, write, read, 0);

            //copy(r, write, read, this.width, this.height);

            //this.renderer.render(this.scene, this.camera);
            //r.clear(false, true, true);
            //THREE.EffectComposer.quad.material = new THREE.MeshBasicMaterial({map:write});
            //r.render(THREE.EffectComposer.scene, THREE.EffectComposer.camera);
            //

            this.maskObject.render(r, undefined, undefined, 0);
            r.clear(false, true, true);
            this.renderModel.render(r, undefined, undefined, 0);

        } else {
            this.renderPostProcessing(frontBuffer);
        }

        //composer.addPass( effectFilm );
        //console.log("Got three");
        //console.log(this.renderer);
        /*
        console.log("Got buffer");
        console.log(frontBuffer);*/

        frontBuffer.drawImage(this.renderer.domElement, 0, 0, this.width, this.height);
        // blit to actual image output from THREE <canvas> renderer internal buffer
    },

    /**
     * Get a handle to the background canvas element
     */
    getBackgroundCanvasContext : function() {
        return this.renderer.domElement.getContext("2d");
    }
};


/**
 * Create a plane mesh with fill and border material, optionally different for both sides
 */
THREE.FramedPlaneGeometry = function ( width, height, segmentsWidth, segmentsHeight, frameWidth, frameHeight, noBody, ax, ay) {

    THREE.Geometry.call( this );


    console.log("nobody:" + noBody);

    var ix, iy,
    width_half = width / 2,
    height_half = height / 2,
    gridX = segmentsWidth || 1,
    gridY = segmentsHeight || 1,
    gridX1 = gridX + 1,
    gridY1 = gridY + 1,
    segment_width = width / gridX,
    segment_height = height / gridY,
    normal = new THREE.Vector3( 0, 0, -1 ),
    normal2 = new THREE.Vector3( 0, 0, 1 );

    // Add UV coordinates for back fill material
    this.faceVertexUvs.push([]);

    // Body vertices
    for ( iy = 0; iy < gridY1; iy++ ) {
        for ( ix = 0; ix < gridX1; ix++ ) {
            var x = ix * segment_width - width_half;
            var y = iy * segment_height - height_half;
            this.vertices.push( new THREE.Vertex( new THREE.Vector3( x, - y, 0 ) ) );
        }
    }

    if(!noBody) {

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

    }

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

        self.vertices.push(new THREE.Vertex( new THREE.Vector3(ax + left, ay + top,  0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(ax + right, ay + top, 0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(ax + right, ay + bottom, 0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(ax + left, ay + bottom, 0)));

        // Create faces for both sides

        var face = new THREE.Face4(vi, vi+1, vi+2, vi+3);
        face.normal.copy( normal );
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
        face.materialIndex = 2;
        self.faces.push( face );
        self.borderFaces.push(face);

        self.faceVertexUvs[0].push( [
                    uv[v1], uv[v2], uv[v3], uv[v4]
                ] );

        face = new THREE.Face4(vi, vi+3, vi+2, vi+1);
        face.normal.copy(normal2);
        face.vertexNormals.push(normal2.clone(), normal2.clone(), normal2.clone(), normal2.clone());
        face.materialIndex = 3;
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


    var fillMaterial = new THREE.MeshBasicMaterial( {  color: 0xff00ff, wireframe : true } );
    var borderMaterial = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading });
    var borderMaterial2 = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x00dd00, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading });

    this.materials = [fillMaterial, fillMaterial, borderMaterial, borderMaterial2];

    this.computeCentroids();

};

THREE.FramedPlaneGeometry.prototype = new THREE.Geometry();

THREE.FramedPlaneGeometry.prototype.constructor = THREE.FramedPlaneGeometry;


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
