/**
 * Render text on <canvas> with some formatting options.
 *
 */

/*global require,define,window,console*/


define("krusovice/tools/text2canvas", ["krusovice/thirdparty/jquery"], function($) {


    /**
     * Renderer provides some basic text rendering tools for <canvas>
     *
     * Set <target> canvas as a paramter.
     *
     * WARNING: This operation taint the <canvas> on Firefox 8 and Chrome 13.
     * Not usable yet.
     *
     * https://bugzilla.mozilla.org/show_bug.cgi?id=672013
     */
    function Renderer(cfg) {
        $.extend(this, cfg);
    }

    Renderer.prototype = {

        /**
         * Target canvas
         */
        canvas : null,


        fontHeight : 0,

        /**
         * Text split to lines
         */
        lines : [],

        /**
         * Some pseudo-CSS styling
         *
         */
        css : {

            "color" : "#000000",

            // Add some shadow / border to make text stand
            // out of various backgrounds
            "border-color" : "#000000",

            // top, middle, bottom
            "vertical-align" : "top",

            // left, right, center
            "text-align"  : "left",

            // Font height of <canvas> height
            "font-size-percents" : 10,

            "padding-percents" : 10,

            "border-size-percents" : 1,

            "font-family" : "Helvetica"

        },


        getWidthAsPixels : function(percents) {
            return this.canvas.width * percents/100;
        },

        getHeightAsPixels : function(percents) {
            return this.canvas.height * percents / 100;
        },

        // Default 2% line padding
        calculateLineHeight : function() {
            return this.fontHeight + this.getHeightAsPixels(2);
        },

        measureText : function() {

            var maxWidth = 0;
            var self = this;

            this.lines.forEach(function(line) {
                var width = self.ctx.measureText(line);
                if(width > maxWidth) {
                    maxWidth = width;
                }
            });

            var lineHeight = this.calculateLineHeight();

            return {
                width : maxWidth,
                height : lineHeight * this.lines.length
            };
        },

        split : function(text) {
            this.lines = text.split("\n");
        },

        prepareFont : function() {

            var pixels;

            if(this.css["font-size-percents"]) {
                pixels = this.getHeightAsPixels(this.css["font-size-percents"]);
            }


            this.fontHeight =  pixels;

            var font = pixels + "px " + this.css["font-family"];
            console.log("Using font definition:" + font);
            this.ctx.font = font;
        },


        /**
         * Return x and y which is the start of the text drawing position
         */
        positionText : function(dim) {

            var w = this.canvas.width;
            var h = this.canvas.height;

            var paddingX = this.getWidthAsPixels(this.css["padding-percents"]);
            var paddingY = this.getHeightAsPixels(this.css["padding-percents"]);

            var x = 0, y= 0;
            var v = this.css["vertical-align"];
            var a = this.css["text-align"];

            if(v == "top") {
                y = paddingY;
            }

            if(v == "middle") {
                y = h / 2 - dim.height / 2;
            }

            if(v == "bottom") {
                y = h - paddingY - dim.height;
            }

            // Use native canvas text align API for real X
            x = paddingX;

            if(a == "center") {
                x = w /2;
            }

            if(a == "right") {
                x = w - paddingX;
            }

            return { x : x, y : y, width : w - paddingX * 2, height : h - paddingY * 2};

        },

        /**
         * Render text using current formatting paramaters.
         *
         * Cleverly delegate heavy lifting to jQuery.
         */
        renderText : function(text) {

            var ctx;
            this.ctx = ctx = this.canvas.getContext("2d");

            this.split(text);

            this.prepareFont();

            var dimensions = this.measureText(text);

            var position = this.positionText(dimensions);

            var x = position.x;
            var y = position.y;
            var self = this;
            var h = this.calculateLineHeight();

            ctx.textAlign = this.css["text-align"];
            ctx.textBaseline = "top";
            ctx.fillStyle = this.css.color;

            ctx.strokeStyle = this.css["border-color"];
            ctx.lineWidth = this.getHeightAsPixels(this.css["border-size-percents"]);
            ctx.shadowBlur = 3;
            ctx.shadowColor = this.css["border-color"];
            /*
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(0, 0, position.width, position.height);
            ctx.font = "bold 12px sans-serif";
            ctx.fillText("Foobar", 20, 20);
            */

            this.lines.forEach(function(line) {
                console.log("Drawing line:" + x +  " " + y + " line:" + line + " maxWidth:" + position.width);
                if(self.ctx.lineWidth > 0) {
                    ctx.strokeText(line, x, y, position.width);
                }
                ctx.fillText(line, x, y, position.width);

                y += h;
            });

        }

    };

    //
    // public API
    //

    return {
        Renderer : Renderer
    };

});

