import { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [gameState, setGameState] = useState({
    board: Array(9).fill(null),
    currentPlayer: 'X', // Assume X starts
    winner: null,
    gameOver: false
  });
  
  const ws = useRef<WebSocket>();

  useEffect(() => {
    // WebSocket connection setup
    ws.current = new WebSocket('ws://192.168.0.78:3000');

    // Handle messages from the server
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGameState(data);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleCellClick = (index: number) => {
    if (!gameState.gameOver && !gameState.board[index]) {
      const newBoard = [...gameState.board];
      newBoard[index] = gameState.currentPlayer;
      const nextPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
      const updatedGameState = {
        ...gameState,
        board: newBoard,
        currentPlayer: nextPlayer
      };

      ws.current?.send(JSON.stringify({ type: 'move', index }));
      setGameState(updatedGameState);
    }
  };

  const handleReset = () => {
    ws.current?.send(JSON.stringify({ type: 'reset' }));
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false
    });
  };

  return (
    <div className="App">
      <h2>Noughts and Crosses</h2>
      <div className="board">
        {gameState.board.map((cell, index) => (
          <div
            key={index}
            className="cell"
            onClick={() => handleCellClick(index)}
          >
            {cell}
          </div>
        ))}
      </div>
      <div className="status">
        {gameState.gameOver && gameState.winner && (
          <p style={{textAlign: 'center'}}>{`Winner: ${gameState.winner}`}</p>
        )}
        {!gameState.gameOver && <p>{`Current Player: ${gameState.currentPlayer}`}</p>}
        <button onClick={handleReset}>Reset Game</button>
      </div>
    </div>
  );
};

export default App;