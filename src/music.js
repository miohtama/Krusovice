"use strict";

var krusovice = krusovice || {};

krusovice.music = krusovice.music || {};

krusovice.music.Registry = $.extend(true, {}, krusovice.utils.Registry, {

    /**
     * Dummy audio filed used play when no song is selected.
     * <audio> element will still feed clock to the process.
     *
     */
    noAudioClip : null,

    /**
     * Load music data from JSON file
     *
     * @param {String} url URL to songs.json
     *
     * @param {String} mediaURL Base URL to image and video data
     */
    loadData : function(url, mediaURL, callback) {
        var self = this;
        console.log("Loading songs:" + url);
        $.getJSON(url, function(data) {
            console.log("Got song data");
            console.log(data);
            self.processData(data, mediaURL);
            callback();
        });
    },


    /**
     * Decode song bank data to internal format.
     */
    processData : function(data, mediaURL) {
        var self = this;
        data.forEach(function(obj) {
            self.fixMediaURLs(obj, mediaURL);
            self.register(obj);
        });
    },

    /**
     * Make image URLs loadable
     */
    fixMediaURLs : function(obj, mediaURL) {


        if(obj.mp3 && typeof(obj.mp3) == "string") {
            if(!obj.mp3.match("^http")) {
                // Convert background source url from relative to absolute
                obj.mp3 = krusovie.tools.url.joinRelativePath(mediaURL, obj.mp3);
            }
        }

    },



    /**
     * Load rhytm data for MP3;
     */
    loadRhytmData : function(file, callback) {

    },

    /**
     * Load a song from the repository for the show purposes.
     *
     * @param {String} id Song id or null for no music
     *
     * @param {Object} audio HTMLAudio element used for music playback, or null
     *
     * @param {Function} callback called when all done
     *
     * @param {boolean} prelisten Load low quality audio version
     *
     */
    loadSong : function(id, audio, callback, prelisten) {

        var songURL, rhytmURL;
        var rhytmDone = false;
        var songDone = false;
        var song;

        if(id) {
            // Assuming has music

            song = this.get(id);
            songURL = this.getAudioURL(id, prelisten);

            if(!song) {
                throw "Unknown song:" + id;
            }

            var mp3 = song.mp3;
            rhytmURL = mp3.replace(".mp3", ".json");

        } else {
            songURL = this.noAudioClip;
        }

        console.log("Loading song URL " + songURL + " for audio element:" + audio);


        function allDone() {
            if(rhytmDone && songDone) {
                callback(song);
            }
        }

        function onRhytmData(data) {
            song.rhytmData = data;
            rhytmDone = true;
            allDone();
        }

        function onMusicBuffered() {
            songDone = true;
            allDone();
        }

        $.getJSON(rhytmURL, onRhytmData);

        if(audio) {
            $(audio).one("canplay", onMusicBuffered);
            $(audio).attr("src", songURL);
        } else {
            songDone = true;
        }

    },

    /**
     * @param {Boolean} prelisten Get low quality preview version
     */
    getAudioURL : function(songId, prelisten) {

        // XXX: add <audio> API format detection here
        var needOGG = navigator.userAgent.toLowerCase().indexOf("firefox") >= 0 || navigator.userAgent.toLowerCase().indexOf("chrome") >= 0;

        var song = this.get(songId);

        var url = song.mp3;

        if(prelisten) {
            url = url.replace(".mp3", ".prelisten.mp3");
        }

        if(needOGG) {
            url = url.replace(".mp3", ".ogg");
        } else {
            url = url.replace(".mp3", ".aac");
        }

        return url;
    }


});


