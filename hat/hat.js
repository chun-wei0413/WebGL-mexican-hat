var gl;

// Define the number of rows and columns for the grid
var nRows = 50;
var nColumns = 50;

// Calculate data for the hat function
var data = Array.from({ length: nRows }, (_, i) => {
    var x = Math.PI * (4 * i / nRows - 2.0);
    return Array.from({ length: nColumns }, (_, j) => {
        var y = Math.PI * (4 * j / nRows - 2.0);
        var r = Math.sqrt(x * x + y * y);
        return r ? Math.sin(r) / r : 1.0;
    });
});

// Initial camera parameters
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Rotation parameters
var axis = 1;
var rotate = true;
var speed = 2.0;
var theta2 = [0, 0, 0];
var rotateMultiply=1.0;
var thetaLoc;
var pointsArray = [];

var fColor;

// Camera parameters
var near = -10;
var far = 10;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

// Constants for colors
const red = vec4(1.0, 0.0, 0.0, 1.0);
const green = vec4(0.0, 1.0, 0.0, 1.0);
const blue = vec4(0.0, 0.0, 1.0, 1.0);
const black = vec4(0.0, 0.0, 0.0, 1.0);
const pink = vec4(1.0, 0.5, 0.5, 1.0);
const gold = vec4(1.0, 0.843137, 0, 1.0);
var color = vec4(0.0, 0.0, 0.0, 1.0);
var colorless = vec4(0.0, 0.0, 0.0, 0); // Transparent color

// Color indices
var lc = 3;

// View frustum boundaries
var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var modelViewMatrixLoc, projectionMatrixLoc;

// Initialize function
window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    // Set up WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.92, 0.9375, 0.94, 1.0);

    // Enable depth testing and polygon offset
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    // Create grid vertex array
    for (var i = 0; i < nRows - 1; i++) {
        for (var j = 0; j < nColumns - 1; j++) {
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j], 2 * j / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));
        }
    }

    // Load vertex and fragment shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    thetaLoc = gl.getUniformLocation(program, "theta2");

    // Set button event handlers
    document.getElementById("Button1").onclick = function () { near *= 1.1; far *= 1.1; };
    document.getElementById("Button2").onclick = function () { near *= 0.9; far *= 0.9; };
    document.getElementById("Button3").onclick = function () { radius *= 2.0; };
    document.getElementById("Button4").onclick = function () { radius *= 0.5; };
    document.getElementById("Button5").onclick = function () { theta += dr; };
    document.getElementById("Button6").onclick = function () { theta -= dr; };
    document.getElementById("Button7").onclick = function () { phi += dr; };
    document.getElementById("Button8").onclick = function () { phi -= dr; };
    document.getElementById("Button9").onclick = function () { left *= 0.9; right *= 0.9; };
    document.getElementById("Button10").onclick = function () { left *= 1.1; right *= 1.1; };
    document.getElementById("Button11").onclick = function () { ytop *= 0.9; bottom *= 0.9; };
    document.getElementById("Button12").onclick = function () { ytop *= 1.1; bottom *= 1.1; };

    document.getElementById("xButton").onclick = function () {
        rotate = true;
        axis = 0;
    };
    document.getElementById("yButton").onclick = function () {
        rotate = true;
        axis = 1;
    };
    document.getElementById("zButton").onclick = function () {
        rotate = true;
        axis = 2;
    };
    document.getElementById("sButton").onclick = function () {
        rotate = false;
    };
    document.getElementById( "resetRotate" ).onclick = function () {
		speed = 2.0;
		theta2 = [ 0, 0, 0 ];
		axis = 1;
		rotateMultiply = 1.0;
    };
    document.getElementById("speed_up").onclick = function () {
        if (speed < 5.0) {
            speed = speed + 0.5;
        }
    };
    document.getElementById("speed_down").onclick = function () {
        if (speed > 0.5) {
            speed = speed - 0.5;
        }
    };

    document.getElementById("LBR").onclick = function () { lc = 0; };
    document.getElementById("LBG").onclick = function () { lc = 1; };
    document.getElementById("LBBLUE").onclick = function () { lc = 2; };
    document.getElementById("LBBLACK").onclick = function () { lc = 3; };
    document.getElementById("LBPINK").onclick = function () { lc = 4; };
    document.getElementById("LBGOLD").onclick = function () { lc = 5; };
    render();
}

// Rendering function
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Set color based on the selected color index
    switch (lc) {
        case 0:
            color = red;
            break;
        case 1:
            color = green;
            break;
        case 2:
            color = blue;
            break;
        case 3:
            color = black;
            break;
        case 4:
            color = pink;
            break;
        case 5:
            color = gold;
            break;
        default:
            color = black;
    }

    // Draw grid lines for each row
    for (var i = 0; i < pointsArray.length; i += 4) {
        gl.uniform4fv(fColor, flatten(color));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(fColor, flatten(colorless));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    // Update rotation if enabled
    if (rotate)
        theta2[axis] += speed*rotateMultiply;

    gl.uniform3fv(thetaLoc, theta2);

    requestAnimFrame(render);
}
