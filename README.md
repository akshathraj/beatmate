# 🎵 BeatMate - AI-Powered Music Generation Platform

BeatMate is a full-stack AI music generation platform that allows users to create songs, generate lyrics, and manage their music library. Built with React, FastAPI, and Supabase.

## 🌟 Features

- 🎼 **AI Song Generation** - Generate songs using MusicGPT AI
- ✍️ **AI Lyrics Generation** - Create lyrics with Google Gemini AI
- 🎥 **Lyric Video Creation** - Automatic music video generation with lyrics
- 📚 **Music Library** - Manage and organize your generated songs
- 🎨 **Beautiful UI** - Modern, responsive interface with Tailwind CSS
- 🔐 **User Authentication** - Secure authentication with Supabase Auth
- ☁️ **Cloud Storage** - All files stored in Supabase Storage

## 🚀 Quick Start

Choose your setup method:

### Option 1: Local Development
Follow the [Local Development Guide](#local-development) below

### Option 2: Deploy to Production (FREE!)
Follow the [Deployment Guide](#deployment) - **Recommended for sharing your app**

---

## 📋 Prerequisites

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend development
- **Git** - Version control
- **API Keys**:
  - [Gemini API](https://makersuite.google.com/app/apikey) - For lyrics generation
  - [MusicGPT API](https://musicgpt.com) - For song generation
  - [AssemblyAI API](https://www.assemblyai.com) - For transcription
- **Supabase Account** - Database and storage (free tier available)

---

## 💻 Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/beatmate.git
cd beatmate
```

### 2. Backend Setup (beatmate_backend)

1. Navigate to the backend directory:
   ```bash
   cd beatmate_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the beatmate_backend directory:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   MUSICGPT_API_KEY=your_musicgpt_api_key_here
   MUSICGPT_WEBHOOK_URL=http://localhost:8000/api/webhook/musicgpt
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at: `http://localhost:8000`

### 3. Frontend Setup (beatmate_frontend)

1. Navigate to the frontend directory:
   ```bash
   cd beatmate_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the beatmate_frontend directory:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:5173`

### 4. Access Your Local App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 🚀 Deployment

Ready to make your app live and share it with the world? 

### Quick Deploy (1-2 hours)

We recommend deploying with **Vercel** (frontend) + **Render** (backend) - both have generous free tiers!

**📖 Follow these guides:**

1. **Quick Start**: [`QUICK_DEPLOY.md`](QUICK_DEPLOY.md) - Step-by-step deployment guide
2. **Detailed Guide**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Comprehensive documentation
3. **Checklist**: [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Quick reference

### Verify Before Deploying

Run the verification script to check if everything is ready:

```bash
python verify_deployment_ready.py
```

This will check:
- ✅ Project structure
- ✅ Environment variables
- ✅ Git configuration
- ✅ CORS settings
- ✅ Dependencies

### Deployment Platforms

| Component | Platform | Cost | Why? |
|-----------|----------|------|------|
| Frontend | **Vercel** | FREE | Fast CDN, auto-deploy, perfect for React |
| Backend | **Render** | FREE | Python support, permanent URL for webhooks |
| Database | **Supabase** | FREE | Already configured! |

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month
- Render: 750 hours/month (spins down after 15min inactivity)
- Supabase: 500MB database, 1GB storage

---

## 📁 Project Structure

```
beatmate/
├── beatmate_backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI app with CORS
│   │   ├── api.py                # Legacy API endpoints
│   │   ├── api_supabase.py       # Supabase-integrated API (ACTIVE)
│   │   ├── models.py             # Pydantic models
│   │   └── services/             # Business logic
│   │       ├── gemini_service.py       # Lyrics generation
│   │       ├── musicgpt_service.py     # Song generation
│   │       ├── video_service.py        # Video creation
│   │       └── supabase_service.py     # Database & storage
│   ├── files/                    # Local file storage (legacy)
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables (DO NOT COMMIT!)
│
├── beatmate_frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── lib/                  # Utilities
│   │   └── App.tsx               # Main app component
│   ├── package.json              # Node dependencies
│   └── .env                      # Environment variables (DO NOT COMMIT!)
│
├── QUICK_DEPLOY.md               # 🚀 Start here for deployment!
├── DEPLOYMENT_GUIDE.md           # Detailed deployment docs
├── DEPLOYMENT_CHECKLIST.md       # Quick checklist
├── verify_deployment_ready.py    # Pre-deployment verification
└── README.md                     # This file
```

---

## 🎨 Features Overview

### 🎼 AI Song Generator
- Generate songs from text descriptions
- Multiple genre support (Pop, Rock, Hip-Hop, Jazz, Electronic, etc.)
- Adjustable duration (15-180 seconds)
- Real-time generation status tracking
- Webhook-based async processing

### ✍️ Lyrics Generator
- AI-powered lyrics generation using Google Gemini
- Multiple genres and moods
- Customize song structure (verses, chorus, bridge)
- Copy lyrics directly to song generator

### 🎥 Lyric Video Creator
- Automatic music video generation
- Synchronized lyrics display
- Custom background selection
- Professional video output

### 📚 My Songs Library
- View all your generated songs
- Audio player with controls
- Download songs as MP3
- Delete unwanted songs
- Search and filter functionality

### 👤 User Management
- Secure authentication with Supabase
- User profiles
- Personal song libraries
- Account settings

## 🔌 API Endpoints

The backend provides these REST API endpoints:

### Songs
- `POST /api/songs` - Create a new song request
- `GET /api/songs` - List all user's songs
- `GET /api/songs/{song_id}` - Get specific song details
- `PUT /api/songs/{song_id}` - Update song metadata
- `DELETE /api/songs/{song_id}` - Delete a song

### Lyrics
- `POST /api/lyrics/generate` - Generate lyrics with AI
- `GET /api/lyrics` - List all user's lyrics
- `GET /api/lyrics/{lyrics_id}` - Get specific lyrics
- `DELETE /api/lyrics/{lyrics_id}` - Delete lyrics

### Videos
- `POST /api/videos/create` - Create a lyric video
- `GET /api/videos` - List all user's videos
- `GET /api/videos/{video_id}` - Get specific video
- `DELETE /api/videos/{video_id}` - Delete video

### Webhooks
- `POST /api/webhook/musicgpt` - MusicGPT completion webhook

### Utility
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

## 🔧 Troubleshooting

### Common Issues

**"Network Error" in frontend**
- Check if backend is running on port 8000
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors

**CORS Errors**
- Ensure frontend URL is in backend's CORS allowed origins
- Check `app/main.py` CORS configuration
- Clear browser cache and retry

**API Keys Not Working**
- Verify all API keys in `.env` files
- Check for extra spaces or quotes
- Ensure `.env` files are in correct directories

**Songs Not Generating**
- Check MusicGPT API credits
- Verify webhook URL is accessible
- Check backend logs for errors

**Supabase Connection Issues**
- Verify Supabase URL and keys in `.env`
- Check Supabase project is active
- Verify database tables exist (run `supabase_schema.sql`)

**File Upload Errors**
- Verify Supabase Storage buckets exist
- Check bucket policies allow public read
- Ensure files are not too large (check Supabase limits)

### View Logs

**Backend Logs (Local)**:
```bash
cd beatmate_backend
# Logs will appear in terminal where uvicorn is running
```

**Frontend Logs (Local)**:
- Open browser Developer Tools (F12)
- Go to Console tab

**Production Logs**:
- **Vercel**: Dashboard → Your Project → Deployments → Function Logs
- **Render**: Dashboard → Your Service → Logs

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🆘 Support

**Need help?**
- 📖 Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed docs
- 🐛 Open an issue on GitHub
- 📧 Contact the maintainers

**Useful Resources:**
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)

---

## 🎉 Acknowledgments

- **MusicGPT** - AI song generation
- **Google Gemini** - AI lyrics generation
- **AssemblyAI** - Audio transcription
- **Supabase** - Backend infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

---

**Built with ❤️ by the BeatMate Team**

**⭐ Star this repo if you find it useful!**
