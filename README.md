# APS Viewer Application

This is an Autodesk Platform Services (APS) viewer application with a React frontend and Express backend.

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
