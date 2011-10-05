'use strict';

/*global window,$,console*/

var krusovice = krusovice || {};


krusovice.showobjects = krusovice.showobjects || {};

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
     * Font id or null
     */
    font : null,

    prepare : function(loader, width, height) {

        if(!this.data) {
            throw "Input data missing";
        }

        if(!this.data.shape) {
            throw "Shape id missing";
        }

        if(!this.data.labels) {
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

        if(this.shape.backgroundImage) {
             loader.loadImage(this.backgroundImage, $.proxy(this.prepareMesh, this));
        } else {
            // 100% procedural thing
            this.prepareMesh();
        }
    },

    /**
     * Create <canvas> elements holding the text side and back side of the plane
     */
    createBuffer : function(width, height) {
       // Create <canvas> to work with
       var buffer = document.createElement('canvas');

       buffer.width = width;
       buffer.height = height;

       return buffer;
    },

    /**
     * @param {Object} labelData x,y,width,height
     *
     * @parma text Text to draw
     */
    drawLabel : function(labelData, text) {
        var ctx = this.buffer.getContext("2d");

    },

    drawLabels : function() {
        var self = this;

        if(!this.data.labels) {
            console.error(this.data);
            throw "No input text defined";
        }

        $.each(this.data.labels, function(labelId, text) {
            var labelData = self.shape.labels[labelId];
            if(!labelData) {
                console.error(self.shape);
                throw "No label " + labelId + " in shape " + self.shape.id;
            }
            self.drawLabel(labelData, text);
        });
    },

    drawBackground : function() {
        var ctx = this.buffer.getContext("2d");
        if(this.image) {
            ctx.drawImage(this.image, 0, 0, this.buffer.width, this.buffer.height);
        } else {
            var background = this.data.backgroundColor ||this.backgroundColor ||"#ffFFff";
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, this.buffer.width, this.buffer.height);
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

        return this.renderer.createQuad(buffer, buffer2);
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
        this.loadData(window.getTextDefinitions());
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
