import './Footer.css';

function Footer({ config }) {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-icon">B</span>
            <span className="logo-text">BUYMAX</span>
          </div>
          <p className="footer-tagline">The ultimate pump.fun buy frequency rewards game.</p>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>Game Info</h4>
            <ul>
              <li>Round Duration: {(config?.roundDurationMs / 60000) || 15} min</li>
              <li>Reward: {config?.rewardPercentage || 5}% of dev wallet</li>
              <li>Chain: Solana</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Verify On-Chain</h4>
            <ul>
              <li>
                <a
                  href="https://solscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solscan Explorer
                </a>
              </li>
              <li>
                <a
                  href="https://pump.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pump.fun
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} BUYMAX. Built for degens.
          </p>
          <div className="footer-disclaimer">
            Not financial advice. DYOR. Trade responsibly.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
