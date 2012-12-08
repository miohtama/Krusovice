/*global define, console, jQuery, document, setTimeout */

define("krusovice/effects/linear",
    ["krusovice/thirdparty/jquery-bundle",
     "krusovice/core",
     'krusovice/effects',
     'krusovice/effects/interpolate',
     'krusovice/thirdparty/three-bundle'
     ], function($, krusovice, effects, Interpolate, THREE) {
"use strict";

/**
 * An effect which has axis and angle paramters.
 *
 * Axis and angle define the source and end rotation.
 * Both can have random variation.
 * When the animation is prepared axis/angle combinations are converted to the quaternions
 * which perform slerp animation.
 *
 */
effects.QuaternionRotate = $.extend(true, {}, Interpolate, {

   id : "quaternionrotate",

   available : false,

   prepareParameters : function(parametersSlot, obj, config, source) {

        // Initialize default positions and such
        this.initParameters(parametersSlot, obj, config, source);

        // Choose random axis on X % Y plane
        var axis = this.randomizeParameter("axis", parametersSlot, config, source);
        var angle = this.randomizeParameter("angle", parametersSlot, config, source);

        //console.log("Got axis/angle " + parametersSlot + " axis:" + axis + " angle:" + angle);
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
effects.ZoomIn = $.extend(true, {}, Interpolate, {

    id : "zoomin",

    name : "Zoom In",

    easing : "easeOutCubic",

    available : true,

    transitions : ["transitionin", "transitionout"],

    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, effects.BEHIND_CAMERA_Z];
        this.parameters.source.opacity = 0;
        //this.parameters.opacity.easing = "linear";
    }

});

effects.Manager.register(effects.ZoomIn);


effects.ZoomFar = $.extend(true, {}, Interpolate, {

    id : "zoomfar",

    name : "Zoom Far",

    available : true,

    easing : "easeOutCubic",

    transitions : ["transitionin", "transitionout"],

    init : function() {
        // Override default animation parameters
        this.parameters.source.position = [0, 0, effects.FAR_Z];
    }

});

effects.Manager.register(effects.ZoomFar);

/**
 * Hold the photo on the screen without moving.
 */
effects.Hold = $.extend(true, {}, Interpolate, {

    id : "hold",

    name : "Hold",

    available : true,

    transitions : ["onscreen"]

});

effects.Manager.register(effects.Hold);

/**
 * Have the object on screen but move it a little for extra dynamicity.
 */
effects.SlightMove = $.extend(true, {}, Interpolate, {

    id : "slightmove",

    name : "Slight move",

    available : true,

    transitions : ["onscreen"],

    init : function() {
        // Override default animation parameters
        var r = 0.3;
        //this.parameters.source.position = [-effects.ON_SCREEN_MAX_X, 0, 0];
        //this.parameters.target.position = [effects.ON_SCREEN_MAX_X, 0, 0];

        var x = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_X;
        var y = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_Y;
        this.parameters.sourceVariation.position = [x, y, 0];

        x = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_X;
        y = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_Y;
        this.parameters.targetVariation.position = [x, y, 0];
    }

});

effects.Manager.register(effects.SlightMove);

/**
 * Have the object on screen but move it a little for extra dynamicity.
 */
effects.Fade = $.extend(true, {}, Interpolate, {

    id : "fade",

    name : "Fade",

    available : true,

    transitions : ["transitionin", "transitionout"],

    init : function() {
        this.parameters.source.opacity = 0;
        this.parameters.target.opacity = 1;


        // This effect should not change the rotation parameters
        this.parameters.target.rotation = null;
        this.parameters.source.rotation = null;

        this.parameters.target.position = null;
        this.parameters.source.position = null;

    }

});

effects.Manager.register(effects.Fade);

effects.SlightMoveLeftRight = $.extend(true, {}, effects.QuaternionRotate, {

    id : "slightmoveleftright",

    name : "Slight Move Left -> Right",

    available : true,

    transitions : ["onscreen"],

    easing : "easeInOutSine",

    init : function() {
        // Override default animation parameters
        var x,y;
        var r = 0.3;
        var r2 = 0.1;
        //this.parameters.source.position = [-effects.ON_SCREEN_MAX_X, 0, 0];
        //this.parameters.target.position = [effects.ON_SCREEN_MAX_X, 0, 0];

        x = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_X;
        y = krusovice.utils.splitrnd(r2) * effects.ON_SCREEN_MAX_Y;
        this.parameters.source.position = [-effects.ON_SCREEN_MAX_X*0.3, 0, 0];
        this.parameters.sourceVariation.position = [x, y, 0];

        x = krusovice.utils.splitrnd(r) * effects.ON_SCREEN_MAX_X + r;
        y = krusovice.utils.splitrnd(r2) * effects.ON_SCREEN_MAX_Y;
        this.parameters.target.position = [+effects.ON_SCREEN_MAX_X*0.3, 0, 0];
        this.parameters.targetVariation.position = [x, y, 0];

        var p = this.parameters;

        p.source.axis = [0,0,1];
        p.source.angle = Math.PI/32;
        p.sourceVariation.angle = krusovice.utils.splitrnd(Math.PI/32);

        p.target.axis = [0,0,1];
        p.targetVariation.axis = [0,0,1];
        p.target.angle = -Math.PI/32;
        p.targetVariation.angle = krusovice.utils.splitrnd(Math.PI/32);

    }

});

effects.Manager.register(effects.SlightMoveLeftRight);


/**
 * Randomically rotate object around its Z axis
 *
 * XXX: Don't use as an example - made before QuaternionEffect base class
 */
effects.SlightRotateZ = $.extend(true, {}, Interpolate, {

    id : "slightrotatez",

    name : "Slight Rotate Z",

    available : true,

    transitions : ["onscreen"],

    init : function() {
        this.parameters.source.angle = +Math.PI/16;
        this.parameters.target.angle = -Math.PI/16;
        this.parameters.sourceVariation.angle = Math.PI/32;
        this.parameters.targetVariation.angle = Math.PI/32;
    },

    prepareParameters : function(parametersSlot, obj, config, source) {

        this.initParameters(parametersSlot, obj, config, source);

        var r, q;

        var z = new THREE.Vector3(0, 0, 1);

        r = this.randomizeParameter("angle", parametersSlot, config, source);
        q = (new THREE.Quaternion()).setFromAxisAngle(z, r);

        obj.rotation = krusovice.utils.grabQuaternionData(q);

    }

});


effects.Manager.register(effects.SlightRotateZ);


/**
 * Hold object on the center of the screen slighty rotated around one of its axis.
 *
 * XXX: Must finish
 */
effects.StaticRotateZ = $.extend(true, {}, effects.QuaternionRotate, {

    id : "staticrotatez",

    name : "Static Rotate Z",

    available : true,

    transitions : ["onscreen"],

    // XXX: Does not really matter
    easing : "easeInOutSine",

    init : function() {
        var p = this.parameters;
        p.source.axis = p.target.axis = [0,0,1];
        p.source.angle = p.target.angle = 0;
    },

    /**
     * Note: we need to post process the parameters because the tilt angle
     * is not the same for each pobject, but we still need to vary it between
     * objects.
     */
    postProcessParameters : function(source, target) {
        console.log(source);
        console.log(target);

        var z = new THREE.Vector3(0, 0, 1);
        var r = krusovice.utils.splitrnd(Math.PI/16);
        var q = (new THREE.Quaternion()).setFromAxisAngle(z, r);
        source.rotation = target.rotation = krusovice.utils.grabQuaternionData(q);
    }

});


effects.Manager.register(effects.StaticRotateZ);

/**
 * Hold object lttle bit off the center of the screen slighty rotated around one of its axis.
 *
 */
effects.SlightDisplacement = $.extend(true, {}, effects.QuaternionRotate, {

    id : "slightdisplacement",

    name : "Slight Displacement",

    available : true,

    transitions : ["onscreen"],

    // XXX: Does not really matter
    easing : "easeInOutSine",

    init : function() {
        var p = this.parameters;
        p.source.axis = p.target.axis = [0,0,1];
        p.source.angle = p.target.angle = 0;
    },

    /**
     * Note: we need to post process the parameters because the tilt angle
     * is not the same for each pobject, but we still need to vary it between
     * objects.
     */
    postProcessParameters : function(source, target) {
        console.log(source);
        console.log(target);

        var z = new THREE.Vector3(0, 0, 1);
        var r = krusovice.utils.splitrnd(Math.PI/16);
        var q = (new THREE.Quaternion()).setFromAxisAngle(z, r);
        source.rotation = target.rotation = krusovice.utils.grabQuaternionData(q);

        var x = krusovice.utils.splitrnd(effects.ON_SCREEN_MAX_X/3);
        var y = krusovice.utils.splitrnd(effects.ON_SCREEN_MAX_Y/8);

        source.position = target.position = [x, y, effects.ON_SCREEN_Z];

    }

});


effects.Manager.register(effects.SlightDisplacement);

/**
 * Flip photo 90 degrees around random XY-axis.
 */
effects.Flip = $.extend(true, {}, effects.QuaternionRotate, {

    id : "flip",

    name : "Flip",

    available : true,

    transitions : ["transitionin", "transitionout"],

    init : function() {
        var p = this.parameters;
        p.source.axis = [0,1,0];
        p.source.angle = Math.PI*4/3;
        //p.sourceVariation.axis = [krusovice.utils.splitrnd(1), krusovice.utils.splitrnd(1), 0];
        p.target.axis = [0,0,0];
        p.targetVariation.axis = [0,0,0];
        p.target.angle = 0;
    }

});

effects.Manager.register(effects.Flip);



/**
 * Movie "news paper headlines" comes in effect
 */
effects.RotoZoomFar = $.extend(true, {}, effects.QuaternionRotate, {

    id : "rotozoomfar",

    name : "Roto Zoom Far",

    available : true,

    transitions : ["transitionin", "transitionout"],

    easing : 'easeInBounce',

    init : function() {
        var p = this.parameters;

        p.source.position = [0,0, effects.FAR_Z];
        p.source.axis = [0,0,1];
        p.source.angle = Math.PI/2;
        p.sourceVariation.angle = Math.PI*6;
        p.source.opacity = 0;

        p.sourceVariation.position = [effects.FAR_Z_MAX_X, effects.FAR_Z_MAX_Y, 0];

        p.target.axis = [0,0,0];
        p.targetVariation.axis = [0,0,0];
        p.target.angle = 0;
        p.target.opacity = 1;
    }

});

effects.Manager.register(effects.RotoZoomFar);

effects.SpinLeft = $.extend(true, {}, effects.QuaternionRotate, {

    id : "spinleft",

    name : "Spin Left",

    available : true,

    transitions : ["transitionin", "transitionout"],

    easing : 'easeOutCubic',

    init : function() {
        var p = this.parameters;

        p.source.position = [-effects.ON_SCREEN_MAX_X*2,
                             0,
                             -400];

        p.source.axis = [0,1,0];
        p.source.angle = Math.PI*2/3;
        p.source.opacity = 0.3;
        p.sourceVariation.axis = [0.1, 0.1, 0];

        p.sourceVariation.position = [effects.ON_SCREEN_MAX_X*0.2, effects.ON_SCREEN_MAX_Y*0.2, 0];

        p.target.axis = [0,0,0];
        p.targetVariation.axis = [0,0,0];
        p.target.angle = 0;
        p.target.opacity = 1;
    }

});

effects.Manager.register(effects.SpinLeft);

effects.SpinRight = $.extend(true, {}, effects.QuaternionRotate, {

    id : "spinright",

    name : "Spin Right",

    available : true,

    transitions : ["transitionin", "transitionout"],

    easing : 'easeOutCubic',

    init : function() {
        var p = this.parameters;

        p.source.position = [effects.ON_SCREEN_MAX_X*2,
                             0,
                             -400];

        p.source.axis = [0,1,0];
        p.source.angle = -Math.PI*2/3;
        p.source.opacity = 0.3;
        p.sourceVariation.axis = [0.1, 0.1, 0];

        p.sourceVariation.position = [effects.ON_SCREEN_MAX_X*0.2, effects.ON_SCREEN_MAX_Y*0.2, 0];

        p.target.axis = [0,0,0];
        p.targetVariation.axis = [0,0,0];
        p.target.angle = 0;
        p.target.opacity = 1;
    }

});

effects.Manager.register(effects.SpinRight);


effects.FallTop = $.extend(true, {}, effects.QuaternionRotate, {

    id : "falltop",

    name : "Fall Top",

    transitions : ["transitionin", "transitionout"],

    easing : 'easeOutBounce',

    init : function() {
        var p = this.parameters;


        p.source.axis = p.target.axis = [0,1,0];
        p.source.angle = p.target.angle = 0;


        p.source.position = [0,
                             effects.ON_SCREEN_MAX_Y*2,
                             effects.ON_SCREEN_Z];

    }

});

effects.Manager.register(effects.FallTop);

effects.FallBottom = $.extend(true, {}, effects.QuaternionRotate, {

    id : "fallbottom",

    name : "Fall Bottom",

    transitions : ["transitionin", "transitionout"],

    easing : 'easeOutExpo',

    init : function() {
        var p = this.parameters;

        p.source.axis = p.target.axis = [0,1,0];
        p.source.angle = p.target.angle = 0;

        p.source.position = [0,
                             -effects.ON_SCREEN_MAX_Y*2,
                             effects.ON_SCREEN_Z];

    }

});

effects.Manager.register(effects.FallBottom);


});
