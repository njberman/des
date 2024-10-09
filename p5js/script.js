let CONFIG;
let g = 9.81;

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

function thetaDoubleDotPendulum(theta, thetaDot) {
  const L = 5;
  const mew = 1;
  return (-g / L) * sin(theta) - mew * thetaDot;
}

function rotatePoint(point, angle) {
  return createVector(
    point.x * cos(angle) - point.y * sin(angle),
    point.x * sin(angle) + point.y * cos(angle),
  );
}

class Arrow {
  constructor(ax, ay, bx, by, color, strokeWeight) {
    this.a = createVector(ax, ay);
    this.b = createVector(bx, by);
    this.color = color || 'white';
    this.strokeWeight = strokeWeight || 2;

    this.triangleSide = 5.5 * this.strokeWeight;

    this.rotationAngle = 0;
    this.calculate();
  }

  calculate() {
    this.sOver2 = this.triangleSide / 2;
    const x = this.b.x - this.a.x;
    const y = this.b.y - this.a.y;

    const xOverY = x / y;

    if (x >= 0 && y >= 0) {
      this.rotationAngle = -atan(xOverY);
    } else if (this.b.x - this.a.x < 0 && this.b.y - this.a.y >= 0) {
      this.rotationAngle = atan(-xOverY);
    } else if (this.b.x - this.a.x < 0 && this.b.y - this.a.y < 0) {
      this.rotationAngle = PI / 2 + atan(1 / xOverY);
    } else if (this.b.x - this.a.x >= 0 && this.b.y - this.a.y < 0) {
      this.rotationAngle = -PI / 2 - atan(-1 / xOverY);
    }
  }

  setA(newA) {
    this.a = newA;
  }

  setB(newB) {
    this.b = newB;
  }

  setColor(newColor) {
    this.color = newColor;
  }

  draw() {
    stroke(this.color);
    strokeWeight(this.strokeWeight);

    push();
    fill(this.color);
    noStroke();

    translate(this.b.x, this.b.y);
    rotate(this.rotationAngle);

    triangle(
      -this.sOver2,
      -this.sOver2 * sqrt(3),
      this.sOver2,
      -this.sOver2 * sqrt(3),
      0,
      0,
    );

    // This bits a bit dodgy, but it's basically drawing the line up to the base of the triangle so we don't see any extrusions.
    stroke(this.color);
    strokeWeight(this.strokeWeight);

    rotate(-this.rotationAngle);
    const newPoint = rotatePoint(
      createVector(0, -this.sOver2 * sqrt(3)),
      this.rotationAngle,
    );

    line(this.a.x - this.b.x, this.a.y - this.b.y, newPoint.x, newPoint.y);
    pop();
  }
}

class VectorAtPoint extends Arrow {
  constructor(point, vector, showMagByColor, color) {
    const newPoint = point.copy().add(vector);
    super(point.x, point.y, newPoint.x, newPoint.y, color, 2);

    this.point = point.copy();
    this.vector = vector.copy();
    this.setVector();

    if (showMagByColor) this.showMagByColor();
  }

  setPoint(newPoint) {
    this.point = newPoint.copy();
    this.setA(this.point);
  }

  setVector(newVector) {
    if (newVector !== undefined) this.vector = newVector.copy();
    this.setB(this.point.copy().add(this.vector));
  }

  showMagByColor() {
    const mag = this.vector.mag();
    this.vector = this.vector.copy().normalize().mult(30);
    this.setVector();

    const hue = map(mag, 0, 14, 0, 360);
    const { r, g, b } = hslToRgb(hue, 100, 50);
    this.color = color(r, g, b, 255);

    this.strokeWeight = 1;
    this.triangleSide = 10;
    this.calculate();
  }
}

class PhaseSpace {
  constructor(differentialEquation, grid) {
    this.vectors = [];

    this.differentialEquation = differentialEquation;
    this.grid = grid;

    for (let x = grid.xMin; x <= grid.xMax; x += CONFIG.constants.GAP) {
      this.vectors.push([]);
      for (let y = grid.yMin; y <= grid.yMax; y += CONFIG.constants.GAP) {
        this.vectors[this.vectors.length - 1].push(
          new VectorAtPoint(
            grid.c2p(createVector(x, y)),
            this.velocityVector(createVector(x, y)),
            true,
          ),
        );
      }
    }

    this.simulatedPoints = [];
    this.simulating = false;
    this.simulatingIndex = 0;
    this.simulatedVectors = [];
  }

  draw() {
    for (const vertLineOfVectors of this.vectors) {
      for (const vector of vertLineOfVectors) {
        vector.draw();
      }
    }

    if (this.simulating) {
      for (let i = 0; i <= this.simulatingIndex; i++) {
        const point = this.grid.c2p(this.simulatedPoints[i]);
        noStroke();
        fill(255);
        circle(point.x, point.y, 10);

        if (i !== 0) {
          stroke(255);
          strokeWeight(1);
          const lastPoint = this.grid.c2p(this.simulatedPoints[i - 1]);
          line(point.x, point.y, lastPoint.x, lastPoint.y);
        }

        // this.simulatedVectors[i].draw();
      }

      if (this.simulatingIndex < this.simulatedPoints.length - 1)
        this.simulatingIndex++;
    }
  }

  velocityVector(point) {
    return createVector(point.y, this.differentialEquation(point.x, point.y));
  }

  simulateSystemEvolution(startPoint) {
    const Dt = 0.1;
    this.simulatedPoints = [startPoint];
    this.simulatedVectors = [
      new VectorAtPoint(startPoint, this.velocityVector(startPoint), true),
    ];
    console.log(startPoint, this.simulatedVectors);

    // Start at Dt because we already have startPoint in simulatedPoints
    for (let t = Dt; t < 100; t += Dt) {
      const prevPoint =
        this.simulatedPoints[this.simulatedPoints.length - 1].copy();

      const velocityVector = this.velocityVector(prevPoint);

      const nextPoint = prevPoint.add(velocityVector.mult(Dt));
      this.simulatedPoints.push(nextPoint);
    }

    this.simulating = true;
    this.simulatingIndex = 0;
  }
}

class Line {
  constructor(ax, ay, bx, by, color, strokeWeight) {
    this.a = createVector(ax, ay);
    this.b = createVector(bx, by);
    this.color = color || 'white';
    this.strokeWeight = strokeWeight || 1;
  }

  draw() {
    stroke(this.color);
    strokeWeight(this.strokeWeight);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }

  setCol(color) {
    this.color = color;
  }
}

class Grid {
  constructor(xRange, xPi, yRange, yPi, fadedLineRatio) {
    this.xRange = xRange;
    [this.xMin, this.xMax, this.xStep] = this.xRange;
    this.xDistance = this.xMax - this.xMin;
    this.xLineDistance = (width * this.xStep) / this.xDistance;
    this.xAxisIndex = -this.xMin / this.xStep;
    this.xPi = xPi;

    this.yRange = yRange;
    [this.yMin, this.yMax, this.yStep] = this.yRange;
    this.yDistance = this.yMax - this.yMin;
    this.yLineDistance = (height * this.yStep) / this.yDistance;
    this.yAxisIndex = -this.yMin / this.yStep;
    this.yPi = yPi;

    this.fadedLineRatio = fadedLineRatio;

    this.coordinates = false;

    this.xLines = [];
    this.xFadedLines = [];
    for (let x = -width / 2; x <= width / 2; x += this.xLineDistance) {
      this.xLines.push(
        new Line(x, height / 2, x, -height / 2, CONFIG.colors.gridLines),
      );

      for (
        let dx = 0;
        dx < this.xLineDistance;
        dx += this.xLineDistance / this.fadedLineRatio
      ) {
        this.xFadedLines.push(
          new Line(
            x + dx,
            height / 2,
            x + dx,
            -height / 2,
            CONFIG.colors.fadedGridLines,
          ),
        );
      }
    }

    this.xLines[this.xAxisIndex].setCol(CONFIG.colors.axesLines);

    this.yLines = [];
    this.yFadedLines = [];
    for (let y = -height / 2; y <= height / 2; y += this.yLineDistance) {
      this.yLines.push(
        new Line(-width / 2, y, width / 2, y, CONFIG.colors.gridLines),
      );

      for (
        let dy = 0;
        dy < this.yLineDistance;
        dy += this.yLineDistance / this.fadedLineRatio
      ) {
        this.yFadedLines.push(
          new Line(
            -width / 2,
            y + dy,
            width / 2,
            y + dy,
            CONFIG.colors.fadedGridLines,
          ),
        );
      }
    }

    this.yLines[this.yAxisIndex].setCol(CONFIG.colors.axesLines);
  }

  toggleCoordinates() {
    this.coordinates = !this.coordinates;
  }

  c2p(coordinate) {
    return createVector(
      (coordinate.x / this.xStep) * this.xLineDistance -
        this.xLines[this.xAxisIndex].a.x,
      (coordinate.y / this.yStep) * this.yLineDistance -
        this.yLines[this.yAxisIndex].a.y,
    );
  }

  p2c(point) {
    return createVector(
      (this.xStep / this.xLineDistance) *
        (point.x + this.xLines[this.xAxisIndex].a.x),
      (this.yStep / this.yLineDistance) *
        (point.y + this.yLines[this.yAxisIndex].a.y),
    );
  }

  draw() {
    for (const xLine of this.xLines) {
      const index = this.xLines.indexOf(xLine);
      xLine.draw();

      if (!this.coordinates) continue;

      const x = xLine.a.x;
      const y = this.yLines[this.yAxisIndex].a.y;

      let num = this.xMin + index * this.xStep;
      if (num === 0) continue;

      if (this.xPi) {
        const rationalPart = num / PI;
        num = `${abs(rationalPart) !== 1 ? round(rationalPart, 2) : rationalPart === -1 ? '-' : ''}π`;
      }

      scale(1, -1);
      noStroke();
      textSize(20);
      fill(CONFIG.colors.textColor);

      textAlign(LEFT, TOP);
      // Has to be -y here because we scaled back to original above,
      // since if you don't, the text is flipped.
      text(num, x + 5, -y);
      scale(1, -1);
    }

    for (const yLine of this.yLines) {
      const index = this.yLines.indexOf(yLine);
      yLine.draw();

      if (!this.coordinates) continue;

      const x = this.xLines[this.xAxisIndex].a.x;
      const y = yLine.a.y;

      let num = this.yMin + index * this.yStep;
      if (num === 0) continue;

      scale(1, -1);
      noStroke();
      textSize(16);
      fill(CONFIG.colors.textColor);

      textAlign(RIGHT, TOP);
      // Has to be -y here because we scaled back to original above,
      // since if you don't, the text is flipped.
      text(num, x - 3, -y);
      scale(1, -1);
    }

    for (const xFadedLine of this.xFadedLines) {
      xFadedLine.draw();
    }

    for (const yFadedLine of this.yFadedLines) {
      yFadedLine.draw();
    }
  }
}

let grid;
let CMUFont;

let pendulumPhaseSpace;

function preload() {
  CMUFont = loadFont('assets/cmu.ttf');
}

function setup() {
  let canvasInset = 350;
  let tempWidth = windowWidth - canvasInset;
  createCanvas(tempWidth, round((9 / 16) * tempWidth));

  CONFIG = {
    colors: {
      gridLines: color(88, 196, 221, 255),
      fadedGridLines: color(88, 196, 221, 50),
      axesLines: color(255, 255, 255, 255),
      textColor: color(255, 255, 255, 255),
    },
    constants: {
      GAP: 0.4,
    },
  };

  translate(width / 2, height / 2);
  scale(1, -1);
  textFont(CMUFont);

  grid = new Grid([-3 * PI, 3 * PI, PI / 2], true, [-4, 4, 1], false, 5);
  grid.toggleCoordinates();

  pendulumPhaseSpace = new PhaseSpace(thetaDoubleDotPendulum, grid);
}

function draw() {
  translate(width / 2, height / 2);
  scale(1, -1);

  background(0);

  grid.draw();
  pendulumPhaseSpace.draw();
}

function mousePressed() {
  const point = grid.p2c(
    createVector(mouseX - width / 2, -mouseY + height / 2),
  );

  pendulumPhaseSpace.simulateSystemEvolution(point);
}
