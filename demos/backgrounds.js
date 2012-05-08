/* Background icon sampler */

"use strict";

/*global require, krusovice, window, console, $, document*/

/**
 *
 */
var backgrounds = {

    /**
     *
     */
    ready : false,

    failedMessage: null,

    width : 64,

    height: 36,

    bgs : [],

    drawBackground : function() {

        var width = this.width;
        var height = this.height;

        this.bgs.forEach(function(bg) {
            console.log("Rendering:" + bg.options.id);
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            bg.render(ctx, 0);

            $("#backgrounds").append("<h2>" + bg.options.name + "</h2>");
            $("#backgrounds").append(canvas);

            // Store canvas for later grabbing the pixel data
            bg.canvas = canvas;
        });

        console.log("All ready");

        this.ready = true;

    },

    prepareBackgrounds : function() {

        var ids = this.getBackgroundIds();
        var width = this.width;
        var height = this.height;

        var self = this;

        console.log("Preparing backgrounds:" + ids);

        function error(event, msg) {
            console.error(msg);
            self.failed = msg;
        }

        var loader = new krusovice.Loader({allLoadedCallback : $.proxy(this.drawBackground, this), errorCallback : $.proxy(error, this)});

        ids.forEach(function(id) {
            var bg = krusovice.backgrounds.createBackgroundById(id, 1);
            self.bgs.push(bg);
            console.log("Preparing:" + id);
            bg.prepare(loader, width, height);

        });

    },

    getBackgroundIds : function() {
        return krusovice.backgrounds.Registry.getIds();
    },

    /**
     * Called from the controller script to extract PNG data.
     */
    getBackgroundThumbnail : function(id) {
        var i=0;
        for(i=0; i<this.bgs.length; i++) {
            var bg = this.bgs[i];
            if(bg.options.id == id) {
                var canvas = bg.canvas;
                var data = canvas.toDataURL();
                return data;
            }
        }
    },

    init : function(krusovice) {

        window.krusovice = krusovice;

        // XXX: Cannot distribute media files on Github
        krusovice.backgrounds.Registry.loadBackgroundData("../../../../../olvi/backgrounds/backgrounds.json",
                                                           "../../../../../olvi/backgrounds/",
                                                           $.proxy(this.prepareBackgrounds, this));


    }

};

require(["krusovice/api", "../src/thirdparty/domready!"], function(krusovice) {
    backgrounds.init(krusovice);
});
