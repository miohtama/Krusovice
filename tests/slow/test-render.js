'use strict';

/*global window,$,console,krusovice*/

var RenderTest = window.AsyncTestCase("Render");

/**
 * Create timeline where we have image URLs relative to JsTestDriver root
 */
RenderTest.prototype.createPlan = function() {
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
 * Try loading a show which has bad resources and loading should fail
 */
RenderTest.prototype.testRenderBadResource = function(queue) {

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

/**
 * @param webGL use WebGL rendering
 */
RenderTest.prototype.renderCore = function(queue, webGL) {

    var plan = this.createPlan();

    var cfg = {
            timeline : plan,
            background : {
                type : "plain",
                color : "#ffffff"
            },
            elem : null,
            realtime : false,
            webGL : webGL
    };


    window.assertEquals(2, plan.length);

    var show = new krusovice.Show(cfg);

    var done = false;

    queue.call('Step 1: load show media resources', function(callbacks) {

        console.log("Step 1");

        window.assertFalse(show.loaded);

        var interrupt = callbacks.addErrback("Failed to load media resources");

        var onloaded = callbacks.add(function() {

        });

        $(show).bind("loadend", function() {
            console.log("loadend");
            onloaded();
        });

        $(show).bind("loaderror", function(event, msg) {
            // Single load failure is enough to stop us
            if(!done) {
                done = true;
                interrupt(msg);
            }
        });

        show.prepare();

    });

    queue.call('Step 2: render the show', function(callbacks) {

        console.log("Step 2");

        window.assertTrue(show.loaded);

        window.assertEquals(2, show.animatedObjects.length);

        for(var i=0; i<3; i+=0.1) {
            console.log("Rendering frame:" + i);
            show.onClock(i);
            show.render();
        }

        window.assertEquals(30, show.currentFrame);

    });

};
