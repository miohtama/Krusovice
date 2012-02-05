/*global define,window,console*/

define("krusovice/loader", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
"use strict";

/**
 * Simple element loader helper
 */
krusovice.Loader = function(cfg) {
    $.extend(this, cfg);
};

krusovice.Loader.prototype = {

    /**
     * Dictionary of elements which are still being loaded.
     *
     * Must be populated in before prepare() or during prepare() using addForLoading
     *
     */
    loadElements : {
        video : 0,
        audio : 0,
        images : 0,
        backgroundImages : 0
    },

    totalElementsToLoad : 0,

    nowLoaded : 0,

    /**
     * @type Function
     *
     * Function which is called for the progress as callback(progress)
     *
     */
    callback : null,


    /**
     * @type Function
     *
     * errorCallback(msg, progress)
     *
     * Called when any item load fails
     */
    errorCallback : null,


    /**
     * @type Function
     *
     * allLoadedCallback
     *
     * Called when all done
     */
    allLoadedCallback : null,

    /**
     * @type String
     *
     *
     * Contains error message if loading has failed somehow
     */
    errorMessage : null,

    /**
     * Add elements to load queue counter
     *
     * @param {String} name E.g. audio, video, image
     *
     * @param {Nunmber} count How many elements needs to be loaded (still)
     */
    add : function(name, count) {

        // Let's imagine this is an atomic operation
        var value = this.loadElements[name] || 0;
        value += count;
        this.totalElementsToLoad += count;
        this.loadElements[name] = value;

        console.log("Queued resource for loading " + name + " * " + count + " total:" + this.totalElementsToLoad);

    },

    getLeftCount : function() {
        return this.totalElementsToLoad;
    },

    mark : function(name, count) {

        var value = this.loadElements[name] || 0;
        value -= count;

        if(value < 0) {
            throw "Loading book keeping failure for:" + name;
        }


        this.loadElements[name] = value;

        this.nowLoaded += count;

        console.log("Loaded name:" + name + " left:" + value + " total loaded:" + this.nowLoaded + " total count:" + this.totalElementsToLoad);

        if(this.callback) {
            this.callback(this.getProgress());
        }

        this.checkAllLoaded();
    },

    checkAllLoaded : function() {
        if(this.nowLoaded >= this.totalElementsToLoad) {
            if(this.allLoadedCallback) {
                this.allLoadedCallback();
            }
        }
    },

    /**
     * @return Number 0...1 how much loading is done
     */
    getProgress : function() {
        return this.nowLoaded / this.totalElementsToLoad;
    },

    setError : function(msg) {
        this.errorMessage = msg;
        if(this.errorCallback) {
            this.errorCallback(msg);
        }
    },

    /**
     * Fire an error of failing to load a certain resource.
     *
     * @param {String} msg Error message which tells how we failed
     */
    fireError : function(msg) {
        this.setError(msg);
    },


    /**
     * Put an image to a loading chain.
     *
     * If image is an object wait until it is completely laoded.
     * If image is an URL create an image and load it.
     *
     * @param {Image|String} obj Image object or URL to an image
     *
     * @param {Function} callback callback(img) - called on succesful load
     */
    loadImage : function(obj, callback) {

        var self = this;
        var img;
        var load;
        var url;

        if(!obj) {
            throw "loadImage(): missing target";
        }

        if(obj.width === 0 || obj.width) {
            // We have a prepared image
            img = obj;
            url = img.getAttribute("src");
            load = false;
        } else {
            url = obj;
            img = new Image();
            load = true;
        }

        console.log("Preparing image:" + obj + " needs async load:" + load);

        function imageLoaded() {
            //console.log("imageLoaded()" + url);
            callback(img);
            self.mark("image", 1);
        }

        function error() {
            var msg = "Failed to load image:" + url;
            console.error(msg);
            self.setError(msg);
        }

        self.add("image", 1);

        // Load image asynchroniously
        if(load) {
            img.onload = imageLoaded;
            img.onerror = error;
            img.src = obj;
        } else {
            console.log("Was already loaded");
            if(callback) {
                callback();
            }
        }

        return img;

    }

};
});
