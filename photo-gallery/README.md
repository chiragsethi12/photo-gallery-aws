# Cloud Photo Gallery (MERN Stack)

A containerized MERN application providing an interactive cloud photo gallery dashboard, persisted in MongoDB, utilizing Cloudinary image optimization APIs, and protected by JWT authentication with refresh-token session management and role-based album collaboration.

---

## 🛠️ Technology Stack

### Backend
- **Node.js & Express**: Secure API router endpoints.
- **Mongoose & MongoDB**: Document schema modeling and Atlas persistent storage.
- **JWT (JsonWebTokens)**: Access + refresh token-based session management with automatic rotation.
- **Bcrypt.js**: Salting and hashing passwords (10 salt rounds).
- **Helmet**: Securing HTTP headers.
- **Express Rate Limit**: Anti-brute force request limits (100 reqs/15m globally, 10 reqs/15m on auth).
- **Express Validator**: Server-side request payload schema validation.
- **Compression**: Gzip compression middleware to reduce network latency.
- **Pino & Pino-HTTP**: Structured JSON logging with request IDs for observability.
- **Socket.IO**: Real-time album collaboration events (live image/comment updates).
- **Swagger (swagger-jsdoc + swagger-ui-express)**: Auto-generated OpenAPI documentation at `/api-docs`.
- **node-cron**: Scheduled daily trash cleanup job (auto-purges items deleted >30 days ago).

### Frontend
- **React.js**: Modern view library with custom React Hooks (`useGallery`) for state management.
- **Tailwind CSS**: Sleek, glassmorphic UI design system.
- **React Dropzone**: Drag-and-drop multi-file selection.
- **Axios**: HTTP API client with auth interceptors and automatic token refresh.
- **Recharts**: Analytics dashboard with bar charts, pie charts, and custom tooltips.
- **Socket.IO Client**: Real-time album view updates.

### DevOps, Testing & CI/CD
- **Docker & Docker Compose**: Containerization configurations.
- **Nginx**: High-performance HTTP server serving React static assets.
- **Jest & Supertest**: Backend integration and unit testing with `mongodb-memory-server`.
- **Playwright**: End-to-end browser tests covering registration through share-link verification.
- **React Testing Library**: Frontend view components validation.
- **GitHub Actions**: Automated CI testing pipeline on pushing to `main`.

---

## 🌟 Features

### Core Gallery
1. **User Authentication**: Secure registration and login with encrypted passwords, short-lived access tokens (15 min), and long-lived refresh tokens (7 days) with automatic rotation.
2. **Session Management**: View and revoke active sessions from the UI. Each device/browser gets its own refresh token with user-agent tracking.
3. **Albums Board**: Categorize photos into albums. Responsive albums board displaying image counts and cover photos, with a floating modal to create new albums.
4. **Tags & Search**: Comma-separated tag strings parsed on upload. Navbar-based queries filtering by titles or tag lists.
5. **Optimistic Favorites**: Toggle heart icons on images with instant optimistic UI changes that automatically roll back on network failure.
6. **Drag-and-Drop Concurrent Uploads**: Upload multiple files simultaneously with individual parallel progress indicators.
7. **Direct Cloud Downloads**: Download full-resolution original assets with one click via temporary anchor triggers.
8. **Cloudinary CDN Transformations**: Grid cards load optimized thumbnails (`w_400,q_auto,f_auto`) for fast load times, saving network bandwidth.

### Collaboration & Sharing
9. **Role-Based Album Collaboration**: Invite collaborators with `viewer`, `contributor`, or `editor` roles. Role-specific permissions control who can view, upload, or manage an album.
10. **Shareable Links**: Generate time-limited share links for albums and images. Public share pages are accessible without authentication.
11. **Comments on Images**: Add and view comments on images within albums, with real-time updates via Socket.IO.
12. **Activity Feed**: Per-album activity feed tracking uploads, deletions, comments, and collaboration changes.
13. **Real-Time Updates**: Live-updating album views when a collaborator uploads, deletes, or comments — powered by Socket.IO scoped rooms.

### Content Management
14. **Soft-Delete & Trash**: Deleted images and albums move to a 30-day trash bin instead of being permanently removed. Restore or permanently delete from the trash view.
15. **Duplicate Detection**: SHA-256 content hashing prevents re-uploading identical files per user. Exact match returns the existing image.
16. **Extended Search & Sort**: Filter by tag, album, date range, and format. Sort by newest, oldest, title, or size.

### Observability & Analytics
17. **Analytics Dashboard**: Visual Recharts-powered dashboard showing upload trends, format breakdown, and activity history.
18. **Structured Logging**: Pino JSON logging with request IDs for full request tracing.
19. **Health Checks**: `/health` (liveness) and `/health/ready` (readiness, verifies MongoDB connectivity) endpoints.
20. **OpenAPI Documentation**: Interactive Swagger UI at `/api-docs` documenting every API endpoint.

### Error Handling
21. **Centralized Error Handling**: Standardized async controller wrapper `wrapAsync` routing errors to a central error handling middleware with structured `AppError` responses.

---

## 📐 Architecture

```
photo-gallery/
├── backend/
│   ├── config/           # DB connection, Cloudinary, logger, Swagger setup
│   ├── controllers/      # Route handlers (auth, image, album, share, comment, analytics)
│   ├── middleware/        # Auth, album access, error handler, multer upload
│   ├── models/           # Mongoose schemas (User, Image, Album, Session, ShareLink, Comment, Activity)
│   ├── routes/           # Express route definitions with Swagger JSDoc annotations
│   ├── jobs/             # Scheduled background jobs (trash cleanup)
│   ├── utils/            # Shared utilities (token verification, album access checks, activity logging)
│   ├── tests/            # Jest integration tests
│   ├── server.js         # Main Express + Socket.IO server entry point
│   └── server-test.js    # In-memory MongoDB test server for E2E
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios API client with interceptors
│   │   ├── components/   # React components (Gallery, Upload, Lightbox, Albums, Comments, etc.)
│   │   ├── context/      # AuthContext with token refresh logic
│   │   └── hooks/        # Custom hooks (useGallery)
│   └── public/
├── e2e/                  # Playwright end-to-end browser tests
├── .github/workflows/    # CI pipeline definitions
├── docker-compose.yml
└── README.md
```

---

## 🚀 How to Run the Project

### Option A: Local Development

#### 1. Setup Environment Variables
Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/photo-gallery
JWT_SECRET=yoursecretrandomstringhere
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGIN=http://localhost:3000
```

#### 2. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend server runs on: [http://localhost:5000](http://localhost:5000)
API documentation available at: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

#### 3. Start the Frontend Server
```bash
cd frontend
npm install
npm start
```
The React development server runs on: [http://localhost:3000](http://localhost:3000)

---

### Option B: Running with Docker Compose

Ensure Docker and Docker Compose are installed on your machine.

#### 1. Configure Root Environment Variables
Create a `.env` file in the **project root** directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/photo-gallery
JWT_SECRET=yoursecretrandomstringhere
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### 2. Configure API Endpoint for Production
By default, the React frontend points to `http://localhost:5000` for local development. When deploying to a remote host, you **must** configure the API base URL at build time so the React bundle is compiled with the correct backend URL.

To do this, add `REACT_APP_API_URL` to your root `.env` file before building the containers:
```env
REACT_APP_API_URL=https://your-backend-domain.com
```
*(Note: This URL must be reachable from the browser client, not just within the internal Docker network, since React runs client-side in the user's browser).*

#### 3. Build and Run Stack
Run the startup command from the project root:

```bash
docker compose up --build
```

- **React Frontend (Nginx)** is available at: [http://localhost:3000](http://localhost:3000)
- **Express Backend API** is available at: [http://localhost:5000](http://localhost:5000)

#### 4. Stop Containers
```bash
docker compose down
```

---

## 🧪 Running Automated Tests

### Backend Tests
Runs Jest integration tests against an isolated, in-memory MongoDB environment:
```bash
cd backend
npm test
```

To generate a coverage report:
```bash
cd backend
npm test -- --coverage
```

### Frontend Tests
Runs React Testing Library component tests:
```bash
cd frontend
npm test
```
*(Tests run non-interactively in CI mode if environment variable `CI=true` is set)*

### End-to-End Browser Tests
Runs Playwright browser tests covering the full user flow (register → album → upload → share):
```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```
> **Note**: E2E tests require a pre-built frontend (`cd frontend && npm run build`) and will automatically start an in-memory backend + static frontend server.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive access + refresh tokens |
| POST | `/api/auth/refresh` | No | Refresh access token using refresh token cookie |
| POST | `/api/auth/logout` | Yes | Revoke current session |
| GET | `/api/auth/sessions` | Yes | List active sessions |
| DELETE | `/api/auth/sessions/:id` | Yes | Revoke a specific session |
| GET | `/api/images` | Yes | Get all images (with search/filter/sort) |
| POST | `/api/images` | Yes | Upload an image |
| DELETE | `/api/images/:id` | Yes | Soft-delete an image (move to trash) |
| POST | `/api/images/:id/restore` | Yes | Restore an image from trash |
| DELETE | `/api/images/:id/permanent` | Yes | Permanently delete an image |
| POST | `/api/images/:id/favorite` | Yes | Toggle favorite status |
| GET | `/api/images/trash` | Yes | Get trashed images |
| GET | `/api/albums` | Yes | Get all user albums + collaborated albums |
| POST | `/api/albums` | Yes | Create an album |
| DELETE | `/api/albums/:id` | Yes | Soft-delete an album |
| POST | `/api/albums/:id/restore` | Yes | Restore an album from trash |
| DELETE | `/api/albums/:id/permanent` | Yes | Permanently delete an album |
| GET | `/api/albums/:id/collaborators` | Yes | List album collaborators |
| POST | `/api/albums/:id/collaborators` | Yes | Add a collaborator |
| DELETE | `/api/albums/:id/collaborators/:userId` | Yes | Remove a collaborator |
| PATCH | `/api/albums/:id/collaborators/:userId` | Yes | Update collaborator role |
| GET | `/api/albums/:id/activity` | Yes | Get album activity feed |
| POST | `/api/share` | Yes | Create a share link |
| GET | `/api/share/:token` | No | Access shared resource |
| DELETE | `/api/share/:id` | Yes | Revoke a share link |
| GET | `/api/images/:imageId/comments` | Yes | Get comments on an image |
| POST | `/api/images/:imageId/comments` | Yes | Add a comment |
| DELETE | `/api/comments/:id` | Yes | Delete a comment |
| GET | `/api/analytics/storage` | Yes | Get storage analytics |
| GET | `/api/analytics/activity` | Yes | Get activity analytics |
| GET | `/health` | No | Liveness check |
| GET | `/health/ready` | No | Readiness check (verifies DB) |
| GET | `/api-docs` | No | Swagger UI documentation |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
