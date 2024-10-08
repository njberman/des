let CONFIG;
let g = 9.81;

function thetaDoubleDotPendulum(theta, thetaDot) {
  const L = 1;
  const mew = 1;
  return (-g / L) * sin(theta) - mew * thetaDot;
}

class Arrow {
  constructor(ax, ay, bx, by, color, strokeWeight) {
    this.a = createVector(ax, ay);
    this.b = createVector(bx, by);
    this.color = color || 'white';
    this.strokeWeight = strokeWeight || 2;

    this.triangleSide = this.strokeWeight * 4;
  }

  setA(newA) {
    this.a = newA;
  }

  setB(newB) {
    this.b = newB;
  }

  draw() {
    stroke(this.color);
    strokeWeight(this.strokeWeight);
    line(this.a.x, this.a.y, this.b.x, this.b.y);

    fill(this.color);
    push();
    translate(this.b.x, this.b.y);
    // Got the first quadrant working but still need to do the rest.
    if (this.b.x - this.a.x >= 0 && this.b.y - this.a.y >= 0) {
      rotate(-atan((this.b.x - this.a.x) / (this.b.y - this.a.y)));
    }
    triangle(
      -this.triangleSide / 2,
      -(this.triangleSide / 2) * tan(PI / 3),
      this.triangleSide / 2,
      -(this.triangleSide / 2) * tan(PI / 3),
      0,
      0,
    );
    pop();
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
    for (
      let y = -height / 2;
      y <= height / 2;
      y += height / (this.yDistance / this.yStep)
    ) {
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
        num = `${round(rationalPart, 2)}π`;
      }

      scale(1, -1);
      noStroke();
      textSize(16);
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

function preload() {
  CMUFont = loadFont('assets/cmu.ttf');
}

let arrow;

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
  };

  translate(width / 2, height / 2);
  scale(1, -1);
  textFont(CMUFont);

  grid = new Grid([-7, 7, 1], false, [-4, 4, 1], false, 5);
  grid.toggleCoordinates();

  arrow = new Arrow(0, 0, 100, 0, 'orange', 10);
}

function draw() {
  translate(width / 2, height / 2);
  scale(1, -1);

  background(0);

  grid.draw();

  arrow.draw();

  arrow.setB(createVector(mouseX - width / 2, -mouseY + height / 2));
}

function mousePressed() {
  grid.toggleCoordinates();
}
