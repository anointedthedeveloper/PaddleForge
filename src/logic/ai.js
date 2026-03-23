import { CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SIZE } from "./physics";

const DIFFICULTY = {
  easy:   { speed: 3.0, reactionDelay: 18, errorMargin: 40 },
  medium: { speed: 4.5, reactionDelay: 10, errorMargin: 20 },
  hard:   { speed: 6.5, reactionDelay: 3,  errorMargin: 5  },
};

// Predict where ball will be when it reaches AI paddle X
function predictBallY(ball, targetX) {
  let { x, y, vx, vy } = ball;
  let steps = 0;
  while (vx > 0 && x < targetX && steps < 300) {
    x += vx;
    y += vy;
    if (y <= 0) { y = 0; vy = Math.abs(vy); }
    if (y + BALL_SIZE >= CANVAS_HEIGHT) { y = CANVAS_HEIGHT - BALL_SIZE; vy = -Math.abs(vy); }
    steps++;
  }
  return y + BALL_SIZE / 2;
}

export function moveAI(aiPaddle, ball, difficulty = "medium", frameCount) {
  const cfg = DIFFICULTY[difficulty] || DIFFICULTY.medium;

  // Only react every N frames
  if (frameCount % cfg.reactionDelay !== 0) return aiPaddle.y;

  const targetY = ball.vx > 0
    ? predictBallY(ball, aiPaddle.x) - PADDLE_HEIGHT / 2
    : CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2; // return to center when ball moving away

  // Add error margin
  const error = (Math.random() - 0.5) * cfg.errorMargin;
  const dest = targetY + error;

  const center = aiPaddle.y + PADDLE_HEIGHT / 2;
  const diff = dest + PADDLE_HEIGHT / 2 - center;

  if (Math.abs(diff) < cfg.speed) return dest;
  return aiPaddle.y + (diff > 0 ? cfg.speed : -cfg.speed);
}
