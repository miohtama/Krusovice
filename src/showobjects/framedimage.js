define("krusovice/showobjects/framedimage", ['jquery_bundle', 'krusovice_base', 'krusovice/showobjects'], function($, krusovice) {
"use strict";

/*global krusovice,window,$,console*/

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
     * HTML image object of the source image
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
     * @param {Number} width Canvas width for which we prepare (downscale)
     *
     * @param {Number} height Canvas width for which we prepare (downscale)
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

        console.log("FramedAndLabeledPhoto.prepare(): load: " + load + " image obj:" + this.data.image + " URL:" + this.data.imageURL);

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
     */
    createFramedImage : function(img, width, height) {

       if(!width || !height) {
           throw "Width and height missing";
       }

       // Drop shadow blur size in pixels
       // Shadow is same length to both X and Y dirs
       var shadowSize = 5;

       // Picture frame color
       var frameColor = "#FFFFFF";

       // Actual pixel data dimensions, not ones presented in DOM tree

       // Create temporary <canvas> to work with, with expanded canvas (sic.) size
       var buffer = document.createElement('canvas');

       // <canvas> source doesn't give naturalWidth
       var naturalWidth = img.naturalWidht || img.width;
       var naturalHeight = img.naturalHeight || img.height;

       if(!naturalWidth) {
            console.error(img);
            throw "Image does not have width/height information available";
       }

       // Texture sampling base
       //var base = Math.max(width, height);
       //var size = krusovice.utils.calculateAspectRatioFit(naturalWidth, naturalHeight, base, base)


       var size = {width:512,height:512};
       buffer.width = size.width;
       buffer.height = size.height;
       buffer.naturalWidth = naturalWidth;
       buffer.naturalHeight = naturalHeight;
       console.log("Buffer:" + size.width + " " + size.height);

       var nw = size.width;
       var nh = size.height;

       if(!nw || !nh) {
           throw "Unknown image source for framing";
       }

       var borderSize = Math.min(nw, nw) * 0.015;

       // horizontal and vertical frame border sizes
       var borderX = borderSize;
       var borderY = borderSize;

       // Remember, remember, YTI Turbo Pascal
       var context = buffer.getContext('2d');

       context.fillStyle = "#eeEEee";
       context.fillRect(0,0,nw,nh);

       var dimensions = {width : nw, height : nh };

       context.drawImage(img,
           borderX,
           borderY,
           dimensions.width - borderX*2,
           dimensions.height - borderY*2);
       //context.drawImage(img, width/2 - w/2 + 10, height/2 - h/2 + 10, w-20, h-40);


       /*
       context.fillStyle = "#ff00ff";
       context.fillRect(0, 0, dimensions.width, dimensions.height);
       context.fillStyle = "#00ff00";
       context.fillRect(borderX, borderY, dimensions.width - borderX*2, dimensions.height - borderY*2);
       */

       // We don't need to convert canvas back to imge as drawImage() accepts canvas as parameter
       // http://kaioa.com/node/103
       return buffer;

    },

    createRendererObject : function() {
        return this.renderer.createQuad(this.framed, this.framed.naturalWidth, this.framed.naturalHeight);
    }

});
});
