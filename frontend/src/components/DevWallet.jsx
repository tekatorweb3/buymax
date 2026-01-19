import { motion } from 'framer-motion';
import './DevWallet.css';

function shortenAddress(address, chars = 4) {
  if (!address) return 'Not configured';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function DevWallet({ balance, potentialReward, rewardPercentage, walletAddress }) {
  return (
    <motion.div
      className="dev-wallet card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="wallet-header">
        <h3 className="wallet-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          Dev Wallet Transparency
        </h3>
        <span className="transparency-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Verified
        </span>
      </div>

      <div className="wallet-content">
        <div className="wallet-address-section">
          <span className="section-label">Wallet Address</span>
          <div className="wallet-address-display">
            <span className="address-text">{shortenAddress(walletAddress, 8)}</span>
            {walletAddress && (
              <a
                href={`https://solscan.io/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="address-link"
                title="View on Solscan"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="wallet-stats">
          <div className="wallet-stat">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value balance">
              {balance?.toFixed(4) || '0.0000'}
              <span className="stat-unit">SOL</span>
            </span>
          </div>

          <div className="wallet-stat highlight">
            <span className="stat-label">
              Next Prize ({rewardPercentage || 5}%)
            </span>
            <span className="stat-value prize">
              {potentialReward?.toFixed(4) || '0.0000'}
              <span className="stat-unit">SOL</span>
            </span>
          </div>
        </div>

        <div className="wallet-info">
          <div className="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>Payouts are automatic and verifiable on-chain</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DevWallet;
