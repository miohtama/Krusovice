/**
 * Background registry and some default backgrounds.
 *
 */

/*global define, console, jQuery, document, setTimeout */

define("krusovice/backgrounds", ["krusovice/thirdparty/jquery-bundle",
"krusovice/core",
"krusovice/utils",
"krusovice/tools/url"], function($, krusovice, utils, urltools) {

"use strict";

krusovice.backgrounds = krusovice.backgrounds || {};

krusovice.backgrounds.Registry = $.extend(true, {}, utils.Registry, {

    mediaURL : null,

    /**
     * @param url Pointer to the folder with backgrounds.json
     */
    init : function(url, callback, errorCallback) {

        if(!url) {
            throw "Base folder URL must be given";
        }

        var dbURL = urltools.joinRelativePath(url, "backgrounds.json");

        this.mediaURL = url;

        this.loadBackgroundData(dbURL, url, callback);
    },

    /**
     * Load backgrounds from JSON file
     *
     * @param {String} url URL to backgrounds.json
     *
     * @param {String} mediaURL Base URL to image and video data
     */
    loadBackgroundData : function(url, mediaURL, callback, errorCallback) {

        var self = this;

        if(!callback) {
            throw "Async callback missing";
        }

        console.log("Loading background data:" + url);

        var dfd = $.getJSON(url, function(data) {
            self.processData(data, mediaURL);
            callback();
        });

        dfd.error(errorCallback);
    },

    /**
     * Load data directly from array.
     */
    processData : function(data, mediaURL) {
        var self = this;

        if(!data) {
            throw "Background data was not provided";
        }

        data.forEach(function(obj) {
            self.fixMediaURLs(obj, mediaURL);
            self.fixThumbnails(obj, mediaURL);
            self.register(obj);
        });
    },

    /**
     * Make image URLs loadable
     */
    fixMediaURLs : function(obj, mediaURL) {

        if(!mediaURL) {
            throw "Using image-based backgrounds needs base media URL";
        }

        /*
        if(mediaURL[mediaURL.length-1] != "/") {
            throw "Media URL must end with slash:" + mediaURL;
        }
        */

        // We may also get Image objects directly feed in
        if(obj.image && typeof(obj.image) == "string") {
            if(!obj.image.match("^http")) {
                // Convert background source url from relative to absolute
                obj.image = urltools.joinRelativePath(mediaURL, obj.image);
            }
        }
    },

    /**
     * Fix thumbnail URLs of the background.
     *
     * XXX: Hardcoded for now
     */
    fixThumbnails : function(obj, mediaURL) {
        var u = urltools.joinRelativePath(mediaURL, "thumbnails");
        obj.thumbnail = urltools.joinRelativePath(u, obj.id + ".png");
        //console.log("Got thumbnail URL:" + obj.thumbnail);
    },

    checkInit : function() {
        if(!this.mediaURL) {
            throw new Error("Background registry not initalized - call krusovice.backgrounds.Registry.init()");
        }
    }


});

/**
 * Background animation.
 */
krusovice.backgrounds.Background = function(options, data) {
};

krusovice.backgrounds.Background.prototype = {

    /**
     * Initialize rendering objects
     *
     * @return
     */
    prepare : function(loeader, width, height) {

    },

    buildScene : function(loader, renderer) {
    },


    /**
     * Calculate background animation state
     */
    render : function(renderer, clock, data) {
    }


};

krusovice.backgrounds.createBackground = function(type, duration, timeline, rhythmData, cfg) {

       console.log("Creating background type:" + type);

       if(type == "plain") {
           if(!cfg.color) {
               throw "Color is missing";
           }
           return new krusovice.backgrounds.Plain(cfg);
       } else if(type == "panorama-2d") {
           var data = krusovice.backgrounds.Scroll2D.createAnimation(duration, timeline, rhythmData, cfg);
           if(!data.frames) {
               throw "Ooops";
           }
           return new krusovice.backgrounds.Scroll2D(cfg, data);
       } else {
           throw "Unknown background type:" + type;
       }
};

/**
 * @param {String} id One of stock background ids
 */
krusovice.backgrounds.createBackgroundById = function(id, duration, timeline, rhythmData, cfg) {

    console.log("Creating background by id:" + id);

    var bgData = $.extend({}, krusovice.backgrounds.Registry.get(id), cfg);
    var type = bgData.type;

    if(!type) {
        console.error("Background not available:" + id);
        throw "Unknown background id:" + id;
    }

    return krusovice.backgrounds.createBackground(type, duration, timeline, rhythmData, bgData);
};

return krusovice.backgrounds;

});
