# Node.js MongoDB Learning Backend

This is the backend for the Node.js MongoDB Learning app, built with Node.js and MongoDB.

## Features

- REST API for messages and file uploads
- WebSocket for real-time messaging
- JWT-based authentication

## Prerequisites

- Node.js 20.x
- MongoDB (local or MongoDB Atlas)

## Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd nodejs-mongodb-learning

   ```

2. Install dependencies:
   npm install

3. Set up environment variables in .env:
   PORT=3000
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-secret-key>

4. Run the app:
   npm run dev

5. API accessible at http://localhost:3000/

## Testing

1. Unit tests: npm test (using Mocha/Chai)
