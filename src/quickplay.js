/**
 * Minimal krusovice show player.
 *
 * Loads show based on a design object and creates necessary HTML to play it.
 *
 * This is not part of the API bundle, but must be loaded separately using require.js.
 */

/*global define*/
define("krusovice/quickplay", ["krusovice/thirdparty/jquery-bundle", "krusovice/api"], function($, krusovice) {
    "use strict";

    /**
     * Create a krusoive show player.
     *
     * Automatically start playback.
     *
     * @param {String} elementId Wrapping div id
     *
     * @param {Object} project krusovice.Project object
     *
     * @param {Object} showOptions Extra options for krusovice.Show
     */
    function play(elementId, project, showOptions) {
        var elem = $("#" + elementId);

        var design = project.design;

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(design.plan, null, design.transitions);
        var timeline = timeliner.createPlan();
        var audio;


        if(!showOptions) {
            showOptions = {};
        }

        function onSongData(songURL, rhythmURL, rhythmData) {

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
            /*
            $(show).bind("loadend", function() {
                console.log("Rendering the show");
                audio.play();
            });*/

            show.prepare();
        }

        audio = document.createElement("audio");

        audio.controls = true;

        elem.append(audio);

        krusovice.music.Registry.loadSongFromDesign(design, audio, onSongData, true);

    }

    return {
        play : play
    };

});
