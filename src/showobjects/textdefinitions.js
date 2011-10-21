/*global define*/


/**
 * Define text shapes we can have in the show.
 */
define("krusovice/showobjects/textdefinitions", ["krusovice/showobjects"], function(showobjects) {

    "use strict";

    var textdefinitions = {};

    textdefinitions.getDefinitions = function() {

    return [
        {
            id : "box",

            name : "Box",

            labels : {
                text : {
                    name : "Text",
                    x : 0.2,
                    y : 0.2,
                    w : 0.6,
                    h : 0.4
                }
            },

            width : 16,
            height : 9
        },

        {
            id : "note",

            name : "Note",

            labels : {
                 text : {
                    name : "Text",
                    x : 0.2,
                    y : 0.2,
                    w : 0.6,
                    h : 0.4
                }
            },

            width : 4,

            height : 4
        },


        {
            id : "postcard",

            name : "Postcard",

            labels : {},

            width : 0,

            height : 0

        }
    ];
};

    return textdefinitions;

});
