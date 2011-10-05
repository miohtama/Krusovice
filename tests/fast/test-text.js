'use strict';

/*global TestCase*/

var TextTest = window.TestCase("Text");

/**
 * Render transition in frame for an test image element
 */
TextTest.prototype.testRenderBasicText = function() {

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
    
    var elements = [
        {
            "id" : 0,
            "type" : "text",
            "labels" : {
                "text" : "Testing"   
            },
            "shape" : "box"
        }
    ]
    
	var timeliner = krusovice.Timeliner.createSimpleTimeliner(elements, null);
	var plan = timeliner.createPlan();

	return plan[0];
}


TextTest.prototype.basicSetup = function() {
    
 
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


