//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
let stack = []
var ANGLE_STEP =45.0;
var floatsPerVertex = 7;
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
var move_x = 0;
var move_y = 0;            
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;                  // initial rotation angle
var g_angle02Rate = 40.0;           // rotation speed, in degrees/second 
//--------Arm
var g_angle0now  =   0.0;       // init Current rotation angle, in degrees
var g_angle0rate = -22.0;       // init Rotation angle rate, in degrees/second.
var g_angle0brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle0min  =-140.0;       // init min, max allowed angle, in degrees.
var g_angle0max  =  40.0;

var g_angle1now  =   0.0; 			// init Current rotation angle, in degrees > 0
var g_angle1rate =  30.0;				// init Rotation angle rate, in degrees/second.
var g_angle1brake=	 1.0;				// init Rotation start/stop. 0=stop, 1=full speed.
var g_angle1min  = -80.0;       // init min, max allowed angle, in degrees
var g_angle1max  =  80.0;

var g_angle2now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle2rate =  69.0;				// init Rotation angle rate, in degrees/second.
var g_angle2brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle2min  = -20.0;       // init min, max allowed angle, in degrees
var g_angle2max  = -5.0;

var g_angle3now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle3rate =  80.0;				// init Rotation angle rate, in degrees/second.
var g_angle3brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle3min  = -40.0;       // init min, max allowed angle, in degrees
var g_angle3max  =  40.0;

var g_angle4now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle4rate =  -22.0;				// init Rotation angle rate, in degrees/second.
var g_angle4brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle4min  = -40.0;       // init min, max allowed angle, in degrees
var g_angle4max  =  30.0;


//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits
								 

function main() {
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.87, 0.63, 0.87, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global g_angle01 variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/
  //var currentAngle = 0.0;
  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
	//currentAngle = animate(currentAngle); 
    animate();   // Update the rotation angle
    drawAll();   // Draw all parts
//    console.log('g_angle01=',g_angle01.toFixed(g_digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		document.getElementById('CurAngleDisplay').innerHTML= 
			'g_angle01= '+g_angle01.toFixed(g_digits);
		// Also display our current mouse-dragging state:
		document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+
			g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(g_digits);	
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!
  /*
  makeSphere();							 
  var mySiz = ( sphVerts.length );
  var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	//cylStart = 0;							// we stored the cylinder first.
  //for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	//colorShapes[i] = cylVerts[j];
	//	}
		sphStart = 48;				// next, we'll store the sphere;
	for(i=48,j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
  
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/ 
     var colorShapes = new Float32Array([
    // Face 0: (left side)
	0.0, 1.0, 0.0, 1.0,			0.52,  0.44,  1.0,	// Node 0
	-1.0, -1.0, 1.0, 1.0, 		1.0,  0.89,  0.88, 	// Node 1
	1.0,  -1.0, 1.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
					 // Face 1: (right side)
	0.0,  1.0,  0.0, 1.0,		0.52,  0.44,  1.0,	// Node 0
	1.0,  -1.0, 1.0, 1.0,  		1.0,  0.0,  1.0,	// Node 2
	1.0, -1.0, -1.0, 1.0, 		0.94,  0.97,  1.0, 	// Node 3
				 // Face 2: (lower side)
	0.0,  1.0, 0.0, 1.0,		0.52,  0.44,  1.0,	// Node 0 
	1.0, -1.0, -1.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3
	-1.0, -1.0, -1.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1 
				  // Face 3: (base side)  
	0.0, 1.0, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 3
	-1.0,  -1.0, -1.0, 1.0,  	    1.0,  1.0,  1.0,	// Node 2
    -1.0, -1.0, 1.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1
      

     // +x face: RED
	 1.0, -1.0, -1.0, 1.0,	  0.5, 0.4, 1.0,	// Node 3
	 1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 2
	 1.0,  1.0,  1.0, 1.0,	  0.52, 0.44, 1.0,  // Node 4
	 
	 1.0,  1.0,  1.0, 1.0,	  0.96, 1.0, 0.98,	// Node 4
	 1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 7
	 1.0, -1.0, -1.0, 1.0,	  0.69, 0.88, 0.9,	// Node 3

		// +y face: GREEN
	-1.0,  1.0, -1.0, 1.0,	  0.9, 1.0, 1.0,	// Node 1
	-1.0,  1.0,  1.0, 1.0,	  1.0, 0.39, 0.28,	// Node 5
	 1.0,  1.0,  1.0, 1.0,	  0.85, 0.75, 0.85,	// Node 4

	 1.0,  1.0,  1.0, 1.0,	  1.0, 0.65, 0.0,	// Node 4
	 1.0,  1.0, -1.0, 1.0,	  1.0, 0.97, 0.86,	// Node 2 
	-1.0,  1.0, -1.0, 1.0,	  0.5, 0.0, 0.1,	// Node 1

		// +z face: BLUE
	-1.0,  1.0,  1.0, 1.0,	  1.0, 0.89, 0.88,	// Node 5
	-1.0, -1.0,  1.0, 1.0,	  1.0, 0.65, 0.0,	// Node 6
	 1.0, -1.0,  1.0, 1.0,	  1.0, 0.75, 0.8,	// Node 7

	 1.0, -1.0,  1.0, 1.0,	  0.85, 0.75, 0.85,	// Node 7
	 1.0,  1.0,  1.0, 1.0,	  0.6, 0.1, 1.0,	// Node 4
	-1.0,  1.0,  1.0, 1.0,	  0.69, 0.93, 0.93,	// Node 5

		// -x face: CYAN
	-1.0, -1.0,  1.0, 1.0,	  0.3, 0.3, 0.3,	// Node 6	
	-1.0,  1.0,  1.0, 1.0,	  0.73, 0.56, 0.56,	// Node 5 
	-1.0,  1.0, -1.0, 1.0,	  0.94, 1.0, 0.94,	// Node 1
	
	-1.0,  1.0, -1.0, 1.0,	  1.0, 0.8, 0.7,	// Node 1
	-1.0, -1.0, -1.0, 1.0,	  0.6, 0.2, 0.2,	// Node 0  
	-1.0, -1.0,  1.0, 1.0,	  1.0, 0.8, 0.6,	// Node 6  
	
		// -y face: MAGENTA
	 1.0, -1.0, -1.0, 1.0,	  0.79, 0.88, 1.0,	// Node 3
	 1.0, -1.0,  1.0, 1.0,	  0.78, 0.89, 1.0,	// Node 7
	-1.0, -1.0,  1.0, 1.0,	  0.82, 0.93, 0.93,	// Node 6

	-1.0, -1.0,  1.0, 1.0,	  1.0, 0.08, 0.58,	// Node 6
	-1.0, -1.0, -1.0, 1.0,	  0.6, 0.8, 0.2,	// Node 0
	 1.0, -1.0, -1.0, 1.0,	  0.65, 0.16, 0.16,	// Node 3

	 // -z face: YELLOW
	 1.0,  1.0, -1.0, 1.0,	  0.9, 0.5, 0.4,	// Node 2
	 1.0, -1.0, -1.0, 1.0,	  1.0, 0.7, 1.0,	// Node 3
	-1.0, -1.0, -1.0, 1.0,	  0.7, 0.8, 0.9,	// Node 0		

	-1.0, -1.0, -1.0, 1.0,	  0.74, 0.56, 0.56,	// Node 0
	-1.0,  1.0, -1.0, 1.0,	  1.0, 0.98, 0.8,	// Node 1
	 1.0,  1.0, -1.0, 1.0,	  1.0, 0.89, 0.88,	// Node 2
	]);
     g_vertsMax = 48;	// 12 tetrahedron vertices.36 cube vertices
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  //return nn;

}
/*
function makeSphere() {
	//==============================================================================
	// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
	// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
	// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
	// sphere from one triangle strip.
	  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
												// (choose odd # or prime# to avoid accidental symmetry)
	  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
												// (same number of vertices on bottom of slice, too)
	  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
	  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
	  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
	
		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
				}
				if(s==0) {	// finally, set some interesting colors for vertices:
					sphVerts[j+4]=topColr[0]; 
					sphVerts[j+5]=topColr[1]; 
					sphVerts[j+6]=topColr[2];	
					}
				else if(s==slices-1) {
					sphVerts[j+4]=botColr[0]; 
					sphVerts[j+5]=botColr[1]; 
					sphVerts[j+6]=botColr[2];	
				}
				else {
						sphVerts[j+4]=Math.random();// equColr[0]; 
						sphVerts[j+5]=Math.random();// equColr[1]; 
						sphVerts[j+6]=Math.random();// equColr[2];					
				}
			}
		}
	}
	*/
function drawAll() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  let stack = []
  //var currentAngle = 0;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  clrColr = new Float32Array(4);
  clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  //------Draw Spinning Body
  g_modelMatrix.setTranslate(-0.1+move_x,-0.1+move_y, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  g_modelMatrix.scale(1,1,-1);			// convert to left-handed coord sys
  										// to match WebGL display canvas.
  g_modelMatrix.scale(0.2,0.2,0.2);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  g_modelMatrix.rotate(g_angle01, 0, 1, 0);  // Make new drawing axes that
  g_modelMatrix.rotate(g_angle02, 1, 0, 0);  // Make new drawing axes that

  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  stack.push(new Matrix4(g_modelMatrix));
  gl.drawArrays(gl.TRIANGLES, 12, 36);
  //-----Draw Head
  g_modelMatrix.translate(0.0,1.7, 0.0);
  g_modelMatrix.scale(0.7,0.7,0.7);
  g_modelMatrix.rotate(180, 1, 0, 0); 
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
  
  //----Draw tree-1
  g_modelMatrix.translate(7,0, 0.0);
  g_modelMatrix.rotate(180, 1, 0, 0);
  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(0.7,0.7,0.7);
  g_modelMatrix.rotate(g_angle2now, 0,1,0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
  g_modelMatrix = popMatrix();
  
  //----Draw tree-2
  
  g_modelMatrix.translate(0,-1, 0.0);
  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(0.8,0.8,0.8);
  g_modelMatrix.rotate(-g_angle2now, 1,0,0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
  g_modelMatrix = popMatrix();
  
  //----Draw tree-3
  g_modelMatrix.translate(0,-1.2, 0.0);
  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(0.9,0.9,0.9);
  g_modelMatrix.rotate(g_angle1now, 0,1,0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
  g_modelMatrix = popMatrix();
  
  //----Draw tree-4

  g_modelMatrix.translate(0,-1.8, 0.0);
  g_modelMatrix.scale(0.4,1.0,0.4);
  g_modelMatrix.rotate(g_angle0now, 0,1,0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 36);
  
  
  //-----Draw arm
    g_modelMatrix = stack.pop();
    stack.push(new Matrix4(g_modelMatrix));
    g_modelMatrix.translate(2,0, 0.0);
	drawArm()
	
	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-2.1, 0, 0);
	g_modelMatrix.rotate(180,0,1,0);
    drawArm()
	
    
    //-----Draw leg
    g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-0.5, -1.5, 0);
	g_modelMatrix.scale(1,1,-1);
	drawleg()
    g_modelMatrix = popMatrix();
	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0.5, -1.5, 0);
	g_modelMatrix.scale(1,1,-1);
	drawleg()
	/*
   ////--------Draw Spinning Sphere
   g_modelMatrix.setTranslate( 0.4, 0.4, 0.0); // 'set' means DISCARD old matrix,
  // (drawing axes centered in CVV), and then make new
  // drawing axes moved to the lower-left corner of CVV.
  g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
														  // to match WebGL display canvas.
  g_modelMatrix.scale(0.3, 0.3, 0.3);
  // Make it smaller:
  g_modelMatrix.rotate(currentAngle , 1, 1, 0);  // Spin on XY diagonal axis
// Drawing:		
// Pass our current matrix to the vertex shaders:
   gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
// Draw just the sphere's vertices
   gl.drawArrays(gl.TRIANGLE_STRIP,	49,	// start at this vertex number, and 
	      sphVerts.length/floatsPerVertex);
   */





  // NEXT, create different drawing axes, and...
  g_modelMatrix.setTranslate(0.8, 0.6, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV.
  g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  g_modelMatrix.scale(0.1, 0.1, 0.1);				// Make it smaller.
  
  // Mouse-Dragging for Rotation:
	//-----------------------------
	// Attempt 1:  X-axis, then Y-axis rotation:
/*  						// First, rotate around x-axis by the amount of -y-axis dragging:
  g_modelMatrix.rotate(-g_yMdragTot*120.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
  						// Then rotate around y-axis by the amount of x-axis dragging
	g_modelMatrix.rotate( g_xMdragTot*120.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
				// Acts SENSIBLY if I always drag mouse to turn on Y axis, then X axis.
				// Acts WEIRDLY if I drag mouse to turn on X axis first, then Y axis.
*/
	//-----------------------------

	// Attempt 2: perp-axis rotation:
							// rotate on axis perpendicular to the mouse-drag direction:
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
	g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 12,36);
	g_modelMatrix.translate(0.0, 1.6, 0.0);
	g_modelMatrix.scale(1.0,1.1, 1.0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0,12);
}







function drawArm(){
//g_modelMatrix.rotate(g_angle0now, 0, 0, 1);  // Make new drawing axes that
// that spin around z axis (0,0,1) of the previous 
// drawing axes, using the same origin.
g_modelMatrix.translate(-0.5, 0,0);	
g_modelMatrix.scale(0.7,0.3,0.4);					
  // around the MIDDLE of it's lower edge, and not the left corner.
// DRAW BOX:  Use this matrix to transform & draw our VBO's contents:
// Pass our current matrix to the vertex shaders:
gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
// Draw the rectangle held in the VBO we created in initVertexBuffers().
DrawCube()	// draw all vertices.
//-------Draw Upper Arm----------------
g_modelMatrix.translate(1.4, 0.1, 0); 			// Make new drawing axes that
// we moved upwards (+y) measured in prev. drawing axes, and
// moved rightwards (+x) by half the width of the box we just drew.
g_modelMatrix.scale(0.8,0.7,0.6);				// Make new drawing axes that
// are smaller that the previous drawing axes by 0.6.
g_modelMatrix.rotate(g_angle1now, 0,0,1);	// Make new drawing axes that
// spin around Z axis (0,0,1) of the previous drawing 
// axes, using the same origin.
g_modelMatrix.translate(-0.1, 0, 0);			// Make new drawing axes that
// move sideways by half the width of our rectangle model
// (REMEMBER! g_modelMatrix.scale() DIDN'T change the 
// the vertices of our model stored in our VBO; instead
// we changed the DRAWING AXES used to draw it. Thus
// we translate by the 0.1, not 0.1*0.6.)
// DRAW BOX: Use this matrix to transform & draw our VBO's contents:
gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
DrawCube()	// draw all vertices.

// DRAW PINCERS:====================================================
    g_modelMatrix.translate(1.5, 0.5, 0.0);	// Make new drawing axes at 
	pushMatrix(g_modelMatrix);
// the robot's "wrist" -- at the center top of upper arm
    //------upper-1
    g_modelMatrix.rotate(g_angle2now, 0,0,1);		
										// make new drawing axes that rotate for lower-jaw
	g_modelMatrix.scale(0.4, 0.2, 0.3);	
		
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube()
	//----upper-2			
    g_modelMatrix.translate(-1, 0, 0.0);
	g_modelMatrix.rotate(30.0, 0,0,1);		// make bend in the lower jaw
	g_modelMatrix.translate(3, 0.0, 0.0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube()
	g_modelMatrix = popMatrix();
    //-----lower-1
    
    g_modelMatrix.rotate(-g_angle2now, 0,0,1);		
								// make new drawing axes that rotate upper jaw symmetrically
								// with lower jaw: changed sign of 15.0 and of 0.5
	g_modelMatrix.scale(0.4, 0.2, 0.3);		// Make new drawing axes that
								// have size of just 40% of previous drawing axes,
    g_modelMatrix.translate(-1, -3, 0.0);  // move box LEFT corner at wrist-point.
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube()
	
	//-----lower-2
	g_modelMatrix.translate(-1,0, 0.0);
	g_modelMatrix.rotate(-30.0, 0,0,1);		// make bend in the upper jaw that																			// is opposite of lower jaw (+/-40.0)
	g_modelMatrix.translate(3, 1, 0.0);
			// Draw inner upper jaw segment:				(same as for lower jaw)
		  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube()
    
	
}
function drawleg(){
	g_modelMatrix.scale(0.4, 0.4, 0.3);
	g_modelMatrix.rotate(g_angle4now , 1,0,0);  // Make new drawing axes that
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.scale(0.6, 0.7, 1);
	g_modelMatrix.translate(0, -2, 0);
	g_modelMatrix.rotate(g_angle4now , 1, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.scale(0.8, 1, 1.0);
	g_modelMatrix.translate(0, -2, 0);
	g_modelMatrix.rotate(g_angle4now , 0, 1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
}
 function DrawCube(){
	gl.drawArrays(gl.TRIANGLES, 12,36);
 }

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();


	
function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  //var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  //return newAngle %= 360;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:

//  if(angle >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
//  if(angle <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
  
  g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
  if(g_angle01 <-180.0) g_angle01 = g_angle01 + 360.0;

	g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  if(g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
  if(g_angle02 <-180.0) g_angle02 = g_angle02 + 360.0;
  
  if(g_angle02 > 45.0 && g_angle02Rate > 0) g_angle02Rate *= -1.0;
  if(g_angle02 < 0.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;
   

//=============================================================================
	// Find new values for all time-varying parameters used for on-screen drawing.
	// HINT: this is ugly, repetive code!  Could you write a better version?
	// 			 would it make sense to create a 'timer' or 'animator' class? Hmmmm...
	//
	  // use local variables to find the elapsed time:
	  var nowMS = Date.now();             // current time (in milliseconds)
	  var elapsedMS = nowMS - g_lastMS;   // 
	  g_lastMS = nowMS;                   // update for next webGL drawing.
	  if(elapsedMS > 1000.0) {            
		// Browsers won't re-draw 'canvas' element that isn't visible on-screen 
		// (user chose a different browser tab, etc.); when users make the browser
		// window visible again our resulting 'elapsedMS' value has gotten HUGE.
		// Instead of allowing a HUGE change in all our time-dependent parameters,
		// let's pretend that only a nominal 1/30th second passed:
		elapsedMS = 1000.0/30.0;
		}
	  // Find new time-dependent parameters using the current or elapsed time:
	  g_angle0now += g_angle0rate * g_angle0brake * (elapsedMS * 0.001);	// update.
	  g_angle1now += g_angle1rate * g_angle1brake * (elapsedMS * 0.001);
	  g_angle2now += g_angle2rate * g_angle2brake * (elapsedMS * 0.001);
	  g_angle4now += g_angle4rate * g_angle4brake * (elapsedMS * 0.001);
	  // apply angle limits:  going above max, or below min? reverse direction!
	  // (!CAUTION! if max < min, then these limits do nothing...)
	  if((g_angle0now >= g_angle0max && g_angle0rate > 0) || // going over max, or
		   (g_angle0now <= g_angle0min && g_angle0rate < 0)  ) // going under min ?
		   g_angle0rate *= -1;	// YES: reverse direction.
	  if((g_angle1now >= g_angle1max && g_angle1rate > 0) || // going over max, or
		   (g_angle1now <= g_angle1min && g_angle1rate < 0) )	 // going under min ?
		   g_angle1rate *= -1;	// YES: reverse direction.
	  if((g_angle2now >= g_angle2max && g_angle2rate > 0) || // going over max, or
		   (g_angle2now <= g_angle2min && g_angle2rate < 0) )	 // going under min ?
		   g_angle2rate *= -1;	// YES: reverse direction.
	  if((g_angle3now >= g_angle3max && g_angle3rate > 0) || // going over max, or
		   (g_angle3now <= g_angle3min && g_angle3rate < 0) )	 // going under min ?
		   g_angle3rate *= -1;	// YES: reverse direction.
	  if((g_angle4now >= g_angle4max && g_angle4rate > 0) || // going over max, or
		   (g_angle4now <= g_angle4min && g_angle4rate < 0) )	 // going under min ?
		   g_angle4rate *= -1;
		// *NO* limits? Don't let angles go to infinity! cycle within -180 to +180.
		if(g_angle0min > g_angle0max)	
		{// if min and max don't limit the angle, then
			if(     g_angle0now < -180.0) g_angle0now += 360.0;	// go to >= -180.0 or
			else if(g_angle0now >  180.0) g_angle0now -= 360.0;	// go to <= +180.0
		}
		if(g_angle1min > g_angle1max)
		{
			if(     g_angle1now < -180.0) g_angle1now += 360.0;	// go to >= -180.0 or
			else if(g_angle1now >  180.0) g_angle1now -= 360.0;	// go to <= +180.0
		}
		if(g_angle2min > g_angle2max)
		{
			if(     g_angle2now < -100.0) g_angle2now += 360.0;	// go to >= -180.0 or
			else if(g_angle2now >  100.0) g_angle2now -= 360.0;	// go to <= +180.0
		}
		if(g_angle3min > g_angle3max)
		{
			if(     g_angle3now < -180.0) g_angle3now += 360.0;	// go to >= -180.0 or
			else if(g_angle3now >  180.0) g_angle3now -= 360.0;	// go to <= +180.0
		}
		if(g_angle4min > g_angle4max)
		{
			if(     g_angle4now < -180.0) g_angle4now += 360.0;	// go to >= -180.0 or
			else if(g_angle4now >  180.0) g_angle4now -= 360.0;	// go to <= +180.0
		}

	}



//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_angle01Rate += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_angle01Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
    myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	g_angle01Rate = myTmp;  // use the stored rate.
  }
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	document.getElementById('MouseDragResult').innerHTML = 
	  'Mouse Drag: '+(x - g_xMclik).toFixed(g_digits)+', ' 
	  					  +(y - g_yMclik).toFixed(g_digits);

	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',
		g_xMdragTot.toFixed(g_digits),',\t',g_yMdragTot.toFixed(g_digits));
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
  document.getElementById('KeyModResult' ).innerHTML = ''; 
  // key details:
  document.getElementById('KeyModResult' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
 
	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found a/A key. Strafe LEFT!';
			move_x -=0.05
			break;
    case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found d/D key. Strafe RIGHT!';
			move_x +=0.05
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found s/Sa key. Move BACK.';
			move_y -=0.05
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found w/W key. Move FWD!';
			move_y +=0.05
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			  move_x -=0.05
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
			  move_x +=0.05
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			  move_y +=0.05
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
			  move_y -=0.05
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
