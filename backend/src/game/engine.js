import { config } from '../config.js';
import { processWinnerPayout, calculateReward } from '../solana/payout.js';
import { getDevWalletBalance } from '../solana/connection.js';
import { saveGameState, loadGameState } from './storage.js';

class GameEngine {
  constructor() {
    this.leaderboard = new Map(); // wallet -> buyCount
    this.roundStartTime = Date.now();
    this.roundNumber = 1;
    this.lastWinner = null;
    this.winners = [];
    this.totalPayouts = 0;
    this.isRunning = false;
    this.roundTimer = null;
    this.onUpdate = null;
  }

  async initialize() {
    const savedState = await loadGameState();
    if (savedState) {
      this.roundNumber = savedState.roundNumber || 1;
      this.winners = savedState.winners || [];
      this.totalPayouts = savedState.totalPayouts || 0;
      this.lastWinner = savedState.lastWinner || null;
    }
    console.log(`🎮 Game engine initialized - Round #${this.roundNumber}`);
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.roundStartTime = Date.now();
    this.scheduleRoundEnd();

    console.log(`🚀 Round #${this.roundNumber} started!`);
    this.broadcastUpdate();
  }

  stop() {
    this.isRunning = false;
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    console.log('🛑 Game engine stopped');
  }

  scheduleRoundEnd() {
    const timeRemaining = this.getTimeRemaining();

    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, timeRemaining);
  }

  async recordBuy(walletAddress) {
    if (!this.isRunning) return;

    const currentCount = this.leaderboard.get(walletAddress) || 0;
    this.leaderboard.set(walletAddress, currentCount + 1);

    console.log(`📊 ${walletAddress.slice(0, 8)}... now has ${currentCount + 1} buys`);
    this.broadcastUpdate();
  }

  async endRound() {
    console.log(`\n⏰ Round #${this.roundNumber} ended!`);

    const winner = this.getLeader();

    if (winner) {
      console.log(`🏆 Winner: ${winner.wallet} with ${winner.buyCount} buys`);

      // Process payout
      const payoutResult = await processWinnerPayout(winner.wallet, winner.buyCount);

      if (payoutResult.success) {
        this.lastWinner = {
          wallet: winner.wallet,
          buyCount: winner.buyCount,
          reward: payoutResult.reward,
          signature: payoutResult.signature,
          roundNumber: this.roundNumber,
          timestamp: Date.now(),
        };

        this.winners.push(this.lastWinner);
        this.totalPayouts += payoutResult.reward;

        // Keep only last 50 winners
        if (this.winners.length > 50) {
          this.winners = this.winners.slice(-50);
        }
      } else {
        this.lastWinner = {
          wallet: winner.wallet,
          buyCount: winner.buyCount,
          reward: 0,
          error: payoutResult.error,
          roundNumber: this.roundNumber,
          timestamp: Date.now(),
        };
      }
    } else {
      console.log('❌ No participants this round');
      this.lastWinner = null;
    }

    // Save state
    await saveGameState({
      roundNumber: this.roundNumber + 1,
      winners: this.winners,
      totalPayouts: this.totalPayouts,
      lastWinner: this.lastWinner,
    });

    // Start new round
    this.startNewRound();
  }

  startNewRound() {
    this.leaderboard.clear();
    this.roundNumber++;
    this.roundStartTime = Date.now();

    console.log(`\n🚀 Round #${this.roundNumber} started!\n`);

    this.scheduleRoundEnd();
    this.broadcastUpdate();
  }

  getLeader() {
    if (this.leaderboard.size === 0) return null;

    let maxBuys = 0;
    let leader = null;

    for (const [wallet, buyCount] of this.leaderboard) {
      if (buyCount > maxBuys) {
        maxBuys = buyCount;
        leader = wallet;
      }
    }

    return leader ? { wallet: leader, buyCount: maxBuys } : null;
  }

  getLeaderboard(limit = 10) {
    const entries = Array.from(this.leaderboard.entries())
      .map(([wallet, buyCount]) => ({ wallet, buyCount }))
      .sort((a, b) => b.buyCount - a.buyCount)
      .slice(0, limit);

    return entries;
  }

  getTimeRemaining() {
    const elapsed = Date.now() - this.roundStartTime;
    const remaining = config.game.roundDurationMs - elapsed;
    return Math.max(0, remaining);
  }

  async getGameState() {
    const devBalance = await getDevWalletBalance();
    const potentialReward = devBalance * (config.game.rewardPercentage / 100);

    return {
      roundNumber: this.roundNumber,
      roundStartTime: this.roundStartTime,
      timeRemaining: this.getTimeRemaining(),
      roundDuration: config.game.roundDurationMs,
      leaderboard: this.getLeaderboard(),
      totalParticipants: this.leaderboard.size,
      lastWinner: this.lastWinner,
      recentWinners: this.winners.slice(-5).reverse(),
      totalPayouts: this.totalPayouts,
      devWalletBalance: devBalance,
      potentialReward,
      rewardPercentage: config.game.rewardPercentage,
      isRunning: this.isRunning,
    };
  }

  setOnUpdate(callback) {
    this.onUpdate = callback;
  }

  broadcastUpdate() {
    if (this.onUpdate) {
      this.getGameState().then((state) => {
        this.onUpdate(state);
      });
    }
  }
}

export const gameEngine = new GameEngine();
