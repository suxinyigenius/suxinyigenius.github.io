
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
	'uniform mat4 u_MvpMatrix;\n' +

  'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
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

var gl;
var canvas = document.getElementById('webgl');

// Global Variables
//? Keys
const UP_ARROW    = 38;
const LEFT_ARROW  = 37;
const RIGHT_ARROW = 39;
const DOWN_ARROW  = 40;

const W = 87;
const A = 65;
const S = 83;
const D = 68;
var g_lastMS = Date.now(); 

// ! For Quaternion Mouse Drag =================================================

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot

// ! ============================================================================

var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.

var g_camX = 5, g_camY = 5, g_camZ = 5; //! Location of our camera
var g_lookX = 4, g_lookY = 4, g_lookZ = 4.5; //! Where our camera is looking

var g_angle = 215;

var g_aimZDiff = g_lookZ - g_camZ;

var g_rate = 3.0;

// For Animation 
var currentangle = 0.0;                  // initial rotation angle
var currentangleRate = 45.0;           // rotation speed, in degrees/second 





var g_angle0now  =   0.0;       // init Current rotation angle, in degrees
var g_angle0rate = -22.0;       // init Rotation angle rate, in degrees/second.
var g_angle0brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle0min  =-140.0;       // init min, max allowed angle, in degrees.
var g_angle0max  =  40.0; 
                                   // elapsed since last on-screen image.
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

function main() {
//==============================================================================
  // Retrieve <canvas> element

	
	window.addEventListener('keydown', keyDown, false);
	
	canvas.onmouseup = (ev) => mouseUp(ev, gl, canvas);
	canvas.onmousedown = (ev) => mouseDown(ev, gl, canvas);
	canvas.onmousemove = (ev) => mouseMove(ev, gl, canvas);
	
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.9, 0.8, 1.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 	 
	 

  // Get handle to graphics system's storage location of u_ModelMatrix
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
	}

	// Create a local version of our model matrix in JavaScript 
	var modelMatrix = new Matrix4();
	var viewMatrix = new Matrix4();
	var projMatrix = new Matrix4();
	var mvpMatrix = new Matrix4();

  // Create, init current rotation angle value in JavaScript
	var currentAngle = 0.0;
	

//-----------------  
  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
	currentAngle = animate(currentAngle);  // Update the rotation angle
    canvas = drawResize(canvas)
    drawAll(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix);   // Draw shapes

    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
    
}

function drawResize() {
  
  canvas.width = innerWidth - 20;
  canvas.height = (innerHeight*2/3) - 20;
  
  return canvas    // draw in all viewports.
}


function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
	 // Make each 3D shape in its own array of vertices:
				// create, fill the pyrVerts array
    makeCylinder();					// create, fill the cylVerts array
    makeSphere();						// create, fill the sphVerts array
    makeTorus();
    makehead();
    makecube();
    makeAxis();							// create, fill the torVerts array
	makeGroundGrid();				// create, fill the gndVerts array
  // how many floats total needed to store all shapes?
	var mySiz = (cylVerts.length + sphVerts.length +  axis.length +
							 torVerts.length + gndVerts.length + headVerts.length+cubeVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		colorShapes[i] = torVerts[j];
		}
		gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}
	
		headstart =i;
	for(j=0;j<headVerts.length;i++,j++){
		colorShapes[i]=headVerts[j];
	    }
	    cubestart = i;
	for(j=0; j< cubeVerts.length; i++, j++) {
		colorShapes[i] = cubeVerts[j];
		}
    axisStart = i;
  for(j=0; j<axis.length; i++, j++){  // store the axis
    colorShapes[i] = axis[j];
    }

  // Create a buffer object on the graphics hardware:
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
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
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
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
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

  return nn;
}

// simple & quick-- 
// I didn't use any arguments such as color choices, # of verts,slices,bars, etc.
// YOU can improve these functions to accept useful arguments...
//
function makehead() {
    headVerts = new Float32Array([
	0.0, 1.0, 0.0, 1.0,			0.52,  0.44,  1.0,	// Node 0
	-1.0, -1.0, 1.0, 1.0, 		1.0,  0.8,  0.7, 	// Node 1
	1.0,  -1.0, 1.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
					 // Face 1: (right side)
	0.0,  1.0,  0.0, 1.0,		0.6,  1,  0.6,	// Node 0
	1.0,  -1.0, 1.0, 1.0,  		1.0,  0.0,  1.0,	// Node 2
	1.0, -1.0, -1.0, 1.0, 		0.94,  0.97,  1.0, 	// Node 3
				 // Face 2: (lower side)
	0.0,  1.0, 0.0, 1.0,		0.6,  0.6,  1.0,	// Node 0 
	1.0, -1.0, -1.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3
	-1.0, -1.0, -1.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1 
				  // Face 3: (base side)  
	0.0, 1.0, 0.0, 1.0, 		1.0,  0.9,  0.5, 	// Node 3
	-1.0,  -1.0, -1.0, 1.0,  	    1.0,  1.0,  1.0,	// Node 2
    -1.0, -1.0, 1.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1
	]);
	
}
function makecube(){
	cubeVerts = new Float32Array([
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
}





function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]; 
			cylVerts[j+5]=ctrColr[1]; 
			cylVerts[j+6]=ctrColr[2];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]; 
			cylVerts[j+5]=topColr[1]; 
			cylVerts[j+6]=topColr[2];			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]; 
				cylVerts[j+5]=topColr[1]; 
				cylVerts[j+6]=topColr[2];			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botColr[0]; 
				cylVerts[j+5]=botColr[1]; 
				cylVerts[j+6]=botColr[2];			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];
		}
	}
}

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
  var sliceAngle = Math.PI/slices;	// latitude angle spanned by one slice.

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

function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.  
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
// around the bar's centerline, circling right-handed along the direction 
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.  
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi); 
//					yc = 0; 
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta) 	
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta) 
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' 
// along the length of the bent bar; successive rings of constant-theta, using 
// the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
// makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
// for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets, 
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}
function Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix){
  modelMatrix.scale(1,1,1)
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.LINES, axisStart/floatsPerVertex,6);
}
function makeAxis(){
  axis = new Float32Array([
    0.0,  0.0,  0.0, 1.0,   1.0,  0.0,  0.0,
    1.9,  0.0,  0.0, 1.0,   1.0,  0.0,  0.0,  //             
    
    0.0,  0.0,  0.0, 1.0,       0.0,  1.0,  0.0,  // 
    0.0,  1.9,  0.0, 1.0,   0.0,  1.0,  0.0,  //             (endpoint: green)

    0.0,  0.0,  0.0, 1.0,   0.0,  0.0,  1.0,  //
    0.0,  0.0,  1.9, 1.0,   0.0,  1.0,  1.0,  //             (endpoint: blue)
    ]);
}

function drawAll(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  var far=20;
  var near = 1;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	resetIdentity(mvpMatrix, projMatrix, viewMatrix, modelMatrix);

	g_lookX = g_camX + Math.cos(toRadians(g_angle));
	g_lookY = g_camY + Math.sin(toRadians(g_angle));
	g_lookZ = g_camZ + g_aimZDiff;

	gl.viewport(0, 0, innerWidth / 2, innerHeight);

	viewMatrix.setLookAt( g_camX,  g_camY,  g_camZ, // center of projection
										 g_lookX, g_lookY, g_lookZ, // look-at point
										 0.0,     0.0,     1.0); // View UP vector
	
	projMatrix.setPerspective(35.0, // FOVY
			                 canvas.width/canvas.height/2, // Aspect ratio
									near, // z-near
									far /* z-far */);


	drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix);
//---------------the right viewport--------
	resetIdentity(mvpMatrix, projMatrix, viewMatrix, modelMatrix);

	viewMatrix.setLookAt( g_camX,  g_camY,  g_camZ, // center of projection
										 g_lookX, g_lookY, g_lookZ, // look-at point
										 0.0,     0.0,     1.0); // View UP vector
  var vpAspect = canvas.width/2 / (canvas.height);
	var hei = 2.0*((far-near)/3)*Math.tan((35 * 0.5) * (Math.PI/180));
	var wid = hei*vpAspect;
	projMatrix.setOrtho(-wid ,wid, -hei, hei, near,far);

	gl.viewport(innerWidth / 2, 0, innerWidth/2, innerHeight);

	drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix);
}

function drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix) {
	
	
  modelMatrix.setIdentity(); 
  
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

 
  pushMatrix(modelMatrix); 
  // SAVE world coord system;
    	
      //-------Draw Spinning Cylinder:

    modelMatrix.translate(-0.8,-1.4, 0.3);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    modelMatrix.scale(0.2, 0.2, 0.2);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
		modelMatrix.rotate(0, 0, 1, 0); 
		modelMatrix.rotate(currentAngle, 0, 1, 1);
		modelMatrix.scale(0.6,0.6,1.5)
		mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
		gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.LINES, axisStart/floatsPerVertex,axis.length/floatsPerVertex);
	
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);

	modelMatrix.translate(0.2,0.2,1.7); 
	modelMatrix.scale(2.0, 2.0, 0.6);
	modelMatrix.rotate(90, 1, 0, 0); 
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,headstart/floatsPerVertex,headVerts.length/floatsPerVertex);

    modelMatrix.translate(0 ,1.8, 0); 
	modelMatrix.scale(0.9, 0.9, 0.9);
	modelMatrix.rotate(g_angle2now, 1, 0, 0); 
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,headstart/floatsPerVertex,headVerts.length/floatsPerVertex);

	modelMatrix.translate(0 ,1.8, 0); 
	modelMatrix.scale(0.8, 0.8, 1);
	modelMatrix.rotate(g_angle2now, 1, 0, 0); 
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,headstart/floatsPerVertex,headVerts.length/floatsPerVertex);

									
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
   
  pushMatrix(modelMatrix); 

  Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix)
    
    //--------Draw Spinning Sphere
    modelMatrix.translate( -0.7, 2.0, 0.3); // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV.
                          // to match WebGL display canvas.
    modelMatrix.scale(0.3, 0.3, 0.3);
								// Make it smaller:
		
	  //modelMatrix.rotate(g_angle + 90, 0.0, 0.0, 1.0); // make sure Quaternion rotation works at all camera angles
	  //quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
      quatMatrix.setFromQuat(qTot.x*Math.cos(toRadians(g_angle+90))-qTot.y*Math.sin(toRadians(g_angle+90)), 
							qTot.x*Math.sin(toRadians(g_angle+90))+qTot.y*Math.cos(toRadians(g_angle+90)),
							qTot.z, 
							qTot.w);
	  modelMatrix.concat(quatMatrix);	// apply that matrix.
  
	  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.LINES, axisStart/floatsPerVertex,axis.length/floatsPerVertex);
  
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
									sphVerts.length/floatsPerVertex);	
	modelMatrix.translate(0,0,1.7)								
	modelMatrix.scale(0.7, 0.7, 0.7);	
	modelMatrix.rotate(g_angle2now, 0, 1, 0); 
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);											
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
									sphVerts.length/floatsPerVertex);				
	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
	
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
  //--------Draw Spinning torus
    modelMatrix.translate(-0.8, 0.4, 0.0);	// 'set' means DISCARD old matrix,
  
    modelMatrix.scale(0.3, 0.3, 0.3);
    						// Make it smaller:
    modelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, mvpMatrix, u_MvpMatrix)
	  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    		// Draw just the torus's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
    						  torStart/floatsPerVertex,	// start at this vertex number, and
    						  torVerts.length/floatsPerVertex);
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
    						  torStart/floatsPerVertex,	// start at this vertex number, and
    						  torVerts.length/floatsPerVertex);						  	// draw this many vertices.
  modelMatrix = popMatrix(); 
 
  modelMatrix.setIdentity();
  //--------Draw body
  pushMatrix(modelMatrix);

  modelMatrix.translate(0.8,0, 0.0); 
  modelMatrix.scale(0.4, 0.4, 0.4);
  modelMatrix.rotate(currentAngle, 0, 1, 0); 
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
  
       //------Draw Head
    modelMatrix.translate(0.2,0, 1.6); 
	modelMatrix.scale(0.7, 0.7, 0.7);
	modelMatrix.rotate(270, 1, 0, 0); 
	
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,headstart/floatsPerVertex,headVerts.length/floatsPerVertex);
	
    //----Draw Arm
	
    pushMatrix(modelMatrix);
	modelMatrix.translate(-2.1, 2,0);	
	modelMatrix.scale(0.7,0.3,0.4);	
	modelMatrix.rotate(g_angle2now , 1,0,0);				
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix.translate(-2, 0.1, 0); 			// Make new drawing axes that
    modelMatrix.scale(0.8,0.8,0.8);				// Make new drawing axes that
    modelMatrix.rotate(g_angle1now, 0,0,1);	// Make new drawing axes that
    modelMatrix.translate(-0.1, 0, 0);			// Make new drawing axes that
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);	// draw all vertices.   .
	

    modelMatrix.translate(-1.8, 2, 0.0);
    	// Make new drawing axes at 
	pushMatrix(modelMatrix);
    // the robot's "wrist" -- at the center top of upper arm
    //------upper-1
    modelMatrix.rotate(g_angle2now, 0,0,1);		
										// make new drawing axes that rotate for lower-jaw
	modelMatrix.scale(0.4, 0.3, 0.4);	
		
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	//----upper-2			
    modelMatrix.translate(-1, 0, 0.0);
	modelMatrix.rotate(30.0, 0,0,1);		// make bend in the lower jaw
	modelMatrix.translate(3, 0.0, 0.0);
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix();

    //-----lower-1
    
    modelMatrix.rotate(-g_angle2now, 0,0,1);		
								// make new drawing axes that rotate upper jaw symmetrically
								// with lower jaw: changed sign of 15.0 and of 0.5
	modelMatrix.scale(0.4, 0.2, 0.3);		// Make new drawing axes that
								// have size of just 40% of previous drawing axes,
    modelMatrix.translate(-1, -3, 0.0);  // move box LEFT corner at wrist-point.
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	//-----lower-2
	modelMatrix.translate(-1,0, 0.0);
	modelMatrix.rotate(-30.0, 0,0,1);		// make bend in the upper jaw that																			// is opposite of lower jaw (+/-40.0)
	modelMatrix.translate(3, 1, 0.0);
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix(); 
	
	
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.9, 2,0);	
	modelMatrix.scale(0.7,0.3,0.4);	
	modelMatrix.rotate(g_angle2now , 1,0,0);				
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix.translate(1.8, 0.1, 0); 			// Make new drawing axes that
    modelMatrix.scale(0.8,0.8,0.8);				// Make new drawing axes that
    modelMatrix.rotate(g_angle1now, 0,0,1);	// Make new drawing axes that
    modelMatrix.translate(-0.1, 0, 0);			// Make new drawing axes that
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);

	modelMatrix.translate(2, 1.5, 0.0);	// Make new drawing axes at 
	pushMatrix(modelMatrix);
    // the robot's "wrist" -- at the center top of upper arm
    //------upper-1
    modelMatrix.rotate(g_angle2now, 0,0,1);		
										// make new drawing axes that rotate for lower-jaw
	modelMatrix.scale(0.4, 0.3, 0.4);	
		
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	//----upper-2			
    modelMatrix.translate(-1, 0, 0.0);
	modelMatrix.rotate(30.0, 0,0,1);		// make bend in the lower jaw
	modelMatrix.translate(3, 0.0, 0.0);
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix();
    //-----lower-1
    
    modelMatrix.rotate(-g_angle2now, 0,0,1);		
								// make new drawing axes that rotate upper jaw symmetrically
								// with lower jaw: changed sign of 15.0 and of 0.5
	modelMatrix.scale(0.4, 0.2, 0.3);		// Make new drawing axes that
								// have size of just 40% of previous drawing axes,
    modelMatrix.translate(-1, -3, 0.0);  // move box LEFT corner at wrist-point.
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	//-----lower-2
	modelMatrix.translate(-1,0, 0.0);
	modelMatrix.rotate(-30.0, 0,0,1);		// make bend in the upper jaw that																			// is opposite of lower jaw (+/-40.0)
	modelMatrix.translate(3, 1, 0.0);
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix(); 
    
    
   
   //-----Draw leg
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.5, 4.3, 0);
    modelMatrix.rotate(180,1,0,0);
	modelMatrix.scale(1.0,0.9,1.3);
    modelMatrix.scale(0.4, 0.6, 0.3);
	modelMatrix.rotate(g_angle4now , 1, 0, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
    modelMatrix.scale(0.6, 0.9, 1);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.rotate(g_angle4now , 1, 0, 0);
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
    modelMatrix.scale(0.8, 0.9, 1.0);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.rotate(g_angle4now , 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix(); 
	
	pushMatrix(modelMatrix);
    modelMatrix.translate(-1.3, 4.3, 0);
    modelMatrix.rotate(180,1,0,0);
	modelMatrix.scale(1.0,0.9,1.3);
    modelMatrix.scale(0.4, 0.6, 0.3);
	modelMatrix.rotate(g_angle4now , 1, 0, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
    modelMatrix.scale(0.6, 0.9, 1);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.rotate(g_angle4now , 1, 0, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
    modelMatrix.scale(0.8, 0.9, 1.0);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.rotate(g_angle4now , 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP,cubestart/floatsPerVertex,cubeVerts.length/floatsPerVertex);
	modelMatrix = popMatrix();

	modelMatrix.setIdentity();
    pushMatrix(modelMatrix);  // SAVE world drawing coords.
  	//---------Draw Ground Plane, without spinning.
  	// position it.
  	modelMatrix.translate( 0.4, -0.4, 0.0);	
  	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:

  	// Drawing:
  	// Pass our current matrix to the vertex shaders:
	  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    // Draw just the ground-plane's vertices
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    						  gndStart/floatsPerVertex,	// start at this vertex number, and
    						  gndVerts.length/floatsPerVertex);	// draw this many vertices.
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

  //===========================================================
}




function resetIdentity(mvpMatrix, projMatrix, viewMatrix, modelMatrix) {
	modelMatrix.setIdentity();  
	projMatrix.setIdentity();
	viewMatrix.setIdentity();
	mvpMatrix.setIdentity();
}



// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;    
 
  var currentanglemin = -60.0;
  var currentanglemax =  60.0;


	// Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -120 degrees:
  if(currentangle >  currentanglemax && currentangleRate > 0) currentangleRate = -currentangleRate;
	if(currentangle <  currentanglemin && currentangleRate < 0) currentangleRate = -currentangleRate;

	
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
   var nowMS = Date.now();             // current time (in milliseconds)
  var elapsedMS = nowMS - g_lastMS;   // 
  g_lastMS = nowMS;                   // update for next webGL drawing.
  if(elapsedMS > 1000.0) {            
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
  return newAngle %= 360;
}



function keyDown(ev) {

	var xd = g_camX - g_lookX;
	var yd = g_camY - g_lookY;
	var zd = g_camZ - g_lookZ;

	var len = Math.sqrt(Math.pow(xd, 2) + Math.pow(yd, 2) + Math.pow(zd, 2));

	var moveRateRad = toRadians(g_rate);
	
	switch(ev.keyCode) {
		case LEFT_ARROW:
			g_angle += g_rate;

			if(g_angle > 360) g_angle -= 360.0;
			if(g_angle < 0) g_angle += 360.0;

			break;
		case RIGHT_ARROW: 
			g_angle -= g_rate;

			if(g_angle > 360) g_angle -= 360.0;
			if(g_angle < 0) g_angle += 360.0;

			break;
		case UP_ARROW:
			g_aimZDiff += moveRateRad;
			break;
		case DOWN_ARROW:
			g_aimZDiff -= moveRateRad;
			break;
		case W: 
			g_lookX -= (xd / len);
			g_lookY -= (yd / len);
			g_lookZ -= (zd / len);

			g_camX -= (xd / len);
			g_camY -= (yd / len);
			g_camZ -= (zd / len);

			break;
		case S: 
			g_lookX += (xd / len);
			g_lookY += (yd / len);
			g_lookZ += (zd / len);

			g_camX += (xd / len);
			g_camY += (yd / len);
			g_camZ += (zd / len);

			break;
		case A:
			var xStrafe = Math.cos(toRadians(g_angle + 90));
			var yStrafe = Math.sin(toRadians(g_angle + 90));

			g_camX += xStrafe / len;
			g_camY += yStrafe / len;

			break;
		case D:
			var xStrafe = Math.cos(toRadians(g_angle + 90));
			var yStrafe = Math.sin(toRadians(g_angle + 90));

			g_camX -= xStrafe / len;
			g_camY -= yStrafe / len;

			break;
	}
	
}

function mouseDown(ev,gl, canvas) {
	//==============================================================================
	// Called when user PRESSES down any mouse button;
	// 									(Which button?    console.log('ev.button='+ev.button);   )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
		
		// Convert to Canonical View Volume (CVV) coordinates too:
		var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
								 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		isDrag = true;											// set our mouse-dragging flag
		xMclik = x;													// record where mouse-dragging began
		yMclik = y;
};

function mouseMove(ev, gl, canvas) {
	//==============================================================================
	// Called when user MOVES the mouse with a button already pressed down.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

		if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

		// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
		
		// Convert to Canonical View Volume (CVV) coordinates too:
		var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
								(canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								(canvas.height/2);

		// find how far we dragged the mouse:
		xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
		yMdragTot += (y - yMclik);
		// AND use any mouse-dragging we found to update quaternions qNew and qTot.
		dragQuat(-(x - xMclik), -(y - yMclik));
		
		xMclik = x;													// Make NEXT drag-measurement from here.
		yMclik = y;
	
};

function mouseUp(ev, gl, canvas) {
	//==============================================================================
	// Called when user RELEASES mouse button pressed previously.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
		
		// Convert to Canonical View Volume (CVV) coordinates too:
		var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
								 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
		
		isDrag = false;											// CLEAR our mouse-dragging flag, and
		// accumulate any final bit of mouse-dragging we did:
		xMdragTot += (x - xMclik);
		yMdragTot += (y - yMclik);
	//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
	
		// AND use any mouse-dragging we found to update quaternions qNew and qTot;
		dragQuat(-(x - xMclik),-( y - yMclik));
	
};

function dragQuat(xdrag, ydrag) {
	//==============================================================================
	// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
	// We find a rotation axis perpendicular to the drag direction, and convert the 
	// drag distance to an angular rotation amount, and use both to set the value of 
	// the quaternion qNew.  We then combine this new rotation with the current 
	// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
	// 'draw()' function converts this current 'qTot' quaternion to a rotation 
	// matrix for drawing. 
		var res = 5;
		var qTmp = new Quaternion(0,0,0,1);
		
		var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
		// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
		qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
		// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
								// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
								// -- to rotate around +x axis, drag mouse in -y direction.
								// -- to rotate around +y axis, drag mouse in +x direction.
								
		qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
		//--------------------------
		// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
		// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
		// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
		// first by qTot, and then by qNew--we would apply mouse-dragging rotations
		// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
		// rotations FIRST, before we apply rotations from all the previous dragging.
		//------------------------
		// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
		// them with finite precision. While the product of two (EXACTLY) unit-length
		// quaternions will always be another unit-length quaternion, the qTmp length
		// may drift away from 1.0 if we repeat this quaternion multiply many times.
		// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
		// Matrix4.prototype.setFromQuat().
		qTmp.normalize();						// normalize to ensure we stay at length==1.0.
		qTot.copy(qTmp);
}

function toRadians(angle) {
	return angle * (Math.PI/180);
}


//==================HTML Button Callbacks
function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
		myTmp = ANGLE_STEP;
		ANGLE_STEP = 0;
		
  }
  else {
		ANGLE_STEP = myTmp;
		;  // use the stored rate.
		
  }
}
 