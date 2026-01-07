# 🚀 Deployment Guide - AnchorRisk

This guide explains how to deploy your full-stack application using **Vercel** (Frontend) and **Render** (Backend).

## Architecture Overview

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Vercel    │─────▶│   Render    │─────▶│  Neo4j Aura  │
│  (Frontend) │      │  (Backend)  │      │  (Database)  │
└─────────────┘      └─────────────┘      └──────────────┘
      │                     │
      │                     ├─────▶ Gemini AI
      │                     └─────▶ Vertex AI
      │
      └─────▶ Firebase Auth
```

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Render Account** - Sign up at [render.com](https://render.com)
4. **Neo4j Aura Account** - Sign up at [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura)

---

## Part 1: Setup Neo4j Aura (Database)

### Step 1: Create Neo4j Aura Instance

1. Go to [console.neo4j.io](https://console.neo4j.io)
2. Click **"New Instance"**
3. Choose **Free tier** (AuraDB Free)
4. Select region closest to your users
5. Click **"Create"**
6. 📝 **SAVE THE CREDENTIALS!** (You only get them once)
   ```
   Connection URI: neo4j+s://xxxxx.databases.neo4j.io
   Username: neo4j
   Password: <your-password>
   ```

### Step 2: Test Connection

```bash
# Install Neo4j Desktop or use Neo4j Browser
# Connect using the credentials above
```

---

## Part 2: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

Create `backend/package.json` start script:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

### Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository**
4. Configure:
   - **Name**: `anchorrisk-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Setup Google Cloud Service Account (Required for Vertex AI)

Before adding environment variables, you need to create a service account for authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **"Create Service Account"**
5. Fill in:
   - **Name**: `render-backend-service`
   - **Description**: `Service account for Render backend deployment`
6. Click **"Create and Continue"**
7. Grant roles:
   - **Vertex AI User**
   - **AI Platform Developer** (if using predictions)
8. Click **"Continue"** → **"Done"**
9. Click on the created service account
10. Go to **"Keys"** tab → **"Add Key"** → **"Create new key"**
11. Choose **JSON** → Click **"Create"**
12. 📝 **Save the downloaded JSON file** - you'll need its contents

### Step 4: Add Environment Variables on Render

Click **"Environment"** tab and add:

```env
NODE_ENV=production
PORT=5000

# Neo4j Aura
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-aura-password

# Google Cloud Vertex AI
VERTEX_PROJECT_ID=your-project-id
VERTEX_LOCATION=europe-west4
VERTEX_ENDPOINT_ID=your-endpoint-id

# Google Cloud Service Account (paste entire JSON as single line)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS (add your Vercel frontend URL later)
ALLOWED_ORIGINS=https://your-app.vercel.app
```

> ⚠️ **IMPORTANT**: For `GOOGLE_APPLICATION_CREDENTIALS_JSON`, open your downloaded service account JSON file, copy the ENTIRE contents, and paste it as a single line (remove line breaks).

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically deploy
3. Wait for deployment to complete
4. Your backend URL: `https://anchorrisk-backend.onrender.com`

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

#### Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
})
```

#### Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your **GitHub repository**
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel
```

### Step 3: Add Environment Variables on Vercel

Go to **Settings** → **Environment Variables** and add:

```env
# Backend API URL (from Render)
VITE_API_BASE_URL=https://anchorrisk-backend.onrender.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Step 4: Redeploy

1. Click **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Your frontend URL: `https://your-app.vercel.app`

---

## Part 4: Configure CORS

### Update Backend CORS on Render

1. Go to Render dashboard → Your web service
2. Environment → Edit `ALLOWED_ORIGINS`
3. Add your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-custom-domain.com
   ```
4. Save and redeploy

---

## Part 5: Configure Firebase

### Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Authentication** → **Settings** → **Authorized domains**
4. Add:
   ```
   your-app.vercel.app
   your-custom-domain.com (if using custom domain)
   ```

---

## Part 6: Custom Domain (Optional)

### For Vercel (Frontend)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel

### For Render (Backend)

1. Go to **Settings** → **Custom Domains**
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed by Render

---

## 🔧 Deployment Checklist

- [ ] **Neo4j Aura** instance created and credentials saved
- [ ] **Backend deployed** to Render with all environment variables
- [ ] **Frontend deployed** to Vercel with all environment variables
- [ ] **CORS configured** with frontend URL
- [ ] **Firebase authorized domains** updated
- [ ] **Test all features**: Login, Create Household, Risk Analysis, Simulations
- [ ] **Monitor logs** on Render and Vercel dashboards

---

## 📊 Monitoring & Logs

### Render (Backend)

- **Logs**: Dashboard → Your Service → Logs tab
- **Metrics**: Dashboard → Your Service → Metrics tab
- **Events**: See deployments, errors, and restarts

### Vercel (Frontend)

- **Deployments**: See build logs and deployment history
- **Analytics**: Track user visits (optional paid feature)
- **Functions**: Monitor serverless function usage

---

## 🚨 Troubleshooting

### Backend won't start on Render

```bash
# Check logs in Render dashboard
# Common issues:
# 1. Missing environment variables
# 2. Port configuration (Render provides PORT env var)
# 3. Neo4j connection string incorrect
```

### Frontend can't reach backend

```bash
# Check:
# 1. VITE_API_BASE_URL is correct in Vercel env vars
# 2. CORS is configured on backend
# 3. Backend is running (check Render dashboard)
```

### Firebase authentication not working

```bash
# Check:
# 1. Firebase authorized domains includes Vercel URL
# 2. All Firebase env vars are set in Vercel
# 3. Firebase providers (Google, Email/Password) are enabled
```

### Database connection errors

```bash
# Check:
# 1. Neo4j Aura instance is running
# 2. NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD are correct
# 3. Connection string uses neo4j+s:// (secure)
```

---

## 💰 Pricing (Free Tiers)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Vercel** | Free | Unlimited deployments, 100GB bandwidth/month |
| **Render** | Free | 750 hours/month, sleeps after 15 min inactivity |
| **Neo4j Aura** | Free | 1 instance, 50k nodes, 175k relationships |
| **Firebase** | Spark (Free) | 10k auth users, 1GB storage |

> ⚠️ **Note**: Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes 30-60 seconds to wake up.

---

## 🎯 Production Recommendations

For production with real users, consider:

1. **Upgrade Render** to paid plan for:
   - No sleep on inactivity
   - Better performance
   - More memory

2. **Use Custom Domain** for professional appearance

3. **Enable Analytics** on Vercel to track usage

4. **Set up Monitoring** with services like Sentry or LogRocket

5. **Backup Neo4j** data regularly (Aura has automated backups on paid plans)

---

## 📝 Next Steps

1. Push your code to GitHub
2. Follow this guide step-by-step
3. Test all features in production
4. Share your deployed app! 🎉

**Deployed URLs will be:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://anchorrisk-backend.onrender.com`

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Neo4j Aura Docs**: https://neo4j.com/docs/aura/

Good luck with your deployment! 🚀
