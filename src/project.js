/*global define*/

define("krusovice/project", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
    'use strict';

    /**
     * Project object captures data for server-side rendering job.
     *
     * Krusovice uses this model to pass information what kind of
     * rendering job the server should do. Besides having the
     * contents of the show, it will also contain metadata for the quality
     * and ownership.
     */
    krusovice.Project = function(cfg) {
        $.extend(this, cfg);
    };

    /**
     *
     */
    krusovice.Project.prototype = {

    /**
     * @type {Object}
     *
     * See {@link krusovice#Design}.
     */
    design : null,

	/**
	 * @type Number
	 *
	 * Pixel width of rendering output
	 */
	width : 512,


	/**
	 * @type Number
	 *
	 * Pixel height of rendering output
	 */
	height: 288,


	/**
	 * @type String
	 *
	 * Email address of the owner of this show. Will be used to send email notification when done.
	 */
	email : null,


	/**
	 * @type String
	 *
	 * The server-side rendering process will notify this URL about its progress.
	 * For internal use only - you cannot set this.
	 */
	pingbackURI : null
    };
});
