# Render Deployment Guide

This guide will help you deploy your blockchain certificate verification system to Render.

## Prerequisites
- GitHub repository with your code
- MongoDB Atlas database (or another cloud MongoDB provider)
- Alchemy API key for Ethereum Sepolia testnet

## Step 1: Deploy Backend (Node.js Web Service)

1. **Create Web Service**
   - Go to [render.com](https://render.com) → "New" → "Web Service"
   - Connect your GitHub repository
   - **Settings:**
     - **Name:** `certificate-backend` (or your preferred name)
     - **Environment:** Node
     - **Region:** Choose your preferred region
     - **Branch:** `main`
     - **Root Directory:** `server`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** Free

2. **Environment Variables (CRITICAL)**
   Add these in the "Environment" tab:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   FRONTEND_URL=https://certificate-frontend.onrender.com
   ALCHEMY_API_KEY=your_alchemy_api_key
   PRIVATE_KEY=your_ethereum_private_key
   ```

3. **Note your backend URL:** `https://certificate-backend.onrender.com`

## Step 2: Deploy Frontend (Static Site)

1. **Create Static Site**
   - Render Dashboard → "New" → "Static Site"
   - Connect same GitHub repository
   - **Settings:**
     - **Name:** `certificate-frontend`
     - **Branch:** `main`
     - **Root Directory:** `certificate-frontend`
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`

2. **Environment Variables (CRITICAL)**
   Add these in the "Environment" tab:
   ```
   VITE_API_BASE_URL=https://certificate-backend.onrender.com
   VITE_BASE_URL=https://certificate-frontend.onrender.com
   VITE_ALCHEMY_API_KEY=your_alchemy_api_key
   ```

3. **CRITICAL: SPA Routing Configuration**
   - Go to "Redirects/Rewrites" tab in your static site settings
   - Add this rewrite rule:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** Rewrite
   
   **This is essential for QR code deep links to work!**

## Step 3: Update Backend CORS

After both services are deployed, update your backend's FRONTEND_URL environment variable to match your actual frontend URL.

## Step 4: Test QR Code Functionality

1. Submit a test certificate through your frontend
2. QR code will be generated with your production URL
3. Scan QR code from mobile device - it should open directly to verification page
4. Auto-verification should work immediately

## Important Notes

- **Free Tier Limitations:** Services may sleep after 15 minutes of inactivity
- **First Deploy:** Takes 2-5 minutes to build and start
- **Auto-Deploy:** New commits to your main branch trigger automatic redeployment
- **HTTPS:** All Render apps automatically get SSL certificates
- **Environment Variables:** Changes require a manual redeploy

## Troubleshooting

### QR Codes Don't Work
- Verify the SPA rewrite rule is configured: `/* → /index.html`
- Check VITE_BASE_URL matches your frontend domain exactly

### CORS Errors
- Ensure FRONTEND_URL in backend matches your frontend URL exactly
- No trailing slashes in URLs

### MongoDB Connection Issues
- Verify MONGODB_URI is correctly formatted
- Check MongoDB Atlas IP whitelist (use 0.0.0.0/0 for simplicity)

### Build Failures
- Check that all required environment variables are set
- Verify Node.js version compatibility