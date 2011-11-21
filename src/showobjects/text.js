define("krusovice/showobjects/text", ["krusovice/thirdparty/jquery-bundle",
    "krusovice/core",
    'krusovice/showobjects/textdefinitions',
    "krusovice/tools/text2canvas"], function($, krusovice, textdefinitions, text2canvas) {

"use strict";

/*global window,$,console*/

/**
 * Text with a monocolor background frame
 *
 * @extends krusovice.showobjects.Base
 */
krusovice.showobjects.Text = function(cfg) {
    $.extend(this, cfg);
};

$.extend(krusovice.showobjects.Text.prototype, krusovice.showobjects.Base.prototype);

$.extend(krusovice.showobjects.Text.prototype, {

    /**
     * HTML <canvas> buffer containing resized and framed image with label text
     */
    buffer : null,

    renderer : null,

    /**
     * {@link krusovice#InputElement}
     */
    data : null,

    /**
     * {@link krusovice.text#Shape} object telling what kind of text object this is
     */
    shape : null,

    /**
     * <canvas> suggested pixel width
     */
    width : 0,

    /**
     * <canvas> pixel height
     */
    height : 0,

    foregroundColor : null,

    backgroundColor : null,

    /**
     * 3D object used
     */
    object : null,

    /**
     * Font id or null
     */
    font : null,

    prepare : function(loader, width, height) {

        var self = this;

        if(!this.data) {
            throw "Input data missing";
        }

        if(!this.data.shape) {
            throw "Shape id missing";
        }

        if(!this.data.texts) {
            throw "Text payload missing";
        }

        if(!this.options) {
            // Spoof dummy options
            this.options = {};
        }

        this.shape = krusovice.texts.Registry.get(this.data.shape);

        if(!this.shape) {
            throw "Unknown text shape id:" + this.data.shape;
        }

        this.width = width;
        this.height = height;

        function done(success, errorMessage) {

            // Resource loading failed
            if(!success) {
                console.error("Resource loading failed for text object");
                console.error(errorMessage);
                self.prepareCallback(success, errorMessage);
                return;
            }

            // Create <canvas> texture (async)
            self.prepareMesh();

        }

         function imageloaded(image) {
            self.backgroundImage = image;
            done(true);
         }


        if(this.shape.backgroundImage) {
             loader.loadImage(this.shape.backgroundImage, imageloaded);
        } else {
            done(true);
        }
    },

    /**
     * Create <canvas> elements holding the text side and back side of the plane
     */
    createBuffer : function(width, height) {
       // Create <canvas> to work with
       var buffer = document.createElement('canvas');

       if(!width || !height) {
           throw "Bad width/height:" + width + " " + height;
       }

       buffer.width = width;
       buffer.height = height;

       console.log("Text buffer:" + buffer.width + " " + buffer.height);

       return buffer;
    },

    /**
     * @param {Object} labelData x,y,width,height
     *
     * @parma text Text to draw
     */
    drawLabel : function(buffer, labelData, text, textStyles) {

        var renderer = new text2canvas.Renderer({canvas:buffer});

        // Inline styyles for this element
        // Most useful for testing / debugging
        //console.log("Text styles");
        //console.log(textStyles);
        if(textStyles) {
            $.extend(renderer.css, textStyles);
        }

        var color = "#000000";

        renderer.css.color = color;
        renderer.css["border-color"] = krusovice.utils.calculateShadowColor(color);

        console.log("Text border color:" + renderer.css["border-color"]);

        renderer.renderText(text);
    },

    /**
     * Draw InputElement.texts
     */
    drawLabels : function(buffer) {
        var self = this;
        var count = 0;

        if(!this.data.texts) {
            console.error(this.data);
            throw "No input text defined";
        }

        // Count how many labels we draw
        $.each(this.data.texts, function(k, v) {
           count++;
        });


        // Async callback check if all labels have been drawn
        // XXX: not really needed currently, but will be needed when svg 2 canvas
        // support works in browsers
        function done() {

            count--;

            if(self.prepareCallback && count <= 0) {
                // Let the rendering engine take over
                console.log("all done()");
            }
        }

        //console.log(self.data);

        $.each(this.data.texts, function(labelId, text) {
            var labelData = self.shape.labels[labelId];
            if(labelData) {
                self.drawLabel(buffer, labelData, text, self.data.textStyles);
            }

            done();
        });
    },

    drawBackground : function(buffer) {
        var ctx = buffer.getContext("2d");

        if(this.image) {
            ctx.drawImage(this.image, 0, 0, this.buffer.width, this.buffer.height);
        } else {
            console.log(this.shape);
            if(!this.shape.clear) {
                var background = this.data.backgroundColor ||this.backgroundColor ||"#ffffff";
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, this.buffer.width, this.buffer.height);
            }
        }
    },

    drawFrontSide : function(buffer) {
        this.drawBackground(buffer);
        this.drawLabels(buffer);
    },

    /**
     *
     */
    prepareMesh : function() {
        var buffer = this.buffer = this.createBuffer(this.width, this.height);
        var buffer2;

        this.drawFrontSide(buffer);

        if(this.hasBackSide()) {
            buffer2 = this.createBuffer(this.width, this.height);
            this.drawBackSide(buffer2);
        } else {
            buffer2 = null;
        }

        var borderColor;
        if(this.shape.border) {
            borderColor = this.data.borderColor;
        } else {
            // texture shapes, clear shape
            borderColor = null;
        }

        this.object = this.renderer.createQuad(buffer, this.width, this.height, borderColor);

        //console.log("Created object");
        //console.log(this.object);

        if(this.prepareCallback) {
            this.prepareCallback(true);
        }

    },

    /**
     * Convert raw photo to a framed image with drop shadow
     *
     * @param {Image} img Image object (loaded)
     */
    createFramedImage : function(img) {
    },

    hasBackSide : function() {
        return false;
    }

});


krusovice.texts = krusovice.texts || {};

/**
 * krusovice.texts.Registry manages different text styles that can be used in shows.
 */
krusovice.texts.Registry = $.extend(true, {}, krusovice.utils.Registry, {

    init : function() {
        console.log("Got defs");
        console.log(textdefinitions);
        this.loadData(textdefinitions.getDefinitions());
    },

    /**
     * Create accessible vocabulary out of Shape definitions
     *
     * @param {Array} data List of krusove.texts.Shape definitions
     */
    loadData : function(data) {
        var self = this;
        data.forEach(function(obj) {
            self.register(obj);
        });
    }

});

// Do now during load time
krusovice.texts.Registry.init();

/**
 * Define what kind of text shapes we have available
 */
krusovice.texts.Shape = function() {
};

krusovice.texts.Shape.prototype = {

    id : null,

    name : null,

    /**
     * List of text boxes of {x, y, width, height}
     */
    labels : [],

    backgroundImage : null

};

});
