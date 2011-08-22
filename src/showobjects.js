'use strict';

var krusovice = krusovice || {};

krusovice.showobjects = krusovice.showobjects || {};

/**
 * Base class for animated show object.
 * 
 * Show object is an visualization of timeline element.
 * It prepares an 2D image used as a texture. Then
 * it asks the renderer object of the show to give a
 * 3D handle for this image.
 * For example, image can be prepared by inserting a
 * frame around and it some text on it.
 *
 * There are different kind of show objects (images,
 * texts, videos, etc.) and they all share this common
 * base class containing the core animation logic.
 * 
 * 
 * Show object animates movement and rotation values
 * based on the animation start and end and easing method.
 * Then it passes these values to the renderer's 3D object.
 * 
 * 
 * 
 */
krusovice.showobjects.Base = function(cfg) {    
}

krusovice.showobjects.Base.prototype = {    
    
    /**
     * @cfg {krusovice.Show} show Parent Show object  
     */
    show : null,

    /**
     * @cfg {krusovice.TimelineElement} data TimelineElement of play parameters  
     */    
    data : null,
    
    
    /**
     * Reference to 3d rendering backend object
     */
    object : null,
    
    /**
     * @cfg {Function} Function which is called when async prepare() is ready
     */
    preparedCallback : null,

    /**
     * Internal flag telling whether this object has been already woken up 
     */
    active : false,
    
    init : function() {
        this.show = show;
        
        // Initialize animation variables
        this.x = this.y = this.w = this.h = 0;
        
        // How many degrees this image has been rotated
        this.rotation = 0;
        
        this.opacity = 1;        
    },

    prepare : function() {        

    },
    
    
    play : function() {        
    },
    
    render : function() {
    	// this.renderer.renderObject(this.object);
    },
    
    /**
     * Set the object to the animation state matched by the clock.
     * 
     * We cache the state whether we have been drawing in prior frames, 
     * as this way we can limit the number of 3D objects on the scene.
     */
    animate : function(clock) {
    	var state, easing;
    	
    	var relativeClock = this.data.wakeUpTime - clock;
    	
    	
    	// Determine the state of this animation
    	statedata = krusovice.utils.calculateElementEase(this.data, relativeClock);
    	
    	var animation = statedata.animation;
    	
    	// Don't animate yet - we are waiting for our turn
    	if(animation == "notyet") {
    		return;
    	}
    	    	
    	if(animation != "notyet" && animation != "gone") {
    		if(!this.alive) {
    			this.wakeUp();
    		}
    	}
    	
    	// Time to die
    	if(this.alive) {
    		if(animation == "gone") {
    			this.farewell();
    		}
    	}
    	
    	if(state == "transitionin") {
    		source = this.data.transitionIn;
    		target = this.data.onScreen;
    	} else if(state == "onscreen") {
    		source = this.data.onScreen;
    		target = this.data.onScreen;    		
    	}

    	
    },
    
    wakeUp : function() {
		// Bring object to the 3d scene
    	console.log("Waking up:" + this.data.id);
    	this.show.renderer.wakeUp(this.object);
		this.alive = true;    	
    },
    
    farewell : function() {
    	console.log("Object is gone:" + this.data.id);
		this.show.renderer.farewell(this.object);
		this.alive = false;
		return;
    }
    
} 

/**
 *
 * Photo
 *
 * @extends krusovice.showobjects.Base 
 */
krusovice.showobjects.FramedAndLabeledPhoto = function(cfg) {    
    $.extend(this, cfg);
} 

$.extend(krusovice.showobjects.FramedAndLabeledPhoto, krusovice.showobjects.Base);

$.extend(krusovice.showobjects.FramedAndLabeledPhoto.prototype, {
    
    /**
     * HTML image object of the source image 
     */
    image : null,
    
    /**
     * HTML <canvas> buffer containing resized and framed image with label text 
     */
    framed : null,
    
    prepare : function() {
        this.image = new Image();
        
        var self = this;
                
        function imageLoaded() {
            self.framed = createFramedImage(self.image);
            self.object = createRendererObject();
            self.prepareCallback();
        }   
        
        // Load image asynchroniously
        this.image.onload = imageLoaded;
        
        this.image.src = this.data.imageURL;                    
    },
 
    /**
     * Convert raw photo to a framed image with drop shadow
     * 
     * @param {Image} img Image object (loaded)
     */
    createFramedImage : function(img) {
                       
       // Drop shadow blur size in pixels
       // Shadow is same length to both X and Y dirs
       var shadowSize = 5;
       
       // Picture frame color
       var frameColor = "#FFFFFF";
               
       // Actual pixel data dimensions, not ones presented in DOM tree
       var nw = img.naturalWidth;
       var nh = img.naturalHeight;
    
       // horizontal and vertical frame border sizes
       var borderX = nw * 0.05;
       var borderY = nh * 0.05;
       
       // calculate the area we need for the final image
       var w = borderX * 2 + shadowSize * 2 + nw;
       var h = borderY * 2 + shadowSize * 2 + nh;
       
       console.log("Got dimensions:" + nw + " " + w + " " + nh + " " + h);
    
       // Create temporary <canvas> to work with, with expanded canvas (sic.) size     
       var buffer = document.createElement('canvas');
       
       buffer.width = w;
       buffer.height = h;
       
       // Remember, remember, YTI Turbo Pascal
       var context = buffer.getContext('2d');
       
       context.shadowOffsetX = 0;
       context.shadowOffsetY = 0;
       context.shadowBlur = shadowSize;
       context.shadowColor = "black";
    
       context.fillStyle = "#FFFFFF";
       context.fillRect(shadowSize, shadowSize, nw+borderX*2, nh+borderY*2);       
                    
       //Turn off the shadow
       context.shadowOffsetX = 0;
       context.shadowOffsetY = 0;
       context.shadowBlur = 0;
       context.shadowColor = "transparent";
       
       // Slap the imge in the frame
       context.drawImage(img, shadowSize+borderX, shadowSize+borderY);
       
       // We don't need to convert canvas back to imge as drawImage() accepts canvas as parameter
       // http://kaioa.com/node/103
       return buffer;
                
    },
    
    createRendererObject : function() {
    	return this.show.renderer.createQuad(this.framed);
    },
    
    xrender : function() {
                       
        console.log("Rendering " + this.state + " " + this.x + " " + this.y +  " " + this.w + " " + this.h + " " + this.rotation);
        
        if(this.state == "dead") {
            return;
        }
        
        // Image sizes are always relative to the canvas size
        
        // This is actually canvas object contained a frame buffer
        var img = this.image.framed;
        
        // Calculate aspect ration from the source material     
        var sw = img.width;
        var sh = img.height;        
        var aspect = sw/sh;
        
        // Create image dimensions relative to canvas size
        // so that height == 1 equals canvas height
        var nh = height;
        var nw = nh*aspect;
        
        var x = width/2 + width/2*this.x;
        var y = height/2 + height/2*this.y;
        
        var w=  nw*this.w;
        var h = nh*this.h;
        ctx.save();
        
        // Put bottom center at origin
        ctx.translate(x, y);
        // Rotate
        // Beware the next translations/positions are done along the rotated axis
        
        ctx.rotate(this.rotation);
        
        ctx.globalAlpha = this.opacity;
        
        // console.log("w:" + w + " h:" + h);
        
        ctx.drawImage(img, -nw/2, -nh/2, w, h);
        
        ctx.restore();
        
    }    
      
});

/**
 * Text with a monocolor background frame
 *
 * @extends krusovice.showobjects.Base
 */
krusovice.showobjects.TextFrame = function(cfg) {
    $.extend(this, cfg);
}

$.extend(krusovice.showobjects.TextFrame, krusovice.showobjects.Base);


$.extend(krusovice.showobjects.TextFrame.prototype, {
        
    /**
     * HTML <canvas> buffer containing resized and framed image with label text 
     */
    framed : null,
    
    prepare : function() {                
    },
 
    /**
     * Convert raw photo to a framed image with drop shadow
     * 
     * @param {Image} img Image object (loaded)
     */
    createFramedImage : function(img) {
    },
    
    render : function() {        
    }    
      
});

