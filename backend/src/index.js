import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config, validateConfig, getFullConfig } from './config.js';
import { gameEngine } from './game/engine.js';
import { startMonitoring, setOnBuyCallback, restartMonitoring, getMonitoringStatus } from './solana/monitor.js';
import { getDevWalletBalance, shortenAddress, isValidSolanaAddress, isValidPrivateKey, getPublicKeyFromPrivate, reloadDevWalletKeypair } from './solana/connection.js';
import { updateDynamicConfig, getSanitizedConfig, getDynamicConfig } from './config/dynamicConfig.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS for multiple origins in production
const allowedOrigins = [
  config.server.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
];

// Add production frontend URL if different
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, be more permissive with vercel URLs
    if (origin.includes('vercel.app') || origin.includes('railway.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now, tighten in production
  },
  credentials: true,
}));

app.use(express.json());

// =====================================
// Admin Authentication Middleware
// =====================================
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const password = authHeader.substring(7); // Remove 'Bearer '

  if (password !== config.admin.password) {
    return res.status(403).json({
      success: false,
      error: 'Invalid admin password',
    });
  }

  next();
};

// =====================================
// Public REST API Routes
// =====================================
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

// =====================================
// Admin API Routes
// =====================================

// Verify admin password
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;

  if (password === config.admin.password) {
    res.json({
      success: true,
      message: 'Authentication successful',
    });
  } else {
    res.status(403).json({
      success: false,
      error: 'Invalid password',
    });
  }
});

// Get admin status (protected)
app.get('/api/admin/status', adminAuth, async (req, res) => {
  try {
    const balance = await getDevWalletBalance();
    const monitoringStatus = getMonitoringStatus();
    const sanitizedConfig = getSanitizedConfig();

    res.json({
      success: true,
      data: {
        config: sanitizedConfig,
        monitoring: monitoringStatus,
        devWallet: {
          publicKey: config.devWallet.publicKey || null,
          balance,
          isConfigured: !!config.devWallet.publicKey,
        },
        token: {
          mint: config.token.mint || null,
          isConfigured: !!config.token.mint,
        },
        game: {
          roundDurationMs: config.game.roundDurationMs,
          rewardPercentage: config.game.rewardPercentage,
          minRewardSol: config.game.minRewardSol,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Validate configuration values
app.post('/api/admin/validate', adminAuth, (req, res) => {
  const { tokenMint, privateKey, publicKey } = req.body;
  const errors = [];

  // Validate token mint
  if (tokenMint && !isValidSolanaAddress(tokenMint)) {
    errors.push('Invalid token mint address');
  }

  // Validate public key
  if (publicKey && !isValidSolanaAddress(publicKey)) {
    errors.push('Invalid public key address');
  }

  // Validate private key
  if (privateKey) {
    if (!isValidPrivateKey(privateKey)) {
      errors.push('Invalid private key (must be Base58 encoded)');
    } else if (publicKey) {
      // Verify that private key matches public key
      const derivedPublicKey = getPublicKeyFromPrivate(privateKey);
      if (derivedPublicKey !== publicKey) {
        errors.push('Private key does not match the provided public key');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  // If private key provided, derive public key
  let derivedPublicKey = null;
  if (privateKey) {
    derivedPublicKey = getPublicKeyFromPrivate(privateKey);
  }

  res.json({
    success: true,
    data: {
      tokenMint: tokenMint ? { valid: true, address: tokenMint } : null,
      publicKey: publicKey ? { valid: true, address: publicKey } : null,
      privateKey: privateKey ? { valid: true, derivedPublicKey } : null,
    },
  });
});

// Update configuration (HOT RELOAD)
app.post('/api/admin/update-config', adminAuth, async (req, res) => {
  const { tokenMint, privateKey, publicKey } = req.body;

  try {
    // Validate inputs
    const errors = [];

    if (tokenMint && !isValidSolanaAddress(tokenMint)) {
      errors.push('Invalid token mint address');
    }

    if (publicKey && !isValidSolanaAddress(publicKey)) {
      errors.push('Invalid public key address');
    }

    if (privateKey && !isValidPrivateKey(privateKey)) {
      errors.push('Invalid private key');
    }

    // Verify private/public key match if both provided
    if (privateKey && publicKey) {
      const derivedPublicKey = getPublicKeyFromPrivate(privateKey);
      if (derivedPublicKey !== publicKey) {
        errors.push('Private key does not match public key');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    // Build update object
    const updates = {};

    if (tokenMint !== undefined) {
      updates.token = { mint: tokenMint || null };
    }

    if (privateKey !== undefined || publicKey !== undefined) {
      updates.devWallet = {};
      if (privateKey !== undefined) {
        updates.devWallet.privateKey = privateKey || null;
      }
      if (publicKey !== undefined) {
        updates.devWallet.publicKey = publicKey || null;
      } else if (privateKey) {
        // Auto-derive public key from private key
        updates.devWallet.publicKey = getPublicKeyFromPrivate(privateKey);
      }
    }

    // Update configuration
    const updated = updateDynamicConfig(updates);

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save configuration',
      });
    }

    // Reload wallet keypair if private key changed
    if (privateKey !== undefined) {
      reloadDevWalletKeypair();
    }

    // Restart monitoring with new config
    const monitorResult = await restartMonitoring();

    // Get updated status
    const balance = await getDevWalletBalance();

    console.log('✅ Configuration updated via admin panel');

    res.json({
      success: true,
      message: 'Configuration updated and monitoring restarted',
      data: {
        tokenMint: config.token.mint,
        devWallet: config.devWallet.publicKey,
        balance,
        monitoring: monitorResult,
      },
    });

    // Broadcast update to all connected clients
    const state = await gameEngine.getGameState();
    io.emit('gameState', state);
    io.emit('configUpdated', {
      tokenMint: config.token.mint,
      devWallet: config.devWallet.publicKey,
    });

  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get current config for admin panel
app.get('/api/admin/config', adminAuth, (req, res) => {
  const dynamicCfg = getDynamicConfig();

  res.json({
    success: true,
    data: {
      tokenMint: dynamicCfg?.token?.mint || '',
      publicKey: dynamicCfg?.devWallet?.publicKey || '',
      // Never send private key to frontend for security
      hasPrivateKey: !!dynamicCfg?.devWallet?.privateKey,
      updatedAt: dynamicCfg?.updatedAt || null,
    },
  });
});

// =====================================
// WebSocket handling
// =====================================
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

// =====================================
// Health check for Railway/Vercel
// =====================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'BUYMAX API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      status: '/api/status',
      leaderboard: '/api/leaderboard',
      config: '/api/config',
      winners: '/api/winners',
      health: '/health',
    },
  });
});

// =====================================
// Start server
// =====================================
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
    console.log(`🔐 Admin panel: /admin (password protected)`);

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
