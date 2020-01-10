var renderer, scene, camera, input, controls, _lastTime;

init();
update();

// init demo
function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x446688, 1 )
    document.body.appendChild( renderer.domElement );
    
    // scene
    scene = new THREE.Scene();
	
	// for input (using StInput)
	input = new StInput(window);

    // camera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set(100,100,100);
	camera.lookAt(new THREE.Vector3(0,0,0));
	
	// create orbit controller
	controls = new THREE.SimpleOrbitControls(renderer, scene, camera);
	
	// create cube geometry
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	
	// create some random cubes
	for (var i = 0; i < 100; ++i) {
		var material = new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff } );
		var cube = new THREE.Mesh( geometry, material );
		cube.position.set(Math.random()*100 - 50, Math.random()*10, Math.random()*100 - 50);
		cube.scale.set(1+Math.random()*5, 1+Math.random()*5, 1+Math.random()*5);
		scene.add( cube );
	}

    // resize renderer and canvas when window resizes.
    var onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener( 'resize', onWindowResize, false );
	
	// to calculate delta time
	_lastTime = (new Date()).getTime();
}

// animation main loop
function update() {

	// calculate delta time
	const timeNow = (new Date()).getTime();
	const deltaTime = (timeNow - _lastTime) / 1000.0;
	_lastTime = timeNow;

	// get next update call
    requestAnimationFrame( update );

	// decide what to move and get mouse delta
	var rotateCamera = this.input.mouseDown(this.input.MouseButtons.right);
	var moveCamera = this.input.mouseDown(this.input.MouseButtons.left);
	var mouseDelta = this.input.mouseDelta;

	// zoom value
	var zoom = this.input.mouseWheel;
	if (this.input.down('page_up')) zoom += 10;
	else if (this.input.down('page_down')) zoom -= 10;

	// update controls
	controls.update({
		deltaTime: deltaTime, 
		rotateHorizontally: rotateCamera ? -mouseDelta.x : 0,
		rotateVertically: rotateCamera ? -mouseDelta.y : 0,
		moveOffsetVertically: (moveCamera ? -mouseDelta.y : 0) * 10,
		moveOffsetHorizontally: (moveCamera ? mouseDelta.x : 0) * 10,
		zoom: zoom * 10,
	});
	
	// render scene
    renderer.render( scene, camera );
	
	// update input
	input.endFrame();
}

