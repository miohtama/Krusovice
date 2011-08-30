"use strict";

var krusovice = krusovice || {};

/**
 * @class krusovice.utils
 * @singleton
 *
 * Misc. utility methods used by various modules.
 */
krusovice.utils = {
				
	/* Z parameter to used to fake the object at infinite distance */
	farAwayZ : 999999999,

    /**
     * Return random value between -max ... max
     */
    splitrnd : function(max) {
    	max = max*2;
        return Math.random()*max - max/2;
    },
        
    /**
     * Pick a random element in an array
     * 
     *
     * http://stackoverflow.com/questions/5876757/how-do-i-pick-a-random-element-from-an-array/5876763#5876763
     * 
     * @param {Array} array List of source elements
     * 
     */
    pickRandomElement : function(array) {
    	return array[Math.floor(Math.random() * array.length)];
    },
    
    
    /**
     * Calculate the current ease value of a slideshow element.
     * 
     * Get the current animation and ease value of transition to the next animation.
     * 
     * element: Output element
     * 
     * timepoint: relative to the element start time 
     *
     * return 0...1 (on screen always 1).
     *
     */
    calculateElementEase : function(elem, timepoint) {
    				
    	var method, percents;
    
        if(timepoint < 0) {
            return {
                    animation : "notyet",
                    current : null,
                    next : null,                    
                    value : 0
            }
        }
        
        var i;
        
        // Loop through all the animations of this element
        // and see if clock is on any of their timelines 
        // If so calculate easing relative to the beginning of the animation

    	// The last element is always a stopper element and should be ignored in the calculations
        for(i=0; i<elem.animations.length-1; i++) {
        	
        	var anim = elem.animations[i];
        	if(timepoint < anim.duration) {
        		method = anim.easing;
        		percents=timepoint/anim.duration;	

        		return {
        			animation:anim.type,        			
   		         	value : krusovice.utils.ease(method, percents, 0, 1),
   		         	current : elem.animations[i],
   		         	next : elem.animations[i+1]
        		};        		
        	}
        	
        	timepoint -= anim.duration;
        }
	
    	// the element is past of its lifetime 
    	return {
    	        animation : "gone",
    	        value : 0,
    	        current  : elem[elem.length-1],
    	        next : null
    	}
    	
    },
    
    /**
     * Calculate ease value.
     * 
     * Prefix method name with minus if you want to do descending,
     * instead of ascending run.
     *
     * Don't expose raw jQuery stuff as we might want to get rid of it later.
     */
    ease : function(method, percents, begin, delta) {
    
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
    },
    
    /**
     * Calculate scalar
     * 
     * @param {Array} target The beginning of the animation state. Array of floats
	 *
     * @param {Array} source The end of the animation state. Array of floats
     * 
     * @param {Number} scale multiplier
     */
    calculateAnimation : function(target, source, scale) {
    	
    	if(!$.isArray(target)) {
    		throw  "Bad target";
    	}

    	if(!$.isArray(source)) {
    		throw  "Bad source";
    	}

    	
    	var result = new Array(source.length);
    	
    	for(var i=0; i<source.length; i++) {
    		result[i] = source[i] + (target[i] - source[i]) * scale;
    	}
    	
    	return result;
    },
    
    
    /**
     * Return arbitary HTML color in #ffeeaa format which is brighter than #888
     */
    pickRandomColor : function(alpha) {
    	
    	var r = Math.floor(Math.random()*127 + 128);
    	var g = Math.floor(Math.random()*127 + 128);
    	var b = Math.floor(Math.random()*127 + 128);
    	
    	    
    	if(alpha != undefined) {
    	    return "rgba(" + r + "," + b + "," + g + "," + alpha + ")";
    	} else {
            return "rgb(" + r + "," + b + "," + g + ")";	    
    	}
    	//return "#" + Math.floor(r).toString(16) + Math.floor(g).toString(16) + Math.floor(b).toString(16);
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
     * @method requestAnimationFrame
     * 
     * Use browser native animation refresh clock or fake one
     *
     * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
     *
     * @param {Function} callback
     *
     * @param {Object} element For which DOM element rendering we sync our animations (Usually <canvas>)
     *
     */
    requestAnimationFrame : (function(){
    	
    	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    	
    	// XXX: bug with Chrome 14 or so
    	if(is_chrome) {
    		 return function(callback, element) {
               window.setTimeout(callback, 1000 / 60);
             };
    	}
    	
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
    })(),
    
    
    /**
     * 
     * @param {THREE.Quaternion} q
     */
    grabQuaternionData : function(q) {
        return [q.x, q.y, q.z, q.w];
    }    
    
    
}