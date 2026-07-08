# Cloud Photo Gallery Stack

A containerized MERN application providing a cloud photo gallery dashboard persisted in MongoDB and utilizing Cloudinary image optimization APIs.

## Running with Docker

To spin up the entire application stack locally using Docker Compose, follow the instructions below:

### 1. Configure Local Environment Variables
Create a `.env` file in the root folder of the project. Specify the following key-value pairs (replace placeholders with your real values):

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/photo-gallery
JWT_SECRET=yoursecretrandomstringhere
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Build and Launch Containers
Run the build and start command from the project root:

```bash
docker compose up --build
```

- The **React Frontend** will boot and map to: [http://localhost:3000](http://localhost:3000)
- The **Express Backend** will listen and map to: [http://localhost:5000](http://localhost:5000)

### 3. Stop running services
```bash
docker compose down
```
