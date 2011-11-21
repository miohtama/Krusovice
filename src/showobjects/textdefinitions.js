/*global define*/


/**
 * Define text shapes we can have in the show.
 */
define("krusovice/showobjects/textdefinitions", ["krusovice/showobjects"], function(showobjects) {

    "use strict";

    var textdefinitions = {};

    // Spoof get text for now
    function dummytext(msg) {
        return msg;
    }

    textdefinitions.getDefinitions = function() {

    return [
        {
            id : "clear",

            name : dummytext("Clear"),

            labels : {
                text : {
                    name : dummytext("Text"),
                    x : 0,
                    y : 0,
                    w : 1,
                    h : 1
                }
            },

            // Allow to move text around
            position : true,

            // No background color
            clear : true,

            // Render frame border
            border : false,

            width : 1,
            height : 1
        },

        {
            id : "plain",

            name : dummytext("Plain"),

            labels : {},

            width : 1,

            height : 1

        },

        {
            id : "postcard",

            name : dummytext("Postcard"),

            labels : {},

            width : 0,

            height : 0

        },


        {
            id : "postit",

            name : dummytext("Post It"),

            labels : {
                 text : {
                    name : dummytext("Text"),
                    x : 0.2,
                    y : 0.2,
                    w : 0.6,
                    h : 0.4
                }
            },

            width : 4,

            height : 4
        }

    ];
};

    return textdefinitions;

});
