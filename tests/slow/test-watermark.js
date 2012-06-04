/*global console, RenderBaseTest, window, finalizeAsyncTestCase, assertTrue, assertObject, assertEquals, assertNotEquals, assertException, assertString, assertFalse, renderCore, jQuery, $ */

'use strict';

var WatermarkTest = function() {};

/**
 * Create timeline where we have image URLs relative to JsTestDriver root
 */
WatermarkTest.prototype.createPlan = function() {
    var krusovice = this.krusovice;
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
    var plan = timeliner.createPlan();

    // fix URls
    plan[0].imageURL = "http://localhost:8000/testdata/kakku.png";

    return plan;
};

/**
 * Render few first frames of simple timeline.
 */
WatermarkTest.prototype.testRenderWatermark = function(queue) {

    var show;
    var extra = {
        watermark : {
            url  : "http://localhost:8000/testdata/kakku.png",
            width : 200,
            height : 50
        }
    };

    function renderStep(callbacks) {
        console.log("Step 3");

        var ok = callbacks.add(function() {
            console.log("Watermark rendered");
        });

        function onWatermarkRendered() {
            ok();
        }

        $(show).bind("watermarkrendered", onWatermarkRendered);

        show.onClock(0);
        show.render();
    }

    extra.renderStep = renderStep;

    var testdata = this.renderCore(queue, extra);
    show = testdata.show;

};

WatermarkTest.prototype.renderCore = RenderBaseTest.prototype.renderCore;

finalizeAsyncTestCase("Watermark", WatermarkTest);
