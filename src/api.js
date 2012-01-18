/*global define,window*/

define("krusovice/api", [

    // Third party code
    "require",
    "krusovice/thirdparty/jquery-bundle",
    "krusovice/thirdparty/three-bundle",

    // Core namespace
    "krusovice/core",

    // Internal modules
    "krusovice/startup",
    "krusovice/utils",
    "krusovice/design",
    "krusovice/inputelement",
    "krusovice/editdata",
    "krusovice/project",
    "krusovice/loader",
    "krusovice/rhythmanalysis",
    "krusovice/timeliner",
    "krusovice/timelinevisualizer",
    "krusovice/show",
    "krusovice/renderers/three",
    "krusovice/effects",
    "krusovice/effects/linear",
    "krusovice/backgrounds",
    "krusovice/backgrounds/plain",
    "krusovice/backgrounds/scroll2d",
    "krusovice/showobjects",
    "krusovice/showobjects/framedimage",
    "krusovice/showobjects/textdefinitions",
    "krusovice/showobjects/text",
    "krusovice/music",
    "krusovice/tools/fade",
    "krusovice/tools/url",
    "krusovice/tools/resizer",
    "krusovice/tools/text2canvas",
    // XXX: Unsupported in browsers
    //"krusovice/tools/html2svg2canvas"

    "krusovice/thirdparty/three-extra"
    //"krusovice/thirdparty/three-extra/BloomPass"

], function(require, $, THREE, krusovice) {
    console.log("Krusovice API init");
    window.krusovice = krusovice;
    return krusovice;
});
