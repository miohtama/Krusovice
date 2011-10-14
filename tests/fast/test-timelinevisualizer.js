'use strict';

var TimelineVisualizerTest = TestCase("TimelineVisualizer");

/**
 * Test construction of very simple timeline
 */
TimelineVisualizerTest.prototype.testBasicNoMusic = function() {
				
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	
	var visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:null});
	
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
	
	var visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:data});
	console.log("Got data:" + visualizer.rhythmData);
	assertObject(visualizer.rhythmData);
	console.log("hasBeats");
	console.log(visualizer.rhythmData != null);
	assertTrue(visualizer.hasBeats() == true);
	
	var div = document.createElement("div");
	
	visualizer.render(div);
			
	assertTrue(visualizer.renderedBeats > 100);
};
