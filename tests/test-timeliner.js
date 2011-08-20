'use strict';

var TimelinerTest = TestCase("Timeliner");

// Some test data


/**
 * Test construction of very simple timeline
 */
TimelinerTest.prototype.testBasicNoMusic = function() {
				
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	assertEquals(plan.length, 2);
};


/**
 * Test construction of very simple timeline with music
 */
TimelinerTest.prototype.testBasicMusic = function() {

	assertObject("Could not load song data", sampleSongData);
		
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, sampleSongData);
	var plan = timeliner.createPlan();
	assertEquals(plan.length, 2);
	
};


/**
 * We cannot construct slideshow without valid input elements
 */
TimelinerTest.prototype.testNoInput = function() {
	
	function test() {
		var timeliner = krusovice.Timeliner.createSimpleTimeliner();
	};
	
	// you must give list of elements to show
	assertException("Must fail - bad input", test);
}; 


/**
 * Check that item has been assigned a wake up time correctly
 */
TimelinerTest.prototype.testHasWakeUpTime = function() {
	
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();

	var elem = plan[0];
	
	assertTrue(elem.wakeUpTime >= 0);
	assertTrue(elem.wakeUpTime < 5);
	
}; 

/**
 * Check that item has been assigned a wake up time correctly
 */
TimelinerTest.prototype.testHasAnimationTypes = function() {
	
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();

	plan.forEach(function(e) {
		assertString(e.transitionIn.type);
		assertString(e.transitionOut.type);
		assertString(e.onScreen.type);

		assertString(e.transitionIn.easing);
		assertString(e.transitionOut.easing);
		assertString(e.onScreen.easing);
		
	});
	
}; 

/**
 * See that our JQ easingn works
 */
TimelinerTest.prototype.testJQueryEasing = function() {
       
        var func = jQuery.easing.linear;
        var val = krusovice.ease("linear", 0.5, 0, 1);
        assertEquals(0.5, val);
        
        val = krusovice.ease("linear", 0.2, 0, 1);
        assertEquals(0.2, val);
}

/**
 * See that our easing calculation utility functions give sane results
 */
TimelinerTest.prototype.testShowElementEase = function() {
		
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
	var plan = timeliner.createPlan();
	
	plan[0].transitionIn.easing = "linear";
	plan[0].transitionIn.duration = 1.0;

	plan[0].onScreen.easing = "linear";
	plan[0].onScreen.duration = 1.0;
	
	plan[0].transitionOut.easing = "linear";
	plan[0].transitionOut.duration = 1.0;

	// Assert midpoint in one second
	
        val = krusovice.calculateElementEase(plan[0], -0.1);
        assertEquals(0, val.value);  	
        assertEquals("notyet", val.animation);     
	
	var val = krusovice.calculateElementEase(plan[0], 0.5);
	assertEquals(0.5, val.value);
        assertEquals("transitionin", val.animation);     
        
        val = krusovice.calculateElementEase(plan[0], 1.5);
        assertEquals(0.5, val.value);
        assertEquals("onscreen", val.animation);     

        val = krusovice.calculateElementEase(plan[0], 2.5);
        assertEquals(0.5, val.value);
        assertEquals("transitionout", val.animation);     
        
        val = krusovice.calculateElementEase(plan[0], 3.0);
        assertEquals(0, val.value);
        assertEquals("gone", val.animation);     

	
}; 

/**
 * See that our easing calculation utility functions give sane results with 2 sec animation intervals
 */
TimelinerTest.prototype.testShowElementEase2sec = function() {
                
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
        var plan = timeliner.createPlan();
        
        plan[0].transitionIn.easing = "linear";
        plan[0].transitionIn.duration = 2.0;

        plan[0].onScreen.easing = "linear";
        plan[0].onScreen.duration = 2.0;
        
        plan[0].transitionOut.easing = "-linear";
        plan[0].transitionOut.duration = 2.0;

        // Assert midpoint in one second
        
        val = krusovice.calculateElementEase(plan[0], -0.1);
        assertEquals(0, val.value);     
        assertEquals("notyet", val.animation);     
        
        var val = krusovice.calculateElementEase(plan[0], 1);
        assertEquals(0.5, val.value);
        assertEquals("transitionin", val.animation);     
        
        val = krusovice.calculateElementEase(plan[0], 3);
        assertEquals(0.5, val.value);
        assertEquals("onscreen", val.animation);     

        val = krusovice.calculateElementEase(plan[0], 5);
        assertEquals(0.5, val.value);
        assertEquals("transitionout", val.animation);     

        val = krusovice.calculateElementEase(plan[0], 5.5);
        assertEquals(0.25, val.value);
        assertEquals("transitionout", val.animation);     

        
        val = krusovice.calculateElementEase(plan[0], 7);
        assertEquals(0, val.value);
        assertEquals("gone", val.animation);     
        
}; 