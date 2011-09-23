"use strict";

/*global krusovice*/

/**
 *
 */
var backgrounds = {

	/**
	 *
	 */
	ready : false,

	failed: true,

	width : 48,

	height: 48,

	drawBackgrounds : function() {

		var ids = this.getBackgroundsIds();

		ids.forEach(function(id) {


			var bg = krusovice.backgrounds.Registry.get(id);

			function loaded() {
				var canvas = document.createElement("canvas");
				canvas.width = this.width;

				var ctx = canvas.getContext("2d");
			}

			function error() {
				this.failed = true;
			}

			var loader = new krusovice.Loader({callback : $.proxy(loaded, this), errorCallback : $.proxy(error, this)});

			bg.prepare(loader, this.width, this.height);


		});

		this.ready = true;
	},

	getBackgroundIds : function() {
		return krusovice.backgrounds.Registry.getIds();
	},


	init : function() {

	    // XXX: Cannot distribute media files on Github
	    krusovice.backgrounds.Registry.loadBackgroundData("../../../../../olvi/backgrounds/backgrounds.json",
	     												  "../../../../../olvi/backgrounds/",
	     												  $.proxy(this.drawBackgrounds, this));


	}

};

// jQuery will be bootstrap'd dynamically

document.addEventListener("DOMContentLoaded", function() {
	// Dynamically load debug mode Krusovice
	krusovice.load(function() {
		backgrounds.init();
	}, true);
});
