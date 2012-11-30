/**
  * Play a simple generated WebGL show without music.
  */

/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

require([
    "krusovice/api",
    "krusovice/quickplay",
    "krusovice/styles/wall",
    "krusovice/plaintextreader",
    "bootstrap",
    "../src/thirdparty/domready!"],
function(krusovice, quickplay, wallStyle, readPlainTextShow) {

    "use strict";

    // List of demo texts and images in the show
    var source = "ukko.jpg\nthailand.jpg\nthailand3.jpg\nukko.jpg\nthailand.jpg\nthailand3.jpg";

    // Media locations
    var initOptions = {
        mediaURL : "../demos",
        songDataURL : "../demos/songs.json",
        songMediaURL : "../demos",
        backgroundMediaURL : "../demos",
        textMediaURL : "../src/showobjects/textdefinitions.js"
    };

    /**
     * Module namespace
     */
    var simple = {

        show : null,

        player : null,

        style : wallStyle,

        createDesign : function() {

            var plan = readPlainTextShow(source);

            this.style.setupPlan(plan);

            var design = new krusovice.Design({
                plan: plan,
                songId: null
            });

            this.style.setupDesign(design);

            return design;
        },


        /**
         * Reconstruct Show
         *
         * @param {krusovice.Design} design
         */
        playShow : function(design, audio, autoplay) {

            var self = this;

            var project = new krusovice.Project({
                width : 720,
                height : 405,
                design : design
            });

            // Display HUD debug data on the image
            var showOptions = {
                renderFlags : {
                    frameLabel : true,
                    background : true,
                    scene : true,
                    photoDebugFill : false,
                    exposeThreeCanvas : false,
                    pipeline: "normal"
                }
            };

            var show = quickplay.play("show", project, initOptions, showOptions);

        },

        /**
         * Stand playback instantly on page load.
         *
         * Useful for effect testing.
         */
        autoplay : function() {
            var design = this.createDesign();
            this.playShow(design, null, true);
        },

        run : function() {
            this.autoplay();
        }


    };

    simple.run();

});


