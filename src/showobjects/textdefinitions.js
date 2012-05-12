/*global define, console, jQuery, document, setTimeout */


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

            // Background image name (if used)
            imageName : null,

            // Allow to move text around
            position : true,

            // No background color
            clear : true,

            // Render frame border
            border : false,

            textBorder : true,

            width : 1,
            height : 1,


            // Transitions for this particular text style
            transitions : {
                transitionIn : {
                    type : "fade",
                    duration : 1
                },
                transitionOut : {
                    type : "fade",
                    duration : 1
                },
                onScreen : {
                    type : "hold"
                }
            }
        },

        // CC-BY-SA
        // http://commons.wikimedia.org/wiki/File:Post-it-note-transparent.png
        {
            id : "postit",

            imageName :  "postit.png",

            name : dummytext("Post It"),

            labels : {

                text : {
                    name : dummytext("Text"),
                    fontSizeAdjust : 0.7
                }

            },

            width : 1,

            height : 1,

            baseScale : 0.8,

            textBorder : false,

            textStyles : {
                "vertical-align" : "middle",
                "text-align" : "center"
            }

        },

       // Scanned by Mikko - public domain
        {
            id : "notepad",

            imageName :  "notepad.png",

            name : dummytext("Notepad"),

            labels : {

                text : {
                    name : dummytext("Text"),
                    x : 0,
                    y : 0.1,
                    w : 1,
                    h : 0.6,
                    fontSizeAdjust : 1
                },

                secondary : {
                    name : dummytext("Footnote"),
                    x : 0,
                    y : 0.6,
                    w : 1,
                    h : 1,
                    fontSizeAdjust : 0.5
                }
            },

            width : 1,

            height : 1,

            // Transitions for this particular text style
            transitions : {
                transitionIn : {
                    type : "falltop",
                    duration : 3
                },
                transitionOut : {
                    type : "fallbottom",
                    duration : 3
                },
                onScreen : {
                    type : "slightrotatez"
                }
            }

        }
    ];
};

    return textdefinitions;

});
