import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const boardStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gridTemplateRows: 'repeat(8, 1fr)',
  width: '100%',
  maxWidth: '480px',
  aspectRatio: '1',
  border: '2px solid black'
};

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '1rem'
};

const squareStyle = (i, j, isOver) => ({
  width: '100%',
  height: '100%',
  backgroundColor: isOver ? '#e0e0e0' : (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 'calc(1.5rem + 1vw)',
  position: 'relative'
});

const checkHighlightStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 0, 0, 0.4)',
  zIndex: 0
};

const pieceUnicode = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

const Piece = ({ piece, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { from: position },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  }), [position]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab', zIndex: 1 }}>
      {pieceUnicode[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
    </div>
  );
};

const Square = ({ i, j, piece, onDropPiece, kingInCheckSquare }) => {
  const square = String.fromCharCode(97 + j) + (8 - i);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item) => onDropPiece(item.from, square),
    collect: (monitor) => ({ isOver: !!monitor.isOver() })
  }), [square]);

  const isInCheck = square === kingInCheckSquare;

  return (
    <div ref={drop} style={squareStyle(i, j, isOver)}>
      {isInCheck && <div style={checkHighlightStyle}></div>}
      {piece && <Piece piece={piece} position={square} />}
    </div>
  );
};

function ChessBoardApp() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [history, setHistory] = useState([]);
  const [captured, setCaptured] = useState([]);
  const [kingInCheckSquare, setKingInCheckSquare] = useState(null);

  const onDropPiece = (from, to) => {
    const legalMoves = game.moves({ square: from, verbose: true });
    const isLegal = legalMoves.some(move => move.to === to);

    if (isLegal) {
      const move = game.move({ from, to });
      if (move.captured) setCaptured(prev => [...prev, move.captured]);
      setBoard([...game.board()]);
      setHistory([...game.history()]);
      setKingInCheckSquare(getCheckedKingSquare(game));
    }
  };

  const getCheckedKingSquare = (chessInstance) => {
    try {
      if (!chessInstance.in_check()) return null;
      const turn = chessInstance.turn();
      const kingSquare = chessInstance.board().flat().find(piece =>
        piece?.type === 'k' && piece.color === turn
      );
      if (!kingSquare) return null;
      const index = chessInstance.board().flat().indexOf(kingSquare);
      const row = Math.floor(index / 8);
      const col = index % 8;
      return String.fromCharCode(97 + col) + (8 - row);
    } catch (error) {
      console.error("in_check() failed:", error);
      return null;
    }
  };

  const handleReset = () => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setCaptured([]);
    setHistory([]);
    setKingInCheckSquare(null);
  };

  useEffect(() => {
    setBoard(game.board());
    setKingInCheckSquare(getCheckedKingSquare(game));
  }, [game]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={containerStyle}>
        <h1>Chess</h1>
        <div style={boardStyle}>
          {board.map((row, i) =>
            row.map((square, j) => (
              <Square
                key={`${i}-${j}`}
                i={i}
                j={j}
                piece={square}
                onDropPiece={onDropPiece}
                kingInCheckSquare={kingInCheckSquare}
              />
            ))
          )}
        </div>
        <p>Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
        <button onClick={handleReset} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Reset Game
        </button>
        <div style={{ marginTop: '1rem' }}>
          <h3>Move History:</h3>
          <div>{history.map((move, index) => <span key={index}>{move} {index % 2 === 1 ? '| ' : ''}</span>)}</div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <h3>Captured Pieces:</h3>
          <div>{captured.map((piece, index) => <span key={index}>{pieceUnicode[piece]}</span>)}</div>
        </div>
      </div>
    </DndProvider>
  );
}

export default ChessBoardApp;

