//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// TABS set to 2.
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// JT_MultiShader.js  for EECS 351-1,
//									Northwestern Univ. Jack Tumblin

// Jack Tumblin's Project C -- step by step.

/* Show how to use 3 separate VBOs with different verts, attributes & uniforms.
-------------------------------------------------------------------------------
	Create a 'VBObox' object/class/prototype & library to collect, hold & use all
	data and functions we need to render a set of vertices kept in one Vertex
	Buffer Object (VBO) on-screen, including:
	--All source code for all Vertex Shader(s) and Fragment shader(s) we may use
		to render the vertices stored in this VBO;
	--all variables needed to select and access this object's VBO, shaders,
		uniforms, attributes, samplers, texture buffers, and any misc. items.
	--all variables that hold values (uniforms, vertex arrays, element arrays) we
	  will transfer to the GPU to enable it to render the vertices in our VBO.
	--all user functions: init(), draw(), adjust(), reload(), empty(), restore().
	Put all of it into 'JT_VBObox-Lib.js', a separate library file.

USAGE:
------
1) If your program needs another shader program, make another VBObox object:
 (e.g. an easy vertex & fragment shader program for drawing a ground-plane grid;
 a fancier shader program for drawing Gouraud-shaded, Phong-lit surfaces,
 another shader program for drawing Phong-shaded, Phong-lit surfaces, and
 a shader program for multi-textured bump-mapped Phong-shaded & lit surfaces...)

 HOW:
 a) COPY CODE: create a new VBObox object by renaming a copy of an existing
 VBObox object already given to you in the VBObox-Lib.js file.
 (e.g. copy VBObox1 code to make a VBObox3 object).

 b) CREATE YOUR NEW, GLOBAL VBObox object.
 For simplicity, make it a global variable. As you only have ONE of these
 objects, its global scope is unlikely to cause confusions/errors, and you can
 avoid its too-frequent use as a function argument.
 (e.g. above main(), write:    var phongBox = new VBObox3();  )

 c) INITIALIZE: in your JS progam's main() function, initialize your new VBObox;
 (e.g. inside main(), write:  phongBox.init(); )

 d) DRAW: in the JS function that performs all your webGL-drawing tasks, draw
 your new VBObox's contents on-screen.
 (NOTE: as it's a COPY of an earlier VBObox, your new VBObox's on-screen results
  should duplicate the initial drawing made by the VBObox you copied.
  If that earlier drawing begins with the exact same initial position and makes
  the exact same animated moves, then it will hide your new VBObox's drawings!
  --THUS-- be sure to comment out the earlier VBObox's draw() function call
  to see the draw() result of your new VBObox on-screen).
  (e.g. inside drawAll(), add this:
      phongBox.switchToMe();
      phongBox.draw();            )

 e) ADJUST: Inside the JS function that animates your webGL drawing by adjusting
 uniforms (updates to ModelMatrix, etc) call the 'adjust' function for each of your
VBOboxes.  Move all the uniform-adjusting operations from that JS function into the
'adjust()' functions for each VBObox.

2) Customize the VBObox contents; add vertices, add attributes, add uniforms.
 ==============================================================================*/


// Global Variables
//   (These are almost always a BAD IDEA, but here they eliminate lots of
//    tedious function arguments.
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#
var g_EyeX = 0;
var g_EyeY = 19.00;
var g_EyeZ = 10.00;
var g_LookAtX = 0;
var g_LookAtY = 0;
var g_LookAtZ = 0;

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
vbo2Box = new VBObox2();     // "  "  for second set of custom-shaded 3D parts
vbo3Box = new VBObox3();
vbo4Box = new VBObox4();
vbo5Box = new VBObox5();
vbo6Box = new VBObox6();
vbo7Box = new VBObox7();

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our
// most-recently-drawn WebGL screen contents.
// Set & used by moveAll() fcn to update all
// time-varying params for our webGL drawings.
// All time-dependent params (you can add more!)
var g_angleNow0  =  0.0; 			  // Current rotation angle, in degrees.
var g_angleRate0 = 45.0;				// Rotation angle rate, in degrees/second.
//---------------
var g_angleNow1  = 0.0;       // current angle, in degrees
var g_angleRate1 =  6.0;        // rotation angle rate, degrees/sec
var g_angleMax1  = 6.0;       // max, min allowed angle, in degrees
var g_angleMin1  =  -5.0;
//---------------
var g_angleNow2  =  0.0; 			  // Current rotation angle, in degrees.
var g_angleRate2 = -62.0;	



//---------------
var g_posNow0 =  0.0;           // current position
var g_posRate0 = 6.6;           // position change rate, in distance/second.
var g_posMax0 =  6.5;           // max, min allowed for g_posNow;
var g_posMin0 = -6.5;
// ------------------
var g_posNow1 =  0.0;           // current position
var g_posRate1 = 50;           // position change rate, in distance/second.
var g_posMax1 =  55.0;           // max, min allowed positions
var g_posMin1 = 0.0;
//---------------

// For mouse/keyboard:------------------------
var g_show0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.								// 	"					"			VBO1		"				"				"
var g_show2 = 1;                //  "         "     VBO2    "       "       "
var g_show3 = 1;
var g_show4 = 1;
var g_show5 = 0;
var g_show6 = 1;
var g_show7 = 1;
var arColor;
var agColor;
var abColor;
var drColor;
var dgColor;
var dbColor;
var srColor;
var sgColor;
var sbColor;
var arColor1;
var agColor1;
var abColor1;
var drColor1;
var dgColor1;
var dbColor1;
var srColor1;
var sgColor1;
var sbColor1;
var KaVal;
var KdVal;
var KsVal;
var lPosX;
var lPosY;
var lPosZ;
var ifLightOn = 1.0;
var ifBlinnPhong = 0.0





// GLOBAL CAMERA CONTROL:					//
g_worldMat = new Matrix4();				// Changes CVV drawing axes to 'world' axes.
g_ProjMatrix = new Matrix4();
g_ViewMatrix = new Matrix4();
// (equivalently: transforms 'world' coord. numbers (x,y,z,w) to CVV coord. numbers)
// WHY?
// Lets mouse/keyboard functions set just one global matrix for 'view' and
// 'projection' transforms; then VBObox objects use it in their 'adjust()'
// member functions to ensure every VBObox draws its 3D parts and assemblies
// using the same 3D camera at the same 3D position in the same 3D world).

function main() {
//=============================================================================
  // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
  g_canvasID = document.getElementById('webgl');
  g_canvasID.width = window.innerWidth-20;
  g_canvasID.height = (window.innerHeight *2 /3 ) -20;
  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);

  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine, adjusted by big sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL func. call
  // will follow this format:  gl.WebGLfunctionName(args);
  //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID);
  // Here's a BETTER version:
  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true});
  // This fancier-looking version disables HTML-5's default screen-clearing, so
  // that our drawMain()
  // function will over-write previous on-screen results until we call the
  // gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.9, 0.8, 1.0, 1.0);	  // RGBA color for clearing <canvas>

  gl.enable(gl.DEPTH_TEST);



  // Initialize each of our 'vboBox' objects:
  worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,
  vbo2Box.init(gl); //右 Gouraud //  "   "   "  for 2nd kind of shading & lighting
  vbo3Box.init(gl);//中 Gouraud，光
  vbo4Box.init(gl); //左 都
  vbo5Box.init(gl);// 中
  vbo6Box.init(gl);//右 Gouraud
  vbo7Box.init(gl);//左



  setCamera();				

  window.addEventListener("keydown", myKeyDown, false);

  var tick = function() {		    // locally (within main() only), define our
    setCamera();

    // self-calling animation function.
    requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
    // til browser is ready to re-draw canvas, then
    timerAll();  // Update all time-varying params, and
    drawAll();                // Draw all the VBObox contents
  };
  //------------------------------------
  tick();                       // do it again!
}

function setCamera() {


  g_ProjMatrix.setPerspective(30.0,   // FOVY: top-to-bottom vertical image angle, in degrees
      g_canvasID.width / g_canvasID.height,   // Image Aspect Ratio: camera lens width/height
      1.0,   // camera z-near distance (always positive; frustum begins at z = -znear)
      1000.0);  // camera z-far distance (always positive; frustum ends at z = -zfar)

  g_ViewMatrix.setLookAt( g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ, 0, 0, 1 );	// View UP vector.


}
function timerAll() {
  
//=============================================================================
// Find new values for all time-varying parameters used for on-screen drawing
  // use local variables to find the elapsed time.
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
  // Continuous rotation:
  g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsedMS) / 1000.0;
  g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsedMS) / 1000.0;
  g_angleNow2 = g_angleNow2 + (5 * elapsedMS) / 1000.0;
  g_angleNow0 %= 360.0;   // keep angle >=0.0 and <360.0 degrees
  g_angleNow1 %= 360.0;
  g_angleNow2 %= 360.0;
  if(g_angleNow1 > g_angleMax1) { // above the max?
    g_angleNow1 = g_angleMax1;    // move back down to the max, and
    g_angleRate1 = -g_angleRate1; // reverse direction of change.
  }
  else if(g_angleNow1 < g_angleMin1) {  // below the min?
    g_angleNow1 = g_angleMin1;    // move back up to the min, and
    g_angleRate1 = -g_angleRate1;
  }
  // Continuous movement:
  g_posNow0 += g_posRate0 * elapsedMS / 1000.0;
  g_posNow1 += g_posRate1 * elapsedMS / 1000.0;
  // apply position limits
  if(g_posNow0 > g_posMax0) {   // above the max?
    g_posNow0 = g_posMax0;      // move back down to the max, and
    g_posRate0 = -g_posRate0;   // reverse direction of change
  }
  else if(g_posNow0 < g_posMin0) {  // or below the min?
    g_posNow0 = g_posMin0;      // move back up to the min, and
    g_posRate0 = -g_posRate0;   // reverse direction of change.
  }
  if(g_posNow1 > g_posMax1) {   // above the max?
    g_posNow1 = g_posMax1;      // move back down to the max, and
    g_posRate1 = -g_posRate1;   // reverse direction of change
  }
  else if(g_posNow1 < g_posMin1) {  // or below the min?
    g_posNow1 = g_posMin1;      // move back up to the min, and
    g_posRate1 = -g_posRate1;   // reverse direction of change.
  }

  arColor1 = document.getElementById("arColor1").value/255
  agColor1 = document.getElementById("agColor1").value/255
  abColor1 = document.getElementById("abColor1").value/255
  drColor1 = document.getElementById("drColor1").value/255
  dgColor1 = document.getElementById("dgColor1").value/255
  dbColor1 = document.getElementById("dbColor1").value/255
  srColor1 = document.getElementById("srColor1").value/51
  sgColor1 = document.getElementById("sgColor1").value/51
  sbColor1 = document.getElementById("sbColor1").value/51
  lPosX = document.getElementById("PosX").value
  lPosY = document.getElementById("PosY").value
  lPosZ = document.getElementById("PosZ").value
  var e = document.getElementById("shading").value;
  var e1 = document.getElementById("lightOn").value;
  var e2 = document.getElementById("lighting").value;
  if (e == "gouraud"){
    g_show2 = 1;
    g_show3 = 1;
    g_show4 = 1;
    g_show5 = 0;
    g_show6 = 0;
    g_show7 = 0;
  }
  if (e == "phong"){
    g_show5 = 1;
    g_show3 = 0;
    g_show2 = 0;
    g_show4 = 0;
    g_show6 = 1;
    g_show7 = 1;
  }
  if (e1 == "lightOn"){
    ifLightOn = 1.0;
  }
  if (e1 == "lightOff"){
    ifLightOn = 0.0;
  }
  if (e2 == "Phong"){
    ifBlinnPhong = 0.0;
  }
  if (e2 == "BlinnPhong"){
    ifBlinnPhong = 1.0;
  }
}

function myKeyDown(ev) {
  //===============================================================================
  var dx = g_EyeX - g_LookAtX;
  var dy = g_EyeY - g_LookAtY;
  var dz = g_EyeZ - g_LookAtZ;
  var lxy = Math.sqrt(dx * dx + dy * dy);
  var l = Math.sqrt(dx * dx + dy * dy + dz * dz);


  switch (ev.keyCode) {      // keycodes !=ASCII, but are very consistent for
      //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.

    case 38: 
      g_LookAtZ = g_LookAtZ + 0.1;
      break;

    case 37:
      g_EyeX = g_EyeX - 0.1 * dy / lxy;
      g_EyeY = g_EyeY + 0.1 * dy / lxy;
      break;
    case 39:
      g_EyeX = g_EyeX + 0.1 * dy / lxy;
      g_EyeY = g_EyeY - 0.1 * dy / lxy;
      break;
    case 40:
      g_LookAtZ = g_LookAtZ - 0.1;
      break;

    case 87:    // w
      g_LookAtX = g_LookAtX - 0.1 * (dx / l);
      g_LookAtY = g_LookAtY - 0.1 * (dy / l);
      g_LookAtZ = g_LookAtZ - 0.1 * (dz / l);

      g_EyeX = g_EyeX - 0.1 * (dx / l);
      g_EyeY = g_EyeY - 0.1 * (dy / l);
      g_EyeZ = g_EyeZ - 0.1 * (dz / l);
      break;

    case 83:    // s
      g_LookAtX = g_LookAtX + 0.2 * (dx / l);
      g_LookAtY = g_LookAtY + 0.2 * (dy / l);
      g_LookAtZ = g_LookAtZ + 0.2 * (dz / l);

      g_EyeX = g_EyeX + 0.2 * (dx / l);
      g_EyeY = g_EyeY + 0.2 * (dy / l);
      g_EyeZ = g_EyeZ + 0.2 * (dz / l);

      break;

    case 68:    // a
     
      g_LookAtX -= 0.1 * dy / lxy;
      g_LookAtY += 0.1 * dx / lxy;

      break;
    case 65:    // d
      
      g_LookAtX += 0.1 * dy / lxy;
      g_LookAtY -= 0.1 * dx / lxy;
      break;
 
    

  }
}

function drawAll() {

//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var b4Draw = Date.now();
  var b4Wait = b4Draw - g_lastMS;

  if(g_show0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
    worldBox.switchToMe();  // Set WebGL to render from this VBObox.
    worldBox.adjust();		  // Send new values for uniforms to the GPU, and
    worldBox.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo2Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo2Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo2Box.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show3 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo3Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo3Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo3Box.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show4 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo4Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo4Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo4Box.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show5 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo5Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo5Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo5Box.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show6 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo6Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo6Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo6Box.draw();			  // draw our VBO's contents using our shaders.
  }
  
  if(g_show7 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    vbo7Box.switchToMe();  // Set WebGL to render from this VBObox.
    vbo7Box.adjust();		  // Send new values for uniforms to the GPU, and
    vbo7Box.draw();			  // draw our VBO's contents using our shaders.
  }
}





