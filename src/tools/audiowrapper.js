/**
 * Provide <audio> like API for AudioBuffer.
 *
 * Thin wrapper around Audia library.
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

    //
    // Module API
    //

    return {
        AudioBufferWrapper : Audia,
        hasAudioBufferSupport : hasAudioBufferSupport,
        isWebAudio : isWebAudio
    };

});

