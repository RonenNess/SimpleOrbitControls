# SimpleOrbitControls

An alternative to the default OrbitControls provided by THREE.js examples.

Live demo can be found [here](https://ronenness.github.io/SimpleOrbitControls/demo/).

# What Is It

THREE.js examples comes with a great [Orbit Camera Controller](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/OrbitControls.js). 

While its very useful and a good starting point, I wanted something slightly different, mainly a controller that don't interact with events internally (and instead being controlled from outside) and wanted to use Lerping instead of delta and damping, which feels different imo.

So I created this class instead, rewritten from scratch. Its a shorter, more basic implementation, which I believe is easier to understand and modify to more specific needs. 

# Usage

```js
// create the orbit controller
var controls = new THREE.SimpleOrbitControls(renderer, scene, camera);

// call this every update call:
var controllerInput = {
    deltaTime: deltaTime,                                      // time passed, in seconds, since last update call
    rotateHorizontally: rotateHorizontally,                    // rotation around y axis
    rotateVertically: rotateVertically,                        // rotate vertically around x / z axis
    moveOffsetVertically: moveY,                               // move the target offset (affect lookat AND camera position), along camera's Y axis. 
    moveOffsetHorizontally: moveXZ,                            // move the target offset left / right, relative to camera's world direction.
    zoom: zoom,                                                // zoom in / out
}
controls.update(controllerInput);
```

For more info, check out the example under `demo/`.

# License

MIT, you can use it for any purpose.
