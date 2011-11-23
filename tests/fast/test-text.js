/*global window,finalizeTestCase,assertTrue,assertObject,assertEquals,assertNotEquals*/

'use strict';

var TextTest = function() {};

/**
 * Render transition in frame for an test image element
 */
TextTest.prototype.testRenderBasicText = function() {

    var krusovice = this.krusovice;

	var init = this.basicSetup();

	var object = new krusovice.showobjects.Text({
		data : init.elem,
		renderer : init.renderer
	});

	object.prepare(null, 512, 512);

    object.animate(0);

};


/**
 * Create a single timeline element for testing purposes.
 */
TextTest.prototype.createTimelineElement = function() {
    var krusovice = this.krusovice;
    var elements = [
        {
            "id" : 0,
            "type" : "text",
            "texts" : {
                "text" : "Testing"
            },
            "shape" : "clear"
        },

        {
            "id" : 1,
            "type" : "text",
            "texts" : {
                "text" : "Testing",
                "secondary" : "Testing"
            },
            "shape" : "plain"
        }
    ];

	var timeliner = krusovice.Timeliner.createSimpleTimeliner(elements, null);
	var plan = timeliner.createPlan();

	return plan[0];
};


TextTest.prototype.basicSetup = function() {

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

finalizeTestCase("Text", TextTest);


