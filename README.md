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

## 🏗️ Architecture Overview

The application follows a standard Client-Server architecture:

- **Frontend**: React.js with Vite, Tailwind CSS v4. Communicates with backend via REST API.
- **Backend**: Node.js + Express API server.
- **Database**: SQLite (default for development/demo) or Supabase (PostgreSQL) for production. Sequelize ORM handles data modeling.
- **Storage**: Local filesystem storage with built-in Cloudinary and Supabase fallback mechanisms for file uploads (receipts/avatars).
## 📁 Project Structure

The repository is organised as follows:

```
frontend/
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ context/
│  └─ utils/
├─ public/
├─ vite.config.js
└─ index.html
backend/
├─ routes/
├─ models/
├─ middleware/
│   ├─ auth.js
│   └─ upload.js
├─ config/
│   └─ database.js
├─ server.js
└─ seed.js
database.sqlite
package.json
README.md
```

- **frontend/** – React Vite front‑end.
  - `src/` – source code (components, pages, context, utils).
  - `public/` – static assets.
  - `vite.config.js` – Vite configuration.
- **backend/** – Express API server.
  - `routes/` – API route definitions.
  - `models/` – Sequelize models.
  - `middleware/` – authentication & upload handling.
  - `config/database.js` – DB connection setup.
  - `server.js` – entry point.
- **database.sqlite** – local SQLite database (sample data).
- **package.json** – workspace scripts (`install-all`, `dev`, `seed`, etc.).
- **README.md** – project documentation.

### Data Flow
1. Drivers log expenses (with receipt uploads) during active trips.
2. The trip is marked as "Completed" and a Settlement is requested.
3. Admins review expenses (approving/rejecting line items).
4. The system calculates the net settlement balance based on the trip's advance amount and approved expenses.
5. Admins approve the settlement, finalizing the ledger.

---

## 💻 Quick Start (Local Setup)

Follow these steps to run the application locally on your Windows/Linux/Mac environment.

### Prerequisites
- **Node.js** (v18+) and **npm**

### 1. Install Dependencies
Run the installation script from the root workspace directory to install dependencies for the root, frontend, and backend packages:
```bash
npm run install-all
```

### 2. Environment Variables
Copy the `.env.example` files to `.env` in both the `backend` and `frontend` directories:

In `backend/`:
```bash
cp .env.example .env
```
Ensure you set a strong `JWT_SECRET` in `backend/.env`.

In `frontend/`:
```bash
cp .env.example .env
```

### 3. Seed Sample Database
Initialize and seed the database with mock records (Admins, Drivers, Trips, and verified/pending Expenses) for immediate dashboard visualization:
```bash
npm run seed --prefix backend
```
*(This creates a local `database.sqlite` file in the backend directory. Zero database setup is needed to start).*

### 4. Start Development Servers
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

## 🚀 Deployment (Vercel)

To deploy this full-stack application on Vercel:

1. Push your repository to GitHub.
2. In the Vercel dashboard, import the project.
3. Configure the following build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Set your Environment Variables in Vercel settings (e.g., `VITE_API_URL` pointing to your hosted backend).
5. For the backend, you can either host it on a service like Render/Railway/Heroku or configure it as Vercel Serverless Functions. If hosting separately, ensure CORS is properly configured in the backend's `CORS_ORIGIN` env variable.
6. Deploy!

---

## 🗄️ Database Adaptability

By default, the application runs on **SQLite** to make local evaluations seamless. To transition to **MySQL** or **PostgreSQL** for staging or production, simply modify the `backend/.env` file:

```env
DB_DIALECT=postgres
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
Run the database seed script again to sync the schemas and seed table records.

---

## 📸 File Upload & Cloudinary Setup

Receipt uploads are processed by **Multer** and saved locally under `backend/uploads/` by default. To hook up cloud storage in production, sign up for a free **Cloudinary** account and update the `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The server dynamically checks for these keys. When present, receipt images are automatically uploaded to Cloudinary, and the local temporary files are deleted. If the keys are missing or invalid, the server automatically falls back to local storage, keeping the app completely functional.

---

## 📄 License
ISC License

## 👨‍💻 Author
Saggam Abhilash
