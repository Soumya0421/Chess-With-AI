/*
 * Global variable to store the current depth of the AI's search,
 * and the value of each piece for the evaluation function.
 */
let depth = 1;
const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

/*
 * setDifficulty() is called when the user changes the difficulty level
 * from the dropdown menu. It updates the 'depth' variable based on
 * the selected value, which determines how many moves ahead the AI will
 * calculate when making its move.
 */
function setDifficulty() {
  depth = parseInt(document.getElementById("difficulty").value);
}

/*
 * evaluateBoard() is a helper function to evaluate the current state of the board.
 * It iterates through each tile of the board, checks for pieces, and calculates
 * a score based on the value of the pieces. The score is positive if white has
 * an advantage and negative if black has an advantage. This function is used in
 * the minimax algorithm to help the AI determine the best move.
 */
function evaluateBoard(game) {
  let board = game.board();
  let score = 0;

  /* Iterate through each tile of the board to check for pieces and calculate the score
   * based on their values.
   */
  for (let row of board) {
    for (let piece of row) {
      if (piece) {
        let value = pieceValues[piece.type];
        score += piece.color === "w" ? value : -value;
      }
    }
  }

  return score;
}

/*
 * orderMoves() is a helper function to order the possible moves based on their potential value.
 * It retrieves all possible moves for the current game state and sorts them in descending order
 * based on the value of any captured pieces. This helps the minimax algorithm to prioritize
 * more promising moves, which can lead to faster decision-making for the AI.
 */
function orderMoves(game) {
  let moves = game.moves({ verbose: true });

  return moves.sort((a, b) => {
    let scoreA = a.captured ? pieceValues[a.captured] : 0;
    let scoreB = b.captured ? pieceValues[b.captured] : 0;
    return scoreB - scoreA;
  });
}

/*
 * minimax() is the core function of the AI's decision-making process.
 * It implements the minimax algorithm with alpha-beta pruning to evaluate the game tree and
 * determine the best move for the AI. The function takes the current game state, the depth
 * of the search, alpha and beta values for pruning, and a boolean indicating whether it's the
 * maximizing player's turn (white) or the minimizing player's turn (black/AI). It recursively
 * explores possible moves, evaluates the board state at leaf nodes, and uses alpha-beta pruning
 * to skip unnecessary evaluations, which improves performance.
 */
function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.game_over()) {
    return evaluateBoard(game);
  }

  // Get the possible moves and order them based on their potential value
  let moves = orderMoves(game);

  // If it's the maximizing player's turn (white), we want to maximize the score
  if (isMaximizing) {
    let maxEval = -Infinity;

    for (let move of moves) {
      game.move(move);
      let evalMove = minimax(game, depth - 1, alpha, beta, false);
      game.undo();

      maxEval = Math.max(maxEval, evalMove);
      alpha = Math.max(alpha, evalMove);
      if (beta <= alpha) break;
    }

    return maxEval;
  } else {
    // Minimizing player's turn (black/AI): we want to minimize the score
    let minEval = Infinity;

    for (let move of moves) {
      game.move(move);
      let evalMove = minimax(game, depth - 1, alpha, beta, true);
      game.undo();

      minEval = Math.min(minEval, evalMove);
      beta = Math.min(beta, evalMove);
      if (beta <= alpha) break;
    }

    return minEval;
  }
}

/*
 * getBestMove() is a helper function to determine the best move for the AI (black).
 * It iterates through all possible moves, applies each move to the game state,
 * and uses the minimax function to evaluate the resulting board state. Because the
 * AI plays black and the evaluation is from white's perspective (positive = white advantage),
 * the AI wants to MINIMIZE the score, so we track the lowest value found.
 * This function is called when it's the AI's turn to make a move.
 */
function getBestMove(game) {
  // Initialize variables to track the best move and its value. We start with bestValue as Infinity
  // because we are looking for the minimum score (best for black).
  let bestMove = null;
  let bestValue = Infinity;

  // Get the possible moves and order them based on their potential value
  let moves = orderMoves(game);

  // Iterate through all possible moves, apply each move, and evaluate the resulting
  // board state using minimax. The AI (black) is the minimizing player, so the next
  // call passes isMaximizing = true (white's turn to respond at depth - 1).
  for (let move of moves) {
    game.move(move);
    let boardValue = minimax(game, depth - 1, -Infinity, Infinity, true);
    game.undo();

    if (boardValue < bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove;
}
