
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
            position : [0, 0, krusovice.effects.CAMERA_Z],
            rotation : [0,0,0, 1],
            opacity : 1,
            scale : [1,1,1],    
            easing : "linear"
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
    },
          
});

/**
 * Interpolate position, rotation, etc. from source to target parameters.
 *
 * Weighting of the interpolation is based on ease value.
 */
krusovice.effects.ZoomIn = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "zoomin",
    
    name : "Zoom In",
    
    available : true,
    
    categories : ["transitionin"],
        
    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, krusovice.effects.FAR_Z];
    }
        
});

krusovice.effects.Manager.register(krusovice.effects.ZoomIn);


krusovice.effects.RotoZoomIn = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "rotozoomin",
    
    name : "Roto Zoom In",
    
    available : true,
    
    categories : ["transitionin"],    
    
    
});

krusovice.effects.Manager.register(krusovice.effects.RotoZoomIn);

krusovice.effects.ZoomOut = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "zoomout",
    
    name : "Zoom Out",
    
    available : true,
    
    categories : ["transitionout"],
    
    init : function() {
        // Override default animation parameters
        this.parameters.target.position = [0, 0, krusovice.effects.FAR_Z];
    }    
    
});

krusovice.effects.Manager.register(krusovice.effects.ZoomOut);


/**
 * 
 */
krusovice.effects.SlightMove = $.extend(true, {}, krusovice.effects.Interpolate, {
    
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

krusovice.effects.Manager.register(krusovice.effects.SlightMove);

/**
 * Randomically rotate object around its Z axis 
 */
krusovice.effects.SlightRotateZ = $.extend(true, {}, krusovice.effects.Interpolate, {
    
    id : "slightrotatez",
    
    name : "Slight Rotate Z",
    
    available : true,
    
    categories : ["onscreen"],
         
    init : function() {
        this.parameters.source.angle = 0;
        this.parameters.target.angle = 0;
        this.parameters.sourceVariation.angle = 0.3;
        this.parameters.targetVariation.angle = 0.3;
    },
    
    prepareParameters : function(parametersSlot, obj, config, source) {        

        this.initParameters(parametersSlot, obj, config, source)

        var r, q;
        
        var z = new THREE.Vector3(0, 0, 1);
            
        r = this.randomizeParameter("angle", "source", config, source);
        q = (new THREE.Quaternion()).setFromAxisAngle(z, r);
        
        obj.rotation = krusovice.utils.grabQuaternionData(q);                 
    }   
    
    
       
});


krusovice.effects.Manager.register(krusovice.effects.SlightRotateZ);




