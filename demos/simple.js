/**
  * Play a simple generated WebGL show without music.
  */

/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

require([
    "krusovice/api",
    "krusovice/quickplay",
    "bootstrap",
    "../src/thirdparty/domready!"],
function(krusovice, quickplay) {

    "use strict";

    // List of texts and images in the show
    var showSource = "ukko.jpg\nthailand.jpg\nthailand3.jpg\nukko.jpg\nthailand.jpg\nthailand3.jpg";

    // Media locations
    var initOptions = {
        mediaURL : "../demos",
        songDataURL : "../demos/songs.json",
        songMediaURL : "../demos",
        backgroundMediaURL : "../demos",
        textMediaURL : "../src/showobjects/textdefinitions.js"
    };

    var transitions = {
        transitionIn : {
            type : "zoomfar",
            duration : 1.5
        },
        transitionOut : {
            type : "zoomin",
            duration : 1.5
        },
        onScreen : {
            type : "slightrotatez"
        }
    };


    /**
     * Module namespace
     */
    var simple = {

        show : null,

        player : null,

        createDesign : function() {

            var baseplan = [];

            var baseelem = {
                type : "image",
                label : null,
                duration : 3.5,
                imageURL : "ukko.jpg",
                borderColor : "#faa8833"
            };

            var lines = showSource.split("\n");

            // Add image elements to show
            lines.forEach(function(l) {
                l = l.trim();
                var copy;

                if(l !== "") {

                    if(l.indexOf(".jpg") >= 0) {
                        copy = $.extend({}, baseelem);
                        copy.imageURL = l;
                        baseplan.push(copy);
                    } else {
                        copy = $.extend({}, baseelem);
                        copy.type = "text";
                        copy.texts = { text : l };
                        copy.shape = "clear";
                        baseplan.push(copy);

                    }
                }

                copy.transitions = $.extend({}, transitions);
            });


            for(var i=0; i<baseplan.length; i++) {
                baseplan[i].id = i;
            }

            var design = new krusovice.Design({
                plan : baseplan,
                background : {
                    type: "plain",
                    color: "#aaAAff"
                },
                songId : null
            });

            return design;
        },


        /**
         * Reconstruct Show
         *
         * @param {krusovice.Design} design
         */
        playShow : function(design, audio, autoplay) {

            var self = this;

            design = design || this.createDesign();

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

            initOptions.ignoreRhythmData = true;

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


