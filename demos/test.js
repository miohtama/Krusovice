// Example of writing to a texture alpha channel -- both foreground and background
// forked from http://jsfiddle.net/scottrabin/7gJtj/ and updated for Three.js r.49
// ref: https://github.com/mrdoob/three.js/issues/1359

require(["krusovice/thirdparty/three-bundle", "krusovice/api"], function(THREE) {

// render-to-texture scene and camera
var rttScene, rttCamera;

// visible scene and camera
var scene, camera;

// render-to-texture material and visible material
var rttMaterial, material;

// plane geometry for both rtt & visible
var planeGeometry;

// render-to-texture scene object & visible scene screens
var rttQuad, sceneQuad, alphaQuad;

// the render target
var rtTexture;

// the renderer
var renderer;

// size
var WIDTH = window.innerWidth * 0.45,
    HEIGHT = window.innerHeight * 0.8;

function init() {

    // initialize the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH * 2, HEIGHT);
    renderer.autoClear = false; // default
    document.getElementById('container').appendChild(renderer.domElement);

    // initialize the plane geometry
    planeGeometry = new THREE.PlaneGeometry(200, 200);

    // initialize the render target
    rtTexture = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });

    // initialize the render-to-texture scene and camera
    rttScene = new THREE.Scene();
    rttCamera = new THREE.OrthographicCamera(WIDTH / -2, WIDTH / 2, HEIGHT / 2, HEIGHT / -2, -10000, 10000);
    rttCamera.position.z = 100;
    rttScene.add(rttCamera);

    // initialize the render-to-texture material
    rttMaterial = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertex_shader').textContent,
        fragmentShader: document.getElementById('fragment_shader_alpha_mask').textContent
    });

    // set up the render-to-texture scene & camera
    rttQuad = new THREE.Mesh(planeGeometry, rttMaterial);
    rttQuad.position.z = -300;
    rttQuad.rotation.x = 1;
    rttQuad.rotation.y = 1;
    rttScene.add(rttQuad);

    // initialize the visible scenes and camera
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(WIDTH / -2, WIDTH / 2, HEIGHT / 2, HEIGHT / -2, -10000, 10000);
    camera.position.z = 100;
    scene.add(camera);

    // create the scene quad
    sceneQuad = new THREE.Mesh(planeGeometry, new THREE.ShaderMaterial({
        uniforms: {
            tex: {
                type: "t",
                value: 0,
                texture: rtTexture
            }
        },
        vertexShader: document.getElementById('vertex_shader').textContent,
        fragmentShader: document.getElementById('fragment_shader_render_texture').textContent
    }));
    sceneQuad.position.set(-100, 0, -100);
    sceneQuad.rotation.set(Math.PI / 2, 0, 0);
    scene.add(sceneQuad);

    // create the alpha channel quad
    alphaQuad = new THREE.Mesh(planeGeometry, new THREE.ShaderMaterial({
        uniforms: {
            tex: {
                type: "t",
                value: 0,
                texture: rtTexture
            }
        },
        vertexShader: document.getElementById('vertex_shader').textContent,
        fragmentShader: document.getElementById('fragment_shader_render_alpha_channel').textContent
    }));
    alphaQuad.position.set(100, 0, -100);
    alphaQuad.rotation.set(Math.PI / 2, 0, 0);
    scene.add(alphaQuad);

}

function render() {

    // render the first scene into a texture
    renderer.setClearColorHex( 0xff00ff, 0.3 ); // *** background *** //
    renderer.clearTarget(rtTexture);
    renderer.render( rttScene, rttCamera, rtTexture, true );

    // render the alpha channel
    renderer.setClearColorHex( 0x00ff00, 1.0 );
    renderer.clear();
    renderer.render( scene, camera );
}

init();
render();


});