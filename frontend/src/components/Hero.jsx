import { motion } from 'framer-motion';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Powered by Solana</span>
          </div>

          <h1 className="hero-title">
            <span className="title-line">Buy More.</span>
            <span className="title-line gradient-text">Win More.</span>
          </h1>

          <p className="hero-description">
            The ultimate pump.fun buy frequency rewards game.
            Every 15 minutes, the wallet with the most buys wins 5% of the dev wallet.
          </p>

          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-label">Frequency Wins</span>
                <span className="feature-value">Amount doesn't matter</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-label">15-Min Rounds</span>
                <span className="feature-value">Auto payout to winner</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-label">5% Rewards</span>
                <span className="feature-value">Direct to your wallet</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="hero-glow"></div>
      </div>
    </section>
  );
}

export default Hero;
