'use strict';

/*global window,krusovice,$,TestCase,assertTrue*/

var BackgroundTest = TestCase("Background");

/**
 * See what kind of timelien output we get for scroll 2d background.
 *
 */
BackgroundTest.prototype.testScroll2DDataGeneratino = function() {

	var init = this.basicSetup();

	var cfg = {
		"type" : "panorama-2d",
		"image" : new Image(),
        "orignalSize" : {
            "width" : 7018,
            "height" : 1200
        },
        "zoomSizes" : {
            "maxW" : 1300,  "maxH" : 800, "minW" : 900, "minH" : 600
        }
	};

	var duration = 30;
	var background = krusovice.backgrounds.createBackground(cfg.type, duration, init.timeline, null, cfg);

	console.log(background);

	// Check that we are long enough and last frame is outside the show duration
	assertTrue(background.data.frames[background.data.frames.length-1].clock > duration);

	// Check that we get valid frame data
	var keyframes = background.getFramePair(0, background.data.frames);
	assertObject(keyframes); // not null

	console.log("Got frames");
	console.log(keyframes);

	var keyframes = background.getFramePair(duration+666, background.data.frames);
	assertEquals(null, keyframes);

	// Need to mock this data
	background.image = new Image();
	background.image.width = 10;
	background.image.height = 10;


	// Render some random points
	for(var i=0; i<duration; i+=5) {
		background.render(null, 0);
	}
}


/**
 * Create a single timeline element for testing purposes.
 */
BackgroundTest.prototype.createTimeline = function() {
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();

	// Do not try to load
	// image asynchronously during unit tests
	var elem = plan[0];

	//elem.image = new Image();
	var canvas = document.createElement("canvas");
	canvas.width = 100;
	canvas.height = 100;

	elem.image = canvas;

	return plan;
}


/**
 * Set up timeline and show objects basd on our test fixture.
 */
BackgroundTest.prototype.basicSetup = function() {

	var timeline = this.createTimeline();


    return {
    	timeline : timeline
    }
}


