'use strict';

/*global amdTestCase,window,krusovice,$,TestCase,assertTrue*/

/**
 * Various tests showing what kind of fittings of photos we can have in different shapes of videos.
 */
amdTestCase(
    {
        testCase : "AspectRatioTest",
        baseUrl : "/test/src"
    },
    ["krusovice_loader"],
    {

        setUp : krusoviceSetUp,
        /**
         *
         */
        shouldFitLandscapeToMoreLandscape : function() {

            var krusovice = this.krusovice;

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

        },

        /**
         *
         */
        shouldFitLandscapeToPortrait : function() {

            var krusovice = this.krusovice;

            var sw = 512;
            var sh = 288;
            var a = sw / sh;

            var tw = 200;
            var th = 1000;


            var d = krusovice.utils.resizeAspectRatio(sw, sh, tw, th);

            console.log("Got:" + d.width + " " + d.height);

            // This should be the constraining factor
            window.assertEquals(112.5, d.height);

            window.assertEquals(d.width/d.height, a);

        },

        /**
         *
         */
        shouldFitLandscapeToSquare : function() {

            var krusovice = this.krusovice;

            var sw = 512;
            var sh = 288;
            var a = sw / sh;

            var tw = 512;
            var th = 512;

            var d = krusovice.utils.resizeAspectRatio(sw, sh, tw, th);

            console.log("Got:" + d.width + " " + d.height);

            // This should be the constraining factor
            window.assertEquals(288, d.height);

            window.assertEquals(d.width/d.height, a);

        }

    }
);


