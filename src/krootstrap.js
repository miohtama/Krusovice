define(['require'], function(require) {
"use strict";

window.krusovice = window.krusovice || {};
var krusovice = window.krusovice;
krusovice.version = "trunk"; // $VERSION_LINE

/*global console,window*/

/**
 * Dynamicaly load Krusovice Javascript code for debug mode (not merged/compressed)
 *
 * Load library own files and dependencies if needed.
 *
 * @param {Function} doneCallback Called after the loading is complete.
 *
 * @param {Boolean} includeDependencies Include dependency libraries also
 *
 */
krusovice.load = function(doneCallback, includeDependencies) {

        // Someone elses code
    var deps = [
        "thirdparty/jquery.js",
        "thirdparty/jquery.easing.1.3.js",
        "thirdparty/Three.js"
        ];

    // Our code
    var files = [
         "utils",
         "design",
         "inputelement",
         "project",
         "loader",
         "rhythmanalysis",
         "timeliner",
         "timelinevisualizer",
         "show",
         "renderers/three",
         "renderers/canvas",
         "renderers/projector",
         "effects/base",
         "effects/linear",
         "backgrounds/background",
         "showobjects/showobjects",
         "showobjects/framedimage",
         "showobjects/textdefinitions",
         "showobjects/text",
         "music",
         "tools/fade",
         "tools/url"
    ];


    if (includeDependencies) {
        // ...
    }

    require(files, doneCallback);
};
