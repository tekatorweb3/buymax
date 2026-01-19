# BUYMAX

> The ultimate pump.fun buy frequency rewards game on Solana.

Buy more. Win more. Every 15 minutes, the wallet with the most buys wins 5% of the dev wallet.

## Core Mechanic

- Monitor any pump.fun token for BUY transactions
- Count buys per wallet (amount doesn't matter)
- Every 15 minutes, reward the wallet with the most buys
- Automatic SOL transfer to winner
- Full on-chain transparency

## Project Structure

```
BUYMAX/
├── backend/
│   ├── src/
│   │   ├── config.js           # Configuration loader
│   │   ├── index.js            # Express server + WebSocket
│   │   ├── game/
│   │   │   ├── engine.js       # Game round logic
│   │   │   └── storage.js      # JSON persistence
│   │   └── solana/
│   │       ├── connection.js   # Solana RPC connection
│   │       ├── monitor.js      # Transaction monitoring
│   │       └── payout.js       # Winner payout logic
│   ├── data/                   # Game state storage
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── GameStats.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LastWinner.jsx
│   │   │   ├── DevWallet.jsx
│   │   │   └── Footer.jsx
│   │   └── styles/
│   │       ├── index.css
│   │       └── App.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Solana wallet with SOL for payouts

### Installation

```bash
# Clone and navigate to project
cd BUYMAX

# Install all dependencies
npm run install:all
```

### Configuration

1. Copy the environment template:

```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` with your settings:

```env
# Solana RPC (use a premium RPC for production)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# Your pump.fun token mint address
TOKEN_MINT=YOUR_TOKEN_MINT_ADDRESS

# Dev wallet (the wallet that holds funds for payouts)
DEV_WALLET_PRIVATE_KEY=YOUR_BASE58_PRIVATE_KEY
DEV_WALLET_PUBLIC_KEY=YOUR_PUBLIC_KEY

# Game settings
ROUND_DURATION_MS=900000     # 15 minutes
REWARD_PERCENTAGE=5          # 5% of dev wallet
MIN_REWARD_SOL=0.001         # Minimum reward threshold

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Running the App

#### Development Mode

```bash
# Run both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:5173
```

#### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Demo Mode

If no token is configured, BUYMAX runs in demo mode with simulated buy transactions. Perfect for testing the UI and game mechanics.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Current game state |
| `GET /api/leaderboard` | Current round leaderboard |
| `GET /api/config` | Public game configuration |
| `GET /api/winners` | Recent winners list |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `gameState` | Server → Client | Full game state update |
| `newBuy` | Server → Client | New buy transaction detected |

## How It Works

### Transaction Monitoring

1. Backend subscribes to on-chain logs for the configured token
2. Filters for pump.fun buy transactions
3. Extracts buyer wallet address
4. Increments buy count in the leaderboard

### Round System

1. 15-minute rounds (configurable)
2. Real-time leaderboard tracking
3. Automatic round end processing
4. Winner calculation and payout

### Payout Logic

1. Calculate 5% of dev wallet balance
2. Create and sign SOL transfer transaction
3. Send to winner's wallet
4. Log transaction signature for verification

## Frontend Features

- Dark futuristic UI with orange glow accents
- Live countdown timer
- Animated leaderboard with rank badges
- Last winner showcase with tx link
- Dev wallet transparency section
- Mobile responsive design
- Real-time WebSocket updates

## Security Considerations

- **Never commit your `.env` file**
- Use a dedicated wallet for the dev wallet (not your main wallet)
- Consider using a hardware wallet for large balances
- Use a premium RPC endpoint for production
- Rate limit API endpoints in production
- Add authentication for admin functions

## Customization

### Change Round Duration

Edit `ROUND_DURATION_MS` in your `.env`:

```env
ROUND_DURATION_MS=300000   # 5 minutes
ROUND_DURATION_MS=1800000  # 30 minutes
```

### Change Reward Percentage

```env
REWARD_PERCENTAGE=10  # 10% of dev wallet
```

### Custom Styling

Edit CSS variables in `frontend/src/styles/index.css`:

```css
:root {
  --orange-primary: #ff6b00;    /* Primary accent color */
  --orange-secondary: #ff9500;  /* Secondary accent */
  --bg-primary: #0a0a0f;        /* Background color */
}
```

## Deployment

### Backend (Node.js hosting)

1. Set environment variables on your host
2. Run `npm start` or use PM2: `pm2 start backend/src/index.js`

### Frontend (Static hosting)

1. Run `npm run build`
2. Deploy `frontend/dist` to Vercel, Netlify, or similar
3. Update `FRONTEND_URL` in backend config

## Troubleshooting

### "Token mint not configured"

Add your pump.fun token's mint address to `TOKEN_MINT` in `.env`

### "Dev wallet not configured"

Add both `DEV_WALLET_PRIVATE_KEY` and `DEV_WALLET_PUBLIC_KEY` to `.env`

### Transactions not detected

- Verify the token mint address is correct
- Check RPC connection (try a different endpoint)
- Ensure the token has active trading

### Payouts failing

- Check dev wallet has sufficient SOL balance
- Verify private key is correct (Base58 encoded)
- Check minimum reward threshold

## License

MIT

---

**Built for degens. Not financial advice. DYOR.**
