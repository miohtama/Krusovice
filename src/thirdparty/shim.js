
// Wrap 3rd party libraries

var requireShim = {

    'audia': {
        deps : [],
        exports : "window.Audia"
    },

    'spin': {
        deps : [],
        exports : "window.Spinner"
    },

    'bootstrap': {
        deps : ["krusovice/thirdparty/jquery"],
        exports : "$"
    },

    'krusovice/thirdparty/remix/src/js/audio': {
        deps : ["krusovice/thirdparty/remix/src/js/utils"]
    },

    'krusovice/thirdparty/remix/src/js/filter': {
        deps : ["krusovice/thirdparty/remix/src/js/utils"]
    },

    'krusovice/thirdparty/remix/src/js/manager': {
        deps : ["krusovice/thirdparty/remix/src/js/filter"]
    },

    // Controls

    "krusovice/thirdparty/controls/orbit": {
        deps: ["krusovice/thirdparty/three"],
        exports : "THREE.OrbitControls"
    },

    "krusovice/thirdparty/controls/trackball": {
        deps: ["krusovice/thirdparty/three"],
        exports : "THREE.TrackballControls"
    },

    // Shaders

    "krusovice/thirdparty/shaders/BasicShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/BleachBypassShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/BlendShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/BokehShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/BrightnessContrastShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/ColorCorrectionShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/ColorifyShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/ConvolutionShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/CopyShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/DOFMipMapShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/DotScreenShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/FXAAShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/FilmShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/FocusShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/HorizontalBlurShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/HorizontalTiltShiftShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/HueSaturationShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/KaleidoShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/LuminosityShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/MirrorShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/NormalMapShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/RGBShiftShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/SSAOShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/SepiaShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/TriangleBlurShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/UnpackDepthRGBAShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/VerticalBlurShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/VerticalTiltShiftShader": {
        deps: ["krusovice/thirdparty/three"]
    },
    "krusovice/thirdparty/shaders/VignetteShader": {
        deps: ["krusovice/thirdparty/three"]
    }

};