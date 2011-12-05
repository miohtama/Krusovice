/**
 * Handle initialization which depends on loading of data resources
 */

/*global define*/

define("krusovice/startup", ["krusovice/thirdparty/jquery-bundle", "krusovice/core", "krusovice/tools/url"], function($, krusovice, urltools) {
    'use strict';

    krusovice.Startup = function(cfg) {
        $.extend(this, cfg);

    };

    /**
     *
     */
    krusovice.Startup.prototype = {

        /**
         * @type {String}
         *
         * Base URL for loading song database, songs, background images, text background images, fonts.
         */
        mediaURL : null,

        backgroundMediaURL : null,

        songDataURL : null,

        textMediaURL : null,


        /**
         * Perform krusovice initialization.
         *
         * Construct URLs to various data bits we need to load and create a deferred object
         * to load all this data.
         *
         * @return a Deferred object with a promise to have everything loaded or will fail() with an error message argument
         */
        init :function() {

            console.log("krusovice.Startup.init()");

            if(!this.mediaURL) {
                throw "mediaDataURL must be given";
            }

            // Match olvi data layout here
            if(!this.songMediaURL) {
                this.songMediaURL = urltools.joinRelativePath(this.mediaURL, "music");
            }

            if(!this.songDataURL) {
                this.songDataURL = urltools.joinRelativePath(this.songMediaURL, "songs.json");
            }

            if(!this.textMediaURL) {
                this.textMediaURL = urltools.joinRelativePath(this.mediaURL, "text-backgrounds");
            }

            if(!this.backgroundMediaURL) {
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

            krusovice.backgrounds.Registry.init(this.backgroundMediaURL, ok, fail);

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

            krusovice.music.Registry.loadData(this.songDataURL, this.songMediaURL, ok, fail);

            return dfd.promise();
        }

    };

    return krusovice.Startup;

});
