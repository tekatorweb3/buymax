# BUYMAX

> The ultimate pump.fun buy frequency rewards game on Solana.

Buy more. Win more. Every 15 minutes, the wallet with the most buys wins 5% of the dev wallet.

## Features

- **Hot Reload Configuration**: Change token in < 30 seconds via admin panel
- **Real-time Monitoring**: WebSocket-powered live updates
- **Automatic Payouts**: SOL sent instantly to winners
- **Admin Panel**: Secure web interface at `/admin`
- **No Server Restart**: Token changes apply immediately

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Solana wallet with SOL for payouts

### Installation

```bash
cd BUYMAX
npm run install:all
```

### Running Locally

```bash
# Run both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:5173
```

### Access Admin Panel

1. Open http://localhost:5173/admin
2. Default password: `admin123` (change in production!)
3. Configure your token and wallet
4. Click "Apply & Restart Monitoring"

---

## Deployment Guide

### Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │
│    (Vercel)     │     │   (Railway)     │
│                 │◀────│                 │
│  - React/Vite   │ WS  │  - Express      │
│  - Static files │     │  - Socket.io    │
│  - /admin page  │     │  - Solana RPC   │
└─────────────────┘     └─────────────────┘
```

---

## Step 1: Deploy Backend on Railway

### 1.1 Create Railway Account
Go to [railway.app](https://railway.app) and sign up with GitHub.

### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `buymax` repository
4. Select the `backend` folder as root directory

### 1.3 Configure Environment Variables

In Railway dashboard → Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `3001` | Yes |
| `SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` | Yes |
| `SOLANA_WS_URL` | `wss://api.mainnet-beta.solana.com` | Yes |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Yes |
| `ADMIN_PASSWORD` | `your-secure-password` | Yes |
| `ROUND_DURATION_MS` | `900000` | No |
| `REWARD_PERCENTAGE` | `5` | No |
| `MIN_REWARD_SOL` | `0.001` | No |

> **Note**: TOKEN_MINT and DEV_WALLET keys can be configured later via the admin panel!

### 1.4 Deploy
Railway will auto-deploy. Note your backend URL (e.g., `https://buymax-backend.up.railway.app`)

---

## Step 2: Deploy Frontend on Vercel

### 2.1 Create Vercel Account
Go to [vercel.com](https://vercel.com) and sign up with GitHub.

### 2.2 Import Project
1. Click "Add New Project"
2. Import your `buymax` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.up.railway.app` |

### 2.4 Deploy
Click "Deploy" and wait for completion.

---

## Step 3: Connect Frontend to Backend

### 3.1 Update Railway FRONTEND_URL
Go back to Railway and update:
```
FRONTEND_URL=https://your-app.vercel.app
```

### 3.2 Redeploy Railway
Railway will auto-redeploy with the new CORS settings.

---

## Step 4: Configure via Admin Panel

### 4.1 Access Admin
Go to `https://your-app.vercel.app/admin`

### 4.2 Login
Enter your `ADMIN_PASSWORD`

### 4.3 Configure Token (< 30 seconds!)
1. **Token Mint Address**: Paste your pump.fun token address
2. **Dev Wallet Private Key**: Paste Base58 private key
3. **Dev Wallet Public Key**: Auto-filled or paste manually
4. Click "Validate" to check values
5. Click "Apply & Restart Monitoring"

Done! Your game is now live.

---

## Change Token in 30 Seconds

1. Go to `/admin`
2. Enter new Token Mint Address
3. Click "Apply & Restart Monitoring"
4. Monitoring restarts with new token immediately

No server restart. No redeployment. No downtime.

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | Public mainnet |
| `SOLANA_WS_URL` | Solana WebSocket endpoint | Public mainnet |
| `TOKEN_MINT` | Token to monitor (optional, use admin) | - |
| `DEV_WALLET_PRIVATE_KEY` | Payout wallet key (optional, use admin) | - |
| `DEV_WALLET_PUBLIC_KEY` | Payout wallet address (optional, use admin) | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ADMIN_PASSWORD` | Admin panel password | `admin123` |
| `ROUND_DURATION_MS` | Round duration in ms | `900000` (15 min) |
| `REWARD_PERCENTAGE` | % of wallet to pay | `5` |
| `MIN_REWARD_SOL` | Minimum payout | `0.001` |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (Railway) |

---

## API Endpoints

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Current game state |
| `/api/leaderboard` | GET | Top 20 wallets |
| `/api/config` | GET | Public config |
| `/api/winners` | GET | Recent winners |
| `/health` | GET | Health check |

### Admin (requires `Authorization: Bearer <password>`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/verify` | POST | Verify password |
| `/api/admin/status` | GET | Full admin status |
| `/api/admin/config` | GET | Current config |
| `/api/admin/validate` | POST | Validate values |
| `/api/admin/update-config` | POST | Update & hot reload |

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `gameState` | Server → Client | Full game state |
| `newBuy` | Server → Client | New buy detected |
| `configUpdated` | Server → Client | Config changed |

---

## Troubleshooting

### "Connection refused" error
- Check Railway backend is running
- Verify `VITE_API_URL` in Vercel matches Railway URL
- Check CORS: `FRONTEND_URL` in Railway must match Vercel URL

### "Invalid password" in admin
- Verify `ADMIN_PASSWORD` is set in Railway
- Password is case-sensitive

### Transactions not detected
- Verify token mint address is correct
- Check RPC connection (try premium RPC)
- Ensure token has active trading

### Payouts failing
- Check dev wallet has SOL balance
- Verify private key is correct Base58
- Check minimum reward threshold

### CORS errors
- Update `FRONTEND_URL` in Railway to match Vercel URL exactly
- Include `https://` in the URL
- Redeploy Railway after changing

---

## Security Best Practices

1. **Change default admin password** - Set `ADMIN_PASSWORD` to something strong
2. **Use dedicated wallet** - Never use your main wallet for dev payouts
3. **Premium RPC** - Use Helius/QuickNode for production reliability
4. **Monitor logs** - Check Railway logs for errors
5. **Never share private keys** - Admin panel stores them securely

---

## Project Structure

```
BUYMAX/
├── backend/
│   ├── src/
│   │   ├── config.js              # Configuration loader
│   │   ├── index.js               # Express server + API
│   │   ├── config/
│   │   │   └── dynamicConfig.js   # Hot-reload config system
│   │   ├── game/
│   │   │   ├── engine.js          # Game round logic
│   │   │   └── storage.js         # JSON persistence
│   │   └── solana/
│   │       ├── connection.js      # Solana RPC connection
│   │       ├── monitor.js         # Transaction monitoring
│   │       └── payout.js          # Winner payout logic
│   ├── data/                      # Runtime data (gitignored)
│   ├── railway.json               # Railway config
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app + routing
│   │   ├── components/
│   │   │   ├── AdminPage.jsx      # Admin panel
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── GameStats.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LastWinner.jsx
│   │   │   ├── DevWallet.jsx
│   │   │   └── Footer.jsx
│   │   └── styles/
│   ├── vercel.json                # Vercel config
│   └── package.json
├── package.json                   # Root workspace
└── README.md
```

---

## License

MIT

---

**Built for degens. Not financial advice. DYOR.**
