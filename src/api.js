/*global define, window, console, jQuery, document, setTimeout, requirejs */


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
    "krusovice/analyses",
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

    "krusovice/directors/registry",
    "krusovice/directors/wall",

    "krusovice/music",

    "krusovice/tools/fade",
    "krusovice/tools/url",
    "krusovice/tools/resizer",
    "krusovice/tools/text2canvas"

], function(require, $, THREE, krusovice) {

    "use strict";

    console.log("Krusovice API init");
    window.krusovice = krusovice;
    return krusovice;
});
