define(['jquery_bundle', 'krusovice_base'], function($, krusovice) {
"use strict";

/**
 * Visualize show timeline for diagnosis
 *
 * @param {Object} config Configuration options
 *
 */
krusovice.TimelineVisualizer = function(config) {
	
	$.extend(this, config)
	
	if(!this.rhythmData) {
		this.rhythmData = null;
	}
	
    // length in pixels
    this.lineLength = this.duration / this.secondsPerPixel;
}

krusovice.TimelineVisualizer.prototype = {
    
    /**
     * @cfg {Object} plan Show plan data
     */
    plan : null,

    /**
     * @cfg {Object} rhythmData Rhythm data JSON from Echo Nest Remix API or null if no music 
     */    
    rhythmData : null,
    
    /** 
     * @cfg {Number} secondsPerPixel How long timeline is covered by single pixel on the timeline. Modify this to change the zoom level.
     */
    secondsPerPixel :  0.1,

    /** 
     * @cfg {Number} duration How long timeline we render
     */
    duration : 60,
    
    /** 
     * @cfg {Number} clockSpan How often render time hint labels on the timeline (pixels)
     */
    clockSpan : 100,
    
    /**
     * @cfg {Number} lineHeight One visualization line height in pixels
     */
    lineHeight : 80,
    
    
    /**
     * @cfg {Boolean} autoscroll Keep cursor visible all teh time 
     */
    autoscroll : true,
    
    /**
     * @type Number
     * No of rendered  beats (for testing purposes)
     */ 
    renderedBeats : 0,
    
    /**
     * @type Number
     * No of rendered show elements (for testing purposes)
     */ 
    renderedElements : 0,        
		
	formatClock : function(time) {
		var minutes = Math.floor(time/60);
		var seconds = time - minutes;			
		return minutes + ":" + Math.round(seconds, 2);		
	},
	
	/**
	 * Does this visualization have data for beats
	 */
	hasBeats : function() {
		return (this.rhythmData != null);
	},
	
	createLabelLine : function() {
		var line = $("<div class=timeline>");		
		return line;
	},	
	
	createLabel : function(parent, x, text) {
		var label = $("<div class=label></div>");	
		label.css("left", x + "px");
		label.text(text);
		parent.append(label);
		return label;
	},
	
	createDataLine : function() {
		var canvas = $("<canvas class=timeline width=" + this.lineLength + " height=" + this.lineHeight + ">");
		canvas.css("width", this.lineLength + "px");				
		var context = canvas.get(0).getContext("2d");
		return [canvas, context];
	},
	
	/**
	 * Show time hints for the timelint
	 */
	createClockLine : function () {
				
		var line = this.createLabelLine ();
		
		var i=0; 
		
		for(i=0; i<this.lineLength; i+=this.clockSpan) {
			var time = i * this.secondsPerPixel;
			var text = this.formatClock(time);			
			this.createLabel(line, i, text);
		}
		
		return line;
	},
	
	
	/**
	 * Show beat data on timeline
	 */
	createBeatLine : function() {

		console.log("Rendering beat line");
		
		var line = this.createDataLine();
		
		var canvas = line[0];
		var context = line[1];
		
		var i=0; 
		
		var clock = 0;
					
		context.strokeStyle = "#ff0000";
		context.lineWidth = 1;
		
		if(this.hasBeats()) {
		
			var beats = this.rhythmData.beats;
			var currentBeat = 0;
			
			//console.log("Rendering beats");
			
			// Render each pixel of the timeline image
			for(i=0; i<this.lineLength; i++) {
				 					
				 var currentClock = i*this.secondsPerPixel;
				 var nextClock =  currentClock + this.secondsPerPixel;
				
				 //console.log("Rendering clock span " + currentClock + "-" + nextClock);
				 //console.log(beats[currentBeat]);					 
				 
				 // max of all beat values during the clock span
				 var peakBeat = 0;
				 
				 var beatsHit = 0;
				 
				 // Note: beat data clocks are in milliseconds
				 
				 // Wind beat cursor to the start of current clock span
				 while(currentBeat < beats.length && beats[currentBeat].start/1000 < currentClock) {
					 currentBeat++;
				 }

				 
				 while(beats[currentBeat].start/1000 >= currentClock && beats[currentBeat].start/1000 < nextClock) {
					 peakBeat = Math.max(beats[currentBeat].confidence, peakBeat);
					 beatsHit++;			
					 currentBeat++;
				 }
				 
				 // console.log("Pixel " + i + " beat peak " + peakBeat + " hits:" + beatsHit + " current beat:" + currentBeat);
				 
				 // Beat line height in pixels
				 var height =  peakBeat * this.lineHeight;
				 
				 this.renderedBeats += 1;
				 
				 // canvas assumes 0.5 is in the middle of pixel
				 // hurray for subpixel mess
				 context.beginPath();
				 context.moveTo(i + 0.5, this.lineHeight - height);
				 context.lineTo(i + 0.5, this.lineHeight);
				 context.stroke();
			}
		}
		
		return canvas;

	},
	
	/**
	 * Create timeline which shows element ease in, on screen and ease out times
	 */
	createElementLine : function() {
		
		console.log("Rendering element line");
		
		var line = this.createDataLine();
		
		var canvas = line[0];
		var context = line[1];
		
		var i;
		
		context.lineWidth = 1;
		
		for(i=0; i<this.plan.length; i++) {
			var elem = this.plan[i];
						
			// Pick random color with 50% alpha for this element
			var acolor = krusovice.utils.pickRandomColor(128);
			context.strokeStyle = acolor;
			
			var startX = elem.wakeUpTime / this.secondsPerPixel;
						
			if(elem.animations.length != 4) {
				throw "This visualization code can handle animations only with three states: in, screen and out + gone state";
			}
			
			var totalDuration = elem.animations[0].duration + elem.animations[1].duration + elem.animations[2].duration;
						
			// span length in pixels
			var length = totalDuration / this.secondsPerPixel;
		
			console.log("Rendering element:" + elem + " x:" + startX + " duration:" + totalDuration + " length:" + length + " color:" + acolor);
							
			context.save();
			for(var l=0; l<length; l++) {
				var clock = l*this.secondsPerPixel;
				
				//console.log("Calculating ease for");
				//console.log(elem);
				
				var animation = krusovice.utils.calculateElementEase(elem, clock);
				var value;
				
				if(animation.animation == "onscreen") {
				   value = 1;
				} else if(animation.animation == "transitionout") {
				   value = 1 - animation.value;
				}  else {
				   value = animation.value;
				}
				
				if(value > 1) {
				        console.error("Elem:");
				        console.error(elem);
				        console.error("Clock:" + clock);
                                            console.error("Animation:");
				        console.error(animation);
				        throw new "Bad easing calculation yield too high value > 1";
				}
									
				var x = startX + l;
				var height = value * this.lineHeight;
				
				// console.log("Rendering " + animation.animation + " x:" + l + " value:" + value);
				
				if(height == undefined) {
				        throw "Height calculation failed for an animation";
				}
				
				context.beginPath();
				context.moveTo(x + 0.5, this.lineHeight - height);
				context.lineTo(x + 0.5, this.lineHeight);
				context.stroke();

			
			}
			context.restore();

			// Draw animation labels for this element
			context.save();
			context.font = "10px sans-serif"    
			context.strokeStyle = "#000000";
			x = startX;
			for(l=0; l<elem.animations.length-1; l++) {
				var anim = elem.animations[l];
				var label = anim.effectType.toUpperCase();
				// console.log("rendering anim x:" + x + "  label:" + label);
				context.fillText(label, x, 10);
				x += anim.duration / this.secondsPerPixel;
			}
			context.restore();
			
			this.renderedElements++;
			
		}
		
		return canvas;
	},
	
	/**
	 * Create position indicator line
	 */
	createPositionIndicator : function() {
		return $("<div class=position-indicator>");
	},
	
	render : function (elem) {
		
				
		var elem = $(elem);
		
		elem.addClass("timeline-visualization");
		
		elem.css("width", this.lineLength + "px");	
		
		if(elem.size() == 0) {
			throw "Render target cannot be empty for timeline visualizer";
		}
		
		var clock = this.createClockLine();
		var beats = this.createBeatLine();
		var elements = this.createElementLine();
		elem.append(clock);
		elem.append(beats);
		elem.append(elements);
		
		this.positionIndicator = this.createPositionIndicator();
		elem.append(this.positionIndicator)
		
		this.elem = elem;
					
	},
	
	
	/**
	 * Set position indicating cursor to a
	 */
	setPositionIndicator : function(time, visible) {
		
		if(visible) {
			this.positionIndicator.show();
		} else {
			this.positionIndicator.hide();				
		}
		
		//console.log("Position update:" + time);
		
		var x = time / this.secondsPerPixel;
		
		var parent = this.positionIndicator.parent().parent();
				
		var poffset = parent.offset();

		// Calcualte visible area
		var cx = parent.scrollLeft();
		var cx2 = parent.scrollLeft() + parent.width();

		// console.log("cx:" + cx + " cx2:" + cx2);
		
		// Do manual clip
		if(x < cx ||x >= cx2) {
			this.positionIndicator.hide();
			if(this.autoscroll) {
				this.doAutoscroll(x);
			}
			return;
		}
		
		x -= cx;


		// Draw marker as styled div over the parent elem
		this.positionIndicator.css({
			left : x + poffset.left,
			top : poffset.top,
			width : "1 px",
			height : this.elem.height() + "px"
		});
	},
	
	/**
	 * Put viewport to X position on the timeline
	 */
	doAutoscroll : function(x) {
		var parent = this.positionIndicator.parent().parent();
		parent.scrollLeft(x);
	}
		
};

/**
 *  Play song over timeline visualization to see if beats match song data 
 *  
 *  @param {String|HTMLAudio} src URL to a music or <audio> elem
 */
krusovice.TimelinePlayer = function(visualization, src) {
	
	this.visualization = visualization;
		
	if(typeof(src) == "string") {
	
		// http://dev.opera.com/articles/view/everything-you-need-to-know-about-html5-video-and-audio/
		this.audio = document.createElement("audio");
	
		this.audio.controls = true;
				
		this.audio.setAttribute('src', src);
		
	} else {
		this.audio = src;		
	}

	if(!this.audio) {
		throw "Who silenced the stereo?";
	}
	
	$(this.audio).bind("load", function() {
		console.log("Loaded:" + src);
	});

	$(this.audio).bind("Error", function() {
		console.log("Error:" + src);
	});

	
	$(this.audio).bind("timeupdate", $.proxy(this.onTimeUpdate, this));
	$(this.audio).bind("stop", $.proxy(this.stop, this));

}

krusovice.TimelinePlayer.prototype = {
	
	stop : function() {
		this.visualization.setPositionIndicator(0, false);
	},
		
	
	onTimeUpdate : function() {
		var ctime = this.audio.currentTime;
		this.visualization.setPositionIndicator(ctime, true);
	}
	
}

/**
 * @static
 * 
 * Display a simple pop-up during the loading of a show.
 */
krusovice.attachSimpleLoadingNote = function(show) {
    
    var note = $("<div class='loading-note'>");
    
    note.css({
        position : "absolute",
        margin : "5px",
        padding : "5px",
        background : "white",
        color : "black",
        border : "2px solid black",
        width : "250px",
        height : "50px"
    });
    
    
    $(show).bind("loadstart", function() {
        var container = $(show.elem).parent();                
        container.append(note);
        
        note.offset({
        	top : container.offset().top + 10,
        	left : container.offset().left + 10
        });
        
    });

    $(show).bind("loadprogress", function(progress) {
    	if(krusovice.utils.isNumber(progress)) {
	        var number = Math.round(progress, 2);
	        note.text("Loading " + number + "%");
    	}
    }); 

    $(show).bind("loaderror", function(event, msg) {
        note.text(msg);
    }); 

    
    $(show).bind("loadend", function() {
        note.remove();
    }); 
    

}
});
