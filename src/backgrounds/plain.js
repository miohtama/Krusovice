/**
 * 2D parallax scroller.
 *
 * Scroll & rotate inside a bigger continuous 2D texture.
 */

/*global define*/

define("krusovice/backgrounds/plain", ["krusovice/thirdparty/jquery-bundle", "krusovice/core", "krusovice/backgrounds"], function($, krusovice, backgrounds) {

/**
 * Single color background
 */
backgrounds.Plain = function(options) {
    this.options = options;
};

backgrounds.Plain.prototype = {

    prepare : function(loader, width, height) {
        this.width = width;
        this.height = height;
    },

    render : function(ctx) {
        // Single colour bg
        // https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas
        if(ctx) {
            ctx.save();
            ctx.fillStyle = this.options.color;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }
    }

};

return backgrounds.Plain;

});
