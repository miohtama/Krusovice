/*global window,console*/

"use strict";

function RenderBaseTest() {
}


/**
 * Tick through the show and see that no exceptions are risen.
 *
 * Helper functions used in various async tests to yield frames.
 * Attach this function to your test case class prototype.
 *
 * @param webGL use WebGL rendering
 */
RenderBaseTest.prototype.renderCore = function(queue, webGL, extraCfg) {

    var krusovice = this.krusovice;
    var plan = this.createPlan();
    var req = this.req;

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

    queue.call("Step 1: Initialize Krusovive async resources", function(callbacks) {
        console.log("Step 1");

        var startup = new krusovice.Startup({
            // No media paths defined
            mediaURL : "http://localhost:8000/",
            backgroundMediaURL : null,
            songMediaURL : null,
            songDataURL : null
        });

        // This will cause async abort
        var interrupt = callbacks.addErrback("Failed to load media resources");
        // This will go to next step
        var initialized = callbacks.add(function() {
            console.log("Krusovice initialized");
        });

        var dfd = startup.init();

        dfd.done(function() {
            initialized();
        });

        dfd.fail(function(msg) {
            interrupt("Failed to initialize Krusovice:" + msg);
        });

    });

    queue.call('Step 2: load show media resources', function(callbacks) {

        console.log("Step 2");

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

    queue.call('Step 3: render the show', function(callbacks) {

        console.log("Step 3");

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

    return { queue : queue, show : show };

};