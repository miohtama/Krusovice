"use strict";

/*global krusovice,window*/

/**
 * Test different <canvas> sizes for the show rendering.
 *
 * This is for manual visual inspection to see what kind of zoom levels,
 * and aspect ratios would be useful.
 *
 */
var canvas = {

    // Test following scale sizes
    sizes : [
        {width : 512, height: 288 },
        {width : 720, height: 288 },
        {width : 1024, height: 288 },
        {width : 512, height: 368 },
        {width : 512, height: 512 }
    ],


    /**
     * Creates a show and slices one frame out of it.
     */
    renderShowFrame : function(elem, width, height, clock) {

        var elems = window.horizontalAndVerticalPlan;
        if(!elems) {
            throw "Failed to load sample fixtures";
        }
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(elems);
        var timeline = timeliner.createPlan();

        var cfg = {
            width : width,
            height : height,
            timeline : timeline,
            elem : elem,
            realtime : false
        };

        // Create show
        var show = new krusovice.Show(cfg);

        // Slice a frame out of it
        show.onClock(clock);

        $(show).bind("loadend", function() {
            show.render();
        });

        show.prepare();

        return show;
    },

    /**
     * Draw the sample canvas twice, using portrait and lanscape image sample.
     */
    addCanvasSamples : function(width, height) {

        var frame1 = $("<div class='frame1'>");

        // 1.0 = the first image visible
        this.renderShowFrame(frame1, width, height, 1);

        $("#canvases").append(frame1);

        var frame2 = $("<div class='frame2'>");

        // 1.0 = the first image visible
        this.renderShowFrame(frame2, width, height, 3);

        $("#canvases").append(frame2);

        $("#canvases").append("<div class='split'>");
    },

    init : function() {
        var self = this;
        this.sizes.forEach(function(s) {
            self.addCanvasSamples(s.width, s.height);
        });

    }

};

// jQuery will be bootstrap'd dynamically

document.addEventListener("DOMContentLoaded", function() {
    // Dynamically load debug mode Krusovice
    krusovice.load(function() {
        canvas.init();
    }, true);
});
