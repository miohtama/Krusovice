/*global RenderBaseTest, console, window, finalizeAsyncTestCase, assertTrue, assertObject, assertEquals, assertNotEquals, assertException, assertString, assertFalse, renderCore, jQuery, $ */

'use strict';

var RenderTest = function() {};

/**
 * Create timeline where we have image URLs relative to JsTestDriver root
 */
RenderTest.prototype.createPlan = function() {
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
RenderTest.prototype.testRenderFewFramesCanvas = function(queue) {
    this.renderCore(queue, false);
};

/**
 * Render few first frames of simple timeline.
 */
RenderTest.prototype.testRenderFewFramesWebGL = function(queue) {
    this.renderCore(queue, true);
};


/**
 * Test that preview warning message is drawn.
 */
RenderTest.prototype.testPreviewWarningMessage = function(queue) {

    console.log("Preview test");

    var config = {
        previewWarningMessage : $("<div>Test blaa blaa</div>"),
        duration : 0.5,
        preview : true
    };

    var show = null;

    function step3(callbacks) {
        console.log("step 3");
        // Check that jQuery message is correctly decoded
        window.assertEquals(show.previewWarningMessage, "Test blaa blaa");
    }

    var res = this.renderCore(queue, false, config);
    show = res.show;

    res.queue.call("Check preview warning message", step3);
};



/**
 * Try loading a show which has bad resources and loading should fail
 */
RenderTest.prototype.testRenderBadResource = function(queue) {

    var krusovice = this.krusovice;

    var plan = this.createPlan();

    // Test only with a single element
    plan = plan.slice(0, 1);

    plan[0].imageURL = "http://notexist";

    var cfg = {
            timeline : plan
    };

    var show = new krusovice.Show(cfg);

    var $show = $(show);

    queue.call('Step 1: try load non-existant resources', function(callbacks) {

        console.log("Step 1");

        window.assertFalse(show.loaded);

        var interrupt = callbacks.addErrback("Failed to load media resources");

        var onerror = callbacks.add(function() {
            /// ok
            console.log("baabaa");
        });

        $show.bind("loadend", function(event) {
            console.log("loadend");
            interrupt();
        });

        $show.bind("loaderror", function(event, msg) {
            console.log("loaderror");
            onerror();
        });

        show.prepare();

    });

};

RenderTest.prototype.renderCore = RenderBaseTest.prototype.renderCore;

finalizeAsyncTestCase("Render", RenderTest);
