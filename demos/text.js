"use strict";

/*global require,krusovice,window*/

/**
 * Test different text outputs
 */
var text = {

    // Test following scale sizes
    texts : [
        { shape : "box", labels : { text : "Test text" }, timepoint : 0 }
    ],

    /**
     * Creates a show and slices one frame out of it.
     */
    renderShowFrame : function(elem, width, height, clock, data) {

        var design = new krusovice.Design();

        var plan = [
            {
                id : "text",
                type : "text",
                labels : data.labels,
                duration : 2,
                shape : data.shape
            }
        ];

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(plan, null, design.transitions);
        var timeline = timeliner.createPlan();

        var cfg = {
            width : width,
            height : height,
            timeline : timeline,
            elem : elem,
            realtime : false,
            webGL : "auto",
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
    addCanvasSamples : function(data) {

        var width = 512;
        var height = 512;

        var label = $("<div>").text("Projection " + width + " x " + height);
        $("#canvases").append(label);

        var frame1 = $("<div class='frame1'>");

        // 1.0 = the first image visible
        this.renderShowFrame(frame1, width, height, 3, data);
        $("#canvases").append(frame1);
    },

    renderSample : function() {

        var width = 512;
        var height = 288;

        var text = $("#textarea").val();

        // 1.0 = the first image visible
        var frame1 = $("<div class='frame1'>");
        $("#sample-area").append(frame1);

        var data = {
            labels :{
                text :text
            },
            shape : "box"
        };

        this.renderShowFrame(frame1, width, height, 3, data);

    },

    init : function() {
        var self = this;

        $("#textarea").change($.proxy(this.renderSample, this));

        this.texts.forEach(function(s) {
            self.addCanvasSamples(s);
        });


    }

};

require(["krusovice/api", "../src/thirdparty/domready!"], function(krusovice) {
    window.krusovice = krusovice;
    text.init();
});


