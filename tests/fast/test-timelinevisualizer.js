/*global document, window, finalizeTestCase, assertTrue, assertObject, assertEquals, assertNotEquals, assertException, assertString, assertFalse, console, jQuery, $ */

'use strict';

var TimelineVisualizerTest = function() {};

/**
 * Test construction of very simple timeline
 */
TimelineVisualizerTest.prototype.testBasicNoMusic = function() {

    var krusovice = this.krusovice;
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();

        var visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:null});

        var div = document.createElement("div");

        visualizer.render(div);

        assertFalse(visualizer.hasBeats());

        assertEquals(visualizer.renderedBeats, 0);
};


TimelineVisualizerTest.prototype.testBasicMusic = function() {
    var krusovice = this.krusovice;
        var data = window.sampleSongData;
        assertObject(data);

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, data);
        var plan = timeliner.createPlan();

        var visualizer = new krusovice.TimelineVisualizer({plan:plan, rhythmData:data});
        //console.log("Got data:" + visualizer.rhythmData);
        assertObject(visualizer.rhythmData);
        //console.log("hasBeats");
        //console.log(visualizer.rhythmData != null);
        assertTrue(visualizer.hasBeats());

        var div = document.createElement("div");

        visualizer.render(div);

        assertTrue(visualizer.renderedBeats > 100);
};

finalizeTestCase("TimelineVisualizer", TimelineVisualizerTest);
