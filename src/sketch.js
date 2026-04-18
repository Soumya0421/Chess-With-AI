// Global variables
let game;
let selected = null;
let legalMoves = [];
let boardSize;
let tileSize;
let pieces = {};
let aiThinking = false;

function preload() {
  const names = [
    "wp",
    "wr",
    "wn",
    "wb",
    "wq",
    "wk",
    "bp",
    "br",
    "bn",
    "bb",
    "bq",
    "bk",
  ];
  for (let name of names) {
    let colour = name[0];
    let piece = name[1].toUpperCase();
    pieces[name] = loadImage(`assets/${colour + piece}.svg`);
  }
}

function setup() {
  game = new Chess();
  setupBoard();
  imageMode(CORNER);
}

function setupBoard() {
  let container = document.querySelector(".chessboard");
  let size = Math.min(container.offsetWidth, container.offsetHeight) * 0.9;
  boardSize = size;
  tileSize = boardSize / 8;
  let canvas = createCanvas(boardSize, boardSize);
  canvas.parent(container);
}

function windowResized() {
  let container = document.querySelector(".chessboard");
  let size = Math.min(container.offsetWidth, container.offsetHeight) * 0.9;
  boardSize = size;
  tileSize = boardSize / 8;
  resizeCanvas(boardSize, boardSize);
}

function newGame() {
  game = new Chess();
  selected = null;
  legalMoves = [];
  aiThinking = false;
}

function draw() {
  background(15, 15, 15);
  drawBoard();
  drawPieces();

  if (game.game_over()) {
    drawGameOver();
    return;
  }

  if (game.turn() === "b" && !aiThinking) {
    aiThinking = true;
    setTimeout(() => {
      aiMove();
      aiThinking = false;
    }, 200);
  }
}

/*
 * drawBoard() draws tiles, selected-square highlight, and legal-move dots/rings.
 */
function drawBoard() {
  noStroke();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let isLight = (i + j) % 2 === 0;
      fill(isLight ? color(235, 235, 210) : color(45, 45, 65));
      rect(j * tileSize, i * tileSize, tileSize, tileSize);
    }
  }

  // Blue tint on selected square
  if (selected) {
    let selX = selected.charCodeAt(0) - 97;
    let selY = 8 - parseInt(selected[1]);
    fill(100, 160, 255, 120);
    rect(selX * tileSize, selY * tileSize, tileSize, tileSize);
  }

  // Legal move indicators
  for (let sq of legalMoves) {
    let mx = sq.charCodeAt(0) - 97;
    let my = 8 - parseInt(sq[1]);
    let cx = mx * tileSize + tileSize / 2;
    let cy = my * tileSize + tileSize / 2;
    let boardState = game.board();
    let pieceOnTarget = boardState[my][mx];

    if (pieceOnTarget) {
      // Ring for captures
      noFill();
      stroke(100, 160, 255, 180);
      strokeWeight(tileSize * 0.08);
      ellipse(cx, cy, tileSize * 0.88, tileSize * 0.88);
      noStroke();
    } else {
      // Dot for empty squares
      fill(100, 160, 255, 150);
      ellipse(cx, cy, tileSize * 0.3, tileSize * 0.3);
    }
  }

  noStroke();
}

/*
 * drawPieces() renders pieces with strong white/dark tints for clear contrast.
 */
function drawPieces() {
  let board = game.board();
  let padding = tileSize * 0.05;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let piece = board[i][j];
      if (piece) {
        let key = piece.color + piece.type;
        // White pieces: pure white; Black pieces: very dark
        tint(piece.color === "w" ? color(255, 255, 255) : color(15, 15, 15));
        image(
          pieces[key],
          j * tileSize + padding,
          i * tileSize + padding,
          tileSize - padding * 2,
          tileSize - padding * 2,
        );
      }
    }
  }
  noTint();
}

/*
 * drawGameOver() renders a dark overlay with the result and sub-text.
 */
function drawGameOver() {
  let headline, sub;

  if (game.in_checkmate()) {
    headline = game.turn() === "w" ? "You Lost" : "You Won!";
    sub =
      game.turn() === "w" ? "Checkmate — Black wins" : "Checkmate — White wins";
  } else if (game.in_draw()) {
    headline = "Draw";
    if (game.in_stalemate()) sub = "Stalemate";
    else if (game.in_threefold_repetition()) sub = "Threefold Repetition";
    else if (game.insufficient_material()) sub = "Insufficient Material";
    else sub = "50-Move Rule";
  } else {
    headline = "Game Over";
    sub = "";
  }

  // Semi-transparent overlay
  fill(0, 0, 0, 175);
  noStroke();
  rect(0, 0, boardSize, boardSize);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(tileSize * 0.72);
  fill(255, 255, 255);
  text(headline, boardSize / 2, boardSize / 2 - tileSize * 0.35);

  textStyle(NORMAL);
  textSize(tileSize * 0.28);
  fill(180, 180, 180);
  text(sub, boardSize / 2, boardSize / 2 + tileSize * 0.2);

  textSize(tileSize * 0.22);
  fill(110, 110, 110);
  text(
    'Press "New Game" to play again',
    boardSize / 2,
    boardSize / 2 + tileSize * 0.65,
  );
}

/*
 * mousePressed() handles selection and moves.
 */
function mousePressed() {
  if (game.turn() !== "w" || aiThinking || game.game_over()) return;

  let x = floor(mouseX / tileSize);
  let y = floor(mouseY / tileSize);
  if (x < 0 || x > 7 || y < 0 || y > 7) return;

  let square = String.fromCharCode(97 + x) + (8 - y);

  if (!selected) {
    selected = square;
    legalMoves = game
      .moves({ square: selected, verbose: true })
      .map((m) => m.to);
  } else {
    let move = game.move({ from: selected, to: square, promotion: "q" });
    selected = null;
    legalMoves = [];

    if (move === null) {
      // Re-select if clicked square has a white piece
      let boardState = game.board();
      let clickedPiece = boardState[y][x];
      if (clickedPiece && clickedPiece.color === "w") {
        selected = square;
        legalMoves = game
          .moves({ square: selected, verbose: true })
          .map((m) => m.to);
      }
    }
  }
}

function aiMove() {
  let move = getBestMove(game);
  if (move) game.move(move);
}
