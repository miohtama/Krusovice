/**
 * Handle Krusovice database initializations
 */

/*global define, console, jQuery, document, setTimeout */

define("krusovice/startup", ["krusovice/thirdparty/jquery-bundle", "krusovice/core", "krusovice/tools/url"], function($, krusovice, urltools) {
    'use strict';

    krusovice.Startup = function(cfg) {
        $.extend(this, cfg);

    };

    /**
     * Load krusovice media databases.
     * These databases include things like available backgrounds, medias, etc.
     *
     * Uses jQuery defer pattern.
     */
    krusovice.Startup.prototype = {

        /**
         * @type {String}
         *
         * Base URL for loading song database, songs, background images, text background images, fonts.
         */
        mediaURL : null,

        // Set these URLs to null to skip loading

        backgroundMediaURL : undefined,

        songMediaURL : undefined,

        songDataURL : undefined,

        textMediaURL : undefined,


        /**
         * Perform krusovice initialization.
         *
         * Construct URLs to various data bits we need to load and create a deferred object
         * to load all this data.
         *
         * @return {jQuery.Deferred} a Deferred object with a promise to have everything loaded or will fail() with an error message argument
         */
        init :function() {

            console.log("krusovice.Startup.init()");

            if(!this.mediaURL) {
                throw new Error("Startup.mediaURL must be given");
            }

            // Match olvi data layout here
            if(this.songMediaURL === undefined) {
                this.songMediaURL = urltools.joinRelativePath(this.mediaURL, "music");
            }

            if(this.songDataURL === undefined) {
                this.songDataURL = urltools.joinRelativePath(this.songMediaURL, "songs.json");
            }

            if(this.textMediaURL === undefined) {
                this.textMediaURL = urltools.joinRelativePath(this.mediaURL, "text-backgrounds");
            }

            if(this.backgroundMediaURL === undefined) {
                this.backgroundMediaURL = urltools.joinRelativePath(this.mediaURL, "backgrounds");
            }

            return $.when(
                this.loadTexts(),
                this.loadSongs(),
                this.loadBackgrounds()
            );

        },

        loadTexts : function() {
            var dfd = $.Deferred();
            var self = this;

            // this step cannot fail - no async resources

            setTimeout(function() {
                krusovice.texts.Registry.init(self.textMediaURL);
                dfd.resolve();
            }, 1);

            return dfd.promise();
        },

        /**
         * Load backgrounds database
         */
        loadBackgrounds : function() {

            var dfd = $.Deferred();

            function ok() {
                dfd.resolve();
            }

            function fail() {
                dfd.reject("Could not load background database");
            }

            if(this.backgroundMediaURL) {
                krusovice.backgrounds.Registry.init(this.backgroundMediaURL, ok, fail);
            } else {
                console.warn("loadBackground(): skip");
                setTimeout(ok, 10);
            }

            return dfd.promise();
        },

        /**
         * Load song database and set-up song registry.
         */
        loadSongs : function() {
            var dfd = $.Deferred();

            function ok() {
                dfd.resolve();
            }

            function fail() {
                dfd.reject("Could not load music database");
            }

           if(this.songDataURL) {
                krusovice.music.Registry.loadData(this.songDataURL, this.songMediaURL, ok, fail);
            } else {
                console.warn("loadSongs(): skip");
                setTimeout(ok, 10);
            }

            return dfd.promise();
        }

    };

    return krusovice.Startup;

});
