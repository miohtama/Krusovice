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
         * Text bounding box relative to the back buffer
         */
        box : {
            x : 0,
            y : 0,
            w : 1,
            h : 1
        },

        /**
         * Some pseudo-CSS styling.
         *
         * Note that used font-family MUST be preloaded somehow,
         * or the first call of draw string will draw nothing
         * on Chrome 15.
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

            // 0...1 multiplier for font size
            "font-size-adjust" : 1,

            "padding-percents" : 10,

            "border-size-percents" : 1,

            "font-family" : "'Gloria Hallelujah'"

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

            this.fontHeight =  pixels * this.css["font-size-adjust"];

            var font = this.fontHeight + "px " + this.css["font-family"];
            console.log("Using font definition:" + font);
            this.ctx.font = font;
        },


        /**
         * Return x and y which is the start of the text drawing position
         */
        positionText : function(dim) {
            var box = this.box;
            var w = this.canvas.width * box.w;
            var h = this.canvas.height * box.h;

            var paddingX = this.getWidthAsPixels(this.css["padding-percents"]);
            var paddingY = this.getHeightAsPixels(this.css["padding-percents"]);

            var x = this.canvas.width * box.x, y=this.canvas.height*box.y;
            var v = this.css["vertical-align"];
            var a = this.css["text-align"];

            if(v == "top") {
                y = y+paddingY;
            }

            if(v == "middle") {
                y = box.y + (h / 2 - dim.height / 2);
            }

            if(v == "bottom") {
                y = box.y + (h - paddingY - dim.height);
            }

            // Use native canvas text align API for real X
            x = x+paddingX;

            if(a == "center") {
                x = w /2;
            }

            if(a == "right") {
                x = w - paddingX;
            }


            var data = { x : x, y : y, width : w - paddingX * 2, height : h - paddingY * 2};

            if(data.width < 0) {
                console.error(data);
                console.error(box);
                throw "Width calculation failed big time";
            }

            return data;

        },

        /**
         * Render text using current formatting paramaters.
         *
         * Cleverly delegate heavy lifting to jQuery.
         */
        renderText : function(text) {

            console.log("renderText()");
            console.log(this.css);

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

            if(this.css["border-color"] !== null) {
                ctx.strokeStyle = this.css["border-color"];
                ctx.lineWidth = this.getHeightAsPixels(this.css["border-size-percents"]);
            } else {
                ctx.lineWidth = 0;
            }

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

