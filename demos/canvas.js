"use strict";

/*global krusovice*/

/**
 *
 */
var canvas = {

    /**
     *
     */
    ready : false,

    failedMessage: null,

    // Test following scale sizes
    sizes : [
        { width : 512, height: 288 },
        { width : 720, height: 288 },
        { width : 1024, height: 288 },
        { width : 512, height: 368 },
        { width : 512, height: 512 }
    ],

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


    init : function() {


    }

};

// jQuery will be bootstrap'd dynamically

document.addEventListener("DOMContentLoaded", function() {
    // Dynamically load debug mode Krusovice
    krusovice.load(function() {
        canvas.init();
    }, true);
});
