# Vercel Deployment Guide

This guide will help you deploy the BTC Fee Calculator to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (free tier available)
- The project code in a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/btc-fee-calculator.git
   git push -u origin main
   ```

### 2. Deploy to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Create New Project:**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository: `btc-fee-calculator`

3. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 3. Set Up Vercel KV Database

1. **Create KV Database:**
   - In your Vercel dashboard, go to the "Storage" tab
   - Click "Create Database"
   - Select "KV" (Key-Value)
   - Name it: `btc-fee-calculator-kv`
   - Choose a region close to your users

2. **Get Connection Details:**
   - After creation, go to the database settings
   - Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`

### 4. Configure Environment Variables

1. **Add Environment Variables:**
   - In your Vercel project settings, go to "Environment Variables"
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `KV_REST_API_URL` | Your KV database URL | Production, Preview, Development |
   | `KV_REST_API_TOKEN` | Your KV database token | Production, Preview, Development |

2. **Redeploy:**
   - After adding environment variables, trigger a new deployment
   - Go to "Deployments" tab and click "Redeploy"

### 5. Test Your Deployment

1. **Visit Your App:**
   - Your app will be available at `https://your-project-name.vercel.app`
   - Test the calculator with a real Bitcoin address
   - Check the leaderboard functionality

2. **Verify Database:**
   - Enter a Bitcoin address and calculate fees
   - Check that the leaderboard updates
   - Verify data persistence across page refreshes

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally
   - Check the build logs in Vercel dashboard

2. **Database Connection Issues:**
   - Verify environment variables are set correctly
   - Check that Vercel KV database is active
   - Ensure the database region is accessible

3. **API Timeouts:**
   - The mempool.space API can be slow
   - Consider adding loading states
   - Monitor function execution time in Vercel dashboard

### Environment Variables

Make sure these are set in your Vercel project:

```bash
KV_REST_API_URL=https://your-kv-database-url
KV_REST_API_TOKEN=your-kv-token
```

### Local Development

For local development without Vercel KV:

1. The app will automatically fall back to in-memory storage
2. Data will not persist between restarts
3. This is fine for testing the UI and functionality

## Production Considerations

1. **Rate Limiting:**
   - The mempool.space API has rate limits
   - Consider implementing client-side caching
   - Add error handling for API failures

2. **Performance:**
   - Monitor function execution times
   - Consider implementing request batching
   - Add loading states for better UX

3. **Monitoring:**
   - Use Vercel Analytics for usage insights
   - Monitor error rates in the dashboard
   - Set up alerts for critical failures

## Custom Domain (Optional)

1. **Add Custom Domain:**
   - In project settings, go to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate:**
   - Vercel automatically provides SSL certificates
   - No additional configuration needed

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test locally with the same environment variables
4. Check the Vercel documentation for troubleshooting

Your BTC Fee Calculator should now be live and accessible to users worldwide! 🚀
