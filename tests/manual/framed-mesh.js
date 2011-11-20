/**
 * See what we can do for images on the client side.
 *
 */

/*global require,window,simpleElements,console,THREE*/


require(["krusovice/thirdparty/jquery",
    "krusovice/api",
    "krusovice/tools/text2canvas",
    "../../src/thirdparty/domready!"], function($, krusovice, text2canvas) {

    "use strict";

    var renderer = new krusovice.renderers.Three({ width : 640, height: 360, webGL : true});

    var i = 0;

    function loop(mesh, mesh2) {
        var canvas = document.getElementsByTagName("canvas")[0];
        if(!canvas) { throw "Ooops"; }
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        mesh.rotation.y += 0.01;
        //mesh.rotation.x += 0.02;

        //mesh.updateMatrix();
        mesh.updateMatrixWorld();


        mesh2.rotation.y -= 0.01;
        //mesh.rotation.x += 0.02;

        //mesh.updateMatrix();
        mesh2.updateMatrixWorld();

        renderer.render(ctx);

        function again() {
            loop(mesh, mesh2);
        }

        krusovice.utils.requestAnimationFrame(again);
        //console.log("Frame:" + i++);
    }

    function createObjects(texture, img) {

        var dimensions = krusovice.utils.calculateAspectRatioFit(img.width, img.height, 512, 512);

        var plane = new THREE.FramedPlaneGeometry(dimensions.width, dimensions.height, 4, 4, 16, 16);

        texture.needsUpdate = true;
        texture.minFilter = texture.magFilter = THREE.NearestFilter;

        var bodyMaterial = new THREE.MeshBasicMaterial({color : 0xffFFff, map:texture});
        var material = new THREE.MeshFaceMaterial();
        plane.materials[0] = bodyMaterial;
        plane.materials[1] = bodyMaterial;
        //mesh = new THREE.Mesh(plane, material);
        var mesh = new THREE.Mesh(plane, material);
        //mesh.doubleSided = true;
        //mesh.useQuaternion = true;
        //mesh.position = [0,0,krusovice.effects.ON_SCREEN_Z];
        //mesh.rotation.z = 3;
        //mesh.rotation.y = 2;

        renderer.scene.addObject(mesh);

        return mesh;
    }

    function init() {
        renderer.setup();

        var img = new Image();


        function createImage() {
            var texture = new THREE.Texture(img, THREE.UVMapping);
            var mesh = createObjects(texture, img);

            mesh.position.y += 0.5;

            return mesh;
        }

        function createText() {
            var canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 288;

            var renderer = new text2canvas.Renderer({canvas:canvas});

            renderer.renderText("Foobar");

            var texture = new THREE.Texture(canvas, THREE.UVMapping);
            var mesh = createObjects(texture, canvas);

            mesh.position.y -= 0.5;

            return mesh;
        }

        function done() {
            var mesh = createImage();
            var mesh2 = createText();
            loop(mesh, mesh2);
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

