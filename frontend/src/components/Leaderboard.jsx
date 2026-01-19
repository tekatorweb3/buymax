import { motion, AnimatePresence } from 'framer-motion';
import './Leaderboard.css';

function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function Leaderboard({ leaderboard, recentBuys }) {
  const getRankBadge = (index) => {
    if (index === 0) return { emoji: '1st', class: 'gold' };
    if (index === 1) return { emoji: '2nd', class: 'silver' };
    if (index === 2) return { emoji: '3rd', class: 'bronze' };
    return { emoji: `${index + 1}`, class: '' };
  };

  return (
    <motion.div
      className="leaderboard card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
            <circle cx="12" cy="8" r="7" />
          </svg>
          Live Leaderboard
        </h2>
        <span className="leaderboard-badge">This Round</span>
      </div>

      <div className="leaderboard-list">
        <AnimatePresence mode="popLayout">
          {leaderboard.length === 0 ? (
            <motion.div
              className="leaderboard-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 15h8M9 9h.01M15 9h.01" />
                </svg>
              </div>
              <p>No buys yet this round</p>
              <span>Be the first to buy!</span>
            </motion.div>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = getRankBadge(index);
              const isRecent = recentBuys.some(
                (buy) => buy.wallet === entry.wallet
              );

              return (
                <motion.div
                  key={entry.wallet}
                  className={`leaderboard-item ${rank.class} ${isRecent ? 'recent' : ''}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="item-rank">
                    <span className={`rank-badge ${rank.class}`}>{rank.emoji}</span>
                  </div>

                  <div className="item-wallet">
                    <span className="wallet-address">
                      {shortenAddress(entry.wallet, 6)}
                    </span>
                    {index === 0 && (
                      <span className="leader-badge">Leader</span>
                    )}
                  </div>

                  <div className="item-buys">
                    <span className="buys-count">{entry.buyCount}</span>
                    <span className="buys-label">buys</span>
                  </div>

                  {isRecent && <div className="recent-indicator"></div>}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {recentBuys.length > 0 && (
        <div className="recent-activity">
          <div className="activity-header">
            <span className="activity-dot"></span>
            Recent Activity
          </div>
          <div className="activity-list">
            {recentBuys.slice(0, 3).map((buy, index) => (
              <div key={`${buy.wallet}-${buy.timestamp}`} className="activity-item">
                <span className="activity-wallet">{shortenAddress(buy.wallet, 4)}</span>
                <span className="activity-action">bought</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Leaderboard;
