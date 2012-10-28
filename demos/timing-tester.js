/**
  * Show timing tester
  *
  * - WebGL reactive effect pipelien
  *
  * - Echo Nest API Javascript uploads
  *
  * - Spectrum analysis
  *
  */

/*global require, window, jQuery, document, setTimeout, console, $, krusovice */

require([
    "krusovice/api",
    "krusovice/quickplay",
    "krusovice/music",
    "krusovice/tools/audiowrapper",
    "krusovice/analyses",
    "krusovice/renderers/postprocessing",
    "krusovice/tools/echonest",
    "../src/thirdparty/domready!"],
function(krusovice, quickplay, music, audiowrapper, analyses, postprocessing, echonest) {

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
    var timingtester = {

        audio : null,

        show : null,

        visualizer : null,

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
                    backgroundId : "plain-sky"
                },
                songId : "test-song"
            });

            return design;
        },

        // Setup special webGL effect pipeline
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

                $(document.body).append(this.renderer.renderer.domElement);

            };

        },

        // Show what audio backend we are using
        updateAudioMode : function(audio) {
            if(audiowrapper.isWebAudio(audio)) {
                $("#audio-mode").text("Audia + AudioBuffer");
            } else {
                $("#audio-mode").text("HTML5 <audio>");
            }
        },


        // Bind real-time spectrum analyzer to the audio playback
        bindSpectrum : function(audio) {
            var spectrumCanvas = document.getElementById("spectrum");
            var spectrum = new analyses.RealTimeSpectrumAnalysis({
                canvas : spectrumCanvas,
                bins : 8,
                smoothing : 0.5
            });
            spectrum.bindToAudioContext(audio.bufferSource, audio.gainNode, audio.bufferSource.context);
            spectrum.start();
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

            music.Registry.useLevelData = false;

            // Display HUD debug data on the image
            var showOptions = {
                renderFlags : {
                    frameLabel : true,
                    background : true,
                    scene : true
                }
            };

            // Default way of starting the playback
            function playWithVisualizer(show, audio, plan, config) {

                // Create visualization
                self.show = show;

                var div = document.getElementById("visualizer");

                var visualizer = new krusovice.TimelineVisualizer({
                    plan:config.timeline,
                    rhythmData:config.rhythmData,
                    levelData:config.levelData
                });

                self.visualizer = visualizer;

                visualizer.secondsPerPixel = 0.02;
                visualizer.lineLength = 2000;
                visualizer.render(div);

                var player = new krusovice.TimelinePlayer(visualizer, audio);
                self.player = player;

                // Make show loader to load the audio file if it
                // is remote file (src set)
                show.bindToAudio(audio, !!audio.src);

                // Show real time spectrum analysis using Web Audio API
                if(audiowrapper.isWebAudio(audio)) {
                    audio.addEventListener("play", function() {
                        self.bindSpectrum(audio);
                    });
                }

                // Auto-start
                $(show).bind("loadend", function() {
                    console.log("Rendering the show");

                    if(autoplay) {
                        audio.play();
                    }
                });



                self.updateAudioMode(audio);

                // Safe reference for stopping
                self.audio = audio;
            }

            initOptions.playCallback = playWithVisualizer;
            initOptions.audio = audio;
            initOptions.ignoreRhythmData = true;

            var show = quickplay.play("show", project, initOptions, showOptions);

        },

        // Upload file input callback
        upload : function() {
            var self = this;
            var file = $("#upload").get(0).files[0];
            var apiKey = window.localStorage.apiKey;
            var audio = new audiowrapper.AudioBufferWrapper();

            audio.volume = 0.2;

            this.nuke();

            function done(data) {
                console.log("Done!!!");
            }

            function loaded() {
                console.log("Local audio file loaded");
                var design = self.createDesign();
                delete design.songId;
                design.songData = {};
                design.songData.audio = audio;
                self.playShow(design, audio, true);
            }

            audiowrapper.loadLocalAudioFile(audio, file, loaded);

            //echonest.analyzeFile(apiKey, file, done);
        },

        // Remove old UI elements
        nuke : function() {
            this.stop();
            $("#visualizer-wrapper").html("<div id='visualizer'><!-- --></div>");
        },

        stop : function() {
          if(this.show) {
                this.show.stop();
                this.show = null;
            }

            if(this.audio) {
                this.audio.stop();
                this.audio = null;
            }

            if(this.player) {
                this.player.stop();
                this.player = null;
            }
        },

        run : function() {
            var self = this;
            this.customizeRenderer();
            //this.playShow();

            $("#stop").click(function() {
                self.stop();
            });

            $("#upload").change(function() {
                self.upload();
            });

            // Rememeber API key in local storage
            $("#api-key").change(function() {
                window.localStorage.apiKey = $("#api-key").val();
            });

            // Restore remembered API key
            if(window.localStorage.apiKey) {
               $("#api-key").val(window.localStorage.apiKey);
            }

            $("#play").click(function() {
                self.audio.play();
            });
        }


    };

    timingtester.run();

});


