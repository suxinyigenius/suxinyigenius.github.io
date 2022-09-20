//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library:
  =====================
Note that you don't really need 'VBObox' objects for any simple,
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly
		the same attributes (e.g. position, color, surface normal), and use
		the same shader program (e.g. same Vertex Shader and Fragment Shader),
		then our textbook's simple 'example code' will suffice.

***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need
		different sets of vertices with  different sets of attributes rendered
		by different shader programs.  THUS a customized VBObox object for each
		VBO/shader-program pair will help you remember and correctly implement ALL
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.

One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO),
		as drawn by calls to one 'shader program' that runs on your computer's
		Graphical Processing Unit(GPU), along with changes to values of that shader
		program's one set of 'uniform' varibles.
The 'shader program' consists of a Vertex Shader and a Fragment Shader written
		in GLSL, compiled and linked and ready to execute as a Single-Instruction,
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex
		Shader for each vertex in every shape, and one 'instance' of the Fragment
		Shader for every on-screen pixel covered by any part of any drawing
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their
		values can't be changed while the shader program runs.
		Each VBObox object stores its own 'uniform' values as vars in JavaScript;
		its 'adjust()'	function computes newly-updated values for these uniform
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs.
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use.
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program,
  -- a DIFFERENT set of attributes that define a vertex for that shader program,
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.
  THUS:
		I don't see any easy way to use the exact same object constructors and
		prototypes for all VBObox objects.  Every additional VBObox objects may vary
		substantially, so I recommend that you copy and re-name an existing VBObox
		prototype object, and modify as needed, as shown here.
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and
		all its prototype functions, then modify their contents for VBObox3
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args;
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================

var floatsPerVertex = 7;
function drawGroundGrid() {

    var xcount = 200;     // # of lines to draw in x,y to make the grid.
    var ycount = 200;
    var xymax = 80.0;     // grid size; extends to cover +/-xymax in x and y.


    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1);    // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1);    // (why half? because v==(0line number/2))


    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {  // put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j] = -xymax + (v) * xgap;  // x
            gndVerts[j + 1] = -xymax;               // y
            gndVerts[j + 2] = 0.0;                  // z
            gndVerts[j + 3] = 1.0;
        }
        else {        // put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j] = -xymax + (v - 1) * xgap;  // x
            gndVerts[j + 1] = xymax;                // y
            gndVerts[j + 2] = 0.0;                  // z
            gndVerts[j + 3] = 1.0;
        }
        gndVerts[j + 4] = 1;     // red
        gndVerts[j + 5] = 1;     // grn
        gndVerts[j + 6] = 1;     // blu
    }
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {    // put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j] = -xymax;               // x
            gndVerts[j + 1] = -xymax + (v) * ygap;  // y
            gndVerts[j + 2] = 0.0;                  // z
            gndVerts[j + 3] = 1.0;
        }
        else {          // put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j] = xymax;                // x
            gndVerts[j + 1] = -xymax + (v - 1) * ygap;  // y
            gndVerts[j + 2] = 0.0;                  // z
            gndVerts[j + 3] = 1.0;
        }
        gndVerts[j + 4] = 1;     // red
        gndVerts[j + 5] = 1;     // grn
        gndVerts[j + 6] = 1;     // blu
    }

}

function VBObox0() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

    this.VERT_SRC =	//--------------------- VERTEX SHADER source code
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        //
        'uniform mat4 u_ViewMatrix;\n' +
        'uniform mat4 u_ProjMatrix;\n' +
        'attribute vec4 a_Pos0;\n' +
        'attribute vec3 a_Colr0;\n'+
        'varying vec3 v_Colr0;\n' +
        //
        'void main() {\n' +
        '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Pos0;\n' +
        '	 v_Colr0 = a_Colr0;\n' +
        ' }\n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec3 v_Colr0;\n' +
        'void main() {\n' +
        '  gl_FragColor = vec4(v_Colr0, 1.0);\n' +
        '}\n';

    drawGroundGrid();
    this.vboContents = gndVerts;
    this.vboVerts = this.vboContents.length / floatsPerVertex;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;
    this.vboStride = this.vboBytes / this.vboVerts;
 

    //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
    // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values)
    

    //----------------------Attribute offsets
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;							// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management:
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;	// error exit.
    }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;	// error exit.
    }

    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer
        this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,

    this.ProjMatrix.setIdentity();

    this.ProjMatrix.set(g_ProjMatrix);	// use our global, shared camera.
    this.ViewMatrix.setIdentity();

    this.ViewMatrix.set(g_ViewMatrix);	// use our global, shared camera.

    gl.uniformMatrix4fv(this.u_ProjMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ViewMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        0, 								// location of 1st vertex to draw;
        this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO

}




function drawCube(){
    cubeVerts = new Float32Array([
        // +x face: RED
 1.0, -1.0, -1.0, 1.0,    0.5, 0.4, 1.0,    // Node 3
 1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,    // Node 2
 1.0,  1.0,  1.0, 1.0,    0.52, 0.44, 1.0,  // Node 4
 
 1.0,  1.0,  1.0, 1.0,    0.96, 1.0, 0.98,  // Node 4
 1.0, -1.0,  1.0, 1.0,    1.0, 0.1, 0.1,    // Node 7
 1.0, -1.0, -1.0, 1.0,    0.69, 0.88, 0.9,  // Node 3

    // +y face: GREEN
-1.0,  1.0, -1.0, 1.0,    0.9, 1.0, 1.0,    // Node 1
-1.0,  1.0,  1.0, 1.0,    1.0, 0.39, 0.28,  // Node 5
 1.0,  1.0,  1.0, 1.0,    0.85, 0.75, 0.85, // Node 4

 1.0,  1.0,  1.0, 1.0,    1.0, 0.65, 0.0,   // Node 4
 1.0,  1.0, -1.0, 1.0,    1.0, 0.97, 0.86,  // Node 2 
-1.0,  1.0, -1.0, 1.0,    0.5, 0.0, 0.1,    // Node 1

    // +z face: BLUE
-1.0,  1.0,  1.0, 1.0,    1.0, 0.89, 0.88,  // Node 5
-1.0, -1.0,  1.0, 1.0,    1.0, 0.65, 0.0,   // Node 6
 1.0, -1.0,  1.0, 1.0,    1.0, 0.75, 0.8,   // Node 7

 1.0, -1.0,  1.0, 1.0,    0.85, 0.75, 0.85, // Node 7
 1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 1.0,    // Node 4
-1.0,  1.0,  1.0, 1.0,    0.69, 0.93, 0.93, // Node 5

    // -x face: CYAN
-1.0, -1.0,  1.0, 1.0,    0.3, 0.3, 0.3,    // Node 6   
-1.0,  1.0,  1.0, 1.0,    0.73, 0.56, 0.56, // Node 5 
-1.0,  1.0, -1.0, 1.0,    0.94, 1.0, 0.94,  // Node 1

-1.0,  1.0, -1.0, 1.0,    1.0, 0.8, 0.7,    // Node 1
-1.0, -1.0, -1.0, 1.0,    0.6, 0.2, 0.2,    // Node 0  
-1.0, -1.0,  1.0, 1.0,    1.0, 0.8, 0.6,    // Node 6  

    // -y face: MAGENTA
 1.0, -1.0, -1.0, 1.0,    0.79, 0.88, 1.0,  // Node 3
 1.0, -1.0,  1.0, 1.0,    0.78, 0.89, 1.0,  // Node 7
-1.0, -1.0,  1.0, 1.0,    0.82, 0.93, 0.93, // Node 6

-1.0, -1.0,  1.0, 1.0,    1.0, 0.08, 0.58,  // Node 6
-1.0, -1.0, -1.0, 1.0,    0.6, 0.8, 0.2,    // Node 0
 1.0, -1.0, -1.0, 1.0,    0.65, 0.16, 0.16, // Node 3

 // -z face: YELLOW
 1.0,  1.0, -1.0, 1.0,    0.9, 0.5, 0.4,    // Node 2
 1.0, -1.0, -1.0, 1.0,    1.0, 0.7, 1.0,    // Node 3
-1.0, -1.0, -1.0, 1.0,    0.7, 0.8, 0.9,    // Node 0       

-1.0, -1.0, -1.0, 1.0,    0.74, 0.56, 0.56, // Node 0
-1.0,  1.0, -1.0, 1.0,    1.0, 0.98, 0.8,   // Node 1
 1.0,  1.0, -1.0, 1.0,    1.0, 0.89, 0.88,  // Node 2
]);
}



function VBObox2() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

this.VERT_SRC =	//--------------------- VERTEX SHADER source code
'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
//
'attribute vec4 a_Normal;\n' +
'uniform mat4 u_ViewMatrix;\n' +
'uniform mat4 u_ProjMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'uniform vec3 eyePosWorld;\n' +
'attribute vec4 a_Position;\n' +
'uniform vec3 Ka;\n' +
'uniform vec3 Kd;\n' +
'uniform vec3 Ks;\n' +
'uniform float shininessVal;\n' +
//Material color
'uniform vec3 ambientColor;\n' +
'uniform vec3 diffuseColor;\n' +
'uniform vec3 specularColor;\n' +
//'uniform vec3 u_lightColor;\n' +
'uniform vec3 lightPos;\n' +
'uniform float ifBlinnPhong;\n' +
 'uniform float ifLightOn;\n' +
'varying vec3 v_Position;\n' +
'varying vec3 v_Normal;\n' +
'attribute vec3 a_Color;\n'+
'varying vec4 v_Colr;\n' +
//
'void main() {\n' +
'  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

'vec3 N = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
'vec3 viewDirection = normalize(eyePosWorld - v_Position);\n' +
'vec3 L = normalize(lightPos - v_Position);\n' +
'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +

'float lambertian = max(dot(N, L), 0.0);\n' +
'float specular = 0.0;\n' +
'if(lambertian > 0.0) {\n' +
'vec3 R = reflect(-L, N);\n' +
'vec3 V = normalize(-v_Position);\n' +
// Compute the specular term
'float specAngle = max(dot(R, viewDirection), 0.0);\n' +
'if (ifBlinnPhong == 1.0){\n' +
'vec3 R = reflect(-L, N);\n' +
'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
'}\n' +
'specular = pow(specAngle, shininessVal);\n' +
'}\n' +
'if (ifLightOn == 1.0){\n' +
'	 v_Colr = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
'}\n' +
'else{\n' +
'	 v_Colr = vec4(Ka * ambientColor, 1.0);\n'+
'}\n' +
' }\n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec4 v_Colr;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Colr;\n' +
        '}\n';

    drawCube();
    drawTetrahedron();
    var mySize = cubeVerts.length + tetVerts.length;

    
    this.vboContents = new Float32Array(mySize);
  
     cubeStart = 0;
     for(i=0 , j = 0; j < cubeVerts.length; i++, j++) {
     this.vboContents[i] = cubeVerts[j];
     }
     tetStart = i;
     for(j = 0; j < tetVerts.length; i++, j++) {
      this.vboContents[i] = tetVerts[j];
      }

    this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) *
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // From any attrib in a given vertex,
    // move forward by 'vboStride' bytes to arrive
    // at the same attrib for the next vertex.
    // (== # of bytes used to store one vertex)

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;  // # of floats in the VBO needed to store the
    // attribute named a_Position (4: x,y,z,w values)
    this.vboFCount_a_Normal = 3;  // # of floats for this attrib (3)
    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;
    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;

    //---------------------- Uniform locations &values in our shaders
    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
    this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_NormalMatrix;
    this.Ka;
    this.Kd;
    this.Ks;
    this.shininessVal;
    this.ambientColor;
    this.diffuseColor;
    this.specularColor;
    this.lightPos;
    this.ifLightOn;
    this.ifBlinnPhong;
    this.eyePosWorld;

};


VBObox2.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');
}

VBObox2.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFCount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox2.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox2.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    // Adjust values for our uniforms;-------------------------------------------
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ProjMatrix.set(g_ProjMatrix);
    // Ready to draw in World coord axes.

    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka,0.25,     0.148,    0.06475,  1.0);
    gl.uniform3f(this.Kd, 0.4,      0.2368,   0.1036);
    gl.uniform3f(this.Ks, 0.774597, 0.458561, 0.200621);
    gl.uniform1f(this.shininessVal, 1);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ)
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);
  

    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);


    this.ViewMatrix.translate(4, 0.0, 0.0); //Shift origin leftwards,
    this.ViewMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
}

VBObox2.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    // ----------------------------Draw the contents of the currently-bound VBO:
    
    gl.drawArrays(gl.TRIANGLES, 		    // select the drawing primitive to draw,
       cubeStart/floatsPerVertex, 
                cubeVerts.length/floatsPerVertex);		// number of vertices to draw on-screen.

  

    this.ViewMatrix.translate(0, 0.0, 1.8);
    this.ViewMatrix.scale(1, 1, 0.8);
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(-0.6, 0.0, 0.3);
    this.ViewMatrix.scale(0.2, 0.4, 0.2);
    this.ViewMatrix.rotate(g_angleNow1, 1, 0, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(-48, -5, 15.0);
    this.ViewMatrix.scale(3, 2.1, 3);
    
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 0, -1.5);
    this.ViewMatrix.scale(0.8, 0.6, 0.8);  
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0); 
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -1.1, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8); 
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -1.3, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8);  
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 14.6, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8); 
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);   
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

}

VBObox2.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}




//=============================================================================
//=============================================================================
//=============================================================================
function VBObox3() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

this.VERT_SRC =	//--------------------- VERTEX SHADER source code
'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
//
'attribute vec4 a_Normal;\n' +
'uniform mat4 u_ViewMatrix;\n' +
'uniform mat4 u_ProjMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'uniform vec3 eyePosWorld;\n' +
'attribute vec4 a_Position;\n' +
'uniform vec3 Ka;\n' +
'uniform vec3 Kd;\n' +
'uniform vec3 Ks;\n' +
'uniform float shininessVal;\n' +
//Material color
'uniform vec3 ambientColor;\n' +
'uniform vec3 diffuseColor;\n' +
'uniform vec3 specularColor;\n' +
//'uniform vec3 u_lightColor;\n' +
'uniform vec3 lightPos;\n' +
'uniform float ifBlinnPhong;\n' +
 'uniform float ifLightOn;\n' +
'varying vec3 v_Position;\n' +
'varying vec3 v_Normal;\n' +
'attribute vec3 a_Color;\n'+
'varying vec4 v_Colr;\n' +
//
'void main() {\n' +
'  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

'vec3 N = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
'vec3 viewDirection = normalize(eyePosWorld - v_Position);\n' +
'vec3 L = normalize(lightPos - v_Position);\n' +
'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +

'float lambertian = max(dot(N, L), 0.0);\n' +
'float specular = 0.0;\n' +
'if(lambertian > 0.0) {\n' +
'vec3 R = reflect(-L, N);\n' +
'vec3 V = normalize(-v_Position);\n' +
// Compute the specular term
'float specAngle = max(dot(R, viewDirection), 0.0);\n' +
'if (ifBlinnPhong == 1.0){\n' +
'vec3 R = reflect(-L, N);\n' +
'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
'}\n' +
'specular = pow(specAngle, shininessVal);\n' +
'}\n' +
'if (ifLightOn == 1.0){\n' +
'	 v_Colr = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
'}\n' +
'else{\n' +
'	 v_Colr = vec4(Ka * ambientColor, 1.0);\n'+
'}\n' +
' }\n';


 this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec4 v_Colr;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Colr;\n' +
        '}\n';

    drawSphere4();
    

    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
    this.a_NormalLoc;

    //---------------------- Uniform locations &values in our shaders
    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
    this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_NormalMatrix;
    this.Ka;
    this.Kd;
    this.Ks;
    this.shininessVal;
    this.ambientColor;
    this.diffuseColor;
    this.specularColor;
    this.lightPos;
    this.ifLightOn;
    this.ifBlinnPhong;
    this.eyePosWorld;
};


VBObox3.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        new Float32Array(positions), 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');

}

VBObox3.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        3, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        0,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        0);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, 3,
        gl.FLOAT, false,
        0, 0);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox3.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox3.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka, 0.05,    0.05,   0.05,   1.0);
    gl.uniform3f(this.Kd, 0.0,     0.2,    0.6,);
    gl.uniform3f(this.Ks, 0.1,     0.2,    0.3, );
    gl.uniform1f(this.shininessVal, 10);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);

    this.ProjMatrix.set(g_ProjMatrix);
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);
   
    this.ViewMatrix.translate(0.0, 0.0, 0.0); 
    this.ViewMatrix.scale(1.4,1.4,1.4);
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);	
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
   
}

VBObox3.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
    // check: was WebGL context set to use our VBO & shader program?
 
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
   
    
   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
    this.ViewMatrix.translate(0, -5.0, 0.0);
    
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    this.ViewMatrix.translate(0, 0.0, 1.6);
    this.ViewMatrix.scale(0.7,0.7,0.7);
    this.ViewMatrix.rotate(g_posNow1, 0, 1, 0);
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    

}

VBObox3.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}


function drawTetrahedron() {
    tetVerts = new Float32Array([
        // Face 0: (left side)
    0.0, 1.0, 0.0, 1.0,         0.52,  0.44,  1.0,  // Node 0
    -1.0, -1.0, 1.0, 1.0,       1.0,  0.8,  0.7,    // Node 1
    1.0,  -1.0, 1.0, 1.0,       1.0,  0.0,  0.0,    // Node 2
                     // Face 1: (right side)
    0.0,  1.0,  0.0, 1.0,       0.6,  1,  0.6,  // Node 0
    1.0,  -1.0, 1.0, 1.0,       1.0,  0.0,  1.0,    // Node 2
    1.0, -1.0, -1.0, 1.0,       0.94,  0.97,  1.0,  // Node 3
                 // Face 2: (lower side)
    0.0,  1.0, 0.0, 1.0,        0.6,  0.6,  1.0,    // Node 0 
    1.0, -1.0, -1.0, 1.0,       1.0,  1.0,  1.0,    // Node 3
    -1.0, -1.0, -1.0, 1.0,      1.0,  0.0,  1.0,    // Node 1 
                  // Face 3: (base side)  
    0.0, 1.0, 0.0, 1.0,         1.0,  0.9,  0.5,    // Node 3
    -1.0,  -1.0, -1.0, 1.0,         1.0,  1.0,  1.0,    // Node 2
    -1.0, -1.0, 1.0, 1.0,       1.0,  0.0,  1.0,    // Node 1
    ]);
}

function VBObox4() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

this.VERT_SRC =	//--------------------- VERTEX SHADER source code
'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
//
'attribute vec4 a_Normal;\n' +
'uniform mat4 u_ViewMatrix;\n' +
'uniform mat4 u_ProjMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'uniform vec3 eyePosWorld;\n' +
'attribute vec4 a_Position;\n' +
'uniform vec3 Ka;\n' +
'uniform vec3 Kd;\n' +
'uniform vec3 Ks;\n' +
'uniform float shininessVal;\n' +
//Material color
'uniform vec3 ambientColor;\n' +
'uniform vec3 diffuseColor;\n' +
'uniform vec3 specularColor;\n' +
//'uniform vec3 u_lightColor;\n' +
'uniform vec3 lightPos;\n' +
'uniform float ifBlinnPhong;\n' +
 'uniform float ifLightOn;\n' +
'varying vec3 v_Position;\n' +
'varying vec3 v_Normal;\n' +
'attribute vec3 a_Color;\n'+
'varying vec4 v_Colr;\n' +
//
'void main() {\n' +
'  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

'vec3 N = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
'vec3 viewDirection = normalize(eyePosWorld - v_Position);\n' +
'vec3 L = normalize(lightPos - v_Position);\n' +
'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +

'float lambertian = max(dot(N, L), 0.0);\n' +
'float specular = 0.0;\n' +
'if(lambertian > 0.0) {\n' +
'vec3 R = reflect(-L, N);\n' +
'vec3 V = normalize(-v_Position);\n' +
// Compute the specular term
'float specAngle = max(dot(R, viewDirection), 0.0);\n' +
'if (ifBlinnPhong == 1.0){\n' +
'vec3 R = reflect(-L, N);\n' +
'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
'}\n' +
'specular = pow(specAngle, shininessVal);\n' +
'}\n' +
'if (ifLightOn == 1.0){\n' +
'	 v_Colr = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
'}\n' +
'else{\n' +
'	 v_Colr = vec4(Ka * ambientColor, 1.0);\n'+
'}\n' +
' }\n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec4 v_Colr;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Colr;\n' +
        '}\n';

    drawCube();
    drawTetrahedron();
    var mySize = cubeVerts.length + tetVerts.length;

    
    this.vboContents = new Float32Array(mySize);
  
     cubeStart = 0;
     for(i=0 , j = 0; j < cubeVerts.length; i++, j++) {
     this.vboContents[i] = cubeVerts[j];
     }
     tetStart = i;
     for(j = 0; j < tetVerts.length; i++, j++) {
      this.vboContents[i] = tetVerts[j];
      }

  

    this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) *
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // From any attrib in a given vertex,
    // move forward by 'vboStride' bytes to arrive
    // at the same attrib for the next vertex.
    // (== # of bytes used to store one vertex)

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;  // # of floats in the VBO needed to store the
    // attribute named a_Position (4: x,y,z,w values)
    this.vboFCount_a_Normal = 3;  // # of floats for this attrib (3)
    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;
    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;

    //---------------------- Uniform locations &values in our shaders
    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
    this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_NormalMatrix;
    this.Ka;
    this.Kd;
    this.Ks;
    this.shininessVal;
    this.ambientColor;
    this.diffuseColor;
    this.specularColor;
    this.lightPos;
    this.ifLightOn;
    this.ifBlinnPhong;
    this.eyePosWorld;
};


VBObox4.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }


    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');

}

VBObox4.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFCount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox4.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox4.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka, 0.0215,  0.1745,   0.0215);
    gl.uniform3f(this.Kd, 0.07568, 0.61424,  0.07568);
    gl.uniform3f(this.Ks, 0.633,   0.727811, 0.633);
    gl.uniform1f(this.shininessVal, 0.5);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);
    
    this.ProjMatrix.set(g_ProjMatrix);
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);
    // Ready to draw in World coord axes.

    this.ViewMatrix.translate(6, 0.0, 0.0); //Shift origin leftwards,
    //this.ViewMatrix.rotate(g_angleNow2, 1, 0, 0);	// -spin drawing axes,
    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);

}

VBObox4.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    // ----------------------------Draw the contents of the currently-bound VBO:
  

    this.ViewMatrix.translate(2, 0.0, 0);
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 1.1, 0.0);
    this.ViewMatrix.scale(0.8, 0.8, 0.8);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 1.5, 0.0);
    this.ViewMatrix.scale(0.7, 0.7, 0.7);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -8, 0.0);
    this.ViewMatrix.scale(0.8, 1.6, 0.8);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    
   
    
}

VBObox4.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}


function VBObox5() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

    this.VERT_SRC =	//--------------------- VERTEX SHADER source code
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        //
        'attribute vec4 a_Normal;\n' +
        'uniform mat4 u_ViewMatrix;\n' +
        'uniform mat4 u_ProjMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'attribute vec4 a_Position;\n' +
        'varying vec3 v_Normal;\n' +
        'varying vec3 v_Position;\n' +
        //
        'void main() {\n' +
        'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
        '  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
        'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n'+
        '}\n';


    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec3 v_Normal;\n' +
        'uniform vec3 Ka;\n' +
        'uniform vec3 Kd;\n' +
        'uniform vec3 Ks;\n' +
        'uniform float ifLightOn;\n' +
        'uniform float shininessVal;\n' +
        'uniform vec3 eyePosWorld;\n' +
        //Material color
        'uniform vec3 ambientColor;\n' +
        'uniform vec3 diffuseColor;\n' +
        'uniform vec3 specularColor;\n' +
        'uniform vec3 lightPos;\n' +
        'uniform float ifBlinnPhong;\n' +
        'varying vec3 v_Position;\n' +
        'void main() {\n' +
        'vec3 N = normalize(v_Normal);\n' +
        'vec3 L = normalize(lightPos - v_Position);\n' +
        'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
        'vec3 viewDirection = normalize(eyePosWorld.xyz - v_Position);\n' +
        'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +
       
        'float lambertian = max(dot(N, L), 0.0);\n' +
        'float specular = 0.0;\n' +
        'if(lambertian > 0.0) {\n' +
        'vec3 R = reflect(-L, N);\n' +
        'vec3 V = normalize(-v_Position);\n' +
        // Compute the specular term
        'float specAngle = max(dot(R, viewDirection), 0.0);\n'+
        'if (ifBlinnPhong == 1.0){\n' +
        'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
        '}\n' +
        'specular = pow(specAngle, shininessVal);\n' +
        '}\n' +
        'if (ifLightOn == 1.0){\n' +
        '	 gl_FragColor = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
        '}\n' +
        'else{\n' +
        '   gl_FragColor = vec4(Ka * ambientColor, 1.0);\n' +
        '}\n'+

        '}\n';

    drawSphere4()
 

    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;

    //---------------------- Uniform locations &values in our shaders
    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
    this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_NormalMatrix;
    this.Ka;
    this.Kd;
    this.Ks;
    this.shininessVal;
    this.ambientColor;
    this.diffuseColor;
    this.specularColor;
    this.lightPos;
    this.ifLightOn;
    this.ifBlinnPhong;
    this.eyePosWorld;
};


VBObox5.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        new Float32Array(positions), 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld');
}

VBObox5.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        3, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        0,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        0);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, 3,
        gl.FLOAT, false,
        0, 0);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox5.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox5.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka, 0.05,    0.05,   0.05,   1.0);
    gl.uniform3f(this.Kd, 0.0,     0.2,    0.6,);
    gl.uniform3f(this.Ks, 0.1,     0.2,    0.3, );
    gl.uniform1f(this.shininessVal, 200);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);
    // Adjust values for our uniforms;-------------------------------------------
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ProjMatrix.set(g_ProjMatrix);
    // Ready to draw in World coord axes.

    // this.ProjMatrix.translate(-3, 0.0, 0.0); //Shift origin leftwards,
    // this.ProjMatrix.rotate(g_angleNow2, 0, 1, 0);	// -spin drawing axes,
    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);
    // Ready to draw in World coord axes.

    this.ViewMatrix.translate(0.0, 0.0, 0.0); //Shift origin leftwards,
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);
    this.ViewMatrix.scale(1.4,1.4,1.4);	// -spin drawing axes,
    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);

}

VBObox5.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
    // check: was WebGL context set to use our VBO & shader program?
 
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
   
    
   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
    this.ViewMatrix.translate(0, -5.0, 0.0);
    
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    this.ViewMatrix.translate(0, 0.0, 1.6);
    this.ViewMatrix.scale(0.7,0.7,0.7);
    this.ViewMatrix.rotate(g_posNow1, 0, 1, 0);
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    

 
}

VBObox5.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}

function drawSphere4(){
    var SPHERE_DIV = 41;

    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1, p2;

    positions = [];
    indices = [];

    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++) {
        aj = j * Math.PI / SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= SPHERE_DIV; i++) {
            ai = i * 2 * Math.PI / SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            positions.push(si * sj);  // X
            positions.push(cj);       // Y
            positions.push(ci * sj);  // Z
        }
    }

    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++) {
        for (i = 0; i < SPHERE_DIV; i++) {
            p1 = j * (SPHERE_DIV+1) + i;
            p2 = p1 + (SPHERE_DIV+1);

            indices.push(p1);
            indices.push(p2);
            indices.push(p1 + 1);

            indices.push(p1 + 1);
            indices.push(p2);
            indices.push(p2 + 1);
        }
    }
}


function VBObox6() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal:
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them
// easily WITHOUT disrupting any other code, ever!

    this.VERT_SRC =	//--------------------- VERTEX SHADER source code
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        //
        'attribute vec4 a_Normal;\n' +
        'uniform mat4 u_ViewMatrix;\n' +
        'uniform mat4 u_ProjMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'attribute vec4 a_Position;\n' +
        'varying vec3 v_Normal;\n' +
        'varying vec3 v_Position;\n' +
        //
        'void main() {\n' +
        'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
        '  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
        'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n'+
        '}\n';


    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec3 v_Normal;\n' +
        'uniform vec3 Ka;\n' +
        'uniform vec3 Kd;\n' +
        'uniform vec3 Ks;\n' +
        'uniform float ifLightOn;\n' +
        'uniform float shininessVal;\n' +
        'uniform vec3 eyePosWorld;\n' +
        //Material color
        'uniform vec3 ambientColor;\n' +
        'uniform vec3 diffuseColor;\n' +
        'uniform vec3 specularColor;\n' +
        'uniform vec3 lightPos;\n' +
        'uniform float ifBlinnPhong;\n' +
        'varying vec3 v_Position;\n' +
        'void main() {\n' +
        'vec3 N = normalize(v_Normal);\n' +
        'vec3 L = normalize(lightPos - v_Position);\n' +
        'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
        'vec3 viewDirection = normalize(eyePosWorld.xyz - v_Position);\n' +
        'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +
        //Lambertian's cosine law
        'float lambertian = max(dot(N, L), 0.0);\n' +
        'float specular = 0.0;\n' +
        'if(lambertian > 0.0) {\n' +
        'vec3 R = reflect(-L, N);\n' +
        'vec3 V = normalize(-v_Position);\n' +
        // Compute the specular term
        'float specAngle = max(dot(R, viewDirection), 0.0);\n'+
        'if (ifBlinnPhong == 1.0){\n' +
        'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
        '}\n' +
        'specular = pow(specAngle, shininessVal);\n' +
        '}\n' +
        'if (ifLightOn == 1.0){\n' +
        '	 gl_FragColor = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
        '}\n' +
        'else{\n' +
        '   gl_FragColor = vec4(Ka * ambientColor, 1.0);\n' +
        '}\n'+

        '}\n';

    drawCube();
    drawTetrahedron();
    var mySize = cubeVerts.length + tetVerts.length;

    
    this.vboContents = new Float32Array(mySize);
  
     cubeStart = 0;
     for(i=0 , j = 0; j < cubeVerts.length; i++, j++) {
     this.vboContents[i] = cubeVerts[j];
     }
     tetStart = i;
     for(j = 0; j < tetVerts.length; i++, j++) {
      this.vboContents[i] = tetVerts[j];
      }


    this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) *
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // From any attrib in a given vertex,
    // move forward by 'vboStride' bytes to arrive
    // at the same attrib for the next vertex.
    // (== # of bytes used to store one vertex)

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;  // # of floats in the VBO needed to store the
    // attribute named a_Position (4: x,y,z,w values)
    this.vboFCount_a_Normal = 3;  // # of floats for this attrib (3)
    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;
    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object,
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;

    //---------------------- Uniform locations &values in our shaders
    this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
    this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
    this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_NormalMatrix;
    this.Ka;
    this.Kd;
    this.Ks;
    this.shininessVal;
    this.ambientColor;
    this.diffuseColor;
    this.specularColor;
    this.lightPos;
    this.ifLightOn;
    this.ifBlinnPhong;
    this.eyePosWorld;
};


VBObox6.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld')
}

VBObox6.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
    gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFCount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox6.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox6.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    // Adjust values for our uniforms;-------------------------------------------
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ProjMatrix.set(g_ProjMatrix);
    // Ready to draw in World coord axes.
    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka,0.25,     0.148,    0.06475,  1.0);
    gl.uniform3f(this.Kd, 0.4,      0.2368,   0.1036);
    gl.uniform3f(this.Ks, 0.774597, 0.458561, 0.200621);
    gl.uniform1f(this.shininessVal, 0.95);
    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);
    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);
    // Ready to draw in World coord axes.

    this.ViewMatrix.translate(4, 0.0, 0.0); //Shift origin leftwards,
    this.ViewMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
 
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
 
}

VBObox6.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    // ----------------------------Draw the contents of the currently-bound VBO:
    
    gl.drawArrays(gl.TRIANGLES, 		    // select the drawing primitive to draw,
       cubeStart/floatsPerVertex, 
                cubeVerts.length/floatsPerVertex);		// number of vertices to draw on-screen.

  

    this.ViewMatrix.translate(0, 0.0, 1.8);
    this.ViewMatrix.scale(1, 1, 0.8);
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(-0.6, 0.0, 0.3);
    this.ViewMatrix.scale(0.2, 0.4, 0.2);
    this.ViewMatrix.rotate(g_angleNow1, 1, 0, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(-48, -5, 15.0);
    this.ViewMatrix.scale(3, 2.1, 3);

  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 0, -1.5);
    this.ViewMatrix.scale(0.8, 0.6, 0.8);  
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0); 
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -1.1, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8); 
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -1.3, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8);  
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 14.6, 0);
    this.ViewMatrix.scale(0.8, 0.6, 0.8); 
    this.ViewMatrix.rotate(g_angleNow2, 0, 1, 0);   
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

}





VBObox6.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}

function VBObox7() {
    this.VERT_SRC = //--------------------- VERTEX SHADER source code
        'precision highp float;\n' +                // req'd in OpenGL ES if we use 'float'
        //
        'attribute vec4 a_Normal;\n' +
        'uniform mat4 u_ViewMatrix;\n' +
        'uniform mat4 u_ProjMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'attribute vec4 a_Position;\n' +
        'varying vec3 v_Normal;\n' +
        'varying vec3 v_Position;\n' +
        //
        'void main() {\n' +
        'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
        '  gl_Position = u_ProjMatrix* u_ViewMatrix * a_Position;\n' +
        'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n'+
        '}\n';


    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
        'precision mediump float;\n' +
        'varying vec3 v_Normal;\n' +
        'uniform vec3 Ka;\n' +
        'uniform vec3 Kd;\n' +
        'uniform vec3 Ks;\n' +
        'uniform float ifLightOn;\n' +
        'uniform float shininessVal;\n' +
        'uniform vec3 eyePosWorld;\n' +
        //Material color
        'uniform vec3 ambientColor;\n' +
        'uniform vec3 diffuseColor;\n' +
        'uniform vec3 specularColor;\n' +
        'uniform vec3 lightPos;\n' +
        'uniform float ifBlinnPhong;\n' +
        'varying vec3 v_Position;\n' +
        'void main() {\n' +
        'vec3 N = normalize(v_Normal);\n' +
        'vec3 L = normalize(lightPos - v_Position);\n' +
        'vec3 lightDirection = normalize(lightPos - v_Position);\n' +
        'vec3 viewDirection = normalize(eyePosWorld.xyz - v_Position);\n' +
        'vec3 halfwayDir = normalize(lightDirection + viewDirection);\n' +
        //Lambertian's cosine law
        'float lambertian = max(dot(N, L), 0.0);\n' +
        'float specular = 0.0;\n' +
        'if(lambertian > 0.0) {\n' +
        'vec3 R = reflect(-L, N);\n' +
        'vec3 V = normalize(-v_Position);\n' +
        // Compute the specular term
        'float specAngle = max(dot(R, viewDirection), 0.0);\n'+
        'if (ifBlinnPhong == 1.0){\n' +
        'specAngle = max(dot(halfwayDir, N), 0.0);\n' +
        '}\n' +
        'specular = pow(specAngle, shininessVal);\n' +
        '}\n' +
        'if (ifLightOn == 1.0){\n' +
        '    gl_FragColor = vec4(Ka * ambientColor + Kd * lambertian * diffuseColor + Ks * specular * specularColor, 1.0);\n' +
        '}\n' +
        'else{\n' +
        '   gl_FragColor = vec4(Ka * ambientColor, 1.0);\n' +
        '}\n'+

        '}\n';


    drawCube();
    drawTetrahedron();
    var mySize = cubeVerts.length + tetVerts.length;

    
    this.vboContents = new Float32Array(mySize);
  
     cubeStart = 0;
     for(i=0 , j = 0; j < cubeVerts.length; i++, j++) {
     this.vboContents[i] = cubeVerts[j];
     }
     tetStart = i;
     for(j = 0; j < tetVerts.length; i++, j++) {
      this.vboContents[i] = tetVerts[j];
      }



    this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) *
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // From any attrib in a given vertex,
    // move forward by 'vboStride' bytes to arrive
    // at the same attrib for the next vertex.
    // (== # of bytes used to store one vertex)

   //----------------------Attribute sizes
   this.vboFcount_a_Position = 4;  // # of floats in the VBO needed to store the
   // attribute named a_Position (4: x,y,z,w values)
   this.vboFCount_a_Normal = 3;  // # of floats for this attrib (3)
   //----------------------Attribute offsets
   this.vboOffset_a_Position = 0;
   //# of bytes from START of vbo to the START
   // of 1st a_Position attrib value in vboContents[]
   // == 4 floats * bytes/float
   //# of bytes from START of vbo to the START
   // of 1st a_Color attrib value in vboContents[]
   this.vboOffset_a_Normal = (this.vboFcount_a_Position) * this.FSIZE;
   // == 7 floats * bytes/float
   // # of bytes from START of vbo to the START
   // of 1st a_PtSize attrib value in vboContents[]

   //-----------------------GPU memory locations:
   this.vboLoc;									// GPU Location for Vertex Buffer Object,
   // returned by gl.createBuffer() function call
   this.shaderLoc;								// GPU Location for compiled Shader-program
   // set by compile/link of VERT_SRC and FRAG_SRC.
   //------Attribute locations in our shaders:
   this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
   this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
   this.a_NormalLoc;

   //---------------------- Uniform locations &values in our shaders
   this.ProjMatrix = new Matrix4();	// Transforms CVV axes to model axes.
   this.u_ProjMatrix;						// GPU location for u_ModelMat uniform
   this.ViewMatrix = new Matrix4();	// Transforms CVV axes to model axes.
   this.u_ViewMatrix;						// GPU location for u_ModelMat uniform
   this.NormalMatrix = new Matrix4();	// Transforms CVV axes to model axes.
   this.u_NormalMatrix;
   this.Ka;
   this.Kd;
   this.Ks;
   this.shininessVal;
   this.ambientColor;
   this.diffuseColor;
   this.specularColor;
   this.lightPos;
   this.ifLightOn;
   this.ifBlinnPhong;
   this.eyePosWorld;
};


VBObox7.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
//
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  you must call this VBObox object's switchToMe() function too!

    // a) Compile,link,upload shaders---------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it----------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
    // (positions, colors, normals, etc), or
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);				// the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use
    //		gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }
    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormaLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_PtSize');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs:
    this.u_ProjMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ProjMatrix');
    if (!this.u_ProjMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_ViewMatrix = gl.getUniformLocation(this.shaderLoc, 'u_ViewMatrix');
    if (!this.u_ViewMatrix) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');

    this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
    this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
    this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
    this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
    this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
    this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
    this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
    this.ifLightOn = gl.getUniformLocation(this.shaderLoc, 'ifLightOn');
    this.ifBlinnPhong = gl.getUniformLocation(this.shaderLoc, 'ifBlinnPhong');
    this.eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'eyePosWorld');
   
}

VBObox7.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer
        this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the
        // number of bytes used to store one complete vertex.  If set
        // to zero, the GPU gets attribute values sequentially from
        // VBO, starting at 'Offset'.	 (Our vertex size in bytes:
        // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with a_Position).
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFCount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
// --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox7.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox7.prototype.adjust = function() {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update the VBO's contents, and (if needed) each
// attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    this.ProjMatrix.set(g_ProjMatrix);
    gl.useProgram(this.shaderLoc);
    gl.uniform3f(this.Ka, 0.0215,  0.1745,   0.0215);
    gl.uniform3f(this.Kd, 0.07568, 0.61424,  0.07568);
    gl.uniform3f(this.Ks, 0.633,   0.727811, 0.633);
    gl.uniform1f(this.shininessVal, 0.5);
    gl.uniform3f(this.ambientColor, arColor1, agColor1, abColor1);
    gl.uniform3f(this.diffuseColor, drColor1, dgColor1, dbColor1);
    gl.uniform3f(this.specularColor, srColor1, sgColor1, sbColor1);
    gl.uniform3f(this.lightPos, lPosX, lPosY, lPosZ);
    gl.uniform3f(this.eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1f(this.ifLightOn, ifLightOn);
    gl.uniform1f(this.ifBlinnPhong, ifBlinnPhong);
    // Adjust values for our uniforms;-------------------------------------------
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    
   
    gl.uniformMatrix4fv(this.u_ProjMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ProjMatrix.elements);	// send data from Javascript.
    this.ViewMatrix.set(g_ViewMatrix);
    this.ViewMatrix.translate(6, 0.0, 0.0); //Shift origin leftwards,
    	// -spin drawing axes,
    //  Transfer new uniforms' values to the GPU:--------------------------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ViewMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,	  // GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
  
}

VBObox7.prototype.draw = function() {
if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    // ----------------------------Draw the contents of the currently-bound VBO:
  

    this.ViewMatrix.translate(2, 0.0, 0);
    this.ViewMatrix.rotate(90, 1, 0, 0);
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 1.1, 0.0);
    this.ViewMatrix.scale(0.8, 0.8, 0.8);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, 1.5, 0.0);
    this.ViewMatrix.scale(0.7, 0.7, 0.7);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        tetStart/floatsPerVertex, 
                                    tetVerts.length/floatsPerVertex);

    this.ViewMatrix.translate(0, -8, 0.0);
    this.ViewMatrix.scale(0.8, 1.6, 0.8);
   
    this.ViewMatrix.rotate(g_angleNow1, 0, 1, 0);   // -spin drawing axes,
  
    this.NormalMatrix.setInverseOf(this.ViewMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_ViewMatrix,    // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.ViewMatrix.elements);  // send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrix,      // GPU location of the uniform
        false,                                      // use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,             // select the drawing primitive to draw,
        cubeStart/floatsPerVertex, 
                                    cubeVerts.length/floatsPerVertex);

    

}

VBObox7.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// 'vboContents' to our VBO, but without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        this.vboContents);   // the JS source-data array used to fill VBO
}