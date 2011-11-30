define("krusovice/utils", ["krusovice/thirdparty/jquery-bundle", "krusovice/core"], function($, krusovice) {
"use strict";

/*global window,console*/

var krusovice = krusovice || {};

/**
 * @class krusovice.utils
 * @singleton
 *
 * Misc. utility methods used by various modules.
 */
krusovice.utils = {
    isNumber : function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },

    /**
     * @return {Number} random value between -max ... max
     */
    splitrnd : function(max) {
        max = max*2;
        return Math.random()*max - max/2;
    },

    /**
     * @return {Number} random value between min ... max
     */
    rangernd : function(min, max) {
        return min + (max-min) * Math.random();
    },

    /**
     * @param {Object} item array of numbers or number.
     */
    randomize : function(value, variation) {
        var x, y;

        if(!$.isArray(value)) {
            x = [value];
        } else {
            x = value;
        }

        // Don't modify in place
        x = x.slice(0);


        if(!$.isArray(variation)) {
            y = [variation];
        } else {
            y = variation;
        }


        for(var i=0; i<x.length; i++) {

            if(!krusovice.utils.isNumber(y[i])) {
                throw "Bad variation data " + y + " for parameters " + x;
            }

            x[i] += krusovice.utils.splitrnd(y[i]);
        }

        if(x.length == 1) {
            return x[0];
        } else {
            return x;
        }
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
                    value : 0,
                    easing : null
            };
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

                if(!method) {
                    console.error(anim);
                    throw "Animation missing easing info";
                }

                percents=timepoint/anim.duration;

                if(elem.animations[i].reverse) {
                    percents = 1 - percents;
                }

                var value = krusovice.utils.ease(method, percents, 0, 1);

                if(elem.animations[i].reverse) {
                    value = 1 - value;
                }

                return {
                    animation:anim.type,
                        value : value,
                        current : elem.animations[i],
                        next : elem.animations[i+1],
                        easing : method
                };
            }

            timepoint -= anim.duration;
        }

        // the element is past of its lifetime
        return {
                animation : "gone",
                value : 0,
                current  : elem[elem.length-1],
                next : null,
                easing : null
        };

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

            if(begin === undefined) {
                    throw "Begin value is missing";
            }

            if(delta === undefined) {
                    throw "Delta value is missing";
            }

            if(percents === undefined) {
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
     * Calculate easing between two endpoints
     */
    easeRange : function(method, start, end, delta) {
        return this.ease(method, delta, start, (end-start));
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
            console.error(target);
            throw  "Bad target";
        }

        if(!$.isArray(source)) {
            console.error(source);
            throw  "Bad source array";
        }


        var result = [];

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

        if(alpha !== undefined) {
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
    requestAnimationFrame : function(callback, elem) {

      var func = window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };

       func(callback);
    },


    /**
     * Serialize quarternion
     *
     * @param {THREE.Quaternion} q
     */
    grabQuaternionData : function(q) {
        return [q.x, q.y, q.z, q.w];
    },



    /**
     *
     */
    sumScalarOrVector : function(a, b) {
        var c;

        if($.isArray(a)) {
            c = [];
            for(var i=0; i<c.length; i++) {
                c[i] = a[i] + b[i];
            }
        } else {
            c = a+b;
        }

        return c;
    },

  /**
     * Shrink view rectangle from width or height until it fits to source aspect ration.
     */
    shrinkToAspectRatio : function(width, height, aspectWidth, aspectHeight) {
        var ratio = aspectWidth / aspectHeight;

        return {
            width : width,
            height : width / ratio
        };
    },


     /**
      * http://stackoverflow.com/questions/1682495/jquery-resize-to-aspect-ratio/5654801#5654801
      */
     resizeAspectRatio : function(srcWidth, srcHeight, maxWidth, maxHeight) {

        /*
        var resizeWidth = srcWidth;
        var resizeHeight = srcHeight;

        var aspect = resizeWidth / resizeHeight;

        if (resizeWidth > maxWidth)
        {
            resizeWidth = maxWidth;
            resizeHeight = resizeWidth / aspect;
        }

        if (resizeHeight > maxHeight)
        {
            aspect = resizeWidth / resizeHeight;
            resizeHeight = maxHeight;
            resizeWidth = resizeHeight * aspect;
        }

        return { width : resizeWidth,
                 height : resizeHeight };*/


        var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

        //ratio = [srcWidth * ratio, srcHeight * ratio]

        //# Some codecs raquire w/h to be multiple of 4
        //ratio = [ratio[0] - ratio[0] % 4, ratio[1] - ratio[1] % 4]

        return { width:srcWidth*ratio, height:srcHeight*ratio };

     },

     calculateAspectRatioFit : function(srcWidth, srcHeight, maxWidth, maxHeight) {

        //return krusovice.utils.resizeAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight);

        /*
        if(srcWidth > srcHeight) {
            return { width : maxWidth, height : maxHeight * srcHeight/srcWidth };
        }  else {
            return { width : maxWidth * srcWidth/srcHeight, height : maxHeight };
        }*/

        var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

        return { width:srcWidth*ratio, height:srcHeight*ratio };
     },


    /**
     * Calculate field of view for new renderer sizes.
     *
     * http://widescreengamingforum.com/node/10767
     *
     * @param {Number} oldAR Old aspect ratio
     *
     * @param {Number} newAR New aspect ratio
     *
     * @param {Number} oldFOV Old field of view in degrees
     */
    calculateFOV : function(oldAR, newAR, oldFOV) {

        // Convert to radians
        oldFOV = 2*Math.PI * oldFOV / 360;

        var res = 2*Math.atan((newAR)/(oldAR) * Math.tan(oldFOV/2));

        return 360 * res / (Math.PI*2);
    },

    /**
     * Detect WebGL support
     */
    hasWebGL : function() {
        var canvas = document.createElement("canvas");
        try {
            var ctx = canvas.getContext("experimental-webgl");
            return true;
        } catch(e) {
            return false;
        }
    },


    /**
     * Draw a rounded rect on canvas using polygonial functions.
     *
     * http://stackoverflow.com/questions/4624614/canvas-drawing-filled-rounded-rect-with-linear-gradient
     */
    fillRoundedRect : function(ctx, left, top, width, height, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left + radius, top);
        ctx.lineTo(left + width - radius, top);
        //Top-right-corner:
        ctx.arc(left + width - radius, top + radius, radius, (Math.PI / 180) * 270, (Math.PI / 180) * 0, false);
        ctx.lineTo(left + width, top + height - radius);
        //Bottom-right-corner:
        ctx.arc(left + width - radius, top + height - radius, radius, (Math.PI / 180) * 0, (Math.PI / 180) * 90, false);
        ctx.lineTo(left + radius, top + height);
        //Bottom-left-corner:
        ctx.arc(left + radius, top + height - radius, radius, (Math.PI / 180) * 90, (Math.PI / 180) * 180, false);
        ctx.lineTo(left, top + radius);
        //Top-left-corner:
        ctx.arc(left + radius, top + radius, radius, (Math.PI / 180) * 180, (Math.PI / 180) * 270, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },


    /**
     * Calculate text shadow color based on incoming text color.
     *
     * Take inverse grayscale.
     */
    calculateShadowColor : function(cssColor) {
        var r = parseInt(cssColor.substring(1, 3), 16);
        var g = parseInt(cssColor.substring(3, 5), 16);
        var b = parseInt(cssColor.substring(5, 7), 16);

        var brightness = (r+g+b) / 3;

        var target = 255 - brightness;

        target = target.toString(16);

        var hex = "#" + target + target + target;

        return hex;

    },

    /**
     */
    getCSSColorAsThreeVector : function(cssColor) {
        var r = parseInt(cssColor.substring(1, 3), 16);
        var g = parseInt(cssColor.substring(3, 5), 16);
        var b = parseInt(cssColor.substring(5, 7), 16);

        return new THREE.Vector3(r/255, g/255, b/255);
    }


};


/**
 * Id -> objects mapper with categorization and other extra functionality.
 *
 * Each object must have **id** and **name** (human readable name) attributes.
 * Optionaly objects have **categories** array containing list of category ids they belong to.
 *
 * Object initialization method can be called when they are added into the registry.
 *
 * @singleton
 */
krusovice.utils.Registry = {

    /**
     * Mapping of effect id -> constructor function
     */
    data : {},

    initFunction : null,

    /**
     * Register a new object to this registry.
     */
    register : function(obj) {

      if(!obj.id) {
          throw "Need id";
      }

      if(!obj.name) {
          throw "Need an effect name";
      }

      this.data[obj.id] = obj;


      if(this.initFunction) {
        var func = obj[this.initFunction];
        if(!func) {
            console.error(obj);
            throw "Init function missing:" + this.initFunction;
        }
        var proxy = $.proxy(func, obj);
        proxy();
      }

    },

    /**
     * Get registered effect by its id
     */
    get : function(id) {
        return this.data[id];
    },

    /**
     * Get human readable effect list
     *
     * @param {String} transtion For which registered transition
     *
     * @return [ { id : name}, { id : name} ]
     */
    getVocabulary : function() {

        var data = [];

        $.each(this.data, function(id, obj) {
            data.push({id:obj.id, name:obj.name});
        });

        return data;
    },

    /**
     * @return All registered effects for certain transition type
     */
    getIds : function() {
        var data = this.getVocabulary();
        var d2 = [];
        data.forEach(function(e) {
            d2.push(e.id);
        });
        return d2;

    },


     /**
      * Get list of category id -> name pairs.
      *
      * This is for objects which have **categories** attribute set
      * to an array containing category ids.
      *
      */
     getCategoriesVocabulary : function() {

        var categories = [];
        var idsDone = [];

        $.each(this.data, function(id, obj) {

            var catIds = obj.categories;

            catIds.forEach(function(catId) {

                if($.inArray(catId, idsDone) == -1) {
                    var cat = {
                        id : catId,
                        name : catId
                    };
                    categories.push(cat);
                    idsDone.push(catId);
                }
            });

        });

        return categories;
    },

    /**
     * Query all objects by category.
     */
    getItemsInCategory : function(catId) {
        var songs = [];

        $.each(this.data, function(id, obj) {

            var catIds = obj.categories;

            if($.inArray(catId, catIds) >= 0) {
                songs.push(obj);
            }
        });

        return songs;
    }
};

return krusovice.utils;

});
