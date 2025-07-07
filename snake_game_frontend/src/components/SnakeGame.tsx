"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";

/**
 * Color palette and board config (matching style/theme requirements)
 */
const GAME_COLORS = {
  snake: "#228B22", // primary
  snakeHead: "#FFD700", // accent
  food: "#FFD700", // accent
  board: "#f9f9f9",
  grid: "#ededed",
  border: "#222222",
};
const BOARD_SIZE = 16;
const CELL_SIZE = 24; // px (will be scaled for responsiveness)
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

/**
 * Direction vectors and keys
 */
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/**
 * Helper: get a random board cell (not in exclusions)
 */
function getRandomCell(exclusions: Array<{ x: number, y: number }>) {
  const available: Array<{ x: number, y: number }> = [];
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (!exclusions.some((seg) => seg.x === x && seg.y === y)) {
        available.push({ x, y });
      }
    }
  }
  return available.length ? available[Math.floor(Math.random() * available.length)] : null;
}

// PUBLIC_INTERFACE
/**
 * SnakeGame - Main game board, controls, and display.
 */
const SnakeGame: React.FC = () => {
  // game state
  const [snake, setSnake] = useState<Array<{ x: number; y: number }>>([
    { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) },
  ]);
  const [direction, setDirection] = useState<{ x: number; y: number }>(
    DIRECTIONS.ArrowRight
  );
  const [food, setFood] = useState<{ x: number; y: number } | null>(() =>
    getRandomCell([
      { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) },
    ])
  );
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(110); // ms per frame (faster==harder)
  const [pendingDirection, setPendingDirection] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the game
  // PUBLIC_INTERFACE
  const startGame = useCallback(() => {
    setSnake([{ x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) }]);
    setDirection(DIRECTIONS.ArrowRight);
    setPendingDirection(null);
    setFood(getRandomCell([{ x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) }])!);
    setScore(0);
    setGameOver(false);
    setRunning(true);
    setSpeed(110);
  }, []);

  // PUBLIC_INTERFACE
  // Handle keyboard input for snake direction
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.key in DIRECTIONS)) return;
      const newDir = DIRECTIONS[e.key as keyof typeof DIRECTIONS];
      const head = snake[0];
      if (!head) return;
      // Prevent reversing: cannot go in the direct opposite of current
      if (
        (newDir.x === -direction.x && newDir.y === -direction.y) ||
        (pendingDirection &&
          newDir.x === -pendingDirection.x &&
          newDir.y === -pendingDirection.y)
      ) {
        return;
      }
      setPendingDirection(newDir);
    },
    [direction, snake, pendingDirection]
  );

  // Touch controls for mobile (swipe gesture)
  useEffect(() => {
    let startX = 0, startY = 0;
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 20) {
            handleKeyDown({ key: "ArrowRight" } as unknown as KeyboardEvent);
          } else if (dx < -20) {
            handleKeyDown({ key: "ArrowLeft" } as unknown as KeyboardEvent);
          }
        } else {
          if (dy > 20) {
            handleKeyDown({ key: "ArrowDown" } as unknown as KeyboardEvent);
          } else if (dy < -20) {
            handleKeyDown({ key: "ArrowUp" } as unknown as KeyboardEvent);
          }
        }
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleKeyDown]);

  // Keyboard arrow keys for controlling snake
  useEffect(() => {
    if (!running) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, running]);

  // Main game loop (updates snake state and game status)
  useEffect(() => {
    if (!running) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }
    function step() {
      setSnake((snake) => {
        const curDirection = pendingDirection || direction;
        // Move head
        const head = { x: snake[0].x + curDirection.x, y: snake[0].y + curDirection.y };
        // Check for wall hit or self-collision
        if (
          head.x < 0 ||
          head.y < 0 ||
          head.x >= BOARD_SIZE ||
          head.y >= BOARD_SIZE ||
          snake.some((seg) => seg.x === head.x && seg.y === head.y)
        ) {
          setGameOver(true);
          setRunning(false);
          return snake;
        }
        let newSnake;
        // Check for food
        if (food && head.x === food.x && head.y === food.y) {
          newSnake = [head, ...snake];
          setScore((score) => score + 1);
          setFood(getRandomCell([head, ...snake]));
          // Increase speed slightly with every 4 points (up to cap)
          setSpeed((s) => Math.max(60, s - (score % 4 === 3 ? 9 : 0)));
        } else {
          newSnake = [head, ...snake.slice(0, -1)];
        }
        setDirection(curDirection);
        setPendingDirection(null);
        return newSnake;
      });
    }

    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(step, speed);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [running, speed, direction, food, pendingDirection, score]);

  // Draw the board/canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snake.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Responsiveness: adjust canvas scaling for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = BOARD_SIZE * CELL_SIZE * dpr;
    canvas.height = BOARD_SIZE * CELL_SIZE * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr);

    // Board background
    ctx.fillStyle = GAME_COLORS.board;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = GAME_COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food
    if (food) {
      ctx.fillStyle = GAME_COLORS.food;
      ctx.beginPath();
      ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE * 0.35,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Snake segments
    for (let i = snake.length - 1; i >= 0; i--) {
      ctx.fillStyle = i === 0 ? GAME_COLORS.snakeHead : GAME_COLORS.snake;
      ctx.strokeStyle = GAME_COLORS.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        snake[i].x * CELL_SIZE + 3,
        snake[i].y * CELL_SIZE + 3,
        CELL_SIZE - 6,
        CELL_SIZE - 6,
        6
      );
      ctx.fill();
      ctx.stroke();
    }
  }, [snake, food, gameOver]);

  // When game is over, show a message and stop running
  useEffect(() => {
    if (gameOver) setRunning(false);
  }, [gameOver]);

  // Responsive layout for canvas and controls
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div
        role="region"
        aria-label="Game Score and Controls"
        className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 mb-2"
      >
        <div className="text-lg font-semibold text-[#228B22] bg-[#fff7d7] rounded-md px-4 py-1 flex-1 text-center shadow-sm">
          Score: {score}
        </div>
        {!running || gameOver ? (
          <button
            aria-label={gameOver ? "Restart game" : "Start game"}
            onClick={startGame}
            className="bg-[#FFD700] hover:bg-[#ffa700] text-[#222] font-bold px-6 py-2 rounded-lg shadow-md mt-2 sm:mt-0 transition"
            style={{
              border: "1.5px solid #222222",
              letterSpacing: 0.8,
            }}
          >
            {gameOver ? "Restart" : "Start"}
          </button>
        ) : null}
      </div>
      <div
        className="relative"
        style={{
          width: "96vw",
          maxWidth: `${CANVAS_SIZE}px`,
          maxHeight: `${CANVAS_SIZE}px`,
          aspectRatio: "1/1",
        }}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          style={{
            width: "100%",
            height: "100%",
            outline: "none",
            background: "#f9f9f9",
            border: "2.5px solid #222222",
            borderRadius: "18px",
            boxShadow: "0 6px 24px 0 #FFD70020, 0 2px 6px #22222215",
            display: "block",
            touchAction: "none",
          }}
          aria-label="Snake game board"
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#fffceea0] rounded-2xl z-10">
            <span className="text-3xl font-extrabold text-[#FFD700] drop-shadow-sm mb-2">
              Game Over
            </span>
            <span className="text-lg text-[#222222] font-semibold mb-2">
              Score: {score}
            </span>
            <button
              onClick={startGame}
              className="bg-[#FFD700] hover:bg-[#ffa700] text-[#222] font-bold px-6 py-2 rounded-lg shadow-md mt-2 transition"
              tabIndex={0}
            >
              Restart
            </button>
          </div>
        )}
      </div>
      <div className="w-full mt-2 flex flex-col items-center gap-1 text-xs sm:text-sm text-[#444] px-2">
        <span>
          Use <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd>{" "}
          <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> or swipe to
          control the snake.
        </span>
        <span>
          Tip: The board is fully responsive and works great on mobile too!
        </span>
      </div>
      <style jsx>{`
        .kbd {
          background: #ededed;
          border-radius: 4px;
          border: 1px solid #bbb;
          padding: 1.5px 5.5px;
          margin: 0 2px;
          font-size: 0.95em;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default SnakeGame;
