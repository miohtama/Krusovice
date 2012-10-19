/*global jQuery, document, setTimeout, console, $ */

/**
 * Test show with one portrait and one landscape image and see they get proper resizes to fit on the screen.
 */
function getHorizontalAndVerticalDesign() {

    "use strict";


    // Create a show with two elements
    var horizontalAndVerticalPlan = [
            {
                type : "image",
                id : "vertical",
                duration : 2.0,
                imageURL : "../testdata/sub.jpg"
            },

            {
                type : "image",
                id : "horizontal",
                imageURL : "../testdata/ukko.jpg",
                duration : 2.0
            }
    ];


    var design = {
        plan : horizontalAndVerticalPlan,
        transitions : {
            transitionIn : {
                duration : 2.0,
                type : "zoomin"
            },

            transitionOut : {
                duration : 2.0,
                type : "zoomfar"
            },

            onScreen : {
                duration : 2.0,
                type : "hold"
            }
        }
    };

    return design;

}

