import React, { useEffect, useRef, useState } from 'react';
import AlertModal from './AlertModal';
import './PacmanGame.css';

export default function PacmanGame({ onClose }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('pacmanHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const gameRef = useRef(null);

  const levelRef = useRef(level);
  const scoreRef = useRef(score);
  
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = 20;
    const rows = 20;
    const cols = 20;
    
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    // Game state
    let pacman = {
      x: 1,
      y: 1,
      direction: 'right',
      nextDirection: 'right',
      mouthOpen: true,
      mouthAngle: 0
    };

    const dots = [];
    const ghosts = [
      { x: cols - 2, y: 1, color: '#FF0000', direction: 'left', startDelay: 60 },
      { x: cols - 2, y: rows - 2, color: '#FFB8FF', direction: 'up', startDelay: 90 },
      { x: 1, y: rows - 2, color: '#00FFFF', direction: 'right', startDelay: 120 }
    ];

    // Initialize dots
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Skip walls and starting positions
        if ((x === 0 || x === cols - 1 || y === 0 || y === rows - 1) ||
            (x === 1 && y === 1) || (x === cols - 2 && y === 1) ||
            (x === cols - 2 && y === rows - 2) || (x === 1 && y === rows - 2)) {
          continue;
        }
        dots.push({ x, y, eaten: false });
      }
    }

    let animationFrame = 0;
    
    // Calculate speed based on level (x1 = 4x slower, x2 = 2x slower, x4 = normal, etc.)
    // Level 1: 40 frames (4x slower), Level 2: 20 frames (2x slower), Level 3: 10 frames (normal), etc.
    const getPacmanSpeed = () => {
      const currentLevel = levelRef.current;
      return Math.max(2, Math.floor(40 / Math.pow(2, currentLevel - 1)));
    };
    const getGhostSpeed = () => {
      const currentLevel = levelRef.current;
      return Math.max(3, Math.floor(80 / Math.pow(2, currentLevel - 1)));
    };

    const drawPacman = (x, y, direction, mouthOpen) => {
      ctx.save();
      ctx.translate(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
      ctx.rotate(
        direction === 'right' ? 0 :
        direction === 'down' ? Math.PI / 2 :
        direction === 'left' ? Math.PI :
        -Math.PI / 2
      );

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      if (mouthOpen) {
        ctx.arc(0, 0, cellSize / 2 - 2, 0.2, Math.PI * 2 - 0.2);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, cellSize / 2 - 2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    };

    const drawGhost = (x, y, color) => {
      ctx.fillStyle = color;
      const centerX = x * cellSize + cellSize / 2;
      const centerY = y * cellSize + cellSize / 2;
      const radius = cellSize / 2 - 2;

      // Ghost body
      ctx.beginPath();
      ctx.arc(centerX, centerY - radius / 2, radius, Math.PI, 0, false);
      ctx.rect(centerX - radius, centerY - radius / 2, radius * 2, radius * 1.5);
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX - radius / 3, centerY - radius / 2, radius / 4, 0, Math.PI * 2);
      ctx.arc(centerX + radius / 3, centerY - radius / 2, radius / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(centerX - radius / 3, centerY - radius / 2, radius / 8, 0, Math.PI * 2);
      ctx.arc(centerX + radius / 3, centerY - radius / 2, radius / 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawDot = (x, y) => {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const canMove = (x, y) => {
      if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
      if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) return false;
      return true;
    };

    const movePacman = () => {
      const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };

      // Try next direction first
      if (pacman.nextDirection !== pacman.direction) {
        const next = directions[pacman.nextDirection];
        const newX = pacman.x + next.x;
        const newY = pacman.y + next.y;
        if (canMove(newX, newY)) {
          pacman.direction = pacman.nextDirection;
        }
      }

      const dir = directions[pacman.direction];
      const newX = pacman.x + dir.x;
      const newY = pacman.y + dir.y;

      if (canMove(newX, newY)) {
        pacman.x = newX;
        pacman.y = newY;

        // Check for dots
        const dotIndex = dots.findIndex(
          d => d.x === pacman.x && d.y === pacman.y && !d.eaten
        );
        if (dotIndex !== -1) {
          dots[dotIndex].eaten = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
      }
    };

    const moveGhost = (ghost) => {
      // Don't move ghosts until their start delay has passed
      if (ghost.startDelay > 0) {
        ghost.startDelay--;
        return;
      }

      const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };

      const dir = directions[ghost.direction];
      const newX = ghost.x + dir.x;
      const newY = ghost.y + dir.y;

      if (canMove(newX, newY)) {
        ghost.x = newX;
        ghost.y = newY;
      } else {
        // Change direction randomly
        const possibleDirs = Object.keys(directions).filter(d => {
          const dDir = directions[d];
          return canMove(ghost.x + dDir.x, ghost.y + dDir.y);
        });
        if (possibleDirs.length > 0) {
          ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }
      }
    };

    const checkCollision = () => {
      // Only check collision if ghosts have started moving
      for (const ghost of ghosts) {
        if (ghost.startDelay <= 0 && ghost.x === pacman.x && ghost.y === pacman.y) {
          return true;
        }
      }
      return false;
    };

    const gameLoop = () => {
      animationFrame++;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw walls
      ctx.fillStyle = '#0000FF';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }

      // Move pacman based on level speed
      const pacmanSpeed = getPacmanSpeed();
      if (animationFrame % pacmanSpeed === 0) {
        movePacman();
        pacman.mouthOpen = !pacman.mouthOpen;
      }

      // Move ghosts based on level speed
      const ghostSpeed = getGhostSpeed();
      if (animationFrame % ghostSpeed === 0) {
        ghosts.forEach(moveGhost);
      }

      // Draw dots
      dots.forEach(dot => {
        if (!dot.eaten) {
          drawDot(dot.x, dot.y);
        }
      });

      // Draw ghosts
      ghosts.forEach(ghost => drawGhost(ghost.x, ghost.y, ghost.color));

      // Draw pacman
      drawPacman(pacman.x, pacman.y, pacman.direction, pacman.mouthOpen);

      // Check collision with ghosts (game over)
      if (checkCollision()) {
        // Get current score and level from refs
        const finalScore = scoreRef.current;
        const finalLevel = levelRef.current;
        
        // Check for high score
        const currentHighScore = parseInt(localStorage.getItem('pacmanHighScore') || '0', 10);
        const isNewHighScore = finalScore > currentHighScore;
        
        if (isNewHighScore) {
          localStorage.setItem('pacmanHighScore', finalScore.toString());
          setHighScore(finalScore);
        }
        
        // Show game over message
        const message = `Game Over!\n\n` +
          `Level Reached: ${finalLevel}\n` +
          `Final Score: ${finalScore}\n` +
          `High Score: ${isNewHighScore ? finalScore : currentHighScore}${isNewHighScore ? ' (NEW!)' : ''}\n\n` +
          `Goal: Eat all pellets without getting caught by the ghosts!`;
        
        setTimeout(() => {
          setGameOverMessage(message);
        }, 100);
        return;
      }

      // Check level completion (all dots eaten)
      if (dots.every(d => d.eaten)) {
        // Reset dots for next level
        dots.forEach(dot => {
          dot.eaten = false;
        });
        
        // Reset positions
        pacman.x = 1;
        pacman.y = 1;
        pacman.direction = 'right';
        pacman.nextDirection = 'right';
        
        ghosts.forEach((ghost, index) => {
          if (index === 0) {
            ghost.x = cols - 2;
            ghost.y = 1;
            ghost.direction = 'left';
          } else if (index === 1) {
            ghost.x = cols - 2;
            ghost.y = rows - 2;
            ghost.direction = 'up';
          } else {
            ghost.x = 1;
            ghost.y = rows - 2;
            ghost.direction = 'right';
          }
          // Reset delay for next level (shorter delay as levels increase)
          ghost.startDelay = Math.max(20, 60 - (levelRef.current * 10));
        });
        
        // Advance to next level
        const newLevel = levelRef.current + 1;
        levelRef.current = newLevel;
        setLevel(newLevel);
        scoreRef.current += 100; // Bonus for completing level
        setScore(scoreRef.current);
      }

      gameRef.current = requestAnimationFrame(gameLoop);
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') pacman.nextDirection = 'up';
      else if (key === 'arrowdown' || key === 's') pacman.nextDirection = 'down';
      else if (key === 'arrowleft' || key === 'a') pacman.nextDirection = 'left';
      else if (key === 'arrowright' || key === 'd') pacman.nextDirection = 'right';
    };

    window.addEventListener('keydown', handleKeyDown);
    gameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameRef.current) {
        cancelAnimationFrame(gameRef.current);
      }
    };
  }, [onClose]);

  return (
    <div className="pacman-game-overlay">
      <div className="pacman-game-container">
        <div className="pacman-game-header">
          <h2 className="pacman-title">PAC-MAN</h2>
          <div className="pacman-stats">
            <div className="pacman-score">Score: {score}</div>
            <div className="pacman-level">Level: {level}</div>
            <div className="pacman-high-score">High Score: {highScore}</div>
          </div>
          <button className="pacman-close" onClick={onClose}>×</button>
        </div>
        <canvas ref={canvasRef} className="pacman-canvas"></canvas>
        <div className="pacman-instructions">
          <p>Use Arrow Keys or WASD to move</p>
          <p>Goal: Eat all pellets without getting caught by the ghosts!</p>
          <p>Complete a level to advance to the next (faster) level!</p>
        </div>
      </div>
    </div>
  );
}

