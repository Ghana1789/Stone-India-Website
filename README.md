# Stone India Multi-Role Portal

A comprehensive, full-stack multi-role web application for **Stone India Pvt. Ltd.** Designed for EV battery manufacturing operations, featuring secure client/employee/admin portals, real-time tracking, and production QC management.

## 🌟 Key Features

- **Multi-Role Authentication**: Secure login with automatic role detection and portal routing.
- **Client Portal**: Battery catalogue, order placement, real-time tracking, and warranty claim management.
- **Employee Portal**: Task tracking with checklists, batch production/QC logging, and leave requests.
- **Admin Dashboard**: Operational analytics with Chart.js, user management, order lifecycle control, and inventory tracking.
- **Support System**: Real-time live chat with Socket.io for integrated client support.
- **Public Site**: Fully functional, SEO-optimized website with performance tracking.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Socket.io, Multer, Helmet.
- **Design**: Premium dark-mode UI with glassmorphism and custom animations.

## 📁 Repository Structure

- `client/`: React/Vite frontend application.
- `server/`: Node.js/Express backend API.
- `seed.js`: Database initialization script for seeding demo data.

## 🚀 Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.14.0 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a cloud URI)

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/stone_india
JWT_SECRET=your_secret_key
# Other configuration for Email, Cloudinary, etc.
```

### 3. Installation
Install dependencies for both client and server:
```bash
# From the root directory
cd server && npm install
cd ../client && npm install
```

### 4. Seed Experimental Data
Populate the database with test users and battery products:
```bash
cd server && node seed.js
```

### 5. Start the Development Servers
```bash
# Backend (Server)
cd server && npm run dev

# Frontend (Client)
cd client && npm run dev
```

## 🔐 Demo Credentials (after seeding)
- **Admin**: `admin@stoneindia.com` / `Admin@123`
- **Client**: `client@stoneindia.com` / `Client@123`
- **Employee**: `employee@stoneindia.com` / `Employee@123`

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contact
- **Website**: [Stone India Pvt. Ltd.](https://stoneindia.com)
- **Email**: stonelithiumbatteries@gmail.com
- **Address**: NEAR RAVIRYAL ROAD, SHAMSHABAD, HYDERABAD 501818
"# stone-india" 
"# Stone-India" 
"# Stone-India" 
"# Stone-India-Website" 
