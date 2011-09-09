"use strict";

var krusovice = krusovice || {};

krusovice.backgrounds = krusovice.backgrounds || {};

krusovice.backgrounds.Registry = $.extend({}, krusovice.utils.Registry);

/**
 * Background animation.
 */
krusovice.backgrounds.Background = function(cfg) {    
    $.extend(this, cfg);
}

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
    },
    
    
};

/**
 * 2D parallax scroller.
 *
 * Scroll & rotate inside a bigger continuous 2D texture.
 */
krusovice.backgrounds.Scroll2D = function(data) {
    this.data = data;
}

$.extend(krusovice.backgrounds.Scroll2D, {

    /**
     * @cfg {Boolean} rotate Allow rotating texture
     */
    rotate : true,
    
    /**
     * @cfg {String} image id or URL  
     */
    image : null,     
    
    maxZoom : 0,
    
    minZoom : 0,
    
    /**
     * How many pixels move at once
     */
    maxMove : 500,
    
    /**
     * How many seconds we vary between movements
     */
    spanVariation : 5,
    
    /**
     * Average duration of camera movement
     */
    spanDuration : 10,
    
    
    /**
     * 
     */
    beatSeekWindow : 2,

    
    calculateKeyFrame : function(t, oldFrame) {
        var frame = {};
        
        frame.clock = t;
        frame.x = (oldFrame.x||0) + krusovice.utils.splitrnd(maxMove);
        frame.y = (oldFrame.y||0) + krusovice.utils.splitrnd(maxMove);
        frame.zoom = krusovice.utils.rangernd(this.minZoom, this.maxZoom);        
    },
        
    createAnimation : function(duration, timeline, analysis) {    
       
        var data = [];
        var frame, oldFrame;
        var t = 0;
        
        frame = this.calculateKeyFrame(0, {});
        data.push(frame);
        
        while(t < duration) {
            var span = this.spanDuration + krusovice.utils.splitrnd(this.spanVariation);            
            t += span;
            frame = this.calculateKeyFrame(t);
            data.push(frame);
            oldFrame = frame;
        }
    },
    
});        

krusovice.backgrounds.Scroll2D.prototype = {
    
    prepare : function(loader, width, height) {
        // Create a working copy of the data
        this.data = this.data.slice(0);
        this.image = loader.loadImage(e.imageSource);
    },
         
    getFramePair : function(clock, data) {
        var i;
        
        for(i=0; i<data.length; i++) {
            if(data[i].clock > clock) {
                var lastFrame = data[i-1];
                var currentFrame = data[i];
                var delta = (clock - lastFrame.clock) / (currentFrame.clock - lastFrame.clock);                
                
                return {last : lastFrame, current : currentFrame, delta : delta};
            }
        }  
    },
    
    render : function(renderer, clock, data) {
        frames = this.getFramePair(clock, data);        
        
        var eased = krusovice.utils.ease("linear", 0, 1, frames.delta);
        
        var x = krusovice.utils.ease("linear", frames.last.x, frames.current.x, frames.delta);
        var y = krusovice.utils.ease("linear", frames.last.y, frames.current.y, frames.delta);
        
        renderer;
    },
      
}


krusovice.backgrounds.Plain = function() {
    this.data = data;
}

krusovice.backgrounds.Plain.prototype = {
    
    prepare : function(loader, width, height) {
        this.width = width;
        this.height = height;
    },
    
    render : function(ctx) {
        // Single colour bg
        // https://developer.mozilla.org/en/Drawing_Graphics_with_Canvas
        ctx.save();
        ctx.fillStyle = this.data.color; 
        ctx.fillRect(0, 0, width, height);
        ctx.restore();        
    } 
    
};

krusovice.backgrounds.createBackgroundData = function(type, duration, timeline, rhytmData, cfg) {    
       if(type == "plain") {
           return cfg;
       } else if(type == "scroll2d") {
           return krusovice.backgrounds.Scroll2D.createAnimation(duration, timeline, rhytmData);
       }
}
