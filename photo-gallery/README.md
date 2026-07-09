# Cloud Photo Gallery (MERN Stack)

A containerized MERN application providing an interactive cloud photo gallery dashboard, persisted in MongoDB, utilizing Cloudinary image optimization APIs, and protected by JWT authentication.

---

## 🛠️ Technology Stack

### Backend
- **Node.js & Express**: Secure API router endpoints.
- **Mongoose & MongoDB**: Document schema modeling and Atlas persistent storage.
- **JWT (JsonWebTokens)**: Token-based state-free user authentication.
- **Bcrypt.js**: Salting and hashing passwords (10 salt rounds).
- **Helmet**: Securing HTTP headers.
- **Express Rate Limit**: Anti-brute force request limits (100 reqs/15m globally, 10 reqs/15m on auth).
- **Express Validator**: Server-side request payload schema validation.
- **Compression**: Gzip compression middleware to reduce network latency.

### Frontend
- **React.js**: Modern view library with custom React Hooks (`useGallery`) for state management.
- **Tailwind CSS**: Sleek, glassmorphic UI design system.
- **React Dropzone**: Drag-and-drop multi-file selection.
- **Axios**: HTTP API client with auth interceptors.

### DevOps, Testing & CI/CD
- **Docker & Docker Compose**: Containerization configurations.
- **Nginx**: High-performance HTTP server serving React static assets.
- **Jest & Supertest**: Backend integration and unit testing with `mongodb-memory-server`.
- **React Testing Library**: Frontend view components validation.
- **GitHub Actions**: Automated CI testing pipeline on pushing to `main`.

---

## 🌟 Current Features

1. **User Authentication**: Secure user registration and login with encrypted passwords and JWT token access.
2. **Albums Board**: Categorize photos into albums. Includes a responsive albums board displaying image counts and cover photos, with a floating modal to create new albums.
3. **Tags & Search**: Commas-separated tag strings are parsed on upload. Includes navbar-based queries filtering by titles or tag lists.
4. **Optimistic Favorites**: Toggle heart icons on images with instant optimistic UI changes that automatically roll back on network failure.
5. **Drag-and-Drop Concurrent Uploads**: Upload multiple files simultaneously with individual parallel progress indicators.
6. **Direct Cloud Downloads**: Download full-resolution original assets with one click via temporary anchor triggers.
7. **Cloudinary CDN Transformations**: Grid cards load optimized thumbnails (`w_400,q_auto,f_auto`) for fast load times, saving network bandwidth.
8. **Centralized Error Handling**: Standardized async controller wrapper `wrapAsync` routing errors to a central error handling middleware.

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

### Frontend Tests
Runs React Testing Library component tests:
```bash
cd frontend
npm test
```
*(Tests run non-interactively in CI mode if environment variable `CI=true` is set)*
