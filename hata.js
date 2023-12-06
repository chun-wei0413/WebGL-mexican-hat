var nRows = 50;
var nColumns = 50;

var data = new Array(nRows);
for(var i = 0; i < nRows; i++) data[i] = new Array(nColumns);

for(var i = 0; i < nRows; i++) {
    var x = Math.PI * (4 * i / nRows - 2.0);
    for(var j = 0; j < nColumns; j++) {
        var y = Math.PI * (4 * j / nRows - 2.0);
        var r = Math.sqrt(x * x + y * y);

        if (r) data[i][j] = Math.sin(r) / r;
        else data[i][j] = 1;
    }
}

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 1;
var rotate = true;
var theta2 = [0, 0, 0];
var thetaLoc;

var pointsArray = [];

var fColor;

var canvas;
var gl;
var lc = 3;
var near = -10;
var far = 10;
var radius = 6.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var SpinSpeed = 2.0;
var RotateMultiply = 1.0;
var OFRatio = 0.0;
var OFRatioLoc;

var modeViewMatrix, projectionMatrix, frustumMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, frustumMatrixLoc;
var eye;

const red = vec4(1.0, 0.0, 0.0, 1.0);
const green = vec4(0.0, 1.0, 0.0, 1.0);
const blue = vec4(0.0, 0.0, 1.0, 1.0);
const black = vec4(0.0, 0.0, 0.0, 1.0);
const pink = vec4(1.0, 0.5, 0.5, 1.0);
const gold = vec4(1.0, 0.843137, 0, 1.0);
var color = vec4(0.0, 0.0, 0.0, 1.0);
var colorless = vec4(0.0, 0.0, 0.0, 0);

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.92, 0.9375, 0.94, 1.0);

    for (var i = 0; i < nRows - 1; i++)
        for (var j = 0; j < nColumns - 1; j++)
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0));

    for (var j = 0; j < nColumns - 1; j++)
        for (var i = 0; i < nRows - 1; i++)
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0));

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    frustumMatrixLoc = gl.getUniformLocation(program, "frustumMatrix");
    thetaLoc = gl.getUniformLocation(program, "theta2");
    OFRatioLoc = gl.getUniformLocation(program, "OFRatio");

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
        axis = xAxis; 
    };
    document.getElementById("yButton").onclick = function () { 
        rotate = true;
        axis = yAxis; 
    };
    document.getElementById("zButton").onclick = function () {
        rotate = true;
        axis = zAxis; 
    };
    document.getElementById("sButton").onclick = function () {
        rotate = false;
    };
    document.getElementById( "resetRotate" ).onclick = function () {
		SpinSpeed = 2.0;
		theta2 = [ 0, 0, 0 ];
		axis = 1;
		RotateMultiply = 1.0;
    };
    document.getElementById("speed_up").onclick = function () {
        SpinSpeed += (SpinSpeed >= 8.0) ? 0 : 0.4;
        SpinSpeed = (SpinSpeed > 7.0) ? 8 : SpinSpeed;
    };
    document.getElementById("speed_down").onclick = function () {
        SpinSpeed -= (SpinSpeed <= 0.0) ? 0 : 0.4;
        SpinSpeed = (SpinSpeed < 0.0) ? 0 : SpinSpeed;
    };

    document.getElementById("LBR").onclick = function () { lc = 0; };
    document.getElementById("LBG").onclick = function () { lc = 1; };
    document.getElementById("LBBLUE").onclick = function () { lc = 2; };
    document.getElementById("LBBLACK").onclick = function () { lc = 3; };
    document.getElementById("LBPINK").onclick = function () { lc = 4; };
    document.getElementById("LBGOLD").onclick = function () { lc = 5; };

    render();
}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    frustumMatrix = perspective(15.0, 1.0, near, far);
    if (rotate)
        theta2[axis] += SpinSpeed * RotateMultiply;
    gl.uniform3fv(thetaLoc, theta2);
    gl.uniform1f(OFRatioLoc, OFRatio);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(frustumMatrixLoc, false, flatten(frustumMatrix));

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

    gl.uniform4fv(fColor, flatten(color));

    for (var i = 0; i < nRows; i++) gl.drawArrays(gl.LINE_STRIP, i * nColumns, nColumns);
    for (var i = 0; i < nColumns; i++) gl.drawArrays(gl.LINE_STRIP, i * nRows + pointsArray.length / 2, nRows);

    requestAnimFrame(render);
}
