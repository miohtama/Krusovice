/**
 * Minimal krusovice show player.
 *
 * Loads show based on a design object and creates necessary HTML to play it.
 *
 * This is not part of the API bundle, but must be loaded separately using require.js.
 */

/*global define, console, jQuery, document, setTimeout */
define("krusovice/quickplay", ["krusovice/thirdparty/jquery-bundle", "krusovice/api", "krusovice/tools/audiowrapper"], function($, krusovice, audiowrapper) {
    "use strict";


    function setupFadeOut(show, audio, fadeOutThreshold) {

        fadeOutThreshold = fadeOutThreshold || 3.0;
        var duration = show.getDuration();
        var nearEnd = duration - fadeOutThreshold;

        // Add audio fade out period to the show end
        var fadingOut = false;

        $(show).bind("showclock", function(e, clock) {
            if(clock > nearEnd && !fadingOut) {
                console.log("Starting fade out");
                fadingOut = true;
                krusovice.tools.fadeOut(audio, fadeOutThreshold*1000);
            }
        });
    }

    /**
     * Create a krusoive show player.
     *
     * Automatically start playback.
     *
     * Extra initOptions
     *     - prelistingSongs
     *     - playCallback: function
     *     - audio: Audia instance
     *     - ignoreRhythmData: Boolean
     *
     *
     * @param {String} elementId Wrapping div id
     *
     * @param {Object} initOptions As would be passed to krusovice.Startup() + additional option prelistenSongs if small encoding version load is tried
     *
     * @param {Object} project krusovice.Project object
     *
     * @param {Object} showOptions Extra options for krusovice.Show
     *
     * @return {jQuery.Deferred}
     */
    function play(elementId, project, initOptions, showOptions) {

        var elem = $("#" + elementId);
        var design = project.design;
        var audio;

        if(!showOptions) {
            showOptions = {};
        }

        // Default way of starting the playback
        function playDefault(show, audio, plan, config) {

            // Sync with audio clock
            if(audio) {
                show.bindToAudio(audio);

                // Auto-start
                $(show).bind("loadend", function() {
                    console.log("Rendering the show");

                    if(audio) {
                        $(audio).bind("canplay", function() {
                            audio.play();
                        });
                    } else {

                    }
                });

                setupFadeOut(show, audio);
            } else {
                // Use clock based playback
                var controller = show.bindToClock();
                $(show).bind("loadend", function() {
                    controller.play();
                });
            }

        }

        // Create show timeline and playback object after we have the song and its music data
        function createShow() {

            console.log("createShow()");

            var rhythmData = audio && audio.rhythmData || null;

            var timeliner = krusovice.Timeliner.createSimpleTimeliner(design.plan, rhythmData, design.transitions);

            timeliner.updateFromDesign(design);

            var timeline = timeliner.createPlan();

            var cfg = {
                width : project.width,
                height : project.height,
                timeline : timeline,
                elem : elem,
                webGL : true,
                background : design.background,
                rhythmData : rhythmData
            };

            if(audio) {
                if(!audio.rhythmData && !initOptions.ignoreRhythmData) {
                    throw new Error("audio.rhytmData missing");
                }
            }

            /*
            if(!audio.levelData) {
                throw new Error("audio.levelData missing");
            }*/

            $.extend(cfg, showOptions);

            // Create show
            var show;

            show = new krusovice.Show(cfg);

            var play = initOptions.playCallback || playDefault;

            play(show, audio, timeline, cfg);

            show.prepare();
        }

        // Make sure we have text style
        if(initOptions.textMediaURL) {
            krusovice.texts.Registry.init(initOptions.textMediaURL);
        }

        // Setup audio playback if design has a background song
        if(krusovice.Design.hasMusic(design)) {
            if(!initOptions.audio) {

                // Load <audio> element for song playback
                if(!audiowrapper.hasAudioBufferSupport()) {
                    audio = document.createElement("audio");
                    audio.controls = true;
                    elem.append(audio);
                } else {
                    audio = new audiowrapper.AudioBufferWrapper();
                }

            } else {
                // Use whatever <audio> element was given in init
                audio = initOptions.audio;
            }

        }

        var startup = new krusovice.Startup(initOptions);
        var startupLoader = startup.init();
        startupLoader.fail(function(msg) {
            console.error("Krusovice show quick play failed: " + msg);
        });


        // We need to load song db by start-up loader before we can try to load song
        $.when(startupLoader).done(function() {

            var songLoader = krusovice.music.Registry.loadSongFromDesign(design, audio, initOptions.prelistenSongs, false);

            if(songLoader) {

                // There was a song associated with the show
                songLoader.fail(function(msg) {
                    console.erro("Song loader failed:" + msg);
                });

                songLoader.done(function() {
                    createShow();
                });
            } else {
                // Mute show
                createShow();
            }


        });
    }

    /**
     *
     * @param callback function(success, msg);
     */
    function submit(url, project, callback) {

        url = "http://morko:6543/thousand_monkeys_and_a_typewriter/";

        // Create a copy of local project
        var submission = $.extend({}, project);

        if(project.width % 8 !== 0) {
            throw "Width must be divisible by 8";
        }

        if(project.height % 8 !== 0) {
            throw "Height must be divisible by 8";
        }

        // Prepare it by cleaning local object references from design
        // to make it JSON serializable
        submission.design = krusovice.Design.clean(project.design);

        console.log("Prepared project submission to:" + url);
        console.log(submission);

        var params = { project :JSON.stringify(submission) };

        console.log($);

        $.post(url, params, function(data, textStatus, jqXHR) {
            console.log("Got response");
            if(data.status == "ok") {
                callback(true, data.status);
            } else {
                callback(false, textStatus);
            }
        }, "json");
    }

    return {
        play : play,
        submit : submit
    };

});
