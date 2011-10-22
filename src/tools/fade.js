/**
 * Audio fade in support
 */

// jslint hints
/*global window*/
define("krusovice/tools/fade", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
    "use strict";

    krusovice.tools = krusovice.tools || {};

    /**
     * Start audio playing with fade in period.
     *
     * Equals to audio.play() but with smooth volume in.
     *
     * @param {Object} audio HTML5 audio element
     *
     * @param {Number} (optional) rampTime How long is the fade in ms
     *
     * @param {Number} targetVolume Max volume. 1 = default = HTML5 audio max.
     *
     * @param {Number} tick Timer period in ms
     *
     */
    krusovice.tools.fadeIn = function(audio, rampTime, targetVolume, tick) {
        //
        if(!targetVolume) {
            targetVolume = 1;
        }

        // By default, ramp up in one second
        if(!rampTime) {
            rampTime = 1000;
        }

        // How often adjust audio volume (ms)
        if(!tick) {
            tick = 50;
        }

        var volumeIncrease = targetVolume / (rampTime / tick);

        var playingEventHandler = null;

        function ramp() {

            var vol = Math.min(targetVolume, audio.volume + volumeIncrease);

            audio.volume = vol;

             // Have we reached target volume level yet?
            if(audio.volume < targetVolume) {
                // Keep up going until 11
                setTimeout(ramp, tick);
            }
        }

        function startRampUp() {

            // For now, we capture only the first playing event
            // as we assume the user calls fadeIn()
            // every time when wants to resume playback
            audio.removeEventListener("playing", playingEventHandler);

            ramp();
        }

        // Start with zero audio level
        audio.volume = 0;

        // Start volume ramp up when the audio actually stars to play (not when begins to buffer, etc.)
        audio.addEventListener("playing", startRampUp);

        audio.play();
    };


    /**
     * Stop audio playing with fade out period.
     *
     * Equals to audio.pause() but with smooth volume out.
     *
     * @param {Object} audio HTML5 audio element
     *
     * @param {Number} (optional) rampTime How long is the fade in ms
     *
     * @param {Number} targetVolume Min volume. 0 = default = HTML5 audio min.
     *
     * @param {Number} tick Timer period in ms
     *
     */
    krusovice.tools.fadeOut = function(audio, rampTime, targetVolume, tick) {

        //
        if(!targetVolume) {
            targetVolume = 0;
        }

        // By default, ramp up in one second
        if(!rampTime) {
            rampTime = 1000;
        }

        // How often adjust audio volume (ms)
        if(!tick) {
            tick = 50;
        }

        var volumeStep = (audio.volume - targetVolume) / (rampTime / tick);

        if(!volumeStep) {
            throw "Could not calculate volume adjustment step";
        }

        function ramp() {

            var vol = Math.max(0, audio.volume - volumeStep);

            audio.volume = vol;

            // Have we reached target volume level yet?
            if(audio.volume > targetVolume) {
                // Keep up going until 11
                setTimeout(ramp, tick);
            } else {
                audio.pause();
            }
        }

        ramp();
    };
});
