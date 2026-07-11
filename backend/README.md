# Nerve STPI Backend - Phase 1

This repository contains Phase 1 of the backend server built using Node.js, Express, and MySQL. It establishes a secure foundations structure and implements Admin authentication using JWT (JSON Web Tokens) and bcrypt password hashing.

---

## Technical Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MySQL
* **Driver:** `mysql2` (Promise-based connection pool)
* **Auth:** JSON Web Tokens (JWT) & `bcryptjs` for secure password hashing
* **Validation:** `express-validator`
* **Development utilities:** `dotenv`, `cors`, `cookie-parser`, `nodemon`

---

## Folder Structure

```
backend/
├── config/
│   └── db.js               # MySQL Connection Pool
├── controllers/
│   └── adminAuthController.js # Login logic & dashboard route tester
├── middleware/
│   └── authMiddleware.js   # JWT token protection middleware
├── routes/
│   └── adminAuthRoutes.js  # Validation logic and route maps
├── models/
│   └── adminModel.js       # Admin data query and DB interaction methods
├── utils/
│   ├── apiError.js         # Standard API Error Class
│   └── apiResponse.js      # Success & Error JSON formatting helper
├── .env                    # Local environment config (credentials)
├── .env.example            # Environment config template
├── package.json            # Scripts & dependencies definition
├── schema.sql              # MySQL database setup and seed admin user
└── server.js               # Express app entry and DB check on startup
```

---

## Setup & Running Instructions

Follow these steps to configure and run the backend locally:

### Step 1: Install Dependencies
Open your terminal inside the `backend/` directory and install the packages:
```bash
npm install
```

### Step 2: Database Initialization (Import SQL)
Import the database schema and default credentials:
1. Log into your MySQL CLI client or a GUI database manager (such as phpMyAdmin, DBeaver, MySQL Workbench, etc.).
2. Run/import the commands in `schema.sql`:
   ```sql
   -- Alternatively from terminal:
   mysql -u root -p < schema.sql
   ```
   This will:
   * Create a database called `nerve_admin`.
   * Create an `admins` table.
   * Seed a default Super Admin user.

**Default Credentials:**
* **Email:** `admin@nerve.com`
* **Password:** `Admin@123`

### Step 3: Configure Environment Variables
1. A file named `.env` has already been created in the `backend/` folder.
2. Edit the `.env` file to match your MySQL database username and password:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=nerve_admin
   JWT_SECRET=super_secret_nerve_admin_jwt_key_12345
   JWT_EXPIRE=24h
   ```

### Step 4: Run the Server
To start the application in development mode with auto-reload (using `nodemon`):
```bash
npm run dev
```
You should see:
```text
Verifying MySQL Database connection...
Successfully connected to MySQL database: nerve_admin
Server is running on port 5000
Test server URL: http://localhost:5000
```

---

## API Documentation (Endpoints)

### 1. Admin Login
* **URL:** `/api/admin/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body Parameters:**
  ```json
  {
    "email": "admin@nerve.com",
    "password": "Admin@123"
  }
  ```
* **Success Response (200 OK):**
  Sets an HTTP-only cookie named `token` and returns:
  ```json
  {
    "success": true,
    "message": "Admin logged in successfully",
    "data": {
      "token": "eyJhbGciOi...",
      "admin": {
        "id": 1,
        "name": "Super Admin",
        "email": "admin@nerve.com",
        "role": "superadmin"
      }
    }
  }
  ```
* **Failure Responses:**
  * **400 Bad Request (Validation):** If email is invalid or passwords are missing.
  * **401 Unauthorized:** If login credentials do not match.

### 2. Protected Test Dashboard Route
* **URL:** `/api/admin/dashboard`
* **Method:** `GET`
* **Headers:** 
  * Pass the JWT token inside cookies (via `token` cookie) OR in the header: `Authorization: Bearer <token_string_here>`
* **Success Response (200 OK):**
  ```text
  Welcome Admin
  ```
* **Failure Response (401 Unauthorized):**
  If token is invalid, expired, or missing.
  ```json
  {
    "success": false,
    "message": "Access denied. No token provided."
  }
  ```
