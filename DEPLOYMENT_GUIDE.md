# Techxl Intelligence System (TIS) Deployment Guide

This project is configured for deployment on render.com (or any Node.js/Vite hosting).
The repository contains both backend and frontend.

## 1. Environment Variables

You must configure environment variables in your hosting provider's dashboard.

### Backend Variables (Render Web Service)
| Key | Value Example | Description |
|-----|---------------|-------------|
| `PORT` | `5000` (or 10000) | Port for the server (Render sets this automatically) |
| `MONGO_URI` | `mongodb+srv://...` | Connection string to MongoDB Atlas |
| `JWT_SECRET` | `secure_string` | Secret for JWT tokens |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` | URL of your deployed frontend (for CORS) |
| `EMAIL_USER` | `me@gmail.com` | Email for sending notifications |
| `EMAIL_PASS` | `app_password` | App password for email |

### Frontend Variables (Render Static Site)
| Key | Value Example | Description |
|-----|---------------|-------------|
| `VITE_API_URL` | `https://your-backend.onrender.com` | URL of your deployed backend |

## 2. Deployment Steps on Render.com

### Step A: Deploy Backend
1. Create a **New Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Name**: `tis-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node server.js`)
4. Add **Environment Variables** (from above).
5. Click **Deploy**. Copy the URL (e.g., `https://tis-backend.onrender.com`).

### Step B: Deploy Frontend
1. Create a **New Static Site**.
2. Connect the SAME GitHub repository.
3. Settings:
   - **Name**: `tis-frontend`
   - **Root Directory**: `frontend/my-react-app`
   - **Build Command**: `npm install; npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: Paste the Backend URL from Step A (e.g., `https://tis-backend.onrender.com`).
5. **Important**: Go to **Redirects/Rewrites** settings on Render.
   - Add a Rewrite Rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Action: `Rewrite`
   - This prevents 404 errors on refresh.
6. Click **Deploy**.

## 3. Local Development
- Create `.env` files in `backend/` and `frontend/my-react-app/` based on `.env.example`.
- Run `npm run dev` in frontend and `node server.js` in backend.
