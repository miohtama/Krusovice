/*global define*/

define("krusovice/renderers/three", ["krusovice/thirdparty/jquery-bundle", "krusovice/core", "krusovice/thirdparty/three-bundle"], function($, krusovice, THREE) {
'use strict';

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
     * Use WebGL backend
     */
    webGL : false,

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

        var renderer;
        if(this.webGL) {
            // https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js
            renderer = new THREE.WebGLRenderer({ antialias : true});
        } else {
            renderer = new THREE.CanvasRenderer();
        }

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

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.x = 0;
        directionalLight.position.y = 0.5;
        directionalLight.position.z = -1.0;
        directionalLight.position.normalize();

        scene.add( directionalLight );

        var ambient = new THREE.AmbientLight( 0x333333 );
        scene.add( ambient );

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

        var texture;

        if(this.webGL && src.getContext) {

            console.log("createQuad(), using src:");
            console.log(src);

            texture = new THREE.Texture(src, THREE.UVMapping);
            texture.needsUpdate = true;
            //texture.repeat.set( 1000, 1000 );

        } else {
            texture = new THREE.Texture(src);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        }


        var dimensions = krusovice.utils.calculateAspectRatioFit(srcWidth, srcHeight, this.PLANE_WIDTH, this.PLANE_HEIGHT);

        var plane = new THREE.PlaneGeometry(dimensions.width, dimensions.height, 4, 4);

        //console.log("Created plane:" + dimensions.width + " " + dimensions.height);

        var material = new THREE.MeshBasicMaterial( {  map: texture } );
        //var material = new THREE.MeshBasicMaterial( {  color: 0xff00ff } );

        var mesh = new THREE.Mesh( plane, material );

        // <canvas> 3d face gap elimimination
        mesh.overdraw = true;

        mesh.doubleSided = true;
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

        if(!mesh.added) {
            this.scene.addObject(mesh);
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
    farewell : function(mesh) {
        // this.scene.removeObject(mesh);
        //console.log("Farewell for object");
        mesh.visible = false;
    },


    render : function(frontBuffer) {

        // Let Three.js do its magic
        this.renderer.render(this.scene, this.camera);

        //console.log("Got three");
        //console.log(this.renderer);
        /*
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


/**
 * @author mr.doob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

THREE.FramedPlaneGeometry = function ( width, height, segmentsWidth, segmentsHeight, frameWidth, frameHeight ) {

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
    normal = new THREE.Vector3( 0, 0, -1 ),
    normal2 = new THREE.Vector3( 0, 0, 1 );


    // Body vertices
    for ( iy = 0; iy < gridY1; iy++ ) {

        for ( ix = 0; ix < gridX1; ix++ ) {

            var x = ix * segment_width - width_half;
            var y = iy * segment_height - height_half;

            this.vertices.push( new THREE.Vertex( new THREE.Vector3( x, - y, 0 ) ) );

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

        }

    }

    this.borderFaces = [];
    var self = this;

    function addBorderFace(left, top, right, bottom, clockwise) {

        var vi = self.vertices.length;

        left -= width_half;
        top -= height_half;
        right -= width_half;
        bottom -= height_half;

        console.log("face " + left + " " + top + " " + right + " " + bottom);

        self.vertices.push(new THREE.Vertex( new THREE.Vector3(left, top,  0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(right, top, 0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(right, bottom, 0)));
        self.vertices.push(new THREE.Vertex( new THREE.Vector3(left, bottom, 0)));

        // Create faces for both sides

        var face = new THREE.Face4(vi, vi+1, vi+2, vi+3);
        face.normal.copy( normal );
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
        face.materialIndex = 1;
        self.faces.push( face );
        self.borderFaces.push(face);

        face = new THREE.Face4(vi, vi+3, vi+2, vi+1);
        face.normal.copy(normal2);
        face.vertexNormals.push(normal2.clone(), normal2.clone(), normal2.clone(), normal2.clone());
        face.materialIndex = 2;
        self.faces.push(face);
        self.borderFaces.push(face);

    }

    addBorderFace(-frameWidth, -frameHeight, width+frameWidth, 0);
    addBorderFace(-frameWidth, 0, 0, height);
    addBorderFace(width, 0, width+frameWidth, height);
    addBorderFace(-frameWidth, height, width+frameWidth, height+frameHeight);


    var fillMaterial = new THREE.MeshBasicMaterial( {  color: 0xff00ff, wireframe : true } );
    var borderMaterial = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading });
    var borderMaterial2 = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x00dd00, specular: 0x009900, shininess: 30, shading: THREE.FlatShading });

    this.materials = [fillMaterial, borderMaterial, borderMaterial2];

    this.computeCentroids();

};

THREE.FramedPlaneGeometry.prototype = new THREE.Geometry();

THREE.FramedPlaneGeometry.prototype.setBorderMaterial = function(material) {

}

THREE.FramedPlaneGeometry.prototype.constructor = THREE.FramedPlaneGeometry;


});
