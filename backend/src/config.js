import dotenv from 'dotenv';
import { getDynamicConfig, loadDynamicConfig } from './config/dynamicConfig.js';

dotenv.config();

// Load dynamic config on startup
loadDynamicConfig();

// Static configuration (from environment variables only)
export const staticConfig = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    wsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  },
  game: {
    roundDurationMs: parseInt(process.env.ROUND_DURATION_MS) || 900000, // 15 minutes
    rewardPercentage: parseFloat(process.env.REWARD_PERCENTAGE) || 5,
    minRewardSol: parseFloat(process.env.MIN_REWARD_SOL) || 0.001,
  },
  server: {
    port: parseInt(process.env.PORT) || 3001,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  admin: {
    password: process.env.ADMIN_PASSWORD || 'admin123', // CHANGE THIS IN PRODUCTION!
  },
};

// Dynamic configuration getter (merges static + dynamic config)
export const config = {
  get solana() {
    return staticConfig.solana;
  },
  get token() {
    const dynamicCfg = getDynamicConfig();
    return {
      mint: dynamicCfg?.token?.mint || process.env.TOKEN_MINT,
    };
  },
  get devWallet() {
    const dynamicCfg = getDynamicConfig();
    return {
      privateKey: dynamicCfg?.devWallet?.privateKey || process.env.DEV_WALLET_PRIVATE_KEY,
      publicKey: dynamicCfg?.devWallet?.publicKey || process.env.DEV_WALLET_PUBLIC_KEY,
    };
  },
  get game() {
    return staticConfig.game;
  },
  get server() {
    return staticConfig.server;
  },
  get admin() {
    return staticConfig.admin;
  },
};

export function validateConfig() {
  const required = [
    ['TOKEN_MINT', config.token.mint],
    ['DEV_WALLET_PRIVATE_KEY', config.devWallet.privateKey],
    ['DEV_WALLET_PUBLIC_KEY', config.devWallet.publicKey],
  ];

  const missing = required.filter(([name, value]) => !value);

  if (missing.length > 0) {
    console.warn('⚠️  Missing configuration (running in demo mode):');
    missing.forEach(([name]) => console.warn(`   - ${name}`));
    return false;
  }

  return true;
}

export function getFullConfig() {
  return {
    ...staticConfig,
    token: config.token,
    devWallet: {
      publicKey: config.devWallet.publicKey,
      // Never expose private key
    },
  };
}
