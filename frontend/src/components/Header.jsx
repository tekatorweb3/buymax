import { motion } from 'framer-motion';
import './Header.css';

function Header({ connected }) {
  return (
    <header className="header">
      <div className="container header-container">
        <motion.div
          className="logo"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="logo-icon">B</span>
          <span className="logo-text">BUYMAX</span>
        </motion.div>

        <nav className="nav">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{connected ? 'Live' : 'Connecting...'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
