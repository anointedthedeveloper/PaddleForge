"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT,
  BALL_SIZE, PADDLE_SPEED, createBall, createPaddles,
  updateBall, checkScore, clampPaddle,
} from "../logic/physics";
import { moveAI } from "../logic/ai";

const WIN_SCORE = 7;

function useAudio() {
  const ctx = useRef(null);
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctx.current;
  }
  function beep(freq, dur, type = "square") {
    try {
      const ac = getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.start(); o.stop(ac.currentTime + dur);
    } catch {}
  }
  return {
    bounce: () => beep(440, 0.07),
    score:  () => beep(220, 0.3, "sawtooth"),
    win:    () => beep(660, 0.5),
  };
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const keysRef = useRef({});
  const touchRef = useRef(null);
  const audio = useAudio();

  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [phase, setPhase] = useState("menu"); // menu | playing | paused | gameover
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [leaderboard, setLeaderboard] = useState([]);

  // Load leaderboard
  useEffect(() => {
    try {
      const lb = JSON.parse(localStorage.getItem("pf_lb") || "[]");
      setLeaderboard(lb);
    } catch {}
  }, []);

  function saveScore(playerScore, aiScore) {
    try {
      const lb = JSON.parse(localStorage.getItem("pf_lb") || "[]");
      lb.unshift({ p: playerScore, ai: aiScore, d: difficulty, t: Date.now() });
      const trimmed = lb.slice(0, 5);
      localStorage.setItem("pf_lb", JSON.stringify(trimmed));
      setLeaderboard(trimmed);
    } catch {}
  }

  const initState = useCallback(() => {
    const paddles = createPaddles();
    stateRef.current = {
      ball: createBall(),
      paddles,
      scores: { player: 0, ai: 0 },
      particles: [],
      frameCount: 0,
      paused: false,
    };
    setScores({ player: 0, ai: 0 });
  }, []);

  function spawnParticles(x, y, color) {
    const p = stateRef.current.particles;
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      p.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
    }
  }

  const draw = useCallback((canvas, state) => {
    const ctx = canvas.getContext("2d");
    const { ball, paddles, particles } = state;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center dashed line
    ctx.setLineDash([10, 14]);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    function drawPaddle(x, y, color) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    drawPaddle(paddles.player.x, paddles.player.y, "#00e5ff");
    drawPaddle(paddles.ai.x, paddles.ai.y, "#ff4081");

    // Ball
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x + BALL_SIZE / 2, ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state || state.paused) return;

    state.frameCount++;

    // Player movement
    const { player } = state.paddles;
    if (keysRef.current["ArrowUp"] || keysRef.current["w"] || keysRef.current["W"]) {
      player.y = clampPaddle(player.y - PADDLE_SPEED);
    }
    if (keysRef.current["ArrowDown"] || keysRef.current["s"] || keysRef.current["S"]) {
      player.y = clampPaddle(player.y + PADDLE_SPEED);
    }

    // Touch movement
    if (touchRef.current !== null) {
      const scale = CANVAS_HEIGHT / canvas.getBoundingClientRect().height;
      const targetY = touchRef.current * scale - PADDLE_HEIGHT / 2;
      const diff = clampPaddle(targetY) - player.y;
      player.y = clampPaddle(player.y + Math.sign(diff) * Math.min(Math.abs(diff), PADDLE_SPEED * 1.5));
    }

    // AI movement
    state.paddles.ai.y = clampPaddle(
      moveAI(state.paddles.ai, state.ball, difficulty, state.frameCount)
    );

    // Ball update
    const prevBall = { ...state.ball };
    state.ball = updateBall(state.ball, state.paddles);

    // Detect paddle hit for particles + sound
    const hitPlayer = state.ball.vx > 0 && prevBall.vx < 0;
    const hitAI = state.ball.vx < 0 && prevBall.vx > 0;
    if (hitPlayer || hitAI) {
      audio.bounce();
      const bx = state.ball.x + BALL_SIZE / 2;
      const by = state.ball.y + BALL_SIZE / 2;
      spawnParticles(bx, by, hitPlayer ? "#00e5ff" : "#ff4081");
    }

    // Particles update
    state.particles = state.particles
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.06 }))
      .filter(p => p.life > 0);

    // Scoring
    const scorer = checkScore(state.ball);
    if (scorer) {
      audio.score();
      state.scores[scorer]++;
      const newScores = { ...state.scores };
      setScores(newScores);

      if (newScores.player >= WIN_SCORE || newScores.ai >= WIN_SCORE) {
        const w = newScores.player >= WIN_SCORE ? "player" : "ai";
        audio.win();
        saveScore(newScores.player, newScores.ai);
        setWinner(w);
        setPhase("gameover");
        draw(canvas, state);
        return;
      }
      state.ball = createBall();
    }

    draw(canvas, state);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [difficulty, draw, audio]);

  // Start / restart
  function startGame() {
    initState();
    setWinner(null);
    setPhase("playing");
  }

  // Run loop when phase = playing
  useEffect(() => {
    if (phase !== "playing") return;
    if (stateRef.current) stateRef.current.paused = false;
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, gameLoop]);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        setPhase(ph => {
          if (ph === "playing") { stateRef.current.paused = true; return "paused"; }
          if (ph === "paused")  { stateRef.current.paused = false; return "playing"; }
          return ph;
        });
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      touchRef.current = e.touches[0].clientY - rect.top;
    };
    const end = () => { touchRef.current = null; };
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    return () => { canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", end); };
  }, []);

  // PWA install prompt
  const deferredPrompt = useRef(null);
  const [showInstall, setShowInstall] = useState(false);
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowInstall(true);
    });
  }, []);
  function installApp() {
    deferredPrompt.current?.prompt();
    setShowInstall(false);
  }

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }, []);

  const overlayVisible = phase !== "playing";

  return (
    <div className="arena">
      {/* Scoreboard */}
      <div className="scoreboard">
        <span className="score player-score">{scores.player}</span>
        <span className="score-label">PaddleForge</span>
        <span className="score ai-score">{scores.ai}</span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
        />

        {/* Overlays */}
        {phase === "menu" && (
          <div className="overlay">
            <h1 className="game-title">PaddleForge</h1>
            <p className="subtitle">AI Pong Arena</p>
            <div className="diff-select">
              {["easy", "medium", "hard"].map(d => (
                <button
                  key={d}
                  className={`diff-btn ${difficulty === d ? "active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >{d}</button>
              ))}
            </div>
            <button className="btn-primary" onClick={startGame}>Play</button>
            {leaderboard.length > 0 && (
              <div className="leaderboard">
                <p className="lb-title">Recent Games</p>
                {leaderboard.map((e, i) => (
                  <p key={i} className="lb-entry">
                    {e.p} – {e.ai} <span className="lb-diff">({e.d})</span>
                  </p>
                ))}
              </div>
            )}
            {showInstall && (
              <button className="btn-install" onClick={installApp}>⬇ Install Game</button>
            )}
          </div>
        )}

        {phase === "paused" && (
          <div className="overlay">
            <h2>Paused</h2>
            <button className="btn-primary" onClick={() => { stateRef.current.paused = false; setPhase("playing"); }}>Resume</button>
            <button className="btn-secondary" onClick={() => setPhase("menu")}>Menu</button>
          </div>
        )}

        {phase === "gameover" && (
          <div className="overlay">
            <h2 className={winner === "player" ? "win-text" : "lose-text"}>
              {winner === "player" ? "You Win! 🏆" : "AI Wins 🤖"}
            </h2>
            <p className="final-score">{scores.player} – {scores.ai}</p>
            <button className="btn-primary" onClick={startGame}>Play Again</button>
            <button className="btn-secondary" onClick={() => setPhase("menu")}>Menu</button>
          </div>
        )}
      </div>

      <p className="controls-hint">W/S or ↑/↓ to move &nbsp;|&nbsp; P to pause</p>

      <footer>Built by AnointedTheDeveloper</footer>

      <style jsx>{`
        .arena {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          background: #0a0a0f;
          color: #fff;
          font-family: 'Courier New', monospace;
          padding: 16px 8px;
          gap: 10px;
        }
        .scoreboard {
          display: flex;
          align-items: center;
          gap: 32px;
          font-size: 1.1rem;
          letter-spacing: 2px;
        }
        .score { font-size: 2.5rem; font-weight: bold; }
        .player-score { color: #00e5ff; }
        .ai-score { color: #ff4081; }
        .score-label { color: rgba(255,255,255,0.4); font-size: 0.85rem; text-transform: uppercase; }
        .canvas-wrap { position: relative; }
        .game-canvas {
          display: block;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          max-width: 100%;
          height: auto;
        }
        .overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px;
          background: rgba(10,10,15,0.88);
          border-radius: 8px;
        }
        .game-title { font-size: 2.8rem; margin: 0; letter-spacing: 4px; color: #00e5ff; text-shadow: 0 0 20px #00e5ff; }
        .subtitle { color: rgba(255,255,255,0.5); margin: 0; font-size: 0.9rem; letter-spacing: 2px; }
        .diff-select { display: flex; gap: 8px; }
        .diff-btn {
          padding: 6px 18px; border: 1px solid rgba(255,255,255,0.2);
          background: transparent; color: rgba(255,255,255,0.5);
          border-radius: 4px; cursor: pointer; font-family: inherit;
          text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;
          transition: all 0.2s;
        }
        .diff-btn.active, .diff-btn:hover { border-color: #00e5ff; color: #00e5ff; }
        .btn-primary {
          padding: 12px 40px; background: #00e5ff; color: #0a0a0f;
          border: none; border-radius: 6px; font-size: 1rem;
          font-family: inherit; font-weight: bold; cursor: pointer;
          letter-spacing: 2px; text-transform: uppercase;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary {
          padding: 10px 30px; background: transparent;
          border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.6);
          border-radius: 6px; font-family: inherit; cursor: pointer;
          font-size: 0.9rem; letter-spacing: 1px;
        }
        .btn-secondary:hover { border-color: #fff; color: #fff; }
        .btn-install {
          padding: 8px 24px; background: transparent;
          border: 1px solid #ff4081; color: #ff4081;
          border-radius: 6px; font-family: inherit; cursor: pointer; font-size: 0.85rem;
        }
        .win-text { color: #00e5ff; margin: 0; font-size: 2rem; }
        .lose-text { color: #ff4081; margin: 0; font-size: 2rem; }
        .final-score { font-size: 1.5rem; margin: 0; }
        .leaderboard { text-align: center; }
        .lb-title { color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px; }
        .lb-entry { margin: 2px 0; font-size: 0.85rem; color: rgba(255,255,255,0.7); }
        .lb-diff { color: rgba(255,255,255,0.35); }
        .controls-hint { color: rgba(255,255,255,0.25); font-size: 0.75rem; letter-spacing: 1px; margin: 0; }
        footer { color: rgba(255,255,255,0.3); font-size: 0.75rem; letter-spacing: 1px; margin-top: auto; padding-top: 8px; }
      `}</style>
    </div>
  );
}
