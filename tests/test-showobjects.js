'use strict';

var ShowObjectTest = TestCase("ShowObject");

/**
 * Test that show object animate() goes through states sanely when feed in a clock.
 */
ShowObjectTest.prototype.testSaneAnimationStates= function() {
	
	var init = this.basicSetup();
	
	var elem = init.elem;
	
	assertObject(elem);
	assertEquals(0, elem.wakeUpTime);
		
	var object = new krusovice.showobjects.Base({
		data : elem,
		renderer : init.renderer
	});
	
	assertObject(object.renderer);
	
	assertEquals("notyet", object.animate(-1));
	assertEquals("transitionin", object.animate(0));	
	assertEquals("onscreen", object.animate(3));
	assertEquals("transitionout", object.animate(5));	
	assertEquals("gone", object.animate(10));
};

/**
 * Render transition in frame for an test image element
 */
ShowObjectTest.prototype.testRenderTransitionIn = function() {
	var init = this.basicSetup();	

	var object = new krusovice.showobjects.FramedAndLabeledPhoto({
		data : init.elem,
		renderer : init.renderer
	});
	
	object.prepare();

	// Check that we didn't trigger async image loading in tests
	assertObject(object.image);
	
	
	
}

/**
 * Create a single timeline element for testing purposes.
 */
ShowObjectTest.prototype.createTimelineElement = function() {	
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	
	// Do not try to load 
	// image asynchronously during unit tests
	var elem = plan[0];
	
	elem.image = new Image();
	
	return plan[0];
}

ShowObjectTest.prototype.basicSetup = function() {
	
	var renderer = new krusovice.renderers.Three({
		width: 100,
		height : 100
	});
	
	renderer.setup();
	
	var elem = this.createTimelineElement();
	
	return {
		elem : elem,
		renderer : renderer
	};
		
}


