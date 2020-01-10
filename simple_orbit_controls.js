/**
 * Simple Orbit Camera Controls, an alternative to the default OrbitControls provided by THREE.js examples.
 * Key differences:
 *  1. Handle changing target position differently.
 *  2. Handle lerping differently.
 *  3. Get input from outside, instead of registering to events internally.
 *  4. Shorter, simpler code.
 * Author: Ronen Ness.
 * Since: 09/01/2020.
 */

/**
 * Orbit camera controller.
 */
class SimpleOrbitControls
{
	/**
	 * Create the orbit camera controller.
	 */
	constructor(renderer, scene, camera)
	{
		// store params
		this.renderer = renderer;
		this.domElement = renderer.domElement;
		this.scene = scene;
		this.camera = camera;

		// spherical coordinates (rotation + zoom)
		// _targetSpherical = future spherical we transition to using lerp.
		// _spherical = current value.
		this._targetSpherical = new THREE.Spherical();
		this._spherical = new THREE.Spherical();

		// position we focus on
		// _targetLookat = future lookat we transition to using lerp.
		// _lookat = current lookat target.
		this._targetLookat = new THREE.Vector3();
		this._lookat = new THREE.Vector3();

		// offset for position and lookat target we focus on
		// _targetOffset = future offset we transition to using lerp.
		// _offset = current offset.
		this._targetOffset = new THREE.Vector3();
		this._offset = new THREE.Vector3();

		// some defaults
		this.position = this.camera.position;
		this.directionLerpSpeed = 10;
		this.positionLerpSpeed = 10;
		this.distanceMin = 0;
		this.distanceMax = 0;
	}

	/**
	 * Get current lookat target.
	 */
	get target()
	{
		return this._offset.clone();
	}

	/**
	 * Set current lookat target.
	 */
	set target(val)
	{
		this._offset = val.clone();
		this._targetOffset = val.clone();
	}

	/**
	 * Rotate camera horizontally.
	 */
	rotateHorizontally(angle)
	{
		this._targetSpherical.theta += angle;
	}

	/**
	 * Rotate camera vertically.
	 */
	rotateVertically(angle)
	{
		this._targetSpherical.phi += angle;
	}

	/**
	 * Zoom in / out.
	 */
	zoom(factor)
	{
		this._targetSpherical.radius += factor;
		if (this._targetSpherical.radius < this.distanceMin) { this._targetSpherical.radius = this.distanceMin; }
		if (this.distanceMax && this._targetSpherical.radius > this.distanceMax) { this._targetSpherical.radius = this.distanceMax; }
	}

	/**
	 * Move target by a given vector.
	 */
	moveTargetBy(vector)
	{
		this._targetOffset.add(vector);
	}

	/**
	 * Get current world direction (from camera).
	 */
	get worldDirection()
	{
		var target = new THREE.Vector3();
		this.camera.getWorldDirection(target)
		return target;
	}

	/**
	 * Move target forward.
	 */
	moveTargetForward(distance)
	{
		var target = this.worldDirection;
		target.multiplyScalar(distance);
		this._targetOffset.add(target);
	}

	/**
	 * Move target backwards.
	 */
	moveTargetBackwards(distance)
	{
		this.moveTargetForward(-distance);
	}

	/**
	 * Get camera position.
	 */
	get position()
	{
		return this.camera.position.clone();
	}

	/**
	 * Set camera position.
	 */
	set position(val)
	{
		this._targetSpherical.setFromVector3(val); // use setFromCartesianCoords(x,y,z)?
	}

	/**
	 * Move target, horizontally, based on camera's current rotation and up vector.
	 */
	moveOffsetHorizontally(delta)
	{
		// get left vector without y axis
		var vector = this.worldDirection;
		vector.y = 0;
		vector.normalize().multiplyScalar(delta);
		vector.applyAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );

		// add to target offset
		this._targetOffset.add(vector);
	}

	/**
	 * Move target, vertically, based on camera's current rotation and up vector.
	 */
	moveOffsetVertically(delta)
	{
		// get vector to move vertically, relative to camera's up vector and rotation
		var spherical = new THREE.Spherical();
		spherical.setFromVector3(this.worldDirection);
		spherical.phi += Math.PI / 2;
		var vector = new THREE.Vector3().setFromSpherical(spherical).normalize().multiplyScalar(delta);

		// add to target offset
		this._targetOffset.add(vector);
	}

	/**
	 * Update controller.
	 * @param {SimpleOrbitControls.InputAPI} input Input implementor that tells the orbit controller what to do.
	 */
	update(input)
	{
		// process input
		if (input)
		{
			// get delta time
			var dt = input.deltaTime;

			// rotate horizontally
			var rh = input.rotateHorizontally || 0;
			if (rh !== 0) {
				this.rotateHorizontally(rh * dt);
			}

			// rotate vertically
			var rv = input.rotateVertically || 0;
			if (rv !== 0) {
				this.rotateVertically(rv * dt);
			}

			// zoom in / out
			var zoom = input.zoom || 0;
			if (zoom !== 0) {
				this.zoom(zoom * dt);
			}

			// move target
			var mt = input.moveTarget;
			if (mt) 
			{
				mt = mt.clone().multiplyScalar(dt);
				this.moveTargetBy(mt);
			}

			// move target horizontally
			var mh = input.moveOffsetHorizontally;
			if (mh)
			{
				this.moveOffsetHorizontally(mh * dt);
			}

			// move target vertically
			var mv = input.moveOffsetVertically;
			if (mv)
			{
				this.moveOffsetVertically(mv * dt);
			}
		}

		// update spherical rotation
		if (this.directionLerpSpeed) {
			this._spherical.theta = THREE.Math.lerp(this._spherical.theta, this._targetSpherical.theta, dt * this.directionLerpSpeed);
			this._spherical.phi = THREE.Math.lerp(this._spherical.phi, this._targetSpherical.phi, dt * this.directionLerpSpeed);
		}
		else {
			this._spherical.theta = this._targetSpherical.theta;
			this._spherical.phi = this._targetSpherical.phi;
		}

		// update position
		if (this.positionLerpSpeed) {
			this._spherical.radius = THREE.Math.lerp(this._spherical.radius, this._targetSpherical.radius, dt * this.positionLerpSpeed);
			this._lookat.lerp(this._targetLookat, dt * this.positionLerpSpeed);
			this._offset.lerp(this._targetOffset, dt * this.positionLerpSpeed);
		}
		else
		{
			this._spherical.radius = this._targetSpherical.radius;
			this._lookat = this._targetLookat.clone();
			this._offset = this._targetOffset.clone();
		}

		// set camera position
		this._spherical.makeSafe();
		this._targetSpherical.makeSafe();
		this.camera.position.setFromSpherical(this._spherical).add(this._offset);

		// set camera target
		this.camera.lookAt(this._lookat.clone().add(this._offset));
	}

	/**
	 * Dispose the controller.
	 */
	dispose()
	{
	}
}

/**
 * Define the Input class that the user must provide.
 */
SimpleOrbitControls.InputAPI = class
{
	/**
	 * Get rotation horizontally delta for this frame (Number).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get rotateHorizontally()
	{
		return 0;
	}

	/**
	 * Get rotation vertically delta for this frame (Numer).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get rotateVertically()
	{
		return 0;
	}

	/**
	 * Get zoom delta for this frame (Number).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get zoom()
	{
		return 0;
	}

	/**
	 * Get target delta for this frame (Vector3).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get moveTarget()
	{
		return null;
	}

	/**
	 * Move target horizontally (left and right of the camera), relative to camera direction (Number).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get moveOffsetHorizontally()
	{
		return null;
	}

	/**
	 * Move target vertically, relative to camera direction (Number).
	 * Note: multiplied by deltaTime and lerped automatically.
	 */
	get moveOffsetVertically()
	{
		return null;
	}

	/**
	 * Get delta time, in seconds, since last update call (Number).
	 */
	get deltaTime() 
	{
		return 1;
	}
};

// export the orbit controls.
THREE.SimpleOrbitControls = SimpleOrbitControls;