/*global $, console, RenderBaseTest,window,finalizeAsyncTestCase,assertTrue,assertObject,assertEquals,assertNotEquals,assertException,assertString,assertFalse,renderCore*/

'use strict';

var ScreenshotTest = function() {};

/**
 * Create timeline where we have image URLs relative to JsTestDriver root
 */
ScreenshotTest.prototype.createPlan = function() {
    var krusovice = this.krusovice;
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
    var plan = timeliner.createPlan();

    // fix URls
    plan[0].imageURL = "http://localhost:8000/testdata/kakku.png";

    return plan;
};

/**
 * Render timeline frames until we have all screenshots.
 */
ScreenshotTest.prototype.testRenderScreenshot = function(queue) {

    var show;
    var extra = {
        // Make rendering faster
        width : 200,
        height : 200
    };

    function renderStep(callbacks) {
        console.log("Step 3");

        var opening = false;
        var firstPhoto = false;
        var screenshot;

        var ok = callbacks.add(function() {
            console.log("Screenshot rendered");
        });

        var fail = callbacks.addErrback("Screenshotting failed");

        // How many seconds we render
        var duration = 10;

        for(var i=0; i<duration; i+=0.5) {
            console.log("Rendering frame:" + i);
            show.onClock(i);
            show.render();

            screenshot = show.consumeLatestScreenshot();
            if(screenshot) {
                if(screenshot.id == "opening") {
                    opening = true;
                }

                if(screenshot.id == "firstPhoto") {
                    firstPhoto = true;
                }

                if(firstPhoto && opening) {
                    // We got both screenshots, ok to quit
                    ok();
                    return;
                }

            }

        }

        fail("Opening:" + opening + " first photo:" + firstPhoto);
    }

    extra.renderStep = renderStep;

    var testdata = this.renderCore(queue, true, extra);
    show = testdata.show;

};

ScreenshotTest.prototype.renderCore = RenderBaseTest.prototype.renderCore;

finalizeAsyncTestCase("Screenshot", ScreenshotTest);
