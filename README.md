# APS Viewer - Full Stack Application

A comprehensive Autodesk Platform Services (APS) viewer application with bucket management, model upload, and 3D visualization capabilities.

## Features

### Frontend (React + Vite)

- **Authentication**: Login/logout with Autodesk account
- **Bucket Management**: Create, delete, and select buckets
- **Model Upload**: Upload 3D models to buckets
- **Model Viewer**: 3D visualization using Autodesk Viewer
- **Modern UI**: React hooks, components, and responsive design

### Backend (Node.js + Express)

- **APS Integration**: Full Autodesk Platform Services integration
- **Bucket Operations**: CRUD operations for buckets
- **Model Management**: Upload, translation, and status checking
- **Authentication**: OAuth 2.0 flow with session management
- **File Upload**: Multer integration for model file uploads

## Prerequisites

1. **Node.js** (v16 or higher)
2. **APS App**: Create an app at [APS Developer Portal](https://aps.autodesk.com/developer/overview)
3. **Git** (for cloning the repository)

## Setup

1. **Backend Setup:**

   ```bash
   cd backend
   npm install
   ```

2. **Frontend Setup:**

   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables:**
   - Copy `.env.example` to `.env` in the backend directory
   - Fill in your APS credentials in the backend `.env` file

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend in development mode:

```bash
cd backend
npm run dev:full
```

This will start:

- Backend server on http://localhost:8080
- Frontend dev server on http://localhost:5173 (with proxy to backend)

### Production Mode

1. Build the frontend:

   ```bash
   cd backend
   npm run build:frontend
   ```

2. Start the backend server (which will serve the built frontend):
   ```bash
   npm start
   ```

The application will be available at http://localhost:8080

## Key Features

- Autodesk authentication
- Browse APS hubs, projects, and files
- 3D model viewing with Autodesk Viewer
- CORS-enabled API
- Session-based authentication

## Troubleshooting

If you encounter CORS issues:

- Make sure the backend is running on port 8080
- Check that CORS is properly configured in server.js
- Verify the VITE_SERVER_URL environment variable in the frontend
