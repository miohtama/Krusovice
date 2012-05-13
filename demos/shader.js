/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

  require(["krusovice/api", "krusovice/quickplay", "../src/thirdparty/domready!"], 
    function(krusovice, quickplay) {

    "use strict";

    // List of texts and images in the show
    var showSource = "WebGL shader test\nukko.jpg\nukko.jpg\nukko.jpg";

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

        // Time in seconds where song starts playing
        musicStartTime : 0,

        transitionIn : {
            type : "zoomin",
            duration : 1.0
        },

        transitionOut : {
            type : "zoomfar",
            duration : 3.0
        },

        onScreen : {
            type : "slightmove"
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

            krusovice.renderers.Three.prototype.usePostProcessing = true;

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

                this.renderer.setupComposer();
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


