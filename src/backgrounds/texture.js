/**
 * 2D planar texture backend
 *
 */

define([
"krusovice/thirdparty/jquery",
"krusovice/thirdparty/three-bundle",
"krusovice/utils"],
function($, THREE, utils) {

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
        mode : null,

        /**
         * Load the referred texture in the memory
         */
        prepare : function(loader) {
            var self = this;

            function done(texture) {
                self.texture = texture;
            }

            this.mode = this.options.mode || "horizon";

            if(!this.options.src) {
                throw new Error("Texture src missing");
            }

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
        buildScene : function(world, krusoviceRenderer) {

            var renderer = krusoviceRenderer.renderer; // ThreeJS backend

            var sizeOfMYJewelry = 100000;

            // https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_texture_anisotropy.html
            var maxAnisotropy = renderer.getMaxAnisotropy ? renderer.getMaxAnisotropy() : 16;
            var texture1 = this.texture;

            if(!texture1) {
                throw new Error("Texture loading has failed, cannot proceed:" + this.options.src);
            }

            var material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture1 } );

            texture1.anisotropy = maxAnisotropy;
            texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
            texture1.repeat.set(world.wall.repeat[0], world.wall.repeat[1]);

            var geometry = new THREE.PlaneGeometry(sizeOfMYJewelry, sizeOfMYJewelry);

            var mesh = new THREE.Mesh( geometry, material1 );
            mesh.rotation.x = - Math.PI / 2;
            var scene = krusoviceRenderer.scene;
            scene.add(mesh);

            // Object type hint for 2d post-processing
            mesh.krusoviceTypeHint = "background";

            // Allow photos to cast shadows on wall like background
            mesh.receiveShadow = true;

            this.setupPlane(krusoviceRenderer, world, scene, mesh);

            this.mesh = mesh;

        },

        /**
         * Do plane type specific setup
         */
        setupPlane : function(krusoviceRenderer, world, scene, mesh) {
            if(this.mode == "horizon") {
                mesh.position.z = -10000;
                mesh.position.y = 2000;
                mesh.rotation.x = -1.1*Math.PI/3;

                // Fade to horizon
                scene.fog = new THREE.Fog(krusoviceRenderer.backgroundColor, 8000, 10000);
            } else if(this.mode == "wall") {
                //mesh.position.z = -4000;
                mesh.position = utils.toVector(world.wall.position);
                mesh.rotation.x = 0;
            } else {
                throw new Error("Unknown background texture plane type " + this.mode);
            }

            mesh.updateMatrixWorld();

        },

        // XXX: Nothing to do
        render3d : function(krusoviceRenderer) {

            // Access Three.JS renderer instance
            var renderer = krusoviceRenderer.renderer;

            //this.mesh.position.z -= 1;
            //
            var mesh = this.mesh;

            //this.mesh.position.z -= 1;
            //this.mesh.rotation.x += 0.01;
            this.mesh.updateMatrixWorld();
        }

    });


    return TextureBackground;
});