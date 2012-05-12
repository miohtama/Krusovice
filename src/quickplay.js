/**
 * Minimal krusovice show player.
 *
 * Loads show based on a design object and creates necessary HTML to play it.
 *
 * This is not part of the API bundle, but must be loaded separately using require.js.
 */

/*global define, console, jQuery, document, setTimeout */
define("krusovice/quickplay", ["krusovice/thirdparty/jquery-bundle", "krusovice/api"], function($, krusovice) {
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
     * @param {String} elementId Wrapping div id
     *
     * @param {Object} initOptions As would be passed to krusovice.Startup()
     *
     * @param {Object} project krusovice.Project object
     *
     * @param {Object} showOptions Extra options for krusovice.Show
     */
    function play(elementId, project, initOptions, showOptions) {
        var elem = $("#" + elementId);

        var design = project.design;

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(design.plan, null, design.transitions);

        timeliner.updateFromDesign(design);

        var timeline = timeliner.createPlan();
        var audio;

        if(!showOptions) {
            showOptions = {};
        }

        function onSongData(songURL, rhythmURL, rhythmData) {

            console.log("onSongData()");

            var cfg = {
                width : project.width,
                height : project.height,
                timeline : timeline,
                elem : elem,
                webGL : "auto",
                background : design.background
            };

            $.extend(cfg, showOptions);

            // Create show
            var show;

            show = new krusovice.Show(cfg);

            // Sync with audio clock
            show.bindToAudio(audio);

            // Auto-start

            $(show).bind("loadend", function() {
                console.log("Rendering the show");
                audio.play();
            });

            setupFadeOut(show, audio);

            show.prepare();
        }

        if(initOptions.textMediaURL) {
            krusovice.texts.Registry.init(initOptions.textMediaURL);
        }

        function loadAudio() {
            audio = document.createElement("audio");
            audio.controls = true;
            elem.append(audio);
            krusovice.music.Registry.loadSongFromDesign(design, audio, onSongData, true);
        }

        function onReady() {
            // SKip this step
            loadAudio();
        }

        var startup = new krusovice.Startup(initOptions);

        var dfd = startup.init();

        dfd.done(onReady);
        dfd.fail(function() {
            throw new Error("Krusovice init failed");
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
