import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import { gameEngine } from './game/engine.js';
import { startMonitoring, setOnBuyCallback } from './solana/monitor.js';
import { getDevWalletBalance, shortenAddress } from './solana/connection.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.server.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: config.server.frontendUrl }));
app.use(express.json());

// REST API Routes
app.get('/api/status', async (req, res) => {
  const state = await gameEngine.getGameState();
  res.json({
    success: true,
    data: state,
  });
});

app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = gameEngine.getLeaderboard(20);
  res.json({
    success: true,
    data: leaderboard,
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      tokenMint: config.token.mint || 'Not configured',
      devWallet: config.devWallet.publicKey
        ? shortenAddress(config.devWallet.publicKey)
        : 'Not configured',
      devWalletFull: config.devWallet.publicKey || null,
      roundDurationMs: config.game.roundDurationMs,
      rewardPercentage: config.game.rewardPercentage,
    },
  });
});

app.get('/api/winners', async (req, res) => {
  const state = await gameEngine.getGameState();
  res.json({
    success: true,
    data: state.recentWinners,
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send initial state
  gameEngine.getGameState().then((state) => {
    socket.emit('gameState', state);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Broadcast game updates to all clients
gameEngine.setOnUpdate((state) => {
  io.emit('gameState', state);
});

// Handle buy transactions
setOnBuyCallback((walletAddress) => {
  gameEngine.recordBuy(walletAddress);
  io.emit('newBuy', { wallet: walletAddress, timestamp: Date.now() });
});

// Start server
async function start() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗ ██╗   ██╗██╗   ██╗███╗   ███╗ █████╗ ██╗  ██╗    ║
║    ██╔══██╗██║   ██║╚██╗ ██╔╝████╗ ████║██╔══██╗╚██╗██╔╝    ║
║    ██████╔╝██║   ██║ ╚████╔╝ ██╔████╔██║███████║ ╚███╔╝     ║
║    ██╔══██╗██║   ██║  ╚██╔╝  ██║╚██╔╝██║██╔══██║ ██╔██╗     ║
║    ██████╔╝╚██████╔╝   ██║   ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗    ║
║    ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ║
║                                                              ║
║           Pump.fun Buy Frequency Rewards Engine              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const isConfigured = validateConfig();

  await gameEngine.initialize();

  // Start monitoring transactions
  await startMonitoring();

  // Start game engine
  gameEngine.start();

  httpServer.listen(config.server.port, () => {
    console.log(`\n🌐 Server running on http://localhost:${config.server.port}`);
    console.log(`📡 WebSocket ready for connections`);

    if (isConfigured) {
      console.log(`\n💰 Dev wallet: ${shortenAddress(config.devWallet.publicKey)}`);
      getDevWalletBalance().then((balance) => {
        console.log(`💎 Current balance: ${balance.toFixed(4)} SOL`);
        console.log(`🎁 Reward per round: ${(balance * config.game.rewardPercentage / 100).toFixed(4)} SOL (${config.game.rewardPercentage}%)`);
      });
    }

    console.log(`\n⏱️  Round duration: ${config.game.roundDurationMs / 1000 / 60} minutes`);
    console.log(`\n✨ BUYMAX is ready!\n`);
  });
}

start().catch(console.error);
