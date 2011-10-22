'use strict';

/*global window,finalizeTestCase,assertTrue,assertObject,assertEquals*/

var EffectsTest = function() {};

// Some test data

/**
 * Test construction of very simple timeline
 */
EffectsTest.prototype.testRandomize = function() {

    var src = [1,2,3];
    var r;

    var krusovice = this.krusovice;

    r = krusovice.utils.randomize(src, [0,0,0]);
    assertEquals([1,2,3], r);

    r = krusovice.utils.randomize(1, 0);
    assertEquals(1, r);

    r = krusovice.utils.randomize(1, 99999);
    assertNotEquals(1, r);
};



/**
 * Test construction of very simple timeline
 */
EffectsTest.prototype.testTransitionInParameters = function() {


    // Try to create a simple animation parameters
    var krusovice = this.krusovice;
    var effect = krusovice.effects.Manager.get("zoomin");
    var params = {};


    assertObject(effect);

    effect.prepareParameters("source", params, {}, {});

    console.log("Params");
    console.log(params);

    // x
    assertEquals(0, params.position[0]);

    // y
    assertEquals(0, params.position[1]);

    // far z
    assertTrue(params.position[2] > 10);


};

/**
 * Test construction of very simple timeline
 */
EffectsTest.prototype.testTransitionOutParameters = function() {

    // Try to create a simple animation parameters
    var krusovice = this.krusovice;
    var effect = krusovice.effects.Manager.get("zoomfar");
    var params = {};
    var krusovice = this.krusovice;

    effect.prepareParameters("source", params, {}, {});

    // x
    assertEquals(0, params.position[0]);

    // y
    assertEquals(0, params.position[1]);

    // far z
    assertTrue(params.position[2] < 0);

};


/**
 * Stress animation interpolate function
 */
EffectsTest.prototype.testCalculateAnimation = function() {

    var krusovice = this.krusovice;

	var source = {
			position : [-0.03381065586581826, -0.024750653142109516, 0.9507922390475869],
			scale : [1,1,1],
			rotation : [0,0,0,1],
			opacity : 1
	};

	var target = {
			position : [-0.03381065586581826, -0.024750653142109516, 0.9507922390475869],
			scale : [1,1,1],
			rotation : [0,0,0,1],
			opacity : 1
	};

    var position = krusovice.utils.calculateAnimation(target.position, source.position, 0);
	assertTrue(krusovice.utils.isNumber(position[0]));

    position = krusovice.utils.calculateAnimation(target.position, source.position, 0.1);
	assertTrue(krusovice.utils.isNumber(position[0]));

    position = krusovice.utils.calculateAnimation(target.position, source.position, 1);
	assertTrue(krusovice.utils.isNumber(position[0]));

};

finalizeTestCase("Effects", EffectsTest);

