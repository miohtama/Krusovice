/*global define*/

// A simple custom shim around three.js
define([
"krusovice/thirdparty/three",
"krusovice/thirdparty/shaders/BasicShader",
"krusovice/thirdparty/shaders/BleachBypassShader",
"krusovice/thirdparty/shaders/BlendShader",
"krusovice/thirdparty/shaders/BokehShader",
"krusovice/thirdparty/shaders/BrightnessContrastShader",
"krusovice/thirdparty/shaders/ColorCorrectionShader",
"krusovice/thirdparty/shaders/ColorifyShader",
"krusovice/thirdparty/shaders/ConvolutionShader",
"krusovice/thirdparty/shaders/CopyShader",
"krusovice/thirdparty/shaders/DOFMipMapShader",
"krusovice/thirdparty/shaders/DotScreenShader",
"krusovice/thirdparty/shaders/FXAAShader",
"krusovice/thirdparty/shaders/FilmShader",
"krusovice/thirdparty/shaders/FocusShader",
"krusovice/thirdparty/shaders/HorizontalBlurShader",
"krusovice/thirdparty/shaders/HorizontalTiltShiftShader",
"krusovice/thirdparty/shaders/HueSaturationShader",
"krusovice/thirdparty/shaders/KaleidoShader",
"krusovice/thirdparty/shaders/LuminosityShader",
"krusovice/thirdparty/shaders/MirrorShader",
"krusovice/thirdparty/shaders/NormalMapShader",
"krusovice/thirdparty/shaders/RGBShiftShader",
"krusovice/thirdparty/shaders/SSAOShader",
"krusovice/thirdparty/shaders/SepiaShader",
"krusovice/thirdparty/shaders/TriangleBlurShader",
"krusovice/thirdparty/shaders/UnpackDepthRGBAShader",
"krusovice/thirdparty/shaders/VerticalBlurShader",
"krusovice/thirdparty/shaders/VerticalTiltShiftShader",
"krusovice/thirdparty/shaders/VignetteShader"
], function () {
    return window.THREE;
});

