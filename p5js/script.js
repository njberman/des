const BUFFER = 3;

// Pendulum constants
let g = 9.81;
const L = 5.5;
const mew = 0.75;
// Pendulum constants

let grid;
let pendulumPhaseSpace;
let CMUFont1;
let CMUFont2;
let CMUFont3;

let awaitingSimulationStart = false;
let simulationPoint;

// Helper functions that do not depend on the p5 instance
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
  return (-g / L) * Math.sin(theta) - mew * thetaDot;
}

function rotatePoint(p, point, angle) {
  return p.createVector(
    point.x * p.cos(angle) - point.y * p.sin(angle),
    point.x * p.sin(angle) + point.y * p.cos(angle),
  );
}

let CONFIG;
// Instance mode setup
let phaseSpaceSketch = (p) => {
  p.preload = function () {
    CMUFont1 = p.loadFont('assets/cmu.ttf');
  };

  p.setup = function () {
    let tempWidth = p.windowWidth / 2;
    let canv = p.createCanvas(
      tempWidth - BUFFER,
      Math.round((9 / 16) * tempWidth) - BUFFER,
    );
    canv.parent('phase-space');

    CONFIG = {
      colors: {
        gridLines: p.color(88, 196, 221, 255),
        fadedGridLines: p.color(88, 196, 221, 50),
        axesLines: p.color(255, 255, 255, 255),
        textColor: p.color(255, 255, 255, 255),
      },
      constants: {
        GAP: 0.57,
      },
    };

    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);
    p.textFont(CMUFont1);

    grid = new Grid(
      p,
      [-3 * Math.PI, 3 * Math.PI, Math.PI / 2],
      true,
      [-4, 4, 1],
      false,
      5,
    );
    grid.toggleCoordinates();

    pendulumPhaseSpace = new PhaseSpace(p, thetaDoubleDotPendulum, grid);
  };

  p.draw = () => {
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);

    p.background(0);
    grid.draw();
    pendulumPhaseSpace.draw();

    if (awaitingSimulationStart) {
      const point = grid.c2p(simulationPoint);

      p.noStroke();
      p.fill(255, 220);
      p.circle(point.x, point.y, 10);
    }
  };

  p.mousePressed = () => {
    if (
      0 > p.mouseX ||
      p.mouseX > p.width ||
      0 > p.mouseY ||
      p.mouseY > p.height
    )
      return;
    simulationPoint = grid.p2c(
      p.createVector(p.mouseX - p.width / 2, -p.mouseY + p.height / 2),
    );

    pendulumPhaseSpace.simulatedPoints = [];
    pendulumPhaseSpace.simulating = false;
    pendulumPhaseSpace.simulatingIndex = 0;

    awaitingSimulationStart = true;
  };

  p.keyPressed = () => {
    if (p.key === ' ' && awaitingSimulationStart) {
      pendulumPhaseSpace.simulateSystemEvolution(simulationPoint);

      awaitingSimulationStart = false;
    }
  };
};

let pendulumSimSketch = (p) => {
  p.preload = () => {
    CMUFont2 = p.loadFont('assets/cmu.ttf');
  };

  p.setup = () => {
    let tempWidth = p.windowWidth / 2;
    let canv = p.createCanvas(
      tempWidth - BUFFER,
      Math.round((9 / 16) * tempWidth) - BUFFER,
    );
    canv.parent('pendulum-sim');
  };

  p.draw = () => {
    p.background(0);

    p.translate(p.width / 2, p.height / 6);

    p.fill(255);
    p.stroke(255);

    p.circle(0, 0, 20);

    let theta =
      pendulumPhaseSpace.simulatedPoints.length > 0
        ? pendulumPhaseSpace.simulatedPoints[pendulumPhaseSpace.simulatingIndex]
            .x
        : 0;

    if (awaitingSimulationStart) {
      theta = simulationPoint.x;
    }

    let x = 75 * L * Math.sin(theta),
      y = 75 * L * Math.cos(theta);

    p.strokeWeight(2);
    p.line(0, 0, x, y);

    p.stroke(255, 30, 170);
    p.fill(255, 30, 170);
    p.circle(x, y, 30);
  };
};

let pendulumGraphAxes;
let pendulumGraphSketch = (p) => {
  p.preload = () => {
    CMUFont3 = p.loadFont('assets/cmu.ttf');
  };

  p.setup = () => {
    let tempWidth = p.windowWidth;
    let canv = p.createCanvas(
      tempWidth - BUFFER,
      p.windowHeight - Math.round((9 / 16) * 0.5 * tempWidth) - BUFFER,
    );
    canv.parent('pendulum-graph');
  };

  p.draw = () => {
    p.background(0);
  };
};

// Attach sketch to new p5 instance
let myPhaseSpaceSketch = new p5(phaseSpaceSketch);
let myPendulumSimSketch = new p5(pendulumSimSketch);
let myPendulumGraphSketch = new p5(pendulumGraphSketch);

class Arrow {
  constructor(p, ax, ay, bx, by, color, strokeWeight) {
    this.p = p;
    this.a = p.createVector(ax, ay);
    this.b = p.createVector(bx, by);
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
      this.rotationAngle = -this.p.atan(xOverY);
    } else if (x < 0 && y >= 0) {
      this.rotationAngle = this.p.atan(-xOverY);
    } else if (x < 0 && y < 0) {
      this.rotationAngle = this.p.PI / 2 + this.p.atan(1 / xOverY);
    } else {
      this.rotationAngle = -this.p.PI / 2 - this.p.atan(-1 / xOverY);
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
    this.p.stroke(this.color);
    this.p.strokeWeight(this.strokeWeight);

    this.p.push();
    this.p.fill(this.color);
    this.p.noStroke();

    this.p.translate(this.b.x, this.b.y);
    this.p.rotate(this.rotationAngle);

    this.p.triangle(
      -this.sOver2,
      -this.sOver2 * this.p.sqrt(3),
      this.sOver2,
      -this.sOver2 * this.p.sqrt(3),
      0,
      0,
    );

    this.p.stroke(this.color);
    this.p.strokeWeight(this.strokeWeight);

    this.p.rotate(-this.rotationAngle);
    const newPoint = rotatePoint(
      this.p,
      this.p.createVector(0, -this.sOver2 * this.p.sqrt(3)),
      this.rotationAngle,
    );

    this.p.line(
      this.a.x - this.b.x,
      this.a.y - this.b.y,
      newPoint.x,
      newPoint.y,
    );
    this.p.pop();
  }
}

class VectorAtPoint extends Arrow {
  constructor(p, point, vector, showMagByColor, color) {
    const newPoint = point.copy().add(vector);
    super(p, point.x, point.y, newPoint.x, newPoint.y, color, 2);

    this.p = p;
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

    const hue = this.p.map(mag, 0, 14, 0, 360);
    const { r, g, b } = hslToRgb(hue, 100, 50);
    this.color = this.p.color(r, g, b, 255);

    this.strokeWeight = 1;
    this.triangleSide = 10;
    this.calculate();
  }
}

class PhaseSpace {
  constructor(p, differentialEquation, grid) {
    this.p = p;
    this.vectors = [];
    this.differentialEquation = differentialEquation;
    this.grid = grid;

    for (let x = grid.xMin; x <= grid.xMax; x += CONFIG.constants.GAP) {
      this.vectors.push([]);
      for (let y = grid.yMin; y <= grid.yMax; y += CONFIG.constants.GAP) {
        this.vectors[this.vectors.length - 1].push(
          new VectorAtPoint(
            p,
            grid.c2p(this.p.createVector(x, y)),
            this.velocityVector(this.p.createVector(x, y)),
            true,
          ),
        );
      }
    }

    this.simulatedPoints = [];
    this.simulating = false;
    this.simulatingIndex = 0;
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
        this.p.noStroke();
        this.p.fill(255);

        if (i !== 0) {
          this.p.stroke(255);
          this.p.strokeWeight(1);
          const lastPoint = this.grid.c2p(this.simulatedPoints[i - 1]);
          this.p.line(point.x, point.y, lastPoint.x, lastPoint.y);
        }
      }

      if (this.simulatingIndex < this.simulatedPoints.length - 1)
        this.simulatingIndex += 1;
    }
  }

  velocityVector(point) {
    return this.p.createVector(
      point.y,
      this.differentialEquation(point.x, point.y),
    );
  }

  simulateSystemEvolution(startPoint) {
    const frameRate = this.p.getTargetFrameRate();
    const Dt = 1 / frameRate;
    this.simulatedPoints = [startPoint];

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
  constructor(p, ax, ay, bx, by, color, strokeWeight) {
    this.p = p;
    this.a = p.createVector(ax, ay);
    this.b = p.createVector(bx, by);
    this.color = color || 'white';
    this.strokeWeight = strokeWeight || 1;
  }

  draw() {
    this.p.stroke(this.color);
    this.p.strokeWeight(this.strokeWeight);
    this.p.line(this.a.x, this.a.y, this.b.x, this.b.y);
  }

  setCol(color) {
    this.color = color;
  }
}

class Axes {
  constructor(p, xRange, xPi, yRange, yPi) {
    this.p = p;
    this.xRange = xRange;
    [this.xMin, this.xMax, this.xStep] = this.xRange;
    this.xDistance = this.xMax - this.xMin;
    this.xLineDistance = (p.width * this.xStep) / this.xDistance;
    this.xAxisIndex = -this.xMin / this.xStep;
    this.xPi = xPi;

    this.yRange = yRange;
    [this.yMin, this.yMax, this.yStep] = this.yRange;
    this.yDistance = this.yMax - this.yMin;
    this.yLineDistance = (p.height * this.yStep) / this.yDistance;
    this.yAxisIndex = -this.yMin / this.yStep;
    this.yPi = yPi;

    this.coordinates = false;

    this.xLines = [];
    for (let x = -p.width / 2; x <= p.width / 2; x += this.xLineDistance) {
      this.xLines.push(
        new Line(p, x, p.height / 2, x, -p.height / 2, CONFIG.colors.gridLines),
      );
    }
    this.xLines[this.xAxisIndex].setCol(CONFIG.colors.axesLines);

    this.yLines = [];
    for (let y = -p.height / 2; y <= p.height / 2; y += this.yLineDistance) {
      this.yLines.push(
        new Line(p, -p.width / 2, y, p.width / 2, y, CONFIG.colors.gridLines),
      );
    }
    this.yLines[this.yAxisIndex].setCol(CONFIG.colors.axesLines);
  }

  toggleCoordinates() {
    this.coordinates = !this.coordinates;
  }

  c2p(coordinate) {
    return this.p.createVector(
      (coordinate.x / this.xStep) * this.xLineDistance -
        this.xLines[this.xAxisIndex].a.x,
      (coordinate.y / this.yStep) * this.yLineDistance -
        this.yLines[this.yAxisIndex].a.y,
    );
  }

  p2c(point) {
    return this.p.createVector(
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
        const rationalPart = num / Math.PI;
        num = `${Math.abs(rationalPart) !== 1 ? this.p.round(rationalPart, 2) : rationalPart === -1 ? '-' : ''}π`;
      }

      this.p.scale(1, -1);
      this.p.noStroke();
      this.p.textSize(20);
      this.p.fill(CONFIG.colors.textColor);

      this.p.textAlign(this.p.LEFT, this.p.TOP);
      this.p.text(num, x + 5, -y);
      this.p.scale(1, -1);
    }

    for (const yLine of this.yLines) {
      const index = this.yLines.indexOf(yLine);
      yLine.draw();

      if (!this.coordinates) continue;

      const x = this.xLines[this.xAxisIndex].a.x;
      const y = yLine.a.y;

      let num = this.yMin + index * this.yStep;
      if (num === 0) continue;

      this.p.scale(1, -1);
      this.p.noStroke();
      this.p.textSize(16);
      this.p.fill(CONFIG.colors.textColor);

      this.p.textAlign(this.p.RIGHT, this.p.TOP);
      this.p.text(num, x - 3, -y);
      this.p.scale(1, -1);
    }
  }
}

class Grid {
  constructor(p, xRange, xPi, yRange, yPi, fadedLineRatio) {
    this.p = p;
    this.xRange = xRange;
    [this.xMin, this.xMax, this.xStep] = this.xRange;
    this.xDistance = this.xMax - this.xMin;
    this.xLineDistance = (p.width * this.xStep) / this.xDistance;
    this.xAxisIndex = -this.xMin / this.xStep;
    this.xPi = xPi;

    this.yRange = yRange;
    [this.yMin, this.yMax, this.yStep] = this.yRange;
    this.yDistance = this.yMax - this.yMin;
    this.yLineDistance = (p.height * this.yStep) / this.yDistance;
    this.yAxisIndex = -this.yMin / this.yStep;
    this.yPi = yPi;

    this.fadedLineRatio = fadedLineRatio;

    this.coordinates = false;

    this.xLines = [];
    this.xFadedLines = [];
    for (let x = -p.width / 2; x <= p.width / 2; x += this.xLineDistance) {
      this.xLines.push(
        new Line(p, x, p.height / 2, x, -p.height / 2, CONFIG.colors.gridLines),
      );

      for (
        let dx = 0;
        dx < this.xLineDistance;
        dx += this.xLineDistance / this.fadedLineRatio
      ) {
        this.xFadedLines.push(
          new Line(
            p,
            x + dx,
            p.height / 2,
            x + dx,
            -p.height / 2,
            CONFIG.colors.fadedGridLines,
          ),
        );
      }
    }

    this.xLines[this.xAxisIndex].setCol(CONFIG.colors.axesLines);

    this.yLines = [];
    this.yFadedLines = [];
    for (let y = -p.height / 2; y <= p.height / 2; y += this.yLineDistance) {
      this.yLines.push(
        new Line(p, -p.width / 2, y, p.width / 2, y, CONFIG.colors.gridLines),
      );

      for (
        let dy = 0;
        dy < this.yLineDistance;
        dy += this.yLineDistance / this.fadedLineRatio
      ) {
        this.yFadedLines.push(
          new Line(
            p,
            -p.width / 2,
            y + dy,
            p.width / 2,
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
    return this.p.createVector(
      (coordinate.x / this.xStep) * this.xLineDistance -
        this.xLines[this.xAxisIndex].a.x,
      (coordinate.y / this.yStep) * this.yLineDistance -
        this.yLines[this.yAxisIndex].a.y,
    );
  }

  p2c(point) {
    return this.p.createVector(
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
        const rationalPart = num / Math.PI;
        num = `${Math.abs(rationalPart) !== 1 ? this.p.round(rationalPart, 2) : rationalPart === -1 ? '-' : ''}π`;
      }

      this.p.scale(1, -1);
      this.p.noStroke();
      this.p.textSize(20);
      this.p.fill(CONFIG.colors.textColor);

      this.p.textAlign(this.p.LEFT, this.p.TOP);
      this.p.text(num, x + 5, -y);
      this.p.scale(1, -1);
    }

    for (const yLine of this.yLines) {
      const index = this.yLines.indexOf(yLine);
      yLine.draw();

      if (!this.coordinates) continue;

      const x = this.xLines[this.xAxisIndex].a.x;
      const y = yLine.a.y;

      let num = this.yMin + index * this.yStep;
      if (num === 0) continue;

      this.p.scale(1, -1);
      this.p.noStroke();
      this.p.textSize(16);
      this.p.fill(CONFIG.colors.textColor);

      this.p.textAlign(this.p.RIGHT, this.p.TOP);
      this.p.text(num, x - 3, -y);
      this.p.scale(1, -1);
    }

    for (const xFadedLine of this.xFadedLines) {
      xFadedLine.draw();
    }

    for (const yFadedLine of this.yFadedLines) {
      yFadedLine.draw();
    }
  }
}
