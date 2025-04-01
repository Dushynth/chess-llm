import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';

const boardStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 60px)',
  gridTemplateRows: 'repeat(8, 60px)',
  width: '480px',
  border: '2px solid black',
};

const squareStyle = (i, j) => ({
  width: '60px',
  height: '60px',
  backgroundColor: (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '32px',
  position: 'relative',
});

const pieceUnicode = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
};

const Piece = ({ piece, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { from: position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [position]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      {pieceUnicode[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
    </div>
  );
};

const Square = ({ i, j, piece, onDropPiece }) => {
  const square = String.fromCharCode(97 + j) + (8 - i);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item) => onDropPiece(item.from, square),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [square]);

  return (
    <div ref={drop} style={squareStyle(i, j)}>
      {piece && <Piece piece={piece} position={square} />}
    </div>
  );
};

function LLMChess() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [status, setStatus] = useState('Your move');
  const [fen, setFen] = useState(game.fen());

  const updateBoard = () => {
    setBoard(game.board());
    setFen(game.fen());
  };

  const onDropPiece = async (from, to) => {
    const legalMoves = game.moves({ square: from, verbose: true });
    const isLegal = legalMoves.some((move) => move.to === to);

    if (!isLegal || game.turn() !== 'w') return;

    game.move({ from, to });
    updateBoard();
    setStatus('LLM is thinking...');

    try {
      const res = await axios.post('http://localhost:5000/groq_move', {
        fen: game.fen(),
      });
      const algebraicMove = res.data.move.trim();
      const legalMoves = game.moves({ verbose: true });
      const match = legalMoves.find(m => m.san === algebraicMove);

      if (match) {
        game.move(match);
        updateBoard();
        setStatus('Your move');
      } else {
        console.warn("LLM suggested an invalid or unmatched SAN move:", algebraicMove);
        setStatus("LLM returned an invalid move.");
      }
    } catch (err) {
      console.error(err);
      setStatus('Error getting move from LLM');
    }
  };

  useEffect(() => {
    updateBoard();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <h2>1 v LLM</h2>
        <div style={boardStyle}>
          {board.map((row, i) =>
            row.map((square, j) => (
              <Square key={`${i}-${j}`} i={i} j={j} piece={square} onDropPiece={onDropPiece} />
            ))
          )}
        </div>
        <p>{status}</p>
        <p style={{ fontSize: '12px', color: 'gray' }}>FEN: {fen}</p>
      </div>
    </DndProvider>
  );
}

export default LLMChess;