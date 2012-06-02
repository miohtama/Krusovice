/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

require(["krusovice/api", "krusovice/quickplay", "krusovice/renderers/postprocessing", "../src/thirdparty/domready!"],
function(krusovice, quickplay, postprocessing) {

    "use strict";

    // List of texts and images in the show
    var showSource = "ukko.jpg\nukko.jpg\nukko.jpg";

    // Media locations
    var initOptions = {
        mediaURL : "../demos",
        songDataURL : "../demos/songs.json",
        songMediaURL : "../demos",
        backgroundMediaURL : "../demos",
        textMediaURL : "../src/showobjects/textdefinitions.js"
    };

    // transition settings
    var transitions = {

        transitionIn : {
            type : "zoomin",
            duration : 2.0
        },

        transitionOut : {
            type : "zoomfar",
            duration : 2.0
        },

        onScreen : {
            type : "slightmove"
        }

    };

    transitions = {
        transitionIn : {
            type : "zoomfar",
            duration : 1
        },
        transitionOut : {
            type : "zoomin",
            duration : 1
        },
        onScreen : {
            type : "slightrotatez"
        }
    };


    /**
     * Shader demo
     */
    var shader = {


        hasMusic : false,

        hasBackgrounds : false,

        song : null,

        createDesign : function() {

            var baseplan = [];

            var baseelem = {
                type : "image",
                label : null,
                duration : 1.5,
                imageURL : "ukko.jpg"
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

                this.postprocessor = new postprocessing.PostProcessor();
                this.postprocessor.init(this.renderer.renderer, this.renderer.width, this.renderer.height);
                this.postprocessor.takeOver(this.renderer);

                var sepia = new postprocessing.SepiaPass();
                sepia.stencilDebug = false; // Paint in stencil when poking the code
                this.postprocessor.addPass(sepia);


                this.postprocessor.prepare();
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
                width : 512,
                height : 288,
                design : design
            });

            var show = quickplay.play("show", project, initOptions);


        },

        run : function() {
            this.customizeRenderer();
            this.playShow();
        }

    };

    shader.run();

});


