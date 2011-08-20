"use strict";

var krusovice = krusovice || {};

/**
 * Return random value between -max ... max
 */
krusovice.splitrnd = function (max) {
	max = max*2;
    return Math.random()*max - max/2;
}

/**
 * http://stackoverflow.com/questions/5876757/how-do-i-pick-a-random-element-from-an-array/5876763#5876763
 */
krusovice.pickRandomElement = function(array) {
	return array[Math.floor(Math.random() * array.length)];
}


/**
 * Calculate ease value of a slideshow element for slide in, slide out
 * 
 *
 * element: Output element
 * 
 * timepoint: relative to the element start time 
 *
 * return 0...1 (on screen always 1).
 *
 */
krusovice.calculateElementEase = function(elem, timepoint) {
				
	var method, percents;

        if(timepoint < 0) {
                return {
                        animation : "notyet",
                        value : 0
                }
        }
	
	// in 
	if(timepoint < elem.transitionIn.duration) {
		method=elem.transitionIn.easing;	
		percents=timepoint/elem.transitionIn.duration;	
		return {animation:"transitionin",
		         value : krusovice.ease(method, percents, 0, 1)
	        };
	}	
	
	
	// on screen
	timepoint -= elem.transitionIn.duration;
	
	if(timepoint < elem.onScreen.duration) {
                percents = timepoint / elem.onScreen.duration;
		method = elem.onScreen.easing;
		return {
		        animation : "onscreen",
		        value : krusovice.ease(method, percents, 0, 1)
		};
	}
	
	// out
	timepoint -= elem.onScreen.duration;
	if(timepoint < elem.transitionOut.duration) {
		method = elem.transitionOut.easing;
		percents = timepoint / elem.transitionOut.duration;
		return {
		        animation :"transitionout",
		        value : krusovice.ease(method, percents, 0, 1)
		};
	}	
		
	// gone already
	return {
	        animation : "gone",
	        value : 0	        
	}
	
}

/**
 * Calculate ease value.
 * 
 * Prefix method name with minus if you want to do descending,
 * instead of ascending run.
 *
 * Don't expose raw jQuery stuff as we might want to get rid of it later.
 */
krusovice.ease = function(method, percents, begin, delta) {

        var reverse;

        if(!method) {
                throw "Easing method is missing";
        }
        
        if(method[0] == '-') {
                method = method.substring(1);
                reverse = true;
        } else {
                reverse = false;
        }
        
        if(begin == undefined) {
                throw "Begin value is missing";             
        }

        if(delta == undefined) {
                throw "Delta value is missing";             
        }

        if(percents == undefined) {
                throw "Progress value is missing";             
        }
        
        var func = jQuery.easing[method];       
        
        if(!func) {
                console.error(func);
                throw "Unknown easing method:" + method;
        }
        
        if(reverse) {
                percents = 1 - percents;                
        }   
   
        if(method == "linear"||method == "swing"){
                // jQuery core easing methods
                return func(percents, 0, begin, delta);             
        } else {
                // http://gsgd.co.uk/sandbox/jquery/easing/
                // x, t: current time, b: begInnIng value, c: change In value, d: duration
               return func(null, percents, begin, delta, 1.0);             
        }
}


/**
 * Return arbitary HTML color in #ffeeaa format which is brighter than #888
 */
krusovice.pickRandomColor = function(alpha) {
	
	var r = Math.floor(Math.random()*127 + 128);
	var g = Math.floor(Math.random()*127 + 128);
	var b = Math.floor(Math.random()*127 + 128);
	
	    
	if(alpha != undefined) {
	    return "rgba(" + r + "," + b + "," + g + "," + alpha + ")";
	} else {
        return "rgb(" + r + "," + b + "," + g + ")";	    
	}
	//return "#" + Math.floor(r).toString(16) + Math.floor(g).toString(16) + Math.floor(b).toString(16);
}