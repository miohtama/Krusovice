/**
 * 2D planar texture backend
 *
 */

define(["krusovice/thirdparty/jquery", "krusovice/thirdparty/three-bundle"], function($, THREE) {

    "use strict";

    function TextureBackground(options, data) {
        this.options = options;
        this.data = data;
    }

    $.extend(TextureBackground.prototype, {

        // The loaded Three.js texture
        texture : null,

        /**
         * Load the referred texture in the memory
         */
        prepare : function(loader) {
            var self = this;

            function done(texture) {
                self.texture = texture;
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
        buildScene : function(krusoviceRenderer) {

            var renderer = krusoviceRenderer.renderer; // ThreeJS backend

            // https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_texture_anisotropy.html
            var maxAnisotropy = renderer.getMaxAnisotropy ? renderer.getMaxAnisotropy() : 16;
            var texture1 = this.texture;

            if(!texture1) {
                throw new Error("Texture loading has failed, cannot proceed");
            }

            var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );

            texture1.anisotropy = maxAnisotropy;
            texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
            texture1.repeat.set( 512, 512 );

            var geometry = new THREE.PlaneGeometry( 100, 100 );
            var mesh1 = new THREE.Mesh( geometry, material1 );
            mesh1.rotation.x = - Math.PI / 2;
            mesh1.scale.set( 1000, 1000, 1000 );

            var scene = krusoviceRenderer.scene;
            scene.add(mesh1);

            // Object type hint for 2d post-processing
            mesh1.krusoviceTypeHint = "background";

        },

        // XXX: Nothing to do
        render : function(cfx, renderer) {
        }

    });


    return TextureBackground;
});