# Vercel Deployment & Database Setup Guide

This guide will help you deploy the Bitcoin Ordinals Inscription DApp to Vercel and set up the database.

## Prerequisites

1. A Vercel account ([sign up here](https://vercel.com/signup))
2. A GitHub account (for Git integration)
3. Node.js 18+ installed locally

## Step 1: Push to GitHub

1. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub

3. Push to GitHub:
```bash
git remote add origin https://github.com/yourusername/bitcoin-ordinals-dapp.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

## Step 3: Set Up Vercel Postgres Database

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name (e.g., "bitcoin-ordinals-db")
5. Select a region (choose closest to your users)
6. Click "Create"

Vercel will automatically add the following environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Step 4: Configure Environment Variables

In your Vercel project settings, go to "Environment Variables" and add:

### Required:
- `NEXT_PUBLIC_NETWORK` = `mainnet` or `testnet`

### Optional (for better performance):
- `MAESTRO_API_KEY` - Get from [Maestro](https://www.oklink.com/en/maestro)
- `SANDSHREW_API_KEY` - Get from [Sandshrew](https://sandshrew.io)

## Step 5: Initialize Database Schema

After deployment, initialize the database by calling:

```bash
curl -X POST https://your-app.vercel.app/api/db/init
```

Or visit: `https://your-app.vercel.app/api/db/init` in your browser.

## Step 6: Redeploy

After setting environment variables, trigger a new deployment:
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger auto-deployment

## Local Development with Vercel Postgres

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Pull environment variables:
```bash
vercel env pull .env.local
```

4. The database connection strings will be in `.env.local`

## Database Schema

The database includes:

- **inscriptions** - Stores inscription transaction data
- **transactions** - Tracks all Bitcoin transactions
- **user_sessions** - Optional user session tracking

## API Endpoints

### Save Inscription
```bash
POST /api/inscriptions
{
  "txid": "...",
  "recipient_address": "...",
  "content_type": "text/plain",
  "content_size": 100,
  "fee_rate": 10,
  "fee_paid": 1000,
  "network": "mainnet"
}
```

### Get Inscription
```bash
GET /api/inscriptions?txid=...
GET /api/inscriptions?recipient=...&limit=50
```

### Update Inscription Status
```bash
PATCH /api/inscriptions
{
  "txid": "...",
  "status": "confirmed",
  "block_height": 800000
}
```

## Troubleshooting

### Database Connection Issues
- Ensure environment variables are set in Vercel dashboard
- Check that the database is created and active
- Verify the region matches your deployment region

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure TypeScript types are correct
- Review build logs in Vercel dashboard

### API Errors
- Check Vercel function logs in the dashboard
- Ensure database schema is initialized
- Verify environment variables are set

## Next Steps

1. Set up monitoring (Vercel Analytics)
2. Configure custom domain
3. Set up CI/CD workflows
4. Add rate limiting for API routes
5. Implement caching strategies

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Documentation](https://nextjs.org/docs)

