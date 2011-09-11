"use strict";

var krusovice = krusovice || {};

krusovice.backgrounds = krusovice.backgrounds || {};

krusovice.backgrounds.Registry = $.extend({}, krusovice.utils.Registry, {

	/**
	 * Load backgrounds from JSON file
	 * 
	 * @param {String} url URL to backgrounds.json
	 *
	 * @param {String} mediaURL Base URL to image and video data
	 */	
	loadBackgroundData : function(url, mediaURL, callback) {
		var self = this;
		console.log("Loading backgrounds");
		$.getJSON(url, function(data) {
			console.log("Background data");
			console.log(data);
			data.forEach(function(obj) {
				self.fixMediaURLs(obj);
				self.register(obj);
			})
			callback();
		});
	},
	
	/**
	 * Make image URLs loadable
	 */
	fixMediaURLs : function(obj, mediaURL) {
		if(obj.image) {
			obj.image = mediaURL + obj.image;
		}
	} 
});

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
        frame.x = (oldFrame.x||0) + krusovice.utils.splitrnd(this.maxMove);
        frame.y = (oldFrame.y||0) + krusovice.utils.splitrnd(this.maxMove);
        frame.zoom = krusovice.utils.rangernd(this.minZoom, this.maxZoom);   
        
        return frame;     
    },
        
    createAnimation : function(duration, timeline, analysis, cfg) {    
       
        var params = $.extend({}, cfg);
        var data = [];
        var frame, oldFrame;
        var t = 0;
        
        frame = this.calculateKeyFrame(0, {});
        data.push(frame);
        oldFrame = frame;
        while(t < duration) {
            var span = this.spanDuration + krusovice.utils.splitrnd(this.spanVariation);            
            t += span;
            frame = this.calculateKeyFrame(t, oldFrame);
            data.push(frame);
            oldFrame = frame;
        }
                
        params.frames = data;
        return params;
        
    },
    
});        

krusovice.backgrounds.Scroll2D.prototype = {
    
    /**
     * @cfg {String|Object} image
     *
     * @cfg {Array} frames 
     */   
    
    prepare : function(loader, width, height) {
        // Create a working copy of the data
        this.frames = this.data.frames.slice(0);
        this.image = loader.loadImage(this.data.image);
    },
         
    getFramePair : function(clock, frames) {
        var i;
        
        for(i=0; i<frames.length; i++) {
            if(frames[i].clock > clock) {
                var lastFrame = frames[i-1];
                var currentFrame = frames[i];
                var delta = (clock - lastFrame.clock) / (currentFrame.clock - lastFrame.clock);                
                
                return {last : lastFrame, current : currentFrame, delta : delta};
            }
        }  
    },
    
    render : function(renderer, clock, data) {
        
        console.log(this.data);
        var frames = this.getFramePair(clock, this.data.frames);        
        
        var eased = krusovice.utils.ease("linear", 0, 1, frames.delta);
        
        var x = krusovice.utils.ease("linear", frames.last.x, frames.current.x, frames.delta);
        var y = krusovice.utils.ease("linear", frames.last.y, frames.current.y, frames.delta);
        
        renderer;
    },
      
}


krusovice.backgrounds.Plain = function(data) {
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
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();        
    } 
    
};

krusovice.backgrounds.createBackground = function(type, duration, timeline, rhytmData, cfg) {    
       if(type == "plain") {         
           if(!cfg.color) {
               throw "Color is missing";
           }  
           return new krusovice.backgrounds.Plain(cfg);
       } else if(type == "scroll2d") {
           var data = krusovice.backgrounds.Scroll2D.createAnimation(duration, timeline, rhytmData, cfg);
           if(!data.frames) {
               throw "Ooops";
           }
           return new krusovice.backgrounds.Scroll2D(data);
       } else {
           throw "Unknown background type:" + type;
       }
}
