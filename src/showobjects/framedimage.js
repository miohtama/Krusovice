define("krusovice/showobjects/framedimage", ["krusovice/thirdparty/jquery-bundle",
    "krusovice/core",
    'krusovice/showobjects',
    'krusovice/tools/text2canvas'], function($, krusovice, showobjects, text2canvas) {

"use strict";

/*global krusovice, window, console, THREE, jQuery, document, setTimeout, Image */

/**
 *
 * Photo
 *
 * @extends krusovice.showobjects.Base
 */
krusovice.showobjects.FramedAndLabeledPhoto = function(cfg) {
    $.extend(this, cfg);
};

$.extend(krusovice.showobjects.FramedAndLabeledPhoto.prototype, krusovice.showobjects.Base.prototype);

$.extend(krusovice.showobjects.FramedAndLabeledPhoto.prototype, {

    /**
     * HTML <image> or <canvas> object of the source image
     */
    image : null,

    /**
     * HTML <canvas> buffer containing resized and framed image with label text
     */
    framed : null,

    /**
     * Load image asynchronously if image source is URL.
     *
     * Draw borders around the image.
     *
     * @param {Number} width Canvas width for which we prepare (downscale)
     *
     * @param {Number} height Canvas width for which we prepare (downscale)
     */
    prepare : function(loader, width, height) {

        if(!width || !height) {
            throw "FramedAndLabeledPhoto.prepare(): cannot prepare without knowing width and height of target canvas";
        }

        var self = this;
        var load;

        if(this.data.image) {
            // We have a prepared image
            this.image = this.data.image;
            load = false;
        } else {
            this.image = new Image();
            load = true;
        }

        if(!this.image || $.isEmptyObject(this.image)) {
            console.error("Bad Image input for framedimage");
            console.log(this.image);
            throw new Error("Bad image input:" + this.image.src);
        }

        // console.log("FramedAndLabeledPhoto.prepare(): load: " + load + " image obj:" + this.data.image + " URL:" + this.data.imageURL);

        function imageLoaded() {
            self.framed = self.createFramedImage(self.image, width, height);
            //self.framed = self.image;
            self.object = self.createRendererObject();
            if(self.prepareCallback) {
                self.prepareCallback(true);
            }
        }

        function error() {

            var msg = "Failed to load image:" + self.data.imageURL;
            console.error(msg);

            if(self.prepareCallback) {
                console.log("Calling error callback");
                self.prepareCallback(false, msg);
            }
        }

        // Load image asynchroniously
        if(load) {
            if(!this.prepareCallback) {
                throw "Cannot do asyncrhonous loading unless callback is set";
            }
            this.image.onload = imageLoaded;
            this.image.onerror = error;
            this.image.src = this.data.imageURL;
        } else {
            console.log("Was already loaded");
            imageLoaded();
        }

    },

    /**
     * Convert raw photo to a framed image with drop shadow
     *
     * @param {Image} img Image object (loaded)
     *
     * @param {Number} Desired resized witdth in pixels
     */
    createFramedImage : function(img, width, height) {

       // console.log("createFramedImage()");
       // console.log(this.data);

       if(!width || !height) {
           throw "Width and height missing";
       }

       // Actual pixel data dimensions, not ones presented in DOM tree

       // <canvas> source doesn't give naturalWidth
       var naturalWidth = img.naturalWidht || img.width;
       var naturalHeight = img.naturalHeight || img.height;

       // Log why we fail
       if(!naturalWidth) {
            console.error("Image width/height missing");
            console.log(img);
            throw new Error("Image does not have width/height information available:" + img.src);
       }

       // Create temporary <canvas> to work with, with expanded canvas (sic.) size
       var buffer = document.createElement('canvas');

       // Texture sampling base
       //var base = Math.max(width, height);
       //var size = krusovice.utils.calculateAspectRatioFit(naturalWidth, naturalHeight, base, base)
       //var size = {width:512,height:512};

       var size = {width:naturalWidth, height:naturalHeight};

       // <canvas> renderer would be really really slow
       // with huge images... make sure we downscale
       size = krusovice.utils.calculateAspectRatioFit(naturalWidth, naturalHeight, 768, 768);

       buffer.width = size.width;
       buffer.height = size.height;
       buffer.naturalWidth = naturalWidth;
       buffer.naturalHeight = naturalHeight;
       //console.log("Buffer:" + size.width + " " + size.height);

       var nw = size.width;
       var nh = size.height;

       if(!nw || !nh) {
           throw "Unknown image source for framing";
       }

       // Remember, remember, YTI Turbo Pascal
       var context = buffer.getContext('2d');

       context.drawImage(img,
           0,
           0,
           buffer.width,
           buffer.height);

       this.renderLabels(buffer);

       return buffer;

    },

    /**
     * Render any photo labels
     */
    renderLabels : function(buffer) {

        var data = this.data;

        if(!data.label) {
            return;
        }

        var label = data.label;
        var position = data.labelPosition ||"bottom-center";
        var color = data.textColor || "#ffffff";
        var vertical = "bottom";
        var horizontal = "center";
        try {
            var parts = position.split("-");
            vertical = parts[0];
            horizontal = parts[1];
        } catch(e) {
        }

        var renderer = new text2canvas.Renderer({canvas:buffer});

        renderer.css["vertical-align"] = vertical;
        renderer.css["text-align"] = horizontal;
        renderer.css.color = color;
        renderer.css["border-color"] = krusovice.utils.calculateShadowColor(color);
        renderer.css["font-size-adjust"] = data.fontSizeAdjust ||1.0;

        //console.log("rendering photo label:" + label);
        renderer.renderText(label);
    },

    createRendererObject : function() {
        var borderColor = this.data.borderColor || "#eeEEee";
        return this.renderer.createQuad(this.framed, this.framed.naturalWidth, this.framed.naturalHeight, borderColor);
    },


    render : function(vuStrength) {
        if(this.effectObject) {
            //this.effectUniforms.intensity.value = vuStrength;

            var v = $.easing.easeOutQuad(null, vuStrength, 0, 1, 1);

            this.effectUniforms.intensity.value = v;

            // Clamp
            /*
            if(v > 0.5) {
                v = 0.5;
            }*/

            //console.log(this.effectUniforms.color.value);
            /*
            console.log("Got vu:" + vuStrength);
            console.log("Got color:");
            console.log(this.effectUniforms.color.value);*/
        }
    }


});
});
