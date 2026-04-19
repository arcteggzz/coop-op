# Project Description

## 1. Project Structure

This project contains both a Frontend (FE) and a Backend (BE).
The repository must follow this folder structure:
/client → React frontend
/server → Express backend

The frontend will be built using React.
The backend will be built using Node.js with Express.
The backend will expose REST APIs that the frontend will consume.
The frontend communicates with the backend through HTTP API calls over the internet.

## 2. Frontend Development Process

The UI design and layout are not being built in this repository.
Instead:

- A UI designer will provide a complete React UI project.
- The UI project will contain pages and components but no backend connectivity.

The workflow will be:

- The designer shares the React code.
- The React code is copied into the /client folder.
- The UI will already contain layouts, forms, and components.
- The only work required is to connect the UI to the backend APIs.

Important rules:

- Do not modify UI structure unless necessary
- Focus only on API integration and state management
- All API calls must connect to the backend in /server.This connection will be done over the internet. After the Backend is complete and hosted, the FE can then talk with the backend via ngrok or any backend hosted platform.

## 3. Backend Responsibilities

The backend will be responsible for:
Authentication
Database access
Business logic
Wallet operations
Invoice generation
Student and parent management
Transaction history

The backend exposes REST APIs that the frontend consumes.

Example API pattern:

POST /api/admin/login
GET /api/admin/dashboard

POST /api/manager/login
GET /api/manager/dashboard

POST /api/member/login
GET /api/member/dashboard

All sensitive operations must happen in the backend only.

## 4. API Communication Rules

The frontend must communicate with the backend via HTTP requests.
Rules:
Use JSON request bodies

All responses must be JSON

Follow REST conventions

Example response format:

{
"success": true,
"message": "Student created successfully",
"data": {}
}

Error example:

{
"success": false,
"message": "Invalid credentials"
}
