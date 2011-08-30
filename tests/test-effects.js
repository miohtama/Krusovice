'use strict';

var EffectsTest = TestCase("Effects");

// Some test data


/**
 * Test construction of very simple timeline
 */
EffectsTest.prototype.testTransitionInParameters = function() {

    // Try to create a simple animation parameters
    var effect = krusovice.effects.Manager.get("ZoomIn");
    var params = {};
    
    effects.initParameters("source", params, {}, {});
    
    // x
    self.assertEqual(0, params.position[0]);
    
    // y
    self.assertEqual(0, params.position[1]);   			

    // far z
    self.assertTrue(params.position[2] > 10);            

};

/**
 * Test construction of very simple timeline
 */
EffectsTest.prototype.testTransitionOutParameters = function() {

    // Try to create a simple animation parameters
    var effect = krusovice.effects.Manager.get("ZoomOut");
    var params = {};
    
    effects.initParameters("target", params, {}, {});
    
    // x
    self.assertEqual(0, params.position[0]);
    
    // y
    self.assertEqual(0, params.position[1]);            

    // far z
    self.assertTrue(params.position[2] > 10);            

};
          