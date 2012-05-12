"use strict";

/*global require, krusovice, window, jQuery, document, setTimeout, console, $ */

/**
 * Test different text outputs
 */
var text = {

    // Test following scale sizes
    texts : [
        { shape : "box", labels : { text : "Top left" }, textStyles : { "vertical-align" : "top", "text-align" : "left" }, timepoint : 0 },
        { shape : "box", labels : { text : "Top center" }, textStyles : { "vertical-align" : "top", "text-align" : "center" }, timepoint : 0 },
        { shape : "box", labels : { text : "Top right" }, textStyles : { "vertical-align" : "top", "text-align" : "right" }, timepoint : 0 },

        { shape : "box", labels : { text : "Middle left" }, textStyles : { "vertical-align" : "middle", "text-align" : "left" }, timepoint : 0 },
        { shape : "box", labels : { text : "Middle center" }, textStyles : { "vertical-align" : "middle", "text-align" : "center" }, timepoint : 0 },
        { shape : "box", labels : { text : "Middle right" }, textStyles : { "vertical-align" : "middle", "text-align" : "right" }, timepoint : 0 },

        { shape : "box", labels : { text : "Bottom left" }, textStyles : { "vertical-align" : "bottom", "text-align" : "left" }, timepoint : 0 },
        { shape : "box", labels : { text : "Bottom center" }, textStyles : { "vertical-align" : "bottom", "text-align" : "center" }, timepoint : 0 },
        { shape : "box", labels : { text : "Bottom right" }, textStyles : { "vertical-align" : "bottom", "text-align" : "right" }, timepoint : 0 }


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
                texts : data.labels,
                duration : 2,
                textStyles:data.textStyles,
                shape : data.shape
            },

            // XXX: Don't know why 2 elemens minimum is needed. Three.js bug?
            {
                id : "image",
                type : "image",
                duration : 2,
                imageURL : "../demos/ukko.jpg"
            }

        ];

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(plan, null, design.transitions);
        var timeline = timeliner.createPlan();


        console.log("Timeline");
        console.log(timeline);

        var cfg = {
            width : width,
            height : height,
            timeline : timeline,
            elem : elem,
            realtime : false,
            webGL : true,
            background : {
                type : "plain",
                color : "#dddddd"
            }
        };

        // Create show
        var show;

        this.show = show = new krusovice.Show(cfg);

        show.renderFlags.frameLabel = true;

        // Slice a frame out of it
        show.onClock(clock);

        $(show).bind("loadend", function() {
            console.log("Rendering the show");
            show.render();
        });

        show.prepare();

        /*
        var visualizer = new krusovice.TimelineVisualizer({plan:timeline});
        visualizer.secondsPerPixel = 0.02;
        visualizer.lineLength = 2000;

        var div = document.createElement("div");
        visualizer.render(div);
        elem.append(div);
        */

        clock = 0;
        $(elem).click(function() {
            clock += 0.25;
            show.onClock(clock);
            show.render();

            //visualizer.setPositionIndicator(clock, true);
        });

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

    /**
     * Custom text tester
     */
    renderSample : function() {

        var width = 512;
        var height = 288;

        var text = $("#textarea").val();

        // 1.0 = the first image visible
        var frame1 = $("<div class='frame1'>");
        $("#sample-area").append(frame1);

        var data = {
            texts :{
                text :text
            },
            shape : "box",
            textStyles : {
                color : "#ffffff",
                "border-color" : "#000000"
            }
        };

        this.renderShowFrame(frame1, width, height, 3, data);

    },

    init : function() {
        var self = this;

        $("#textarea").change($.proxy(this.renderSample, this));

        this.texts.forEach(function(s) {
            //self.addCanvasSamples(s);
        });


    }

};

require(["krusovice/api", "../src/thirdparty/domready!"], function(krusovice) {
    window.krusovice = krusovice;
    text.init();
});


