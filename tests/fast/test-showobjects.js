/*global document, window, finalizeTestCase, assertTrue, assertObject, assertEquals, assertNotEquals, console, jQuery, $ */

'use strict';

var ShowObjectsTest = function() {};

/**
 * Test that show object animate() goes through states sanely when feed in a clock.
 */
ShowObjectsTest.prototype.testSaneAnimationStates= function() {

    var krusovice = this.krusovice;

        var init = this.basicSetup();

        var elem = init.elem;

        assertObject(elem);
        assertEquals(0, elem.wakeUpTime);

        var object = new krusovice.showobjects.Base({
                data : elem,
                renderer : init.renderer
        });

        assertObject(object.renderer);

        assertEquals("notyet", object.animate(-1).animation);
        assertEquals("transitionin", object.animate(0).animation);
        assertEquals("onscreen", object.animate(3).animation);
        assertEquals("transitionout", object.animate(5).animation);
        assertEquals("gone", object.animate(10).animation);
};


/**
 * Render transition in frame for an test image element
 */
ShowObjectsTest.prototype.testRenderTransitionIn = function() {
    var krusovice = this.krusovice;

        var init = this.basicSetup();

        var object = new krusovice.showobjects.FramedAndLabeledPhoto({
                data : init.elem,
                renderer : init.renderer
        });

        object.prepare(null, 512, 512);

        // Check that we didn't trigger async image loading in tests
        assertObject(object.image);

        // Transition in start
        var state = object.animate(0);

        // Check that we got easing correct
        assertEquals(krusovice.effects.ZoomIn.easing, state.easing);

        // Render few frames and assert no exceptions fly
        var i=0;
        for(i=0; i<1; i+=0.3) {
                object.animate(0.1);
        }
};



/**
 * Create a single timeline element for testing purposes.
 */
ShowObjectsTest.prototype.createTimelineElement = function() {
    var krusovice = this.krusovice;

        var timeliner = krusovice.Timeliner.createSimpleTimeliner(window.simpleElements, null);
        var plan = timeliner.createPlan();

        // Do not try to load
        // image asynchronously during unit tests
        var elem = plan[0];

        //elem.image = new Image();
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        elem.image = canvas;

        return plan[0];
};

ShowObjectsTest.prototype.basicSetup = function() {

    var krusovice = this.krusovice;


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

};

finalizeTestCase("ShowObjects", ShowObjectsTest);



