# Outstation Trip Advance Expense Settlement System
### Company: Manivtha Tours & Travels

A professional, full-stack web application that digitizes and centralizes the complete cash advance payment and travel expense settlement lifecycle for outstation trips. Built for **Manivtha Tours & Travels** as an internship final project demonstration.

---

## 🚀 Key Features

### 🔑 Authentication & Access Control
- Secure credentials-based Login with JSON Web Tokens (JWT).
- Role-Based Access Control (RBAC) separating **Admin** and **Driver** profiles.
- Password Reset options.

### 🛡️ Admin Dashboard & Controls
- **Interactive Dashboard**: High-level counts for total drivers, active/completed trips, pending settlements, and total verified travel expenses.
- **Visual Analytics**: Dynamic graphs displaying monthly expense trends (Advances vs. Expenses) and expense category distributions.
- **Roster CRUD**: Full management of drivers (Add, Edit, Delete, View profiles).
- **Trip Dispatcher**: Assign drivers to destinations, select vehicle numbers, configure tour dates, and record cash advance disbursements.
- **Claims Verification**: Review receipt uploads side-by-side with expense category details; Approve or Reject individual claims.
- **Settlement Ledger**: Reconcile outstanding balances. Displays net **Payable** (Company owes driver) or **Recoverable** (Driver returns cash) calculations. Audit claims with custom remarks.
- **Report Center**: Search, filter, and export **Driver Expense Reports**, **Trip Settlement Ledgers**, and **Monthly Expense Sheets** to Excel (CSV) or print clean PDFs.
- **Audit Logs**: Immutable system activity trail for administrative debugging and verification.

### 🚐 Driver Portal
- **Dashboard overview**: Monitor assigned tour itineraries, active advances, logged expenses, and settlement request statuses.
- **Ongoing Tour Console**: Activate trips (Start Trip), log expenditures on the fly (Fuel, Tolls, Food, Parking, Lodging, Misc.), view instant receipt image previews, and submit Settlement Requests.
- **History log**: Browse historical trips, reconciled ledger balances, and admin review remarks.

### 🔔 Real-Time Notifications
- In-app notification drawer alerting drivers about new trip dispatches, approved/rejected bills, and settled balances.
- Alerts admins immediately when drivers submit settlements or start tours.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS v4, React Router DOM, Recharts (visual analytics), Lucide React (icons)
- **Backend**: Node.js, Express.js
- **Database ORM**: Sequelize (supporting SQLite & MySQL)
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer, Cloudinary (with automatic local filesystem fallback)

---

## 💻 Quick Start (Local Setup)

Follow these steps to run the application locally on your Windows environment.

### Prerequisites
Make sure you have **Node.js** (v18+) and **npm** installed.

### 1. Install Dependencies
Run the installation script from the root workspace directory to install dependencies for the root, frontend, and backend packages:
```bash
npm run install-all
```

### 2. Seed Sample Database
Initialize and seed the database with mock records (Admins, Drivers, Trips, and verified/pending Expenses) for immediate dashboard visualization:
```bash
npm run seed --prefix backend
```
*(This creates a local `database.sqlite` file in the backend directory. Zero database setup is needed to start).*

### 3. Start Development Servers
Run the concurrent dev command to spin up the Express API server (port 5000) and the Vite + React dev server (port 3000) simultaneously:
```bash
npm run dev
```

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Credentials for Demo

Use the following pre-seeded logins to test the user role workflows:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@manivtha.com` | `admin123` | Accesses Admin Dashboard, CRUD controls, Verification, & Reports |
| **Driver 1** | `ramesh@manivtha.com` | `driver123` | Has ongoing active trip to Mumbai; settled Goa trip |
| **Driver 2** | `suresh@manivtha.com` | `driver123` | Has completed Chennai trip; settlement pending |
| **Driver 3** | `vikram@manivtha.com` | `driver123` | Has upcoming pending trip to Hyderabad |

---

## 🗄️ Database Adaptability (SQLite 🔄 MySQL)

By default, the application runs on **SQLite** to make local evaluations seamless. To transition to **MySQL** for staging or production, simply modify the `backend/.env` file:

1. Change `DB_DIALECT` to `mysql`:
   ```env
   DB_DIALECT=mysql
   ```
2. Uncomment and configure the MySQL server credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=manivtha_travels
   DB_PORT=3306
   ```
3. Run the database seed script again to sync the schemas and seed table records:
   ```bash
   npm run seed --prefix backend
   ```
   The Sequelize ORM will automatically create the database tables (`Users`, `Drivers`, `Trips`, `Expenses`, `Settlements`, `Notifications`, `AuditLogs`) inside your MySQL server.

---

## 📸 File Upload & Cloudinary Setup

Receipt uploads are processed by **Multer** and saved locally under `backend/uploads/` by default. To hook up cloud storage in production, sign up for a free **Cloudinary** account and update the `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The server dynamically checks for these keys. When present, receipt images are automatically uploaded to Cloudinary, and the local temporary files are deleted. If the keys are missing or invalid, the server automatically falls back to local storage, keeping the app completely functional.
