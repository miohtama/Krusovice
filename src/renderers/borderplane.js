/**
 * Helper geometry for photos.
 */

define(["krusovice/thirdparty/three-bundle"], function(THREE) {

    "use strict";

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

        //this.materials = [borderMaterial, borderMaterial2];

        this.computeCentroids();

    };


    THREE.BorderPlaneGeometry.prototype = new THREE.Geometry();
    THREE.BorderPlaneGeometry.prototype.constructor = THREE.BorderPlaneGeometry;


    return THREE.BorderPlaneGeometry;

});


