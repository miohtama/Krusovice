/**
 * Provide <audio> like API for AudioBuffer.
 *
 * Thin wrapper around Audia library.
 * Allow loading from local file system using FileReader.
 *
 */

/*global require, define, window, console, atob, unescape, ArrayBuffer, Uint8Array, jQuery, document, setTimeout */

define(["audia"], function(Audia) {

    "use strict";

    function AudioBufferWrapper() {
        return Audia;
    }

    /**
     * Return true if the client can use audio buffer
     */
    function hasAudioBufferSupport() {
        return !!window.webkitAudioContext;
    }

    function isWebAudio(audio) {
        return audio instanceof Audia;
    }

    // Load a MP3 file from file system
    function loadLocalAudioFile(audio, file, done) {

        var reader = new FileReader(file);
        var object = audio;

        console.log("Reading local audio file");
        console.log(file);

        // Grab audioContext from Audia internals
        var audioContext = audio.audioContext;
        if(!audioContext) {
            throw new Error("Could not peek into Audia's audioContext");
        }

        var onLoad = function (buffer) {
            // Duration
            if (buffer.duration !== object._duration) {
                object._duration = buffer.duration;
                object.dispatchEvent("durationchange"/*, TODO*/);
            }

            object.dispatchEvent("canplay"/*, TODO*/);
            object.dispatchEvent("canplaythrough"/*, TODO*/);
            object.dispatchEvent("load"/*, TODO*/);

            if(object._autoplay) {
                object.play();
            }

            done();
        };

        reader.onload = function (oFREvent) {
            var data = oFREvent.target.result;
            audioContext.decodeAudioData(data, function (buffer) {
                audio.buffer = buffer;
                onLoad(buffer);
            });
        };


        // Read file as binary data
        reader.readAsArrayBuffer(file);
    }


    //
    // Module API
    //

    return {
        AudioBufferWrapper : Audia,
        hasAudioBufferSupport : hasAudioBufferSupport,
        isWebAudio : isWebAudio,
        loadLocalAudioFile : loadLocalAudioFile
    };

});

