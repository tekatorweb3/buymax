import dotenv from 'dotenv';
dotenv.config();

export const config = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    wsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  },
  token: {
    mint: process.env.TOKEN_MINT,
  },
  devWallet: {
    privateKey: process.env.DEV_WALLET_PRIVATE_KEY,
    publicKey: process.env.DEV_WALLET_PUBLIC_KEY,
  },
  game: {
    roundDurationMs: parseInt(process.env.ROUND_DURATION_MS) || 900000, // 15 minutes
    rewardPercentage: parseFloat(process.env.REWARD_PERCENTAGE) || 5,
    minRewardSol: parseFloat(process.env.MIN_REWARD_SOL) || 0.001,
  },
  server: {
    port: parseInt(process.env.PORT) || 4000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
