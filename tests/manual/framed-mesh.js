/**
 *
 * This is mostly scratch test code to see that krusovice.renderers.Three gives meaningful output
 * and how different texture resize / upload / clip behavior work.
 *
 */

/*global Image, document, require, window, simpleElements, console, THREE, jQuery, $ */


require(["krusovice/thirdparty/jquery",
    "krusovice/api",
    "krusovice/tools/text2canvas",
    "../../src/thirdparty/domready!"], function($, krusovice, text2canvas) {

    "use strict";

    var renderer = new krusovice.renderers.Three({ width : 640, height: 360, webGL : true});

    var mesh, mesh2;

    var i = 0;

    /**
     * Bypass complex rendering
     *
     */
    function directRender() {
        renderer.renderer.render(renderer.scene, renderer.camera);
    }

    function loop() {
        var canvas = document.getElementsByTagName("canvas")[0];
        if(!canvas) { throw "Ooops"; }
        var ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff00ff";
        ctx.fillRect(0, 200, 512, 280);

        mesh.rotation.y += 0.02;

        //mesh.rotation.x += 0.02;
        //mesh.updateMatrix();
        //mesh.updateMatrixWorld();


        if(mesh2) {
            mesh2.rotation.y -= 0.005;
            mesh2.rotation.x += 0.005;
            //mesh.updateMatrix();
            //mesh2.updateMatrixWorld();
        }

        //directRender();
        renderer.render(ctx);

        function again() {
            console.log("frame");
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

        var bodyMaterial = new THREE.MeshLambertMaterial({color : 0xffFFff, map:texture});
        //bodyMaterial.alphaTest = true;
        //var bodyMaterial = new THREE.MeshBasicMaterial({color : 0xff000055 });

        //bodyMaterial.transparent = false;

        var material = new THREE.MeshFaceMaterial();
        //material.alphaTest = true;
        plane.materials[0] = bodyMaterial;
        plane.materials[1] = bodyMaterial;
        //mesh = new THREE.Mesh(plane, material);
        mesh = new THREE.Mesh(plane, material);
        //mesh.doubleSided = true;
        //mesh.useQuaternion = true;
        //mesh.position = [0,0,krusovice.effects.ON_SCREEN_Z];
        //mesh.rotation.z = 3;
        //mesh.rotation.y = 2;

        mesh.scale = new THREE.Vector3(0.5, 0.5, 0.5);
        renderer.scene.add(mesh);

        var materials = [];
        for ( var i = 0; i < 6; i ++ ) {

            material = new THREE.MeshPhongMaterial( {shininess: 255, ambient: 0xffffff, color: 0xddDDdd } );
            //material = new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff });
            materials.push(material);
            // materials.push( new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff } ) );
        }

        var d = 300;
        var geometry = new THREE.CubeGeometry(d, d, d, 1, 1, 1, materials);


        mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial() );
        renderer.scene.add(mesh2);


        return mesh;
    }

    function init() {

        var img = new Image();

        function createImage() {
            var texture = new THREE.Texture(img, THREE.UVMapping);
            var mesh = createObjects(texture, img);

            mesh.position.x += 100;

            return mesh;
        }

        /**
         * See output from text rendering functions.
         */
        function createText(callback) {
            var canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 288;

            var ctx = canvas.getContext("2d");

            //ctx.clearRect(0, 0, canvas.width, canvas.height);
            //ctx.fillStyle = "rgba(255, 128, 255, 0.5)";
            //ctx.fillRect(0, 0, canvas.width, canvas.height);

            var renderer = new text2canvas.Renderer({canvas:canvas});
            renderer.css["border-color"] = "#ffFFff";
            renderer.renderText("Foobar");

            /*
            var img = new Image();


            img.onload = function() {
                console.log("Uploaded texture");

                var texture = new THREE.Texture(img, THREE.UVMapping);
                texture.needsUpdate = true;
                var mesh = createObjects(texture, img);
                mesh.position.x -= 50;
                callback(mesh);
                document.body.appendChild(img);
            };*/

            function foo() {
                var texture = new THREE.Texture(canvas, THREE.UVMapping);
                texture.needsUpdate = true;
                var mesh = createObjects(texture, canvas);
                mesh.position.x -= 100;
                callback(mesh);
                document.body.appendChild(canvas);
            }

            foo();

            //img.src = canvas.toDataURL();
            //img.src = "../../demos/test-texture-transparent.png";



            // See that it is really transparent
            //document.body.appendChild(canvas);

            //return mesh;
        }

        function done() {

            var mesh, mesh2;

            function donedone(m2) {
                mesh2 = m2;


                //mesh2.material.map.image = img;
                //mesh.material.map.image = m2.material.map.image;

                //mesh.material = mesh2.material;

                loop(mesh, mesh2);
            }

            mesh = createImage();


            //createText(donedone);
            donedone();
        }

        //var material = new THREE.MeshFaceMaterial();
        //var src = "../../demos/test-texture.jpg";

        var src = "../../demos/test-texture-transparent.png";
        img.onload = done;
        img.crossOrigin = '';
        img.src = src;

        //renderer.setupSimple();
        renderer.setup();
        //document.body.appendChild(renderer.renderer.domElement);


    }

    init();
});

