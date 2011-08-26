"use strict";

var krusovice = krusovice || {};

krusovice.effects = krusovice.effects || {};

$.extend(krusovice.effects, {
   
 /**
  * Z distance from the camera for normal image viewing.
  *
  * If plane has this distance and has width of 1 and height of 1
  * it will fill the screen exactly.
  *
  */
 CAMERA_Z : 1,
 
 
 /**
  * Used when zooming out of infinity.
  */
 FAR_Z : 100000,
    
});

/**
 * Effect manager is responsible for registering animation effects.
 *
 * The managed data is used by the user interface and the internal
 * factory methods to map serialized effect ids to the actual animation code.
 *
 * @singleton
 */
krusovice.effects.Manager = {
    
    /**
     * Mapping of effect id -> constructor function  
     */
    data : {},
        
    register : function(effect) {

      if(!effect.id) {
          throw "Need id";
      }

      if(!effect.name) {
          throw "Need an effect name";
      }  
      
      this.data[effect.id] = effect;
      
    },
    
    /**
     * Get human readable effect list
     *
     * @param {Boolean} all Set to true to return base classes too 
     *
     * @return [ { id : name}, { id : name} ] 
     */
    getVocabulary : function(all) {
        
        var data = [];
        
        
        $.each(this.data, function(id, effect) {
        
            if(all || effect.available) {
                data.push({id:effect.id, name:effect.name});                
            }       
        });
        
        return data;
    }    
};

/**
 * Effects base class.
 *
 * All effects are singleton instances
 *
 * @singleton
 */
krusovice.effects.Base = {
    
    /**
     * @type String
     
     * Serialization id of the effect
     */
    id : null,
        
    /**
     * @type String
     *
     * The human readable name of the effect
     */
    name : null,
    
    /**
     * @type Boolean
     *
     * Whether or not the end user can pick this effect from the list. Set
     * false for the base classes.
     */
    available : false,
    
    
    /**
     * @type Array
     *
     * Animation types for which this effect is available.
     */
    categories : ["transitionid", "transitionout", "onscreen"],
    
    /**
     * @type Object
     *
     * Default values for various source values.
     *
     * May be computed in prepareAnimationParameters
     */
    source : {
        
    },


    /**
     * Random ranges for each parameter
     */
    variation : {
        
    },

    /**
     * @type Object
     *
     * Default values for various target values,
     * 
     * May be computed in prepareAnimationParameters
     */    
    target : {
        
    },    
    
    animate : function() {        
    },
    
    render : function() {        
    },
    
    
    /**
     * Read effect parameters. 
     *
     * First try animation level parameter, then  
     * show level parameter and finally fall back 
     * to the value defined in the effect class itself.
     *
     */
    getParameter : function(name, slot, showConfig, animationConfig) {
        
        var value;
        
        if(animationConfig[slot]) {
            value = animationConfig[value];
            if(value !== undefined) {
                return value;
            }
        }
        
        if(showConfig[slot]) {
            value = showConfig[slot][value];            
            if(value !== undefined) {
                return value;
            }
        }

        value = this[value];            
        if(value !== undefined) {
            return value;
        }

        throw "Unknown effect parameter:" + name;        
    },
    
    initParameter : function(name, config, source) {
        this[name] = this.getParameter(name, source, config, source);
    
    },
    /**
     * 
     */
    randomizeParameter : function(name, config, source) {
         this[name] = this.getParameter(name, config, source);
         
         variation 
    },
    
    
    /**
     * Set animation source and target parameters for this effects.
     *
     * The purpose is to set animation parameters for "current" animation
     * and optionally hint previous or next animations.
     * 
     * @param {Object} config Global effect configuration
     */
    prepareAnimationParameters : function(config, source, target, next) {        
    },
    
    time : function() {
        
    },    
   
}

