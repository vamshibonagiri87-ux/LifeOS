# 🚀 LifeOS Production Deployment Guide (Render + Vercel)

This guide walks you through deploying **LifeOS** to production:
- **Backend (Node.js/Express + Socket.IO)**: Deployed on **[Render](https://render.com/)**
- **Frontend (React + Vite + Tailwind CSS)**: Deployed on **[Vercel](https://vercel.com/)**
- **Database**: **MongoDB Atlas Cloud**
- **AI Engine**: Google Gemini / OpenRouter / Deterministic Rule Engine

---

## 📋 Table of Contents
1. [Prerequisites & Git Setup](#1-prerequisites--git-setup)
2. [Step 1: MongoDB Atlas Network Configuration](#step-1-mongodb-atlas-network-configuration)
3. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
4. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
5. [Step 4: Connect Frontend & Backend (CORS & URLs)](#step-4-connect-frontend--backend)
6. [Step 5: Google OAuth & Gmail Configuration](#step-5-google-oauth--gmail-configuration)
7. [Step 6: Post-Deployment Verification Checklist](#step-6-post-deployment-verification-checklist)

---

## 1. Prerequisites & Git Setup

Ensure all sensitive files (`.env`, `.local_db.json`, `node_modules/`, `dist/`) are ignored by Git. `.gitignore` files have already been created for you at root, `server/`, and `client/`.

### Initialize and Push to GitHub

Open a terminal at the project root (`c:\Users\b vamshi krishna\lifeos`) and run:

```bash
# 1. Initialize Git repository (if not already done)
git init

# 2. Add all files (secrets and node_modules are automatically ignored)
git add .

# 3. Commit your codebase
git commit -m "feat: complete LifeOS platform ready for production deployment"

# 4. Set main branch
git branch -M main

# 5. Add your remote repository (replace with your GitHub URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push to GitHub
git push -u origin main
```

---

## Step 1: MongoDB Atlas Network Configuration

Render servers use dynamic IP addresses. You must allow connections from any IP in MongoDB Atlas:

1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. In the left sidebar, navigate to **Security** $\to$ **Network Access**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
5. Click **Confirm**.

---

## Step 2: Deploy Backend to Render

1. Log in to **[Render.com](https://render.com/)** (sign in with GitHub).
2. Click **New +** $\to$ **Web Service**.
3. Select **Build and deploy from a Git repository** and pick your `lifeos` repository.
4. Configure the service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `lifeos-backend` (or your preferred name) |
| **Region** | Choose closest to you (e.g., Singapore, Frankfurt, Oregon) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or Starter) |

5. Scroll down to **Environment Variables** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Port used by Render |
| `MONGODB_URI` | `your_mongodb_atlas_connection_string` | Copy from `server/.env` |
| `JWT_SECRET` | `your_secure_32_char_jwt_secret_key` | Secure 32+ char string |
| `CREDENTIAL_ENCRYPTION_KEY` | `your_64_char_hex_encryption_key` | 64-char hex key for AES-256 |
| `GEMINI_API_KEY` | `your_gemini_api_key` | Copy from `server/.env` |
| `OPENROUTER_API_KEY` | *(Optional)* | OpenRouter API Key if available |
| `CLIENT_URL` | `http://localhost:5173` *(Update in Step 4 after Vercel deployment)* | Frontend URL |

6. Click **Create Web Service**.
7. Wait 2–3 minutes for deployment. Once finished, Render will display your live URL:
   `https://lifeos-backend.onrender.com` *(Save this URL for Step 3)*.

8. Test the live health endpoint in your browser:
   👉 `https://lifeos-backend.onrender.com/api/health`

---

## Step 3: Deploy Frontend to Vercel

1. Log in to **[Vercel.com](https://vercel.com/)** (sign in with GitHub).
2. Click **Add New...** $\to$ **Project**.
3. Select your `lifeos` repository and click **Import**.
4. Configure the build & output settings:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click *Edit* and select **`client`** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

5. Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://lifeos-backend.onrender.com/api` *(your Render backend URL + `/api`)* |
| `VITE_SOCKET_URL` | `https://lifeos-backend.onrender.com` *(your Render backend URL)* |

6. Click **Deploy**.
7. Vercel will build and deploy your frontend in ~30 seconds, generating your live URL:
   `https://lifeos.vercel.app` (or similar).

---

## Step 4: Connect Frontend & Backend

Now link the two deployed services:

1. Go back to your **Render Dashboard** $\to$ `lifeos-backend` $\to$ **Environment**.
2. Update the `CLIENT_URL` variable:
   - `CLIENT_URL` = `https://your-app-name.vercel.app`
3. Click **Save Changes** (Render will automatically redeploy).

---

## Step 5: Google OAuth & Gmail Configuration

### Option A: Google App Passwords (Instant — Recommended for Personal Use)
- No cloud setup needed.
- Users can go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), generate a 16-letter App Password, and connect directly in the app at `/integrations`.

### Option B: Google Cloud OAuth 2.0 (Official Popup)
If using Google Cloud Sign-In:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your **OAuth 2.0 Client ID**:
   - **Authorized JavaScript origins**:
     - `https://your-app-name.vercel.app`
     - `https://lifeos-backend.onrender.com`
   - **Authorized redirect URIs**:
     - `https://lifeos-backend.onrender.com/api/integrations/oauth/google/callback`
3. In Render Environment Variables, set:
   - `GOOGLE_CLIENT_ID` = `your_google_client_id`
   - `GOOGLE_CLIENT_SECRET` = `your_google_client_secret`
   - `GOOGLE_REDIRECT_URI` = `https://lifeos-backend.onrender.com/api/integrations/oauth/google/callback`

---

## Step 6: Post-Deployment Verification Checklist

Once both services are deployed, test your live production app:

- [ ] **Backend Health Check**: Open `https://your-backend.onrender.com/api/health` $\to$ Confirm `database: "mongodb"` and `ai.gemini: true`.
- [ ] **User Registration**: Open your Vercel URL $\to$ Register a new account $\to$ Verify account creates in MongoDB Atlas.
- [ ] **Real-Time WebSockets**: Check browser console $\to$ Verify `[Socket.IO] Connected to LifeOS real-time server`.
- [ ] **Gmail Connection**: Navigate to `/integrations` $\to$ Click *Connect Real Gmail* $\to$ Sync inbox emails $\to$ Verify obligations appear on Dashboard.
- [ ] **Document Intelligence**: Upload a sample PDF / TXT at `/documents` $\to$ Verify 6-agent AI extraction runs.
- [ ] **AI Assistant**: Ask questions in `/assistant` $\to$ Verify contextual responses.
- [ ] **Page Refresh**: Refresh on `/settings`, `/documents`, or `/assistant` $\to$ Confirm no 404 errors (handled by `client/vercel.json`).

🎉 **Your LifeOS platform is now live and running in production!**
