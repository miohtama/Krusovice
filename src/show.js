"use strict";

var krusovice = krusovice || {};

/**
 * HTML5 canvas photo show which is too cool to kick llama's ass
 *
 * - Construct show based on timeline input and show settings (background, etc).
 *   These are given in the configuration.
 *
 * - Bind Show object to {@link krusovice.Show#bindToAudio HTML5 audio playback} or if you have no music
 *   use real-time object. You need to have something calling onClock() method or animation won't
 *   go anywhere.
 *
 * - Call {@link krusovice.Show#prepare prepare()} method to start async media loading
 *
 * - {@link krusovice.Show#play play()} will be called automatically by associated clock source
 *
 * @param {Object} cfg Configuration object 
 */
krusovice.Show = function(cfg) {
    $.extend(this, cfg);
    
    if(!this.loader) {
        this.loader = new krusovice.Loader();        
    }
    
}

krusovice.Show.prototype = {

    /**
     * @cfg {Object} elem jQuery wrapped DOM element which will contain the show. 
     * 
     * Can be null for testing (rendering is 100% hidden) 
     */
    elem : null,

    /**
     * @cfg {Array} timeline Timeline of {krusovice.TimelineElement} elements 
     */
    timeline : null,

    /**
     * @cfg {Number} width Show width in pixels
     */
    width : 512,

    /**
     * @cfg {Number} height Show height in pixels
     */
    height : 288,

    /**
     * @cfg {Boolean} controls Draw start/stop or not
     */
    controls : false,

    /**
     * @cfg {Number} musicStartTime Song position where the playback stars (seconds)
     */
    musicStartTime : 0,
    
    
    /**
     * Show design object
     */
    design : null,
        
    /**
     * @cfg {String} songURL URL to the background music 
     */    
    songURL : null,   

    /**
     * @cfg {Object} rhytmData Echo Nest API data for rhytm used to animate background effects 
     */        
    rhytmData : null,
    
    /**
     * Set to true when all necessary data is loaded to start the playback
     */
    loaded : false,
    
    /**
     * Is play currently in progress
     */
    playing : false,
    

    /**
     * @type Number
     *
     * How many frames we have rendered
     */
    currentFrame : 0,
    
    
    /**
     * List of animated objects in this show
     */
    animatedObjects : null,
    
    /**
     * @cfg {Object} Background renderer
     */
    background : null,
        
    /**
     * <canvas> used as the main output element
     */
    canvas : null,
    
    /**
     * 2D context of the <canvas>
     */
    ctx : null,
    
    /**
     * Pseudo 3d backend to render animated show objects
     */
    renderer : null,    
    
    events :[
        /**
         * @event 
         *
         * Fired when the show loading starts in prepare()
         */
        "loadstart",
    
        /**
         * @event 
         *
         * Fired when the show loading is going on
         *
         * @param {Number} progress 0...1 how done we are 
         */
        "loadprogress",
    
        /**
         * @event 
         *
         * Fired when loading is done and we are ready to play
         *
         */
        "loadend",
        
        /**
         * @event 
         *
         * Fired when all resources could not be loaded
         *
         */
        "loaderror",
        
    ],
    
    /**
     * krusovice.Loader used to book keeping of async media loading progress 
     */
    loader : null,
    
    /**
     * @type Number
     *
     * Time in seconds since the starting of the animation.
     *
     * Set by onClock() callback as we usually sync the animation to external audio or video source.
     */
    clock : 0,
    
    /**
     * When the clock was last time updated - as <audio> time update events post too slowly,
     * we need to estimate the audio clock during the timeupdate calls.
     */
    clockUpdated : 0,
    
    /**
     * @type Boolean
     *
     * Is this real-time playback or not
     *
     * Whether or not the show player should try to estimate the clock between onClock() calls.
     */
    realtime : true,
  
  
  	/**
  	 * Control individual render layers.
  	 *
  	 * Most useful for debugging.
  	 */
  	renderFlags : {
  		background : true,
  		scene : true
  	},
            
    /**
     * Start async media loading and preparation.
     *
     * Will set loaded flag and fire loaded event when ready.
     * 
     */    
    prepare : function() {      
        this.prepareCanvas();
		this.prepareRenderer();      
		this.prepareTimeline();
        this.prepareBackground();		
        this.loadResources();
    },

    /**
     * Free are resources associated with this show.
     *
     * After this call this Show object is no longer useable.
     */
    release : function() {
        //this.canvas = null;
        //this.animatedObjects = null;        
    },

    /**
     * ASync waiting loop until are resources are loaded
     */
    loadResources : function() {
                       
        var $this = $(this);
        var self = this;
                                   
        function loadcb(progress) {
            $this.trigger("loadprogress", progress);  
            
            if(progress >= 1) {
                self.loaded = true;
                console.log("Show resources loaded");
                $this.trigger("loadend");
            }
        }   
        
        
        function loaderror(msg) {
            console.log("Triggering loaderror");
            $this.trigger("loaderror", [msg]);
        }
        
        this.loader.callback = loadcb;
        this.loader.errorCallback = loaderror;

        console.log("Starting loading, total objects " + this.loader.totalElementsToLoad);
                 
        $this.trigger("loadstart");        

        function cb(success, errorMessage) {
            if(success) {
                self.loader.mark("animatedobject", 1);
            } else {
                console.log("Got error:" + errorMessage);
                self.loader.setError(errorMessage);
            }
        }
        
        
        for(var i=0; i<this.animatedObjects.length; i++) {
            console.log("Preparing anim object:" + i);
            var e = this.animatedObjects[i];
            e.prepareCallback = cb;
            e.prepare(this.width, this.height);             
        }                               
        
    },
    
    /**
     * Create animated objects based on timeline input data
     */    
    prepareTimeline : function() {        
        
        var self = this;
        var timeline;
        
        this.animatedObjects = new Array();
            
        // XXX: fix all to use show.timeline as input         
        if(this.design) {
        	timeline = this.design.timeline;	
        } else {
        	timeline = this.timeline;
        }
		        
                        
        timeline.forEach(function(e) {            
            var obj = self.createAnimatedObject(e);
            console.log("Created animated object " + obj);
            self.animatedObjects.push(obj);                 
            self.loader.add("animatedobject", 1);
        });
        
        if(timeline.length != this.animatedObjects.length) {
            console.error("arg");
            throw "Somehow failed";
        }
    },
    
    /**
     * Create a <canvas> and place it in the parent container
     */
    prepareCanvas : function() {
                
        var $canvas = $("<canvas width=" + this.width + " height=" + this.height + ">");
        
        if(this.elem !== null) {
            this.elem.append($canvas);
        }        
        this.canvas = $canvas.get(0);
        this.ctx = this.canvas.getContext("2d");
        
    },    
    
    /**
     * Build background data and add all medias to the loader
     */
    prepareBackground : function() {
        var duration = this.getDuration();
        
        var background;
        
        if(!this.background) {
	        // Use default white background
        	background = {
        		type : "plain",
        		color : "#ffffff"
        	}        	
        } else {
        	background = this.background;
        }
                
        var timeline = this.timeline;
        
        this.background = krusovice.backgrounds.createBackground(background.type,
                                                                 duration,
                                                                 timeline,
                                                                 this.rhytmData, 
                                                                 background);  
        this.background.prepare(this.loader, this.width, this.height);
    },
    
    /**
     * Create 3d renderer backend
     */
    prepareRenderer : function() {

    	// XXX: hardcoded for THREE.js now
    	this.renderer = new krusovice.renderers.Three({
    		width : this.width,
    		height : this.height,
    		elem : this.elem
    	});
    	
    	this.renderer.setup();
    },
    
    /**
     * Factory of matching input data to actual animated objects.
     * 
     * Renderer must be set up in this point
     */
    createAnimatedObject : function(timelineInput) {
        
        var cfg = {
            renderer : this.renderer,
            data : timelineInput
        };
        
        if(timelineInput.type == "image") {
        	var obj = new krusovice.showobjects.FramedAndLabeledPhoto(cfg);
        	return obj;     
        } else if(timelineInput.type == "text") {
            return new krusovice.showobjects.TextFrame(cfg);            
        } else {
            throw "Unknown timeline input type:" + timelineInput.type;
        }
    },
        
    /**
     * Start animation frame requesting loop.
     *
     * Show must be prepared and loaded in this point.
     *
     * You must have something feeding clock to onClock() or the animation won't move anywhere.
     *
     */
    play : function() {        
        
        console.log("Show playing start");
        
        if(this.playing) {
            return;
        }
        
        this.playing = true;
        
        this.loopAnimation();
    },
    
    /**
     * Stop playing the show
     */
    stop : function() {      
        this.playing = false;  
    },
    
    
    /**
     * @return {Number} How many seconds this show is long
     */
    getDuration : function() {
    	var lastElem = this.animatedObjects[this.animatedObjects.length - 1];
    	
    	// TimelineElement of last animated object
    	var tl = lastElem.data;
    	
    	var duration = 0;
    	
    	for(var i=0; i<tl.animations.length-1; i++) {
    		duration += tl.animations[i].duration;
    	}
    	
    	var stopPoint = tl.wakeUpTime + duration;

    	return stopPoint;
    },
    
    /**
     * Check if we have played all objects.
     * 
     * Compare current object against the timeline length.
     * 
     * @return {Boolean} true if this show has nothing more to show
     */
    isFinished : function() {
    	var stopPoint = this.getDuration();
    	return this.clock > stopPoint;
    },
    
    /**
     * Main rendering loop.
     *
     * Redraws <canvas> using the frame rate given by the browser
     * until this.playing flag is unset by stop().
     * 
     */
    loopAnimation : function() {
        if(this.playing) {
            this.render();                   
            krusovice.utils.requestAnimationFrame($.proxy(this.loopAnimation, this), this.canvas);
        }         
    },
    
    /**
     * Request rendering.
     * 
     * Can be manually called after onClock(). Automatically called when playing.
     */
    requestAnimationFrame : function() {
        krusovice.utils.requestAnimationFrame($.proxy(this.render, this), this.canvas);    	
    },
    
    render : function() {                
                       
        this.currentFrame += 1;
        
        var renderClock = this.getEstimatedClock();
        
        this.renderAnimateObjects(renderClock);
        
        //console.log("Slicing frame " + this.currentFrame + " clock:" + renderClock);
        this.renderBackground(renderClock);       
        this.renderScene(renderClock);
        this.renderFrameLabel(renderClock); 
    },
    
    /**
     * Render the video background buffer
     */
    renderBackground : function(renderClock) {
        
        if(!this.renderFlags.background) {
        	return;
        }
        
        if(this.background) {
            this.background.render(this.ctx, renderClock);            
        }

    },
    
    renderScene : function() {
    	
        if(!this.renderFlags.scene) {
        	return;
        }
    	
    	this.renderer.render(this.ctx);
    },
    
    /**
     * Debugging helper printing data of this 
     *
     *
     * @param {Number} renderClock The rendering clock time that should be used for this frame
     */
    renderFrameLabel : function(renderClock) {
        // http://diveintohtml5.org/canvas.html#text
        var ctx = this.ctx;
        // round to 3 decimals
        
        function round(x) {
        	return Math.round(x*1000)/1000;
        }
        
        
        var clock = round(renderClock);
        var external = round(this.clock);
        var sync = round(this.clockUpdated);

        ctx.save()
        ctx.font = "bold 12px sans-serif"       
        ctx.fillText("Rendering frame " + this.currentFrame + " render clock:" + clock + " external clock:" + external + " last sync:" + sync, 20, 20);
        ctx.restore();
    },
    
    /**
     * Render the show animated objects.
     *
     * @param {Number} renderClock The rendering clock time that should be used for this frame
     */
    renderAnimateObjects : function(renderClock) {
       
    	this.animatedObjects.forEach(function(obj) {
        	var state = obj.animate(renderClock);        	
        	obj.render();
        	// console.log("Clock " + renderClock + " animated object " + e.data.id + " state " + state);
        });
    },
    
    /**
     * Receive clock signal from external source
     *
     * @param {Number} clock Clock signal in seconds
     */
    onClock : function(clock) {        
        this.clock = clock;
        if(this.realtime && this.playing) {
            this.clockUpdated = (new Date().getTime()) / 1000;
        }
    },
    
    /**
     * Calculate the rendering clock from the last clock timestamp.
     *
     * If we are in real-time mode estimate the current clock value between time update calls.
     */
    getEstimatedClock : function() {
        var now = (new Date().getTime()) / 1000;
        
        if(this.realtime && this.playing) {
        	// We can calculate estimation only if we are in continuous playback mode
        	// and not e.g. on seek
            return this.clock + (now - this.clockUpdated);
        } else {
            return this.clock;
        }
    },

    /**
     * We are forcing in new clock signal and all real-time clock calculations should be reseted.
     */
    resetClock : function() {
    	this.clockUpdated = null;
    },

    
    
    /**
     * Bind this show to HTML5 <audio> player.
     *
     * The show will listen to events from the audio object and 
     * will use its clock to adjust own playback.
     * 
     * @param {HTML5Audio} audio HTML5 audio element / player
     *
     * @param loadAsResource Add MP3 file to the show resources loading chain
     */
    bindToAudio : function(audio, loadAsResource) {        	
    	
    	if(!audio) {
    		throw "You should give that audio element";
    	}
        
        function onTimeUpdate() {
        	        	
        	//console.log("timeupdate");
        	
            var ctime = audio.currentTime;
            ctime -= this.musicStartTime;
            this.onClock(ctime);
            
            // Send in render event if we are not in playback mode
            // to visualize the current position on audio
            if(!this.playing) {
            	console.log("forcing rendering");
            	this.resetClock();
            	this.requestAnimationFrame();
            }              
        } 
        
        // 
        $(audio).bind("timeupdate", $.proxy(onTimeUpdate, this));
        $(audio).bind("play", $.proxy(this.play, this));
        $(audio).bind("pause", $.proxy(this.stop, this));

        
        // User has moved time slider in Audio
        /*
        function onSeekEnd() {
            var ctime = audio.currentTime;
            ctime -= this.musicStartTime;
            this.onClock(ctime);
            
            console.log("seekend");
            
          
        }                
        $(audio).bind("seekend", $.proxy(onSeekEnd, this));
        */
        

        
        /*
         * HAVE_NOTHING (0) No data available

            HAVE_METADATA (1) Duration and dimensions are available
            
            HAVE_CURRENT_DATA (2) Data for the current position is available
            
            HAVE_FUTURE_DATA (3) Data for the current and future position is available, so playback could start
            
            HAVE_ENOUGH_DATA (4) Enough data to play the whole video is available
         */
        
        var self = this;
        // http://www.chipwreck.de/blog/2010/03/01/html-5-video-dom-attributes-and-events/
        if(loadAsResource) {
	        if(audio.readyState < 4) {
	            // 
	            $(audio).bind("canplaythrough", function() {
	                self.loader.mark("audio", 1);
	            });
	            
	            this.loader.add("audio", 1);            
	        }
	    }
    },
    
    
    /**
     * 2D canvas context used to record the video.
     */
    getCaptureCanvasContext : function() {
        return this.ctx;
    }
           
}
