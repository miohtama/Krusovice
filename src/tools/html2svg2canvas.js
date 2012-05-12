/**
 * HTML to SVG to <canvas> rendering helper.
 *
 * Allow HTML outputted text on <canvas>
 *
 * http://people.mozilla.org/~roc/rendering-HTML-elements-to-canvas.html
 *
 * http://badassjs.com/post/12473322192/hack-of-the-day-rendering-html-to-a-canvas-element-via
 *
 */

/*global require, define, window, console, jQuery, document, setTimeout, Image */


define("krusovice/tools/html2svg2canvas", ["krusovice/thirdparty/jquery"], function($) {

    "use strict";

    // Data URI template to create SVG images
    var svgTemplate = "data:image/svg+xml," +
           "<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>" +
             "<foreignObject width='100%' height='100%'>" +
               "${html}" +
             "</foreignObject>" +
           "</svg>";


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


        /**
         * Async callback which is called when the rendering is done.
         */
        callback : null,

        /**
         * CSS formatting of the target text.
         *
         * <div> width and height will be explicitly set to the <canvas> dimensions.
         */
        css : {

            "color" : "black",

            "background" : "yellow",

            "vertical-align" : "top",

            "text-align"  : "left",

            "font-size" : "16px",

            "font-color" : "black",

            "font-family" : "Helvetica"

        },



        /**
         * Render text using current formatting paramaters.
         *
         * Cleverly delegate heavy lifting to jQuery.
         */
        renderText : function(text) {

            var wrapper = $("<div>");
            var div = $("<div>");

            div.attr("xmlns", 'http://www.w3.org/1999/xhtml');
            wrapper.append(div);

            var css = $.extend({}, this.css);

            css.width = this.canvas.width + "px";
            css.height = this.canvas.height  + "px";

            div.css(this.css);

            div.text(text);

            var html = wrapper.html();

            var svg = this.cookSVG(html);

            console.log("renderText(), svg is "+ svg);

            this.renderSVGOnCanvas(svg);

        },

        /**
         * Generate SVG image source code as data URI
         */
        cookSVG : function(html) {
           var data = {
               width : this.canvas.width,
               height : this.canvas.height,
               html : html
           };

           var svg = svgTemplate;

           $.each(data, function(key, value) {
               svg = svg.replace("${" + key + "}", value);
           });

           return svg;
        },

        /**
         * Generate Image object by data URL, render it and report when done.
         */
        renderSVGOnCanvas : function(svg) {
            var img = new Image();
            var ctx = this.canvas.getContext("2d");
            var self = this;

            img.onload = function() {
                console.log("SVG drawImage()");
                //console.log(img.naturalWidth);
                //console.log(img.naturalHeight);
                ctx.drawImage(img, 50, 50, 100, 100);
                if(self.callback) {
                    self.callback();
                }
            };
            img.src = svg;

            ctx.font = "bold 12px sans-serif";
            ctx.fillStyle = "#000000";
            ctx.fillText("Foobar", 10, 10);
        }

    };

    //
    // public API
    //

    return {
        Renderer : Renderer
    };

});

