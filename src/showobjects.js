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
    $.extend(this, cfg);
}

krusovice.showobjects.Base.prototype = {    
    
    /**
     * @cfg {krusovice.Show} Rendering backend used to create artsy
     */
    renderer : null,

    /**
     * @cfg {krusovice.TimelineElement} data TimelineElement of play parameters  
     */    
    data : null,
    
    
    /**
     * Reference to 3d rendering backend object
     */
    object : null,
    
    /**
     * @cfg {Function} Function which is called when async prepare() is ready.
     *
     * prepareCallback(success, msg). If success is false delegate the error message.
     */
    preparedCallback : null,

    /**
     * Internal flag telling whether this object has been already woken up 
     */
    active : false,
    
    init : function() {
        
        // Initialize animation variables
        this.x = this.y = this.w = this.h = 0;
        
        // How many degrees this image has been rotated
        this.rotation = 0;
        
        this.opacity = 1;        
    },

    /**
     * Load all related media resources.
     * 
     * Note: animate() can be called before prepare in dummy unit tests runs. 
     * Please set-up all state variables in init().
     */
    prepare : function() {        

    },
    
    
    play : function() {        
    },
    
    /**
     * Render the current object.
     * 
     * XXX: Three.js maintains scene graph and will render objects automatically
     */
    render : function() {
    	
    	// XXX: 
    	//console.log("render");
    	//this.renderer.renderObject(this.object);
    },
    
    /**
     * Set the object to the animation state matched by the clock.
     * 
     * We cache the state whether we have been drawing in prior frames, 
     * as this way we can limit the number of 3D objects on the scene.
     * 
     * @return Current animation state name
     */
    animate : function(clock) {
    	
    	var state, easing;
    	    	
    	var relativeClock = clock - this.data.wakeUpTime;
    	
    	console.log("Clock:" + clock + " relative clock:" + relativeClock);
    		
    	// Determine the state of this animation
    	var statedata = krusovice.utils.calculateElementEase(this.data, relativeClock);
    	
    	var animation = statedata.animation;
    	
    	// Don't animate yet - we are waiting for our turn
    	if(animation == "notyet") {
    		return statedata;
    	}
    	    	
    	if(animation != "notyet" && animation != "gone") {
    		if(!this.alive) {
    			this.wakeUp();
    		}
    	}

		if(animation == "gone") {
	    	// Time to die
	    	if(this.alive) {
				this.farewell();
	    	}

			return statedata;
		}

    	
    	if(!this.object) {
    		// XXX: should not happen - raise exception here
    		// when code is more complete
    		return statedata;
    	}
    	
    	// Calculate animation parameters
    	var source = statedata.current;
    	var target = statedata.next;
    	
    	if(!source) {
    		throw "Source animation state missing:" + animation;
    	}

    	if(!target) {
    		throw "Target animation state missing:" + animation;;
    	}    	
    	
    	if(!krusovice.utils.isNumber(statedata.value)) {
    		console.error(statedata);
    		console.error(animation);
    		console.error(source);
    		console.error(target);
    		throw "Failed to calculate animation step";
    	}
    	
    	this.animateEffect(target, source, statedata.value);
    	
    	var mesh = this.object;
		return statedata;
    	
    },
    
    /**
     * Calculate animation parameters for current frame and apply them on the 3D object.
     * 
     *  @param {krusovice.TimelineAnimation} target
     *  
     *  @param {krusovice.TimelineAnimation} source
     *  
     *  @param {Number} 0...1 how far the animation has progressed
     */
    animateEffect : function(target, source, value) {                
        var effectId = source.effectType;
        var effect = krusovice.effects.Manager.get(effectId);
        
        if(!effect) {
            console.error("Animation");
            console.error(source);
            throw "Animation had unknown effect:" + effectId;
        }
        
        effect.animate(this.object, target, source, value);
    },
    
    wakeUp : function() {
		// Bring object to the 3d scene
    	console.log("Waking up:" + this.data.id);
    	if(this.object) {
	    	this.renderer.wakeUp(this.object);
    	}
		this.alive = true;    	
    },
    
    farewell : function() {
    	console.log("Object is gone:" + this.data.id);
    	if(this.object) {
	    	this.renderer.farewell(this.object);
    	}
		this.alive = false;

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
     */
    prepare : function() {

        console.log("Prepare photo");

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
        console.log("Loading image image obj:" + this.data.image + " URL:" + this.data.imageURL);
	                    
        function imageLoaded() {
            self.framed = self.createFramedImage(self.image);
            self.object = self.createRendererObject();
            console.log("Got obj");
            console.log(self.object);
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
    createFramedImage : function(img) {
                       
       // Drop shadow blur size in pixels
       // Shadow is same length to both X and Y dirs
       var shadowSize = 5;
       
       // Picture frame color
       var frameColor = "#FFFFFF";
               
       // Actual pixel data dimensions, not ones presented in DOM tree
       var nw = img.naturalWidth || img.width;
       var nh = img.naturalHeight || img.height;
       
       if(!nw || !nh) {
    	   throw "Unknown image source for framing";
       }
    
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
    	return this.renderer.createQuad(this.framed);
    },
    
      
});

/**
 * Text with a monocolor background frame
 *
 * @extends krusovice.showobjects.Base
 */
krusovice.showobjects.TextFrame = function(cfg) {
    $.extend(this, cfg);
}

$.extend(krusovice.showobjects.TextFrame.prototype, krusovice.showobjects.Base.prototype);


$.extend(krusovice.showobjects.TextFrame.prototype, {
        
    /**
     * HTML <canvas> buffer containing resized and framed image with label text 
     */
    framed : null,
    
    prepare : function() { 
        
        console.log("Prepare TextFrame");
        // Nothing to load
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
    
    render : function() {        
    }    
      
});

