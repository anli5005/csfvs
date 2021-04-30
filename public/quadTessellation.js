// @ts-nocheck

p5.disableFriendlyErrors = true;

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    rowsCols = width * height / 64000;
    colorMode(HSB, rowsCols);
}

// Quad Tessellation
// Slightly modified
// by @blckbrry-pi

let perlinPointGens;

let points = [
    new p5.Vector(100, 100),
    new p5.Vector(110, 200),
    new p5.Vector(210, 200),
    new p5.Vector(200, 150),
]

let shift = {
    hori: new p5.Vector(),
    vert: new p5.Vector(),
};

let rowsCols;

function setup() {
    frameRate(24);
    noiseDetail(2, 4)
    createCanvas(windowWidth, windowHeight).parent("background-canvas-container");

    perlinPointGens = [
        new p5.Vector(random(0, 1000), random(0, 1000)),
        new p5.Vector(random(0, 1000), random(0, 1000)),
        new p5.Vector(random(0, 1000), random(0, 1000)),
        new p5.Vector(random(0, 1000), random(0, 1000)),
    ];
    rowsCols = width * height / 64000;
    colorMode(HSB, rowsCols);
}

function draw() {
    background(220);

    points = genPerlinPoints();

    points.forEach(function (v) {
        v.mult(50);
    })

    __macro_calc_shifts();
    __macro_draw();

    incrementPerlinPoints(0.003);
}

function rotateAround(vector) {
    translate(vector.x, vector.y);
    rotate(PI);
    translate(-vector.x, -vector.y);
}
function drawQuad() {
    quad(
        points[0].x, points[0].y,
        points[1].x, points[1].y,
        points[2].x, points[2].y,
        points[3].x, points[3].y
    );
}
function rotateAndDraw(pointIndex1, pointIndex2) {
    let doubleVector = new p5.Vector(
        points[pointIndex1].x + points[pointIndex2].x,
        points[pointIndex1].y + points[pointIndex2].y
    );
    let vector = new p5.Vector(doubleVector.x / 2, doubleVector.y / 2);
    rotateAround(vector);
    drawQuad();
}
function drawMacroBlock() {
    drawQuad();

    push();
    rotateAndDraw(1, 2);
    rotateAndDraw(0, 1);
    pop();

    push();
    rotateAndDraw(2, 3);
    pop();
}


function getPointDiff(pointIndex1, pointIndex2) {
    return new p5.Vector(
        points[pointIndex2].x - points[pointIndex1].x,
        points[pointIndex2].y - points[pointIndex1].y
    );
}


function genPerlinPoints() {
    return [
        new p5.Vector(noise(perlinPointGens[0].x) - 1, noise(perlinPointGens[0].y) - 1),
        new p5.Vector(noise(perlinPointGens[1].x) - 1, noise(perlinPointGens[1].y) + 1),
        new p5.Vector(noise(perlinPointGens[2].x) + 1, noise(perlinPointGens[2].y) + 1),
        new p5.Vector(noise(perlinPointGens[3].x) + 1, noise(perlinPointGens[3].y) - 1),
    ];
}
function incrementPerlinPoints(incVal) {
    perlinPointGens[0].x += incVal;
    perlinPointGens[0].y += incVal;
    perlinPointGens[1].x += incVal;
    perlinPointGens[1].y += incVal;
    perlinPointGens[2].x += incVal;
    perlinPointGens[2].y += incVal;
    perlinPointGens[3].x += incVal;
    perlinPointGens[3].y += incVal;
}





function __macro_calc_shifts() {
    shift.hori = getPointDiff(0, 3);
    shift.hori.add(getPointDiff(1, 2));

    shift.vert = getPointDiff(0, 1);
    shift.vert.add(getPointDiff(3, 2));
}

function __macro_draw() {
    translate(width / 2, height / 2)
    translate(shift.hori.x * -rowsCols / 2, shift.hori.y * -rowsCols / 2);
    translate(shift.vert.x * -rowsCols / 2, shift.vert.y * -rowsCols / 2);

    for (let i = 0; i < rowsCols; i++) {
        push();
        for (let j = 0; j < rowsCols; j++) {
            fill(i + j, i, rowsCols);
            drawMacroBlock();
            translate(shift.vert)
        }
        pop();
        translate(shift.hori);
    }
}

Array.prototype.clone = function () {
    return this.slice(0);
};
