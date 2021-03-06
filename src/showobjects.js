/*global define, console, jQuery, document, setTimeout */

define("krusovice/showobjects",
["krusovice/thirdparty/jquery-bundle",
"krusovice/core",
"krusovice/thirdparty/three-bundle"
], function($, krusovice, THREE) {
'use strict';

krusovice.showobjects = krusovice.showobjects || {};

/**
 * Base class for animated show object.
 *
 * Show object is an visualization of timeline element.
 * It prepares an 2D image used as a texture. Then
 * it asks the renderer object of the show to give a
 * 3D handle for this image.
 * For example, image can be prepared by inserting a
 * frame around and it some text on it.
 *
 * There are different kind of show objects (images,
 * texts, videos, etc.) and they all share this common
 * base class containing the core animation logic.
 *
 *
 * Show object animates movement and rotation values
 * based on the animation start and end and easing method.
 * Then it passes these values to the renderer's 3D object.
 *
 *
 *
 */
krusovice.showobjects.Base = function(cfg) {
    $.extend(this, cfg);
};

krusovice.showobjects.Base.prototype = {

    /**
     * @cfg {krusovice.Show} Rendering backend used to create artsy
     */
    renderer : null,

    /**
     * @cfg {krusovice.TimelineElement} data TimelineElement of play parameters
     */
    data : null,


    /**
     * Reference to 3d rendering backend object
     */
    object : null,

    /**
     * Additional object to render effects
     */
    effectObject : null,

    /**
     * @cfg {Function} Function which is called when async prepare() is ready.
     *
     * prepareCallback(success, msg). If success is false delegate the error message.
     */
    preparedCallback : null,

    /**
     * Internal flag telling whether this object has been already woken up
     */
    active : false,

    init : function() {

        // Initialize animation variables
        this.x = this.y = this.w = this.h = 0;

        // How many degrees this image has been rotated
        this.rotation = 0;

        this.opacity = 1;
    },

    /**
     * Load all related media resources.
     *
     * Note: animate() can be called before prepare in dummy unit tests runs.
     * Please set-up all state variables in init().
     *
     * This function MUST call prepareCallback() on both async success or error.
     *
     * @param loader krusovice.Loader instance
     *
     * @param {Number} width Target canvas width in pixels
     *
     * @param {Number} height Target canvas height in pixels
     *
     */
    prepare : function(loader, width, height) {

    },

    /**
     * Set the object to the animation state matched by the clock.
     *
     * We cache the state whether we have been drawing in prior frames,
     * as this way we can limit the number of 3D objects on the scene.
     *
     * @return Current animation state name
     */
    animate : function(clock) {

        var state, easing;

        var relativeClock = clock - this.data.wakeUpTime;

        // console.log("Clock:" + clock + " relative clock:" + relativeClock);

        // Determine the state of this animation
        var statedata = krusovice.utils.calculateElementEase(this.data, relativeClock);

        var animation = statedata.animation;

        // Don't animate yet - we are waiting for our turn
        if(animation == "notyet") {

            if(this.alive) {
                this.farewell();
            }

            return statedata;
        }

        if(animation != "notyet" && animation != "gone") {
            // XXX: This is unnecessary... just keep object around all the time
            if(!this.alive || !this.object) {
                this.wakeUp();
            }
        }

        if(animation == "gone") {
            // Time to disappear
            if(this.alive) {
                this.farewell();
            }

            return statedata;
        }


        if(!this.object) {
            // XXX: should not happen - raise exception here
            // when code is more complete
            return statedata;
        }

        // Calculate animation parameters
        var source = statedata.current;
        var target = statedata.next;

        if(!source) {
            throw "Source animation state missing:" + animation;
        }

        if(!target) {
            throw "Target animation state missing:" + animation;
        }

        if(!krusovice.utils.isNumber(statedata.value)) {
            console.error(statedata);
            console.error(animation);
            console.error(source);
            console.error(target);
            throw "Failed to calculate animation step";
        }

        this.animateEffect(target, source, statedata.value, statedata.rawValue);

        return statedata;

    },

    /**
     * Calculate animation parameters for current frame and apply them on the 3D object.
     *
     *  @param {krusovice.TimelineAnimation} target
     *
     *  @param {krusovice.TimelineAnimation} source
     *
     *  @param {Number} 0...1 how far the animation has progressed
     */
    animateEffect : function(target, source, value, rawValue) {
        var effectId = source.effectType;

        var effect = krusovice.effects.Manager.get(effectId);

        if(!effect) {
            console.error("Animation");
            console.error(source);
            throw "Animation had unknown effect:" + effectId;
        }

        var baseScale = this.object.baseScale;

        // Call the interpolator to get animation vectors for this frame
        var animationData = effect.animate(target, source, value, rawValue);

        // Apply photo aspect ration fix
        animationData.scale.multiplyScalar(baseScale);

        // Please the developer
        if(this.renderer.isDebugOutputFrame()) {
            this.dumpAnimationData(animationData);
        }

        // Handle Three.JS internals
        this.animateMesh(this.object, animationData.position, animationData.rotation, animationData.scale, animationData.opacity);

    },

    dumpAnimationData : function(d) {
        if(d.position) {
            console.log("Pos:" + d.position.x + " " + d.position.y + " " + d.position.z);
        }
    },

    /**
     * Apply animation parameters to a scene object.
     */
    animateMesh : function(mesh, position, rotation, scale, opacity) {

        if(position) {
            mesh.position = position;
        }

        mesh.scale = scale ;

        if(rotation) {
            mesh.quaternion = rotation;
        }
        mesh.opacity = opacity;
        this.setOpacity(mesh, opacity);
        mesh.updateMatrixWorld();

        // XXX: Hack to animate shadow opacity
        // Does not work if multiple objects on the scene simultaneously
        if(this.renderer.shadowLight) {
            this.renderer.shadowLight.shadowDarkness = opacity;
        }

    },

    /**
     * Handle opacity animation.
     *
     */
    setOpacity : function(mesh, opacity) {

        var objects = [mesh.bodyObject, mesh.borderObject];

        objects.forEach(function(mesh) {
            // Assume MeshFaceMaterial
            if(mesh.material instanceof THREE.MeshFaceMaterial) {
                var materials = mesh.material.materials;
                materials.forEach(function(m) {
                   m.opacity =  opacity;
                });
            }
        });
    },

    wakeUp : function() {
        // Bring object to the 3d scene
        console.log("Waking up:" + this.data.id);
        if(this.object) {
            this.renderer.wakeUp(this.object, this.effectObject);
        }
        this.alive = true;
    },

    farewell : function() {
        console.log("Object is gone:" + this.data.id);
        if(this.object) {
            this.renderer.farewell(this.object, this.effectObject);
        }

        this.alive = false;

    },

    /**
     * Do some post-processing effects
     */
    render : function(vuStrenght) {
    },

    createEffectObject : function() {
        return null;
    }

};

return krusovice.showobjects;

});
