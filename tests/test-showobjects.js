'use strict';

var ShowObjectTest = TestCase("ShowObject");

/**
 * Test that show object animate() goes through states sanely when feed in a clock.
 */
ShowObjectTest.prototype.testSaneAnimationStates= function() {
	
	console.log("Lol");
	console.log(krusovice.renderers);
	var renderer = new krusovice.renderers.Three({
		width: 100,
		height : 100
	});
	
	renderer.setup();
	
	var elem = this.createTimelineElement();
	
	assertObject(elem);
	assertEquals(0, elem.wakeUpTime);
	
	
	var object = new krusovice.showobjects.Base({
		data : elem,
		renderer : renderer
	});
	
	
	assertEquals("notyet", object.animate(-1));
	assertEquals("transitionin", object.animate(0));	
	assertEquals("onscreen", object.animate(3));
	assertEquals("transitionout", object.animate(5));	
	assertEquals("gone", object.animate(10));
};


/**
 * Create a single timeline element for testing purposes.
 */
ShowObjectTest.prototype.createTimelineElement = function() {	
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	return plan[0];
}
