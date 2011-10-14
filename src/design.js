define(['jquery_bundle', 'krusovice_base'], function($, krusovice) {
'use strict';

/**
 * Design object captures all input needed to prepare a show.
 *
 * Design is stateful - it is serialized and can be used to save and restore editing state.
 * Thus, all resource references must be go through id mechanism.
 *
 */
krusovice.Design = function(cfg) {
    $.extend(this, cfg);
}

/**
 *
 */
krusovice.Design.prototype = {

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
         * One of "video", "plain", "gradient", "skybox"
         */
        type : null,

        color : null,

        imageId : null,

        videoId : null
    },

    /**
     * @type String
     *
     * Background song id. Song id is associated with the serve side music file and generated rhythm analysis data.
     */
    songId : null,

    /**
     * @type Number
     *
     * Adjust music start. Positive value skips music to this moment. Negative value plays music X seconds before the show begins.
     *
     */
    musicStart : 0,


    /**
     * @type Number
     *
     * How many seconds delay between photos. Can be negative.
     */
    nextDelay : 0,

    /**
     * @type Number
     *
     * How many seconds before the first animation appears
     */
    leadTime : 0,

    /**
     * @type Number
     *
     * How many seconds empty after the last animation
     */
    coolingTime : 0,

    /**
     * @type Number
     *
     * How long render the credits frames (last frame)
     */
    creditsTime : 0,

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

    }

};

});
