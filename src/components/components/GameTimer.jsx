// ---------- GameTimer.js ----------
import { useEffect, useState } from "react";

export default function GameTimer({ gameTime }) {
  const [elapsed, setElapsed] = useState("0:00:00");

  useEffect(() => {
    if (gameTime.isPaused) return;

    const id = setInterval(() => {
      const now = Date.now();
      const paused =
        gameTime.pausedTime +
        (gameTime.pauseStartTime ? now - gameTime.pauseStartTime : 0);

      const ms = now - gameTime.startTime - paused;
      const h  = Math.floor(ms / 3_600_000);
      const m  = Math.floor(ms / 60_000) % 60;
      const s  = Math.floor(ms / 1_000) % 60;

      setElapsed(`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1_000);

    return () => clearInterval(id);
  }, [gameTime]);

  return (
    <div className="time-container">
      <div className="time-text">{elapsed}</div>
    </div>
  );
}
