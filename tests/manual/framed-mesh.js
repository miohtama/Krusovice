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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff00ff";
        ctx.fillRect(0, 200, 512, 280);

        mesh.rotation.y += 0.02;
        //mesh.rotation.x += 0.02;

        //mesh.updateMatrix();
        mesh.updateMatrixWorld();


        if(mesh2) {
            mesh2.rotation.y -= 0.02;
            //mesh.rotation.x += 0.02;

            //mesh.updateMatrix();
            mesh2.updateMatrixWorld();
        }

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
        //bodyMaterial.alphaTest = true;
        //var bodyMaterial = new THREE.MeshBasicMaterial({color : 0xff000055 });

        bodyMaterial.transparent = false;

        var material = new THREE.MeshFaceMaterial();
        //material.alphaTest = true;
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

        mesh.scale = new THREE.Vector3(0.5, 0.5, 0.5);

        return mesh;
    }

    function init() {
        renderer.setup();

        var img = new Image();


        function createImage() {
            var texture = new THREE.Texture(img, THREE.UVMapping);
            var mesh = createObjects(texture, img);

            mesh.position.x += 100;

            return mesh;
        }

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


            createText(donedone);
            //donedone();
        }

        //var material = new THREE.MeshFaceMaterial();
        //var src = "../../demos/test-texture.jpg";

        var src = "../../demos/test-texture-transparent.png";
        img.onload = done;
        img.crossOrigin = '';
        img.src = src;

    }

    init();
});

