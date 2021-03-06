/*global window, finalizeTestCase, assertTrue, assertObject, assertEquals, assertNotEquals, assertException, assertString, console, jQuery, $ */

'use strict';

var TimelinerTest = function() {};
// Some test data

/**
 * Test construction of very simple timeline
 */
TimelinerTest.prototype.testBasicNoMusic = function() {
    var krusovice = this.krusovice;
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();
        assertEquals(plan.length, 2);

        console.log("Got plan");
        console.log(plan);
        assertEquals(krusovice.effects.ZoomIn.easing, plan[0].animations[0].easing);
        assertEquals("linear", plan[0].animations[1].easing);
        assertEquals(krusovice.effects.ZoomFar.easing, plan[0].animations[2].easing);

};


/**
 * Test construction of very simple timeline with music
 */
TimelinerTest.prototype.testBasicMusic = function() {
    var krusovice = this.krusovice;
        assertObject("Could not load song data", window.sampleSongData);

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, window.sampleSongData);
        var plan = timeliner.createPlan();
        assertEquals(plan.length, 2);

};


/**
 * We cannot construct slideshow without valid input elements
 */
TimelinerTest.prototype.testNoInput = function() {
    var krusovice = this.krusovice;
        function test() {
                var timeliner = krusovice.Timeliner.createSimpleTimeliner();
        }
        // you must give list of elements to show
        assertException("Must fail - bad input", test);
};


/**
 * Check that item has been assigned a wake up time correctly
 */
TimelinerTest.prototype.testHasWakeUpTime = function() {
    var krusovice = this.krusovice;
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();

        var elem = plan[0];

        assertTrue(elem.wakeUpTime >= 0);
        assertTrue(elem.wakeUpTime < 5);

};

/**
 * Check that item has been assigned a wake up time correctly
 */
TimelinerTest.prototype.testHasAnimationTypes = function() {
    var krusovice = this.krusovice;
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();


        plan.forEach(function(e) {

        var realAnimations = e.animations.slice(0, e.length-1);

                realAnimations.forEach(function(a) {

                        /* Goner element has a type of null */
                        if(a.type != "gone") {
                                assertString(a.effectType);
                                assertString(a.type);
                                assertString(a.easing);
                        }
                });
        });

};

/**
 * See that our JQ easingn works
 */
TimelinerTest.prototype.testJQueryEasing = function() {
    var krusovice = this.krusovice;
    var func = jQuery.easing.linear;
    var val = krusovice.utils.ease("linear", 0.5, 0, 1);
    assertEquals(0.5, val);

    val = krusovice.utils.ease("linear", 0.2, 0, 1);
    assertEquals(0.2, val);
};

/**
 * See that our easing calculation utility functions give sane results
 */
TimelinerTest.prototype.testShowElementEase = function() {
    var krusovice = this.krusovice;
        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();

        assertEquals(4, plan[0].animations.length);

        plan[0].animations[0].easing = "linear";
        plan[0].animations[0].duration = 1.0;

        plan[0].animations[1].easing = "linear";
        plan[0].animations[1].duration = 1.0;

        plan[0].animations[2].easing = "linear";
        plan[0].animations[2].duration = 1.0;

        // Assert midpoint in one second

    var val = krusovice.utils.calculateElementEase(plan[0], -0.1);
    assertEquals(0, val.value);
    assertEquals("notyet", val.animation);

        val = krusovice.utils.calculateElementEase(plan[0], 0.5);
        assertEquals(0.5, val.value);
    assertEquals("transitionin", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 1.5);
    assertEquals(0.5, val.value);
    assertEquals("onscreen", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 2.5);
    assertEquals(0.5, val.value);
    assertEquals("transitionout", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 3.0);
    assertEquals(0, val.value);
    assertEquals("gone", val.animation);


};

/**
 * See that our easing calculation utility functions give sane results with 2 sec animation intervals
 */
TimelinerTest.prototype.testShowElementEase2sec = function() {
    var krusovice = this.krusovice;
    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
    var plan = timeliner.createPlan();

        plan[0].animations[0].easing = "linear";
        plan[0].animations[0].duration = 2.0;

        plan[0].animations[1].easing = "linear";
        plan[0].animations[1].duration = 2.0;

        plan[0].animations[2].easing = "linear";
        plan[0].animations[2].duration = 2.0;

    var val = krusovice.utils.calculateElementEase(plan[0], -1);
    assertEquals(0, val.value);
    assertEquals("notyet", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 1);
    assertEquals(0.5, val.value);
    assertEquals("transitionin", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 3);
    assertEquals(0.5, val.value);
    assertEquals("onscreen", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 5);
    assertEquals(0.5, val.value);
    assertEquals("transitionout", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 5.5);
    assertEquals(0.75, val.value);
    assertEquals("transitionout", val.animation);

    val = krusovice.utils.calculateElementEase(plan[0], 7);
    assertEquals(0, val.value);
    assertEquals("gone", val.animation);
};


/**
 * Test show length calculation with lead and cooling times.
 *
 * Check that the lead at the beginning of the show is properly handled.s
 */
TimelinerTest.prototype.testLeadTime = function() {

    var krusovice = this.krusovice;

    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);

    timeliner.leadTime = 3.0;

    var plan = timeliner.createPlan();

    assertEquals(3.0, plan[0].wakeUpTime);
    // 2 seconds on screen, 2 * 2 seconds on transitions
    assertEquals(9.0, plan[1].wakeUpTime);

};


/**
 * Test show length calculation with lead and cooling times.
 *
 * Check that the lead at the end of the show is properly handled.
 */
TimelinerTest.prototype.testCoolingTime = function() {

    var krusovice = this.krusovice;

    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);

    timeliner.coolingTime = 3.0;

    var plan = timeliner.createPlan();

    assertEquals(0, plan[0].wakeUpTime);
    // 2 seconds on screen, 2 * 2 seconds on transitions
    assertEquals(6, plan[1].wakeUpTime);
    // 2 seconds on screen, 2 * 2 seconds on transitions

    // 3 seconds cooling time

    var end = krusovice.Timeliner.getTotalDuration(plan);

    assertEquals(15, end);

};

/**
 * Check that the objects are spaced out evenly using stepping
 * time and the first object does not have stepping time.
 *
 */
TimelinerTest.prototype.testSteppingTime = function() {

    var krusovice = this.krusovice;

    var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);

    timeliner.leadTime = 3.0;
    timeliner.coolingTime = 3.0;
    timeliner.steppingTime = 5.0;


    var plan = timeliner.createPlan();

    assertEquals(3, plan[0].wakeUpTime);
    // 2 seconds on screen, 2 * 2 seconds on transitions
    // 5 seconds step
    assertEquals(14, plan[1].wakeUpTime);
    // 2 seconds on screen, 2 * 2 seconds on transitions

    // 3 seconds cooling time

    var end = krusovice.Timeliner.getTotalDuration(plan);

    assertEquals(23, end);

};


finalizeTestCase("Timeliner", TimelinerTest);



