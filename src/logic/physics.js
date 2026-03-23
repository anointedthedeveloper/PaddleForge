export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const PADDLE_WIDTH = 12;
export const PADDLE_HEIGHT = 80;
export const BALL_SIZE = 10;
export const PADDLE_SPEED = 6;
export const INITIAL_BALL_SPEED = 5;
export const MAX_BALL_SPEED = 14;

export function createBall() {
  const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: dir * INITIAL_BALL_SPEED * Math.cos(angle),
    vy: INITIAL_BALL_SPEED * Math.sin(angle),
  };
}

export function createPaddles() {
  const cy = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  return {
    player: { x: 20, y: cy },
    ai: { x: CANVAS_WIDTH - 20 - PADDLE_WIDTH, y: cy },
  };
}

export function updateBall(ball, paddles) {
  let { x, y, vx, vy } = ball;
  x += vx;
  y += vy;

  // Wall bounce (top/bottom)
  if (y <= 0) { y = 0; vy = Math.abs(vy); }
  if (y + BALL_SIZE >= CANVAS_HEIGHT) { y = CANVAS_HEIGHT - BALL_SIZE; vy = -Math.abs(vy); }

  // Paddle collision helper
  function hitPaddle(paddle) {
    return (
      x < paddle.x + PADDLE_WIDTH &&
      x + BALL_SIZE > paddle.x &&
      y < paddle.y + PADDLE_HEIGHT &&
      y + BALL_SIZE > paddle.y
    );
  }

  if (hitPaddle(paddles.player) && vx < 0) {
    const hitPos = (y + BALL_SIZE / 2 - paddles.player.y) / PADDLE_HEIGHT - 0.5;
    const speed = Math.min(Math.sqrt(vx * vx + vy * vy) + 0.3, MAX_BALL_SPEED);
    const angle = hitPos * (Math.PI / 3);
    vx = speed * Math.cos(angle);
    vy = speed * Math.sin(angle);
    x = paddles.player.x + PADDLE_WIDTH;
  }

  if (hitPaddle(paddles.ai) && vx > 0) {
    const hitPos = (y + BALL_SIZE / 2 - paddles.ai.y) / PADDLE_HEIGHT - 0.5;
    const speed = Math.min(Math.sqrt(vx * vx + vy * vy) + 0.3, MAX_BALL_SPEED);
    const angle = hitPos * (Math.PI / 3);
    vx = -speed * Math.cos(angle);
    vy = speed * Math.sin(angle);
    x = paddles.ai.x - BALL_SIZE;
  }

  return { x, y, vx, vy };
}

export function checkScore(ball) {
  if (ball.x + BALL_SIZE < 0) return "ai";
  if (ball.x > CANVAS_WIDTH) return "player";
  return null;
}

export function clampPaddle(y) {
  return Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y));
}
