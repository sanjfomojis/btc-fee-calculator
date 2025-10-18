# BTC Fee Calculator

A web application that calculates how much users have paid in Bitcoin transaction fees by analyzing their wallet addresses using the mempool.space API.

## Features

- **Wallet Analysis**: Enter any Bitcoin address to see total fees paid
- **Real-time Data**: Uses mempool.space API for up-to-date transaction data
- **Fee Statistics**: Detailed breakdown including total, average, min, and max fees
- **Leaderboard**: See who has paid the most in Bitcoin fees
- **Share Functionality**: Share your fee statistics with others
- **Address Validation**: Supports P2PKH, P2SH, P2WPKH, P2WSH, and P2TR addresses

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Vercel KV (Redis)
- **Deployment**: Vercel
- **External API**: mempool.space
- **Icons**: Lucide React

## Getting Started

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Vercel KV credentials
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploy to Vercel

1. **Fork or clone this repository**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your repository

3. **Set up Vercel KV:**
   - In your Vercel dashboard, go to the "Storage" tab
   - Create a new KV database
   - Copy the connection details

4. **Configure Environment Variables:**
   - In your Vercel project settings, go to "Environment Variables"
   - Add:
     - `KV_REST_API_URL`: Your KV database URL
     - `KV_REST_API_TOKEN`: Your KV database token

5. **Deploy:**
   - Vercel will automatically deploy your project
   - Your app will be available at `https://your-project-name.vercel.app`

## How It Works

1. **Address Input**: Users enter their Bitcoin address
2. **Validation**: The address is validated for proper format
3. **Data Fetching**: The app queries mempool.space API for transaction data
4. **Fee Calculation**: Calculates total fees, averages, and other statistics
5. **Database Storage**: Saves results to SQLite database for leaderboard
6. **Display**: Shows comprehensive fee statistics and sharing options

## API Endpoints

- `POST /api/calculate` - Calculate fees for a Bitcoin address
- `GET /api/leaderboard` - Get the top fee payers leaderboard

## Database Schema

The SQLite database stores user statistics in the `users` table:
- `address`: Bitcoin address
- `total_fees`: Total fees in satoshis
- `total_fees_btc`: Total fees in BTC
- `total_fees_usd`: Total fees in USD
- `transaction_count`: Number of transactions
- `created_at`/`updated_at`: Timestamps

## Supported Address Types

- P2PKH (Legacy): Addresses starting with '1'
- P2SH (Script): Addresses starting with '3'
- P2WPKH/P2WSH (Native SegWit): Addresses starting with 'bc1'
- P2TR (Taproot): Addresses starting with 'bc1p'

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
