# 🏫 School Management System

A full-featured MERN Stack School Management System designed for small private schools and tuition classes.

## Features

- **🔐 Authentication** — JWT-based admin/staff login with role-based access
- **🏫 School Setup** — Configure school name, logo, address, academic year
- **👨‍🎓 Admissions** — Student registration with photo, auto-generated admission numbers
- **💰 Fee Structure** — Define fee heads per grade (Tuition, Exam, Transport, etc.)
- **💸 Fee Collection** — Set committed/negotiated fees, record partial payments
- **🧾 Receipt Generation** — Printable receipts with school branding
- **📊 Pending Fees** — Track outstanding dues, filter by grade
- **🎓 Year-End Promotion** — Bulk promote students with fee-pending warnings
- **📜 Transfer Certificate** — Issue TCs, auto-deactivate students

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Styling | Custom CSS (Glassmorphism dark theme) |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h
```

### 3. Seed Default Admin

```bash
cd server
npm run seed
```

This creates:
- **Email:** admin@school.com
- **Password:** admin123

### 4. Run the Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

| Module | Method | Endpoint | Access |
|--------|--------|----------|--------|
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/register` | Admin |
| School | GET/PUT | `/api/school` | Auth/Admin |
| Students | GET/POST/PUT | `/api/students` | Auth |
| Fee Structure | GET/POST/PUT/DELETE | `/api/fees/structure` | Auth/Admin |
| Fee Collection | GET/POST | `/api/fees/collection` | Auth |
| Pending Fees | GET | `/api/fees/pending` | Auth |
| Promotion | GET/POST | `/api/promotion` | Admin |
| TC | GET/POST | `/api/tc` | Auth/Admin |

## Project Structure

```
school-management-system/
├── server/           # Express.js Backend
│   ├── config/       # DB connection & environment config
│   ├── controllers/  # Request handlers
│   ├── middleware/    # Auth, roles, uploads, errors
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API route definitions
│   ├── utils/        # Helper functions
│   └── server.js     # Entry point
│
├── client/           # React (Vite) Frontend
│   ├── src/
│   │   ├── api/          # Axios config
│   │   ├── components/   # Layout & reusable components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # All page components
│   │   └── styles/       # Design system CSS
│   └── vite.config.js
│
└── README.md
```

## License

MIT
