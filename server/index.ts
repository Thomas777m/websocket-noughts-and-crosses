import express from 'express';
import http from 'http';
import WebSocket from 'ws';

interface GameState {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  gameOver: boolean;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let gameState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null,
  gameOver: false
};

function checkWinner(board: (string | null)[]): string | null {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as string;
    }
  }

  return null;
}

function handleMove(index: number): void {
  if (!gameState.gameOver && !gameState.board[index]) {
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;
    const winner = checkWinner(newBoard);
    const gameOver = !!winner || newBoard.every(cell => cell !== null);

    gameState = {
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver
    };

    broadcastGameState();
  }
}

function resetGame(): void {
  gameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false
  };
  broadcastGameState();
}

function broadcastGameState(): void {
  console.log(gameState); 
  const gameStateJSON = JSON.stringify(gameState);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(gameStateJSON);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify(gameState));

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === 'move') {
      handleMove(data.index);
    } else if (data.type === 'reset') {
      resetGame();
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});