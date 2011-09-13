"use strict";

var krusovice = krusovice || {};

krusovice.music = krusovice.music || {};

krusovice.music.Registry = $.extend(true, {}, krusovice.utils.Registry, {

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
			data.forEach(function(obj) {
				self.fixMediaURLs(obj, mediaURL);
				self.register(obj);
			})
			callback();
		});
	},
	
	/**
	 * Make image URLs loadable
	 */
	fixMediaURLs : function(obj, mediaURL) {
		
		if(!mediaURL) {
			throw "Using image-based backgrounds needs base media URL";
		}
		
		if(mediaURL[mediaURL.length-1] != "/") {
			throw "Media URL must end with slash:" + mediaURL;
		}
		
		if(obj.mp3 && typeof(obj.mp3) == "string") {
			if(!obj.mp3.match("^http")) {
				// Convert background source url from relative to absolute
				obj.mp3 = mediaURL + obj.mp3;
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
	 * @param {String} id Song id
	 *
	 * @param {Object} audio HTMLAudio element used for music playback, or null
	 *
	 * @param {Function} callback called when all done
	 *
	 */
	loadSong : function(id, audio, callback) {
		
		if(!id) {
			throw "Missing id";
		}
		
		var song = this.get(id);
		
		if(!song) {
			throw "Unknown song:" + id;
		}
		
		var rhytmDone = false;
		var songDone = false;
		
		var songURL = song.mp3;
		var rhytmURL = songURL.replace(".mp3", ".json");

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
		
		$(audio).one("canplay", onMusicBuffered);
		
		$(audio).attr("src", songURL);
		
	}


});


