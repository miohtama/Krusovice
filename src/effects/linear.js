
/**
 * 
 *
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.krusovice.effects.Interpolate = $.extend(krusovice.effects.Base, {
    
    name : "Interpolate",
    
    available : false,
    
    parameters : {
    
        source : {
            position : [0, 0, krusovice.effects.CAMERA_Z],
            rotation : [0,0,0, 1],
            opacity : 1,
            scale : [1,1,1]    
        },
        
        sourceVariation : {            
        },
        
        target : {
            position : [0, 0, krusovice.effects.CAMERA_Z],
            rotation : [0, 0, 0, 1],
            opacity : 1,
            scale : [1,1,1]    
        },
        
        targetVariation : {        
        },
        
    },
  
    prepareAnimationParameters : function(config, source, target, next) {        
        this.initParameter("position");
        this.initParameter("rotation");
        this.initParameter("scale");
        this.initParameter("opacity");
    },
          
});

/**
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.ZoomIn = $.extend(krusovice.effects.Interpolate, {
    
    id : "zoomin",
    
    name : "Zoom In",
    
    available : true,
    
    categories : ["transitionin"],
        
    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, krusovice.effects.FAR_Z];
    }
        
});

krusovice.effects.registerEffect(krusovice.effects.ZoomIn);


krusovice.effects.RotoZoomIn = $.extend(krusovice.effects.ZoomIn, {
    
    id : "rotozoomin",
    
    name : "Roto Zoom In",
    
    available : true,
    
    categories : ["transitionin"],    
    
    
});

krusovice.effects.registerEffect(krusovice.effects.RotoZoomIn);

krusovice.effects.ZoomOut = $.extend(krusovice.effects.ZoomOut, {
    
    id : "zoomout",
    
    name : "Zoom Out",
    
    available : true,
    
    categories : ["transitionout"],
    
    init : function() {
        // Override default animation parameters
        this.parameters.target.position = [0, 0, krusovice.effects.FAR_Z];
    }    
    
});

krusovice.effects.registerEffect(krusovice.effects.ZoomOut);


/**
 * 
 */
krusovice.effects.SlightMove = $.extend(krusovice.effects.SlightMove, {
    
    id : "slightmove",
    
    name : "Slight move",
    
    available : true,
    
    categories : ["onscreen"],
    
    init : function() {
        // Override default animation parameters
        var r = 0.1;
        this.parameters.sourceVariation.position = [r, r, r];
        this.parameters.targetVariation.position = [r, r, r];        
    }   
    
});

krusovice.effects.registerEffect(krusovice.effects.SlightMove);



/**
 * Randomically rotate object around its Z axis 
 */
krusovice.effects.SlightRotateZ = $.extend(krusovice.effects.SlightRotate, {
    
    id : "slightrotatez",
    
    name : "Slight Rotate Z",
    
    available : true,
    
    categories : ["onscreen"],
    
    parameters : {
        source : {
                  
        }
    },
    
    init : function() {
        this.parameters.sourceVariations.angle = 0.3;
        this.parameters.targetVariations.angle = 0.3;
    },
    
    prepareParameters : function(parametersSlot, obj, config, source) {        
        var r, q;
        
        var z = THREE.Vector3(0, 0, 1);
        
        this.initParameters(parametersSlot, config, source)
    
        r = this.randomizeParameter("angle", "source", config, source);
        q = THREE.Quaternion.setFromAxisAngle(z, r);
        
        obj.rotation = krusovice.utils.grabQuaternionData(q);                 
    }   
    
});






