"use strict";
/**
 * 
 *
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.Interpolate = $.extend(true, {}, krusovice.effects.Base, {
    
    name : "Interpolate",
    
    available : false,
        
    parameters : {
    
        source : {
            position : [0, 0, krusovice.effects.ON_SCREEN_Z],
            rotation : [0,0,0, 1],
            opacity : 1,
            scale : [1,1,1],    
        },
        
        sourceVariation : {            
        },
        
        target : {
            position : [0, 0, krusovice.effects.ON_SCREEN_Z],
            rotation : [0, 0, 0, 1],
            opacity : 1,
            scale : [1,1,1]    
        },
        
        targetVariation : {        
        },
        
    },
  
    prepareAnimationParameters : function(config, source, target, next) {
    },
    

    /**
     * Calculate state variables for an animation frame
     *
     * @param {Object} Show object being animated
     *
     * @param {Object} target Target animation state  
     *
     * @param {Object} source Source animation state 
     *
     * @param {Number} value current intermediate state 0...1, easing applied 
     */
    animate : function(object, target, source, value) {    
        
    	
    	if(!krusovice.utils.isNumber(value)) {
    		throw "Interpolation step undefined";
    	}
    	
        
        console.log("Got target");
        console.log(target);
        console.log("Got source");
        console.log(source);
        
    	       
        var position = krusovice.utils.calculateAnimation(target.position, source.position, value);

    	console.log("Animation:" + source.type + " effect:" + source.effectType + " reverse:" + source.reverse + " value:" + value);    	
    	console.log("Source:" + source.position);
    	console.log("Target:" + target.position);
    	console.log("Position:" + position);

        
        if(!krusovice.utils.isNumber(position[0])) {
        	throw "Serious fail";
        }
                  
        
        var scale = krusovice.utils.calculateAnimation(target.scale, source.scale, value);
        var opacity = source.opacity + (target.opacity-source.opacity)*value;
        
        var mesh = object;
        mesh.position = new THREE.Vector3(position[0], position[1], position[2]);
        mesh.scale = new THREE.Vector3(scale[0], scale[1], scale[2]);

        // krusovice.utils.calculateAnimation(target.rotation, source.rotation, value);
        var qa = new THREE.Quaternion(source.rotation[0], source.rotation[1], source.rotation[2], source.rotation[3]);
        var qb = new THREE.Quaternion(target.rotation[0], target.rotation[1], target.rotation[2], target.rotation[3]);

        THREE.Quaternion.slerp(qa, qb, mesh.quaternion, value);
        
        //console.log("Position:" + position);
        //console.log("Scale:" + scale);
    }    
    
          
});

/**
 * An effect which has axis and angle paramters.
 *
 * Axis and angle define the source and end rotation.
 * Both can have random variation. 
 * When the animation is prepared axis/angle combinations are converted to the quaternions
 * which perform slerp animation. 
 *
 */
krusovice.effects.QuaternionRotate = $.extend(true, {}, krusovice.effects.Interpolate, {
   
   id : "quaternionrotate",
   
   available : false,
         
   prepareParameters : function(parametersSlot, obj, config, source) {     
        
        // Initialize default positions and such
        this.initParameters(parametersSlot, obj, config, source);
        
        // Choose random axis on X % Y plane    
        var axis = this.randomizeParameter("axis", parametersSlot, config, source);
        var angle = this.randomizeParameter("angle", parametersSlot, config, source);
        
        console.log("Got axis/angle " + parametersSlot + " axis:" + axis + " angle:" + angle);
        var v = new THREE.Vector3(axis[0], axis[1], axis[2]);
        
        v = v.normalize();
        
        var q = (new THREE.Quaternion()).setFromAxisAngle(v, angle);
        
        obj.rotation = krusovice.utils.grabQuaternionData(q);   
        
   }   
    
});

/**
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.ZoomIn = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "zoomin",
    
    name : "Zoom In",
    
    easing : "easeOutCubic",    
    
    available : true,
    
    transitions : ["transitionin", "transitionout"],
        
    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, krusovice.effects.BEHIND_CAMERA_Z];
    }
        
});

krusovice.effects.Manager.register(krusovice.effects.ZoomIn);


krusovice.effects.ZoomFar = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "zoomfar",
    
    name : "Zoom Far",
    
    available : true,
    
    easing : "easeOutCubic",
    
    transitions : ["transitionin", "transitionout"],
    
    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, krusovice.effects.FAR_Z];
    }    
    
});

krusovice.effects.Manager.register(krusovice.effects.ZoomFar);

/**
 * Hold the photo on the screen without moving.
 */
krusovice.effects.Hold = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "hold",
    
    name : "Hold",
    
    available : true,
    
    transitions : ["onscreen"],
      
});

krusovice.effects.Manager.register(krusovice.effects.Hold);

/**
 * Have the object on screen but move it a little for extra dynamicity.
 */
krusovice.effects.SlightMove = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "slightmove",
    
    name : "Slight move",
    
    available : true,
    
    transitions : ["onscreen"],
    
    init : function() {
        // Override default animation parameters
        var r = 0.3;
        this.parameters.sourceVariation.position = [r, r, 0];
        this.parameters.targetVariation.position = [r, r, 0];        
    }   
    
});

krusovice.effects.Manager.register(krusovice.effects.SlightMove);

/**
 * Randomically rotate object around its Z axis 
 */
krusovice.effects.SlightRotateZ = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "slightrotatez",
    
    name : "Slight Rotate Z",
    
    available : true,
    
    transitions : ["onscreen"],
         
    init : function() {
        this.parameters.source.angle = 0;
        this.parameters.target.angle = 0;
        this.parameters.sourceVariation.angle = 0.3;
        this.parameters.targetVariation.angle = 0.3;
    },
    
    prepareParameters : function(parametersSlot, obj, config, source) {        

        this.initParameters(parametersSlot, obj, config, source);       

        var r, q;
        
        var z = new THREE.Vector3(0, 0, 1);
            
        r = this.randomizeParameter("angle", "source", config, source);
        q = (new THREE.Quaternion()).setFromAxisAngle(z, r);
        
        obj.rotation = krusovice.utils.grabQuaternionData(q);                 
    }   
    
    
       
});


krusovice.effects.Manager.register(krusovice.effects.SlightRotateZ);

/**
 * Flip photo 90 degrees around random XY-axis.
 */
krusovice.effects.Flip = $.extend(true, {}, krusovice.effects.QuaternionRotate, {
    
    id : "flip",
    
    name : "Flip",
    
    available : true,
    
    transitions : ["transitionin", "transitionout"],
    
    init : function() {
		var p = this.parameters;
		p.source.axis = [0,1,0];
		p.source.angle = Math.PI/2;
		//p.sourceVariation.axis = [krusovice.utils.splitrnd(1), krusovice.utils.splitrnd(1), 0];
		p.target.axis = [0,0,0];
		p.targetVariation.axis = [0,0,0];
		p.target.angle = 0;
	},
        
});

krusovice.effects.Manager.register(krusovice.effects.Flip);



/**
 * Movie "news paper headlines" comes in effect
 */
krusovice.effects.RotoZoomFar = $.extend(true, {}, krusovice.effects.QuaternionRotate, {
    
    id : "rotozoomfar",
    
    name : "Roto Zoom Far",
    
    available : true,
    
    transitions : ["transitionin", "transitionout"],    

    easing : 'easeInQuad',

    init : function() {
        var p = this.parameters;

        p.source.position = [0,0, krusovice.effects.FAR_Z];
        p.source.axis = [0,0,1];
        p.source.angle = Math.PI/2;
        p.sourceVariation.angle = Math.PI*6;

        p.sourceVariation.position = [krusovice.effects.FAR_Z_MAX_X, krusovice.effects.FAR_Z_MAX_Y, 0];

        p.target.axis = [0,0,0];
        p.targetVariation.axis = [0,0,0];
        p.target.angle = 0;
    },
          
      
    
});

krusovice.effects.Manager.register(krusovice.effects.RotoZoomFar);


