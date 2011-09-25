'use strict';

/*global window,krusovice,$,TestCase,assertTrue*/

var AspectRatioTest = TestCase("AspectRatioTest");

/**
 *
 */
AspectRatioTest.prototype.testFitLandscapeToMoreLandscape = function() {

    var sw = 512;
    var sh = 288;
    var a = sw / sh;

    var tw = 1000;
    var th = 200;

    var d = krusovice.utils.resizeAspectRatio(sw, sh, tw, th);

    console.log("Got:" + d.width + " " + d.height);

    // This should be the constraining factor
    assertEquals(d.height, 200);

    assertEquals(d.width/d.height, a);

}

/**
 *
 */
AspectRatioTest.prototype.testFitLandscapeToPortrait = function() {

    var sw = 512;
    var sh = 288;
    var a = sw / sh;

    var tw = 200;
    var th = 1000;

    var d = krusovice.utils.resizeAspectRatio(sw, sh, tw, th);

    console.log("Got:" + d.width + " " + d.height);

    // This should be the constraining factor
    assertEquals(112.5, d.height);

    assertEquals(d.width/d.height, a);

}

/**
 *
 */
AspectRatioTest.prototype.testFitLandscapeToSquare = function() {

    var sw = 512;
    var sh = 288;
    var a = sw / sh;

    var tw = 512;
    var th = 512;

    var d = krusovice.utils.resizeAspectRatio(sw, sh, tw, th);

    console.log("Got:" + d.width + " " + d.height);

    // This should be the constraining factor
    assertEquals(288, d.height);

    assertEquals(d.width/d.height, a);

}




