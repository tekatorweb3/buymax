import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getConnection, getDevWalletKeypair, getDevWalletBalance } from './connection.js';
import { config } from '../config.js';

export async function sendReward(winnerAddress, rewardSol) {
  const connection = getConnection();
  const devWallet = getDevWalletKeypair();

  if (!devWallet) {
    throw new Error('Dev wallet not configured');
  }

  const winnerPubkey = new PublicKey(winnerAddress);
  const lamports = Math.floor(rewardSol * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: devWallet.publicKey,
      toPubkey: winnerPubkey,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [devWallet], {
    commitment: 'confirmed',
  });

  return signature;
}

export async function calculateReward() {
  const balance = await getDevWalletBalance();
  const reward = balance * (config.game.rewardPercentage / 100);
  return Math.max(reward, 0);
}

export async function processWinnerPayout(winnerAddress, buyCount) {
  try {
    const reward = await calculateReward();

    if (reward < config.game.minRewardSol) {
      console.log(`⚠️  Reward (${reward.toFixed(4)} SOL) below minimum threshold`);
      return {
        success: false,
        error: 'Reward below minimum threshold',
        winner: winnerAddress,
        buyCount,
        reward,
      };
    }

    console.log(`💸 Sending ${reward.toFixed(4)} SOL to ${winnerAddress}...`);

    const signature = await sendReward(winnerAddress, reward);

    console.log(`✅ Payout successful! Signature: ${signature}`);

    return {
      success: true,
      winner: winnerAddress,
      buyCount,
      reward,
      signature,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Payout failed:', error.message);
    return {
      success: false,
      error: error.message,
      winner: winnerAddress,
      buyCount,
      reward: 0,
    };
  }
}
