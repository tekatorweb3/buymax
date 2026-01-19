import { motion } from 'framer-motion';
import './LastWinner.css';

function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function LastWinner({ winner }) {
  if (!winner) {
    return (
      <motion.div
        className="last-winner card empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="winner-header">
          <h3 className="winner-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Last Winner
          </h3>
        </div>
        <div className="winner-empty">
          <p>No winner yet</p>
          <span>First round in progress</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="last-winner card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="winner-header">
        <h3 className="winner-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          Last Winner
        </h3>
        <span className="winner-round">Round #{winner.roundNumber}</span>
      </div>

      <div className="winner-content">
        <div className="winner-trophy">
          <div className="trophy-glow"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>

        <div className="winner-info">
          <div className="winner-address">
            {shortenAddress(winner.wallet, 6)}
          </div>
          <div className="winner-stats">
            <div className="winner-stat">
              <span className="stat-label">Buys</span>
              <span className="stat-value">{winner.buyCount}</span>
            </div>
            <div className="winner-stat highlight">
              <span className="stat-label">Won</span>
              <span className="stat-value">{winner.reward?.toFixed(4) || '0'} SOL</span>
            </div>
          </div>
        </div>

        {winner.signature && (
          <a
            href={`https://solscan.io/tx/${winner.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="winner-tx"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Transaction
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default LastWinner;
