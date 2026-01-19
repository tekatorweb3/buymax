import { PublicKey } from '@solana/web3.js';
import { getConnection } from './connection.js';
import { config } from '../config.js';

// Pump.fun program ID
const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

let subscriptionId = null;
let onBuyCallback = null;

export function setOnBuyCallback(callback) {
  onBuyCallback = callback;
}

export async function startMonitoring() {
  if (!config.token.mint) {
    console.log('⚠️  Token mint not configured - running in demo mode');
    startDemoMode();
    return;
  }

  const connection = getConnection();
  const tokenMint = new PublicKey(config.token.mint);

  console.log(`🔍 Monitoring token: ${config.token.mint}`);

  try {
    // Subscribe to logs mentioning the token mint
    subscriptionId = connection.onLogs(
      tokenMint,
      async (logs) => {
        await processTransaction(logs);
      },
      'confirmed'
    );

    console.log('✅ Transaction monitoring started');
  } catch (error) {
    console.error('Failed to start monitoring:', error.message);
    console.log('🔄 Falling back to demo mode');
    startDemoMode();
  }
}

async function processTransaction(logs) {
  try {
    const connection = getConnection();
    const signature = logs.signature;

    // Fetch full transaction details
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return;

    // Check if this is a pump.fun buy transaction
    const isBuy = await isPumpFunBuy(tx, logs);

    if (isBuy) {
      const buyer = extractBuyer(tx);
      if (buyer && onBuyCallback) {
        console.log(`🛒 Buy detected from: ${buyer}`);
        onBuyCallback(buyer);
      }
    }
  } catch (error) {
    // Silently ignore transaction processing errors
  }
}

async function isPumpFunBuy(tx, logs) {
  // Check for pump.fun program involvement
  const programIds = tx.transaction.message.accountKeys.map((key) =>
    key.pubkey ? key.pubkey.toString() : key.toString()
  );

  const hasPumpFun = programIds.includes(PUMP_FUN_PROGRAM_ID.toString());

  // Check logs for buy indicators
  const logMessages = logs.logs || [];
  const isBuyLog = logMessages.some(
    (log) =>
      log.includes('Buy') ||
      log.includes('swap') ||
      log.includes('Swap') ||
      (log.includes('Program log:') && log.includes('amount'))
  );

  // For pump.fun tokens, check if SOL was sent (buy) vs received (sell)
  const innerInstructions = tx.meta?.innerInstructions || [];
  let solTransferOut = false;

  for (const inner of innerInstructions) {
    for (const inst of inner.instructions) {
      if (inst.parsed?.type === 'transfer' && inst.program === 'system') {
        solTransferOut = true;
      }
    }
  }

  return (hasPumpFun || isBuyLog) && solTransferOut;
}

function extractBuyer(tx) {
  // The fee payer is typically the buyer
  const feePayer = tx.transaction.message.accountKeys[0];
  return feePayer.pubkey ? feePayer.pubkey.toString() : feePayer.toString();
}

export function stopMonitoring() {
  if (subscriptionId !== null) {
    const connection = getConnection();
    connection.removeOnLogsListener(subscriptionId);
    subscriptionId = null;
    console.log('🛑 Transaction monitoring stopped');
  }
}

// Demo mode for testing without real token
function startDemoMode() {
  console.log('🎮 Demo mode active - simulating buy transactions');

  const demoWallets = [
    'DemoWallet1111111111111111111111111111111111',
    'DemoWallet2222222222222222222222222222222222',
    'DemoWallet3333333333333333333333333333333333',
    'DemoWallet4444444444444444444444444444444444',
    'DemoWallet5555555555555555555555555555555555',
  ];

  // Simulate random buys every 3-8 seconds
  setInterval(() => {
    const randomWallet = demoWallets[Math.floor(Math.random() * demoWallets.length)];
    if (onBuyCallback) {
      console.log(`🎮 [DEMO] Buy simulated from: ${randomWallet}`);
      onBuyCallback(randomWallet);
    }
  }, 3000 + Math.random() * 5000);
}
