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
     * Label id -> text content mappings
     */
    texts : {
    },

	/**
	 * @type String
	 *
	 * Label text
	 */
    label : null,

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
	image : null

};

});
