"use strict";

/*global require, krusovice, window, console, $, document*/

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
        {width : 640, height: 360 },
        {width : 720, height: 288 },
        {width : 1024, height: 288 },
        {width : 512, height: 368 },
        {width : 512, height: 512 }
    ],


    /**
     * Creates a show and slices one frame out of it.
     */
    renderShowFrame : function(elem, width, height, clock) {

        var design = window.getHorizontalAndVerticalDesign();

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(design.plan, null, design.transitions);
        var timeline = timeliner.createPlan();

        var cfg = {
            width : width,
            height : height,
            timeline : timeline,
            elem : elem,
            realtime : false,
            background : {
                type : "plain",
                color : "#dddddd"
            }
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

        var label = $("<div>").text("Projection " + width + " x " + height);
        $("#canvases").append(label);

        var frame1 = $("<div class='frame1'>");

        // 1.0 = the first image visible
        this.renderShowFrame(frame1, width, height, 3);

        $("#canvases").append(frame1);

        var frame2 = $("<div class='frame2'>");

        // 1.0 = the first image visible
        this.renderShowFrame(frame2, width, height, 9);

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

require(["krusovice/api", "../src/thirdparty/domready!"], function(krusovice) {
    window.krusovice = krusovice;
    canvas.init();
});
