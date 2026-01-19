import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import Hero from './components/Hero';
import GameStats from './components/GameStats';
import Leaderboard from './components/Leaderboard';
import LastWinner from './components/LastWinner';
import DevWallet from './components/DevWallet';
import Footer from './components/Footer';
import AdminPage from './components/AdminPage';
import './styles/App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recentBuys, setRecentBuys] = useState([]);

  // Simple routing based on pathname
  const isAdminPage = window.location.pathname === '/admin';

  useEffect(() => {
    // Skip socket connection for admin page
    if (isAdminPage) return;

    // Fetch config
    fetch(`${API_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConfig(data.data);
        }
      })
      .catch(console.error);

    // Setup WebSocket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to BUYMAX server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('gameState', (state) => {
      setGameState(state);
    });

    socket.on('newBuy', (buy) => {
      setRecentBuys((prev) => [buy, ...prev].slice(0, 10));
    });

    // Listen for config updates from admin panel
    socket.on('configUpdated', (newConfig) => {
      console.log('Config updated:', newConfig);
      setConfig((prev) => ({ ...prev, ...newConfig }));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdminPage]);

  // Render admin page
  if (isAdminPage) {
    return <AdminPage />;
  }

  // Render main game page
  return (
    <div className="app">
      <Header connected={connected} />

      <main className="main">
        <Hero />

        <div className="container">
          <GameStats gameState={gameState} />

          <div className="main-grid">
            <div className="main-left">
              <Leaderboard
                leaderboard={gameState?.leaderboard || []}
                recentBuys={recentBuys}
              />
            </div>

            <div className="main-right">
              <LastWinner winner={gameState?.lastWinner} />
              <DevWallet
                balance={gameState?.devWalletBalance}
                potentialReward={gameState?.potentialReward}
                rewardPercentage={gameState?.rewardPercentage}
                walletAddress={config?.devWalletFull}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer config={config} />
    </div>
  );
}

export default App;
