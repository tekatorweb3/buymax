import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './GameStats.css';

function GameStats({ gameState }) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!gameState) return;

    const updateTimer = () => {
      const remaining = gameState.timeRemaining - (Date.now() - gameState.roundStartTime - (gameState.roundDuration - gameState.timeRemaining));
      const elapsed = Date.now() - gameState.roundStartTime;
      const actualRemaining = Math.max(0, gameState.roundDuration - elapsed);

      const minutes = Math.floor(actualRemaining / 60000);
      const seconds = Math.floor((actualRemaining % 60000) / 1000);

      setTimeLeft({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  if (!gameState) {
    return (
      <div className="game-stats loading">
        <div className="loading-pulse"></div>
      </div>
    );
  }

  const formatNumber = (num) => num.toString().padStart(2, '0');

  return (
    <motion.div
      className="game-stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="stats-grid">
        <div className="stat-card timer-card">
          <div className="stat-label">Round Ends In</div>
          <div className="timer">
            <div className="timer-segment">
              <span className="timer-value">{formatNumber(timeLeft.minutes)}</span>
              <span className="timer-unit">min</span>
            </div>
            <span className="timer-separator">:</span>
            <div className="timer-segment">
              <span className="timer-value">{formatNumber(timeLeft.seconds)}</span>
              <span className="timer-unit">sec</span>
            </div>
          </div>
          <div className="timer-progress">
            <div
              className="timer-progress-bar"
              style={{
                width: `${((gameState.roundDuration - (timeLeft.minutes * 60000 + timeLeft.seconds * 1000)) / gameState.roundDuration) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Current Round</div>
          <div className="stat-value">#{gameState.roundNumber}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Players This Round</div>
          <div className="stat-value">{gameState.totalParticipants}</div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-label">Prize Pool</div>
          <div className="stat-value prize">
            {gameState.potentialReward?.toFixed(4) || '0.0000'}
            <span className="stat-unit">SOL</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default GameStats;
