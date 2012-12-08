/*global define, window, console, jQuery, document, setTimeout */
define("krusovice/design", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
'use strict';


/**
 * Design object captures all input needed to prepare a show.
 *
 * Design is stateful - it is serialized and can be used to save and restore editing state.
 * Thus, all resource references must be go through id mechanism.
 *
 * Design can be local or pure. Local design contain referenecs to non-serializable objects,
 * like raw image data. Local designs cannot be posted to the server.
 *
 * @class krusovice.Design
 *
 */
krusovice.Design = function(cfg) {
    $.extend(this, cfg);
};


/**
 * Make sure design is serializable and contains no local references.
 */
krusovice.Design.clean = function(design) {

    // Deep copy object
    var cleaned = {};

    $.extend(true, cleaned, design);

    // jQuery array deep copy workaround
    // We want to clone <canvas> elements by reference
    // Above extend() does only shallow copy of arrays
    var i;
    for(i=0; i<design.plan.length; i++) {
        cleaned.plan[i] = $.extend({}, design.plan[i]);
    }

    // Clean non-serializable references
    cleaned.plan.forEach(function(e) {
        // Clean Image objects
        e.image = null;
    });


    return cleaned;
};

/**
 * Check if a particular design has some kind of audio associated with it
 *
 * @param  {krusovice.Design}  design
 */
krusovice.Design.hasMusic = function(design) {
    if(design.songId) {
        // XXX: Remove songId BBB
        return true;
    }

    var d = design.songData;
    if(d) {
        if(d.id || d.url || d.audio) {
            return true;
        }
    }

    return false;
};

/**
 *
 */
krusovice.Design.prototype = {

    /**
     * @type String
     *
     * Version string identifying the format of serialized data.
     */
    version : "krusovice-design-version-1",

    /**
     * @type String
     *
     * Show title as human readable name.
     */
    title : null,


    /**
     * @type {Array}
     *
     * Show input elements. Will be converted to timeline in {@link krusovice"Timeliner}.
     */
    plan : null,

    /**
     * @type {Object}
     *
     * Background info
     */
    background : {

        /**
         * @type String
         *
         * If this is set then use one of stock backgrounds with this id.
         * **backgroundId** takes precendence of backgroundType.
         */
        backgroundId : null,

        /**
         * @type String
         *
         * One of "plain", "scroll-2d", "texture"
         */
        type : null,

        /**
         * Specify subtype of background inside the renderer.
         *
         * For example, for texture this can be "horizon" or "wall"
         * @type {String}
         */
        mode : null,

        /**
         * Background color as RGB hex triplet
         *
         * @type {Number}
         */
        color : null,

        /**
         * Texture, image, etc. media source file URL
         *
         * @type {String}
         */
        src : null

    },

    /**
     * 3D distances and constants used to tune the scene object positions and animations.
     */
    world : {

        // Camera near z, far z
        camera : {

            clip : [0.1, 10000],

            // Where is camera located (always watches 0,0,0 by default)
            position: [0, 0, 650],

            // How camera is rotated
            rotation: [0, 0, 0],

            aspectRatio : 16/10,

            // Camera field of view in degrees
            fov : 60

        },

        wall : {

            // Where is the wall plane positioned
            // when rendering the "falling photos" mode
            position: [0, 0, -4000],

            // Normal towards camera
            up : [0, 0, -1],

            // Wall texture repeat and scaling factor
            repeat : [50, 50]

        },

        // Where is directional the light casting the shadows
        shadow : {

            // Shadow light direction
            light : [0, 2000, 5000],

            fov: 60,

            // top, right, bottom, left, near far
            frustrum : [-1000, 1000, 1000, -1000, -4000, 10000],

            darkness : 0.7

        },

        lights : {
            ambient : {
                color : 0xaaAAaa
            },

            spot : {
                position : [0, 0, 1200],
                color : 0xaaAaaa
            }
        },


        postprocessing : {

            // What kind of postprocessing chain is used for the show
            postprocessor : "normal"
        }

    },


    /**
     * @type String
     *
     * XXX: Remove - use songData block
     *
     * Background song id. Song id is associated with the serve side music file and generated rhythm analysis data.
     */
    songId : null,

    /**
     * @type Object
     *
     * Custom uploaded song data.
     *
     * Song data resolution rules
     *
     * * If songData && songData.url set use it
     *
     * * else if songId set use it
     *
     * * else use silence
     *
     */
    songData : {

        // String
        id : null,

        // String
        name : null,

        // MP3 URL
        url : null,

        // Direct audio data as <audio> or Audia instance.
        // This must have audio.rhythmData property set to track analysis data
        // if analysis information is used
        audio : null
    },

    /**
     * @type Number
     *
     * Adjust music start. Positive value skips music to this moment. Negative value plays music X seconds before the show begins.
     *
     */
    musicStart : 0,

    /**
     * @cfg {Number} leadTime How many seconds we play music before the first element appears
     */
    leadTime : 0,

    /**
     * @cfg {Number} coolingTime  How many seconds empty we have after the last element before the credits
     */
    coolingTime : 0,

    /**
     * @cfg {Number} steppingTime How many seconds empty we have between show objects
     */
    steppingTime : 0,


    /**
     * Default transition settings.
     */
    transitions : {

        transitionIn : {
            type : "zoomin",
            duration : 2.0
        },

        transitionOut : {
            type :  "hold",
            duration : 2.0
        },

        onScreen : {
            type :  "hold"
            // Duration will come from the plan item itself
        }

    },


    /**
     * @type Object
     *
     * Hold UI data of design data
     */
    editData : null

};

});
