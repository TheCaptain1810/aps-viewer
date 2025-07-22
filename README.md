# APS Viewer - Integrated Frontend & Backend

A complete Autodesk Platform Services (APS) viewer application with React frontend and Node.js backend.

## Prerequisites

- Node.js 18+
- APS Client ID and Client Secret from [Autodesk Developer Portal](https://aps.autodesk.com)

## Setup

1. **Install dependencies for both frontend and backend:**

   ```bash
   npm run install:all
   ```

2. **Backend Configuration:**
   - Create a `.env` file in the `backend` directory:
   ```env
   APS_CLIENT_ID=your_client_id_here
   APS_CLIENT_SECRET=your_client_secret_here
   APS_BUCKET=your-default-bucket-name
   PORT=8080
   NODE_ENV=development
   ```

## Development

1. **Run both frontend and backend simultaneously:**

   ```bash
   npm run dev
   ```

   - Backend runs on http://localhost:8080
   - Frontend runs on http://localhost:5173 (or 3000)
   - API requests are proxied from frontend to backend

2. **Run individually:**

   ```bash
   # Backend only
   npm run dev:backend

   # Frontend only
   npm run dev:frontend
   ```

## Production Build

1. **Build the frontend:**

   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```
   - Serves both frontend static files and API on port 8080

## Features

### Backend API Endpoints

- `GET /api/auth/token` - Get viewer access token
- `GET /api/buckets` - List all buckets
- `POST /api/buckets/create` - Create new bucket
- `DELETE /api/buckets/:bucketName` - Delete bucket
- `GET /api/models` - List models (optionally filtered by bucket)
- `GET /api/models/:urn/status` - Get model translation status
- `POST /api/models` - Upload and translate model

### Frontend Features

- **Bucket Management**: Create, select, and delete buckets
- **Model Upload**: Upload CAD files to selected buckets
- **3D Viewer**: View models using Autodesk Viewer
- **Real-time Status**: Translation progress tracking
- **Notifications**: User feedback for all operations

## Important Notes

### Bucket Deletion Restrictions

- **You can only delete buckets that you created** with your specific APS Client ID
- Buckets created by other applications, users, or APS accounts cannot be deleted
- This is an APS API security restriction, not a limitation of this app
- If you get "Access denied" errors when deleting buckets, this is the reason

### APS Token Scopes

The backend uses the following APS scopes:

- `data:read` - Read data from buckets
- `data:create` - Create new data
- `data:write` - Modify existing data
- `bucket:create` - Create new buckets
- `bucket:read` - List and read bucket information
- `bucket:delete` - Delete buckets (only your own)
- **Real-time Status**: Translation progress tracking
- **Notifications**: User feedback for all operations

## Architecture

```
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── utils/      # Utility functions
│   │   └── App.jsx     # Main app
├── backend/            # Express.js backend
│   ├── routes/         # API route handlers
│   ├── services/       # APS service integrations
│   └── config.js       # Configuration
└── package.json        # Root scripts
```

## Integration Details

- **CORS**: Backend configured for cross-origin requests during development
- **Proxy**: Vite dev server proxies `/api/*` requests to backend
- **Static Serving**: Backend serves built frontend in production
- **Error Handling**: Consistent error responses across all endpoints
- **State Management**: React state synced with backend data

## Troubleshooting

1. **CORS Issues**: Make sure backend CORS is configured for your frontend URL
2. **Environment Variables**: Verify all required env vars are set in backend/.env
3. **Port Conflicts**: Ensure ports 8080 and 5173 are available
4. **API Errors**: Check browser network tab and backend console logs
