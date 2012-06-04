/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

require(["krusovice/api", "krusovice/quickplay", "krusovice/music", "krusovice/renderers/postprocessing", "../src/thirdparty/domready!"],
function(krusovice, quickplay, music, postprocessing) {

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
     * Shader demo
     */
    var shader = {

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
                    backgroundId : "plain-sky"
                },
                songId : "test-song"
            });

            return design;
        },

        customizeRenderer : function() {


            krusovice.Show.prototype.prepareRenderer = function() {

                console.log("Custom prepareRenderer()");

                // XXX: hardcoded for THREE.js now

                if(!this.renderer) {
                    console.log("Creating show renderer");
                    this.renderer = new krusovice.renderers.Three({
                        width : this.width,
                        height : this.height,
                        elem : this.elem,
                        webGL : this.webGL
                    });

                }

                this.renderer.setup();

                postprocessing.setupPipeline(this.renderer);

            };

        },

        /**
         * Reconstruct Show
         *
         * @param {krusovice.Design} design
         */
        playShow : function() {

            var design = this.createDesign();

            var project = new krusovice.Project({
                width : 720,
                height : 405,
                design : design
            });

            music.Registry.useLevelData = true;

            quickplay.play("show", project, initOptions);

        },

        run : function() {
            this.customizeRenderer();
            this.playShow();
        }

    };

    shader.run();

});


