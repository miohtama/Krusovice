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
 * Tick through the show and see that no exceptions are risen,
 *
 * @param webGL use WebGL rendering
 */
RenderTest.prototype.renderCore = function(queue, webGL, extraCfg) {

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

    if(extraCfg) {
        $.extend(cfg, extraCfg);
    } else {
        extraCfg = {};
    }

    // Self sanity check
    window.assertEquals(2, plan.length);

    var show = new krusovice.Show(cfg);

    var done = false;

    queue.call('Step 1: load show media resources', function(callbacks) {

        console.log("Step 1");

        window.assertFalse(show.loaded);

        // This will cause async abort
        var interrupt = callbacks.addErrback("Failed to load media resources");

        // This will go to next step
        var onloaded = callbacks.add(function() {
            console.log("zzzz");
        });

        $(show).bind("loadend", function() {
            console.log("loadend");
            onloaded();
        });

        $(show).bind("loaderror", function(event, msg) {
            // Single load failure is enough to stop us
            console.log("loaderror");
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

        var duration = extraCfg.duration || 3;

        for(var i=0; i<duration; i+=0.1) {
            console.log("Rendering frame:" + i);
            show.onClock(i);
            show.render();
        }

        window.assertEquals(duration*10, show.currentFrame);

    });

    return { queue : queue, show : show}

};
