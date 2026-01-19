import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from '../config.js';

let connection = null;
let devWalletKeypair = null;

export function getConnection() {
  if (!connection) {
    connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: config.solana.wsUrl,
    });
  }
  return connection;
}

export function getDevWalletKeypair() {
  if (!devWalletKeypair && config.devWallet.privateKey) {
    try {
      const secretKey = bs58.decode(config.devWallet.privateKey);
      devWalletKeypair = Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error('Failed to load dev wallet keypair:', error.message);
    }
  }
  return devWalletKeypair;
}

export async function getDevWalletBalance() {
  try {
    const conn = getConnection();
    if (!config.devWallet.publicKey) {
      return 0;
    }
    const pubkey = new PublicKey(config.devWallet.publicKey);
    const balance = await conn.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Failed to get dev wallet balance:', error.message);
    return 0;
  }
}

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
