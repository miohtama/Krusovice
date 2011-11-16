/**
 * See what we can do for images on the client side.
 *
 */

/*global require,window,simpleElements,console,THREE*/


require(["krusovice/thirdparty/jquery",
    "krusovice/api",
    "../../src/thirdparty/domready!"], function($, krusovice) {

    "use strict";

    var renderer = new krusovice.renderers.Three({ width : 640, height: 360, webGL : true});
    var mesh = null;
    var i = 0;

    function loop() {
        var canvas = document.getElementsByTagName("canvas")[0];
        if(!canvas) { throw "Ooops"; }
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        mesh.rotation.y += 0.01;
        mesh.rotation.x += 0.02;

        //mesh.updateMatrix();
        mesh.updateMatrixWorld();

        renderer.render(ctx);
        krusovice.utils.requestAnimationFrame(loop);
        //console.log("Frame:" + i++);
    }

    function createObjects(texture, img) {

        var plane = new THREE.FramedPlaneGeometry(512, 512, 4, 4, 32, 32);

        texture.needsUpdate = true;
        texture.minFilter = texture.magFilter = THREE.NearestFilter;

        var bodyMaterial = new THREE.MeshBasicMaterial({color : 0xffFFff, map:texture});
        var material = new THREE.MeshFaceMaterial();
        plane.materials[0] = bodyMaterial;
        plane.materials[1] = bodyMaterial;
        //mesh = new THREE.Mesh(plane, material);
        mesh = new THREE.Mesh(plane, material);
        //mesh.doubleSided = true;
        //mesh.useQuaternion = true;
        //mesh.position = [0,0,krusovice.effects.ON_SCREEN_Z];
        //mesh.rotation.z = 3;
        //mesh.rotation.y = 2;

        renderer.scene.addObject(mesh);
    }

    function init() {
        renderer.setup();

        var img = new Image();

        function done() {
            var texture = new THREE.Texture(img, THREE.UVMapping);
            createObjects(texture, img);
            loop();
        }

        //var material = new THREE.MeshFaceMaterial();
        //var src = "../../demos/test-texture.jpg";

        var src = "../../demos/ukko.jpg";
        img.onload = done;
        img.crossOrigin = '';
        img.src = src;

    }

    init();
});

