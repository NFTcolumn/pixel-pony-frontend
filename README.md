# 🏇 Pixel Pony Racing - Frontend

16 Pixelated Ponies Racing On-Chain For No Reason

## Live on Base Mainnet

**Game Contract:** `0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8`
**Token Contract:** `0x6ab297799335E7b0f60d9e05439Df156cf694Ba7`

## Features

- 🎮 Connect wallet and bet on pony races
- 🏁 Animated race visualization with real sprites
- 💰 Win up to 10x your bet!
- 🎟️ Earn free lottery tickets
- 🔥 Built on Base for low gas fees

## How to Play

1. Connect your wallet (MetaMask, Coinbase Wallet, etc.)
2. Make sure you're on Base Mainnet
3. Select a bet amount (1B - 50B PONY)
4. Choose your pony (#1-16)
5. Approve PONY tokens
6. Place bet and watch the race!

## Payouts

- 🥇 **1st Place:** 10x your bet
- 🥈 **2nd Place:** 2.5x your bet
- 🥉 **3rd Place:** 1x your bet (break even)

## Deployment

### Run Locally

```bash
npm start
```

Then open http://localhost:8080

### Deploy to Render

This project includes a `render.yaml` file for easy deployment:

1. Push this repo to GitHub
2. Go to [Render.com](https://render.com) and create a new account (or sign in)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Render will automatically detect the `render.yaml` configuration
6. Click "Create Web Service"
7. Your site will be live at `https://your-service-name.onrender.com`

**Manual Setup (if needed):**
- Build Command: `npm install` (or leave empty)
- Start Command: `npm start`
- Environment: Node

### Deploy to Vercel

This project includes a `vercel.json` file for easy deployment:

1. Push this repo to GitHub
2. Go to [Vercel.com](https://vercel.com) and import your repository
3. Vercel will automatically detect the configuration
4. Click "Deploy"
5. Your site will be live at `https://your-project.vercel.app`

**Or use Vercel CLI:**
```bash
npm i -g vercel
vercel
```

### Environment

- Node.js 14+
- No build step required
- Static files served from `/public`
- Server binds to `0.0.0.0` for cloud hosting
- PORT environment variable supported

## Tech Stack

- Pure HTML/CSS/JavaScript
- Ethers.js for Web3
- Native Node.js HTTP server
- Pixel art sprites
- Responsive design

## Contract Info

All smart contracts are verified on Basescan:
- [Token Contract](https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7)
- [Game Contract](https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8)

## License

MIT
