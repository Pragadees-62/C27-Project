# Student Management System

A Production-ready Full Stack Application using Node.js, Express, MongoDB (Mongoose), and Docker.

## Project Structure
- `frontend/`: Contains HTML, CSS, JS and a `Dockerfile` using Nginx to serve static files.
- `backend/`: Node.js/Express backend connecting to MongoDB.
- `docker-compose.yml`: Local multi-container Docker configuration.
- `Jenkinsfile`: CI/CD pipeline definitions.

## Requirements
- Docker and Docker Compose
- Node.js (for local non-docker testing)

## Quick Start (Dockerized)

1. **Build and Run Containers:**
   Run from the project root:
   ```bash
   docker-compose up --build -d
   ```
2. **Access the Application:**
   The frontend is available at [http://localhost](http://localhost).
   The backend API is bound to `http://localhost:3000/api`.

3. **Seed Database (Initial Data):**
   To seed sample data:
   ```bash
   docker exec -it backend npm run seed
   ```
   **Default Users:**
   - Teacher: `smith` (Mr. Smith, CSE)
   - Student: `alice` (Alice, CSE)

## Local Setup (Without Docker)

1. Update `MONGO_URI` in `backend/config/db.js` or create a `.env` in `backend/` with:
   ```env
   MONGO_URI=mongodb://localhost:27017/sms
   PORT=3000
   ```
2. Run backend:
   ```bash
   cd backend
   npm install
   npm run seed
   npm start
   ```
3. Run frontend:
   You need a reverse proxy or just access the HTML directly (note: direct file access will break `/api` standard routing if the fetch queries relative `/api/` paths without domain).

## Jenkins Deployment
- Create a new Pipeline in Jenkins.
- Point to this repository or use `Pipeline script from SCM`.
- The pipeline will automatically install backend dependencies and run `docker-compose up -d`.
