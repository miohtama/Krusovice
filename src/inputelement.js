/*global define,window,console*/

define("krusovice/inputelement", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
'use strict';
/**
 * InputElement is photo/text frame data with hints to be inserted on the timeline.
 *
 * This is the the source object which the end user edits.
 */
krusovice.InputElement = function() {

};

/**
 *
 */
krusovice.InputElement.prototype = {

    /**
     * @type String
     *
     * Unique id for this element (e.g. image URL)
     */
    id : null,

    /**
     * @type String
     *
     * "image" or "text"
     */
    type : null,


    /**
     * @type String
     *
     * Label text for main label (photos)
     */
    label : null,


    /**
     * @type String
     *
     * Label position for the main label (photos).
     *
     * One of top-left, top-center, ... middle-left, etc.
     */
    labelPosition : null,

    /**
     * Label id -> text content mappings for shaped text labels
     */
    texts : {
        text : null,
        secondary : null
    },


    /**
     * @type Number
     *
     * Duration on the screen (sans transitions)
     */
    duration : 5,

    /**
     * @type String
     *
     * URL to the image source
     */
    imageURL : null,

    /**
     * @type Object
     *
     * Raw image object. Available only in local Design objects.
     *
     * This is usually dropped in image file resized <canvas> object.
     */
    image : null,


    /**
     * @type String
     *
     * CSS color for rendering photo frame border
     *
     */
    borderColor : "#ffffff",

    /**
     * @type String
     *
     * CSS color for rendering text on this element
     *
     */
    textColor : "#ffffff",

    /**
     * @type String
     *
     * CSS color for rendering text shadow on this element
     *
     */
    textShadowColor : "#000000",


    /**
     * @type String
     *
     * For shaped objects (like text) the id of the shape.
     * These are defined in textdefinitions.js.
     *
     * Potentially different photo shapes in the future.
     */
    shape : null


};

});
