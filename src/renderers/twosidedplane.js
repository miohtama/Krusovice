/**
 * Helper geometry for photos.
 */

define(["krusovice/thirdparty/three-bundle"], function(THREE) {

    "use strict";

    /**
     * Two-sided plane where we can define different faces for the different sides of the plane.
     *
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
                var y = (gridY1-iy-1) * segment_height - height_half;
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

                // Front side

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

        this.computeCentroids();

    };

    THREE.TwoSidedPlaneGeometry.prototype = new THREE.Geometry();

    THREE.TwoSidedPlaneGeometry.prototype.constructor = THREE.TwoSidedPlaneGeometry;


    return THREE.TwoSidedPlaneGeometry;

});


