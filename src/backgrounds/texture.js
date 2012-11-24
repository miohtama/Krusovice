/**
 * 2D planar texture backend
 *
 */

define(["krusovice/thirdparty/jquery", "krusovice/thirdparty/three-bundle"], function($, THREE) {

    "use strict";

    function TextureBackground(options, data) {
        this.options = options;
        this.data = data || {};
    }

    $.extend(TextureBackground.prototype, {

        // The loaded Three.js texture
        texture : null,

        // Plane mesh presenting the background texture
        mesh : null,

        // horizon, wall
        type : null,

        /**
         * Load the referred texture in the memory
         */
        prepare : function(loader) {
            var self = this;

            function done(texture) {
                self.texture = texture;
            }

            this.type = this.data.type || "horizon";

            // Asynchronous texture load / co-operate
            // with show resource manager
            loader.loadTexture(this.options.src, undefined, done);
        },

        /**
         * Create an infinite plane with continous texture.
         *
         * The plane is always XY and Z=0
         *
         */
        buildScene : function(krusoviceRenderer) {

            var renderer = krusoviceRenderer.renderer; // ThreeJS backend

            var sizeOfMYJewelry = 100000;

            // https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_texture_anisotropy.html
            var maxAnisotropy = renderer.getMaxAnisotropy ? renderer.getMaxAnisotropy() : 16;
            var texture1 = this.texture;

            if(!texture1) {
                throw new Error("Texture loading has failed, cannot proceed");
            }

            var material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture1 } );

            texture1.anisotropy = maxAnisotropy;
            texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
            texture1.repeat.set( 512, 512 );

            var geometry = new THREE.PlaneGeometry(sizeOfMYJewelry, sizeOfMYJewelry);

            var mesh1 = new THREE.Mesh( geometry, material1 );
            mesh1.rotation.x = - Math.PI / 2;
            var scene = krusoviceRenderer.scene;
            scene.add(mesh1);

            // Object type hint for 2d post-processing
            mesh1.krusoviceTypeHint = "background";

            this.setupPlanePosition(mesh1);

            this.mesh = mesh1;

        },

        setupPlanePosition : function(mesh) {
            if(this.type == "horizon") {
                mesh.position.z = -10000;
                mesh.position.y = 2000;
                mesh.rotation.x = -1.1*Math.PI/3;
                mesh.updateMatrixWorld();
            } else {
                throw new Error("Unknown background texture plane type " + this.type);
            }
        },

        // XXX: Nothing to do
        render3d : function(krusoviceRenderer) {

            // Access Three.JS renderer instance
            var renderer = krusoviceRenderer.renderer;

            //this.mesh.position.z -= 1;

            //this.mesh.position.y += 1;
            //this.mesh.rotation.x -= 0.01;
            this.mesh.updateMatrixWorld();
        }

    });


    return TextureBackground;
});