'use strict';

var TimelineVisualizerTest = TestCase("TimelineVisualizer");

/**
 * Test construction of very simple timeline
 */
TimelineVisualizerTest.prototype.testBasicNoMusic = function() {
				
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	
	var visualizer = new krusovice.TimelineVisualizer(plan, null);
	
	var div = document.createElement("div");
	
	visualizer.render(div);
	
	assertFalse(visualizer.hasBeats());
	
	assertEquals(visualizer.renderedBeats, 0);
};


TimelineVisualizerTest.prototype.testBasicMusic = function() {
	
	var data = sampleSongData;
	
	assertObject(data);
	
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, data);
	var plan = timeliner.createPlan();
	
	var visualizer = new krusovice.TimelineVisualizer(plan, sampleSongData);

	console.log("Got data:" + visualizer.rhytmData);
	assertObject(visualizer.rhytmData);
	console.log("hasBeats");
	console.log(visualizer.rhytmData != null);
	assertTrue(visualizer.hasBeats() == true);
	
	var div = document.createElement("div");
	
	visualizer.render(div);
			
	assertTrue(visualizer.renderedBeats > 100);
};
