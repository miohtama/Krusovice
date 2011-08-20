'use strict';

var krusovice = krusovice || {};

/**
 * Create timelines based on sample input
 */
krusovice.Timeliner = function(input) {
	
	this.showElements = input.showElements;
	this.settings = input.settings;
	
	this.rhytmData = input.rhytmData;

	if(!this.showElements) {
		throw new TypeError("you must give list of elements to show");
	}
	
	if(!jQuery.isArray(this.showElements)) {
		throw new TypeError("Array plz");
	}
 	
	this.transitionInEffects = input.transitionInEffects; // list of available transition effect ids
	this.transitionOutEffects = input.transitionOutEffects; // list of available transition effect ids
	this.onScreenEffects = input.onScreenEffects;	
	
}

/**
 * Shortcut to create a presentation easily.
 */
krusovice.Timeliner.createSimpleTimeliner = function(elements, rhytmData) {
	var input = {
        	showElements : elements,
        	rhytmData : rhytmData,
        	settings : krusovice.Timeliner.defaultSettings,
        	transitionInEffects : ["fadein"],
        	transitionOutEffects : ["fadeout"],
        	onScreenEffects: ["slightMove"]
	};
	
	return new krusovice.Timeliner(input);
};

krusovice.Timeliner.defaultSettings = {
        				
    // Time in seconds where song starts playing
    musicStartTime : 0,
	
    transitionIn : {
	    type : "random",
	    duration : 2.0,                                                
	},
	
	transitionOut : {
	    type : "random",
	    duration : 2.0,          
	    clockSkip : 0.0 // How many seconds we adjust the next object coming to the screen
	},   
	
	onScreen : {
	    type : "slightMove",
	    duration : 2.0,
	}                          
}

krusovice.Timeliner.prototype = {
		
	/**
	 * Create rhytm analysis interface for laoded rhytm data.
	 * 
	 * Optionally we can use null data and no beats.
	 */
	createMusicAnalysis : function() {
		if(this.rhytmData) {
			return krusovice.RhytmAnalysis(this.rhytmData);
		} else {
			return null;
		}
	},
	
	/**
	 * Be like a MasterMind. 
	 * 
	 * @return
	 */
	createPlan : function() {
				
		this.analysis = this.createMusicAnalysis(this.rhytmData);
		
		var plan = [];
		
		var clock = 0.0;
		
		var transitionIn = this.settings.transitionIn; 
		var transitionOut = this.settings.transitionOut;
		var onScreen = this.settings.onScreen;
				
		var musicStartTime = this.settings.musicStartTime;
					
		for(var i=0; i<this.showElements.length; i++) {
			
			var elem = this.showElements[i];
			
			console.log("Element #" + i + " current clock:" + clock);
			
			// Construct show element 
			var out = {};
			
			// Populate it with default values from input
			this.copyAttrs(out, elem, ["id", "type", "text", "label"]);
			
			if(!elem.duration) {
				throw "Element duration missing";
			}
			
			// Place element on the timeine based on our current clock
			this.timeElement(out, elem, clock, elem.duration);		
								
			// Setup element effects
			this.createAnimationSettings(out.transitionIn, "transitionin", this.settings.transitionIn.type);					
			this.createAnimationSettings(out.transitionOut, "transitionout", this.settings.transitionOut.type);								
			this.createAnimationSettings(out.onScreen, "onscreen", this.settings.onScreen.type);			
								
			// Adjance clock to the start of the next show item based
			
			console.log("Got out");
			console.log(out);
			
			// on the duration of this show item
			clock += out.transitionIn.duration + 
			         out.transitionOut.duration + 
			         out.onScreen.duration + transitionOut.clockSkip;
			
			if(!clock) {
				console.error("Latest input element");
				console.error(elem)
				throw "Bad presentation input element";
			}
		
			plan.push(out);
		}		
		
		return plan;
	},
	
	/**
	 * @param out Show element
	 */
	timeElement : function(out, source, clock, onScreenDuration) {
				
		var transitionIn = this.settings.transitionIn; 
		var transitionOut = this.settings.transitionOut;
		var onScreen = this.settings.onScreen;
		
		var musicStartTime = this.settings.musicStartTime;
		
		console.log("Input data: " + clock + " start time:" + musicStartTime +  " in duration:" + transitionIn.duration + " on screen:" + onScreen.duration);
		
		// on screen effect starts time
		var hitsScreen = this.findNextBeat(clock + musicStartTime + transitionIn.duration) - musicStartTime;			

		// on screen effect stops time
		var hitsOut = this.findNextBeat(hitsScreen + musicStartTime + onScreenDuration) - musicStartTime;	
		
		if(!hitsScreen || hitsScreen < 0) {
			throw "Failed to calculate hits to screen time";
		}

		if(!hitsOut ||hitsOut <  0) {
			throw "Failed to calculate leaves the screen time";
		}
		
		out.wakeUpTime = hitsScreen - transitionIn.duration;
		
		out.transitionIn = {
				duration : hitsScreen - clock					
		};
		
		out.onScreen = {
				duration : hitsOut - hitsScreen
		};		
		
		out.transitionOut = {
				duration : transitionOut.duration					
		};		
	},
	
	/**
	 * Shallow copy named attributes of an object
	 */
	copyAttrs : function(target, source, attr) {
		$.each(source, function(name, value) {
			target[name] = value;
		});
	},
	
	/**
	 * Create one of animation blocks in the outgoing presentation data.
	 */
	createAnimationSettings : function(effect, animation, type, duration) {
		
		effect.type = type;
		
		if(type == "random") {
			if(animation == "screen") {
				effect.type = krusovice.pickRandomElement(this.onScreenEffects);
			} else if(animation == "transitionout") {
				effect.type = krusovice.pickRandomElement(this.transitionOutEffects);
			} else {
				effect.type = krusovice.pickRandomElement(this.transitionInEffects);
			}
		}
		
		if(!effect.type) {
			throw "Effect type pick failed";		
		}
		
		if(animation == "transitionin") {
			effect.easing = "easeInSine";
		} else if(animation == "transitionout") {
			effect.easing = "-linear";
		} else {
			effect.easing = "linear";
		}		
		
		effect.positions = null;
		effect.rotations = null;
		
		return effect;
	},
		
	/**
	 * 
	 * 
	 * @param clock Clock in song time
	 * 
	 * @return Next beat in song time or clock if no data avail
	 */
	findNextBeat : function(clock, window) {
		
		if(!this.analysis) {
			return clock;
		}
		
		if(!window) {
			window = 1500;
		}
		
		var beat = this.analysis.findNextBeat(clock);
		
		if(beat.start - clock > window) {
			return null;
		}
		
		return beat;
	},	
	

	
}

