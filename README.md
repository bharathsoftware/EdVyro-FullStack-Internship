# 🚀 Launchpad — EdVyro Full Stack Internship Project

> **Dual Task Internship Submission: Task 2 (Responsive Internship Board) & Task 3 (REST API & Persistent Data)**  
> Developed with vanilla semantic web standards (HTML5/CSS3/JavaScript) and a Node.js + Express + SQLite backend. Zero heavy frontend frameworks. Fully accessible (WCAG 2.1 AA) and mobile responsive down to 360px.

---

## 📌 Submission Overview for Evaluators

This single repository fulfills both tasks of the EdVyro Full Stack Internship curriculum:

| Component | Task Specification | Implementation Summary | Primary Review Files |
| :--- | :--- | :--- | :--- |
| **Task 2** | [Responsive Internship Board Guide](https://edvyro.in/datasets/task-kits/full-stack-development-task-1.html) | Vanilla HTML5/CSS3/ES6+ UI, safe DOM manipulation, multi-criteria filtering, accessible details dialog, responsive 360px design. | [`index.html`](./index.html), [`styles.css`](./styles.css), [`script.js`](./script.js), [`data/internships.json`](./data/internships.json) |
| **Task 3** | [REST API & Persistent Data Guide](https://edvyro.in/datasets/task-kits/full-stack-development-task-2.html) | Express REST API, SQLite database, CRUD endpoints, pagination, input validation, duplicate prevention, automated tests. | [`server/server.js`](./server/server.js), [`server/database.js`](./server/database.js), [`server/routes/`](./server/routes/), [`tests/api.test.js`](./tests/api.test.js) |

### 🔗 Evaluator Submission Links
When submitting on the EdVyro portal, provide your public GitHub repository link (and live deployment URL if hosted):
- **Task 2 Submission Link:** `https://github.com/<your-username>/EdVyro-FullStack-Internship` (or your GitHub Pages / Live Demo URL)
- **Task 3 Submission Link:** `https://github.com/<your-username>/EdVyro-FullStack-Internship` (or your Render / Railway API URL)

---

## 🛠️ Technology Stack

- **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Properties, Grid & Flexbox, Glassmorphism, Micro-interactions), Vanilla JavaScript (ES6+ Modules, Safe DOM Methods).
- **Backend:** Node.js (v18+ / v22+ / v24+), Express.js (v4), CORS, dotenv.
- **Database:** SQLite (persisted to `./data/launchpad.db` via native `node:sqlite` or `better-sqlite3`).
- **Testing:** Node.js built-in native test runner (`node:test`) and strict assertions (`node:assert/strict`).
- **Design & A11y:** WCAG 2.1 AA compliant color contrast, ARIA landmarks, keyboard focus trapping, `prefers-reduced-motion` support.

---

## 📂 Repository Structure

```text
EdVyro-FullStack-Internship/
├── index.html                 # Frontend homepage & semantic UI structure
├── styles.css                 # Vanilla CSS design system, responsive styles, dark mode
├── script.js                  # Frontend client logic, dual-mode fetch, safe DOM rendering
├── package.json               # Root scripts (start, seed, test, dev)
├── .env.example               # Environment variable blueprint
├── .gitignore                 # Excludes node_modules, local SQLite databases, .env
├── data/
│   ├── internships.json       # Official EdVyro JSON seed data (INT-101 to INT-105, INT-001 to INT-004)
│   └── launchpad.db           # SQLite database file (created automatically on first run)
├── server/
│   ├── package.json           # Server configuration & dependencies
│   ├── server.js              # Express application entry point & static server
│   ├── database.js            # SQLite connection with native node:sqlite fallback
│   ├── validation.js          # Input validation, email checks, safe URL protocol filtering
│   ├── schema.sql             # SQL table definitions, constraints, and performance indexes
│   ├── seed.js                # Database seed script reading data/internships.json
│   └── routes/
│       ├── internships.js     # CRUD, pagination, filtering, search, and sorting endpoints
│       └── applications.js    # Application submission, duplicate prevention, audit endpoint
├── tests/
│   └── api.test.js            # Automated integration & unit test suite (19 test cases)
├── docs/
│   ├── api-requests.http      # Interactive VS Code REST Client requests
│   └── api-collection.json    # Postman & Thunder Client collection export
└── screenshots/
    ├── README.md              # Screenshot capture guidelines
    ├── desktop-view.png       # Desktop view (1200px+)
    ├── mobile-360px-view.png  # Mobile view (360px)
    ├── filtered-view.png      # Filtered / search state
    └── modal-detail-view.png  # Accessible internship details modal
```

---

## ⚡ Prerequisites

- **Node.js:** v18.0.0 or newer (Node.js 22+ / 24+ recommended with native `node:sqlite`).
- **npm:** v9.0.0 or newer.
- **Operating System:** Windows 10/11, macOS, or Linux.

Check your versions on Windows:
```powershell
node -v
npm -v
```

---

## 🚀 Quick Start Guide (Windows)

### Step 1: Install Dependencies
From the repository root folder in PowerShell or Command Prompt:
```powershell
npm install
```

### Step 2: Configure Environment (Optional)
A default `.env.example` file is included. Create your local `.env` if you wish to customize port or database location:
```powershell
Copy-Item .env.example .env
```
Default settings:
```ini
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/launchpad.db
CORS_ORIGIN=*
```

### Step 3: Seed the Database
Seed the official EdVyro internship records into SQLite:
```powershell
npm run seed
```
*(Note: If you skip this, the server will automatically detect an empty database on first launch and auto-seed it for you!)*

### Step 4: Start the Application
```powershell
npm start
```
Once running, open your browser and navigate to:
- **Web Application UI:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Internships API:** [http://localhost:5000/api/internships](http://localhost:5000/api/internships)

---

## 🔄 Dual-Mode Frontend Operation

The frontend features automatic mode detection:
1. **Live API Mode (Default):** The client checks `GET /api/health`. If responsive, it fetches from the Express REST API with full pagination, search, and SQLite persistence.
2. **Local Demo Mode (Offline Fallback):** If the backend server is stopped or unreachable, the frontend automatically falls back to `./data/internships.json` without breaking or throwing runtime errors.
3. **Manual Toggle:** Click the **"Toggle Mode"** button in the top navigation bar at any time to test both modes interactively.

---

## 🧪 Automated Testing

The project includes an integration and unit test suite in [`tests/api.test.js`](./tests/api.test.js) executed via Node's native test runner against an isolated SQLite test database.

### Running the Tests
```powershell
npm test
```

### Actual Test Execution Output
```text
> edvyro-fullstack-internship@1.0.0 test
> node --test tests/api.test.js

--- Initializing EdVyro Database Seed ---
Successfully seeded 9 internship records.
▶ 1. Health Check Endpoint
  ✔ GET /api/health returns 200 OK with healthy status envelope (97ms)
✔ 1. Health Check Endpoint (98ms)
▶ 2. Internship Listings & Pagination
  ✔ GET /api/internships returns paginated list with total count (13ms)
  ✔ GET /api/internships preserves official seed fields and array of skills (16ms)
✔ 2. Internship Listings & Pagination (29ms)
▶ 3. Search and Filtering
  ✔ Filter by domain returns only matching records (9ms)
  ✔ Filter by mode returns only matching work mode (7ms)
  ✔ Search query matches title or skills (7ms)
✔ 3. Search and Filtering (24ms)
▶ 4. Single Internship Detail
  ✔ GET /api/internships/:id returns existing record (7ms)
  ✔ GET /api/internships/:id returns 404 for nonexistent ID (5ms)
✔ 4. Single Internship Detail (12ms)
▶ 5. Internship CRUD Operations
  ✔ POST /api/internships creates a new listing (44ms)
  ✔ PUT /api/internships/:id updates the existing listing (7ms)
  ✔ DELETE /api/internships/:id removes the listing (7ms)
✔ 5. Internship CRUD Operations (59ms)
▶ 6. Validation & Error Handling
  ✔ POST /api/internships rejects missing required fields with 400 (4ms)
  ✔ POST /api/internships rejects invalid work mode with 400 (4ms)
  ✔ POST /api/applications rejects invalid email address (4ms)
  ✔ POST /api/applications rejects unsafe URL scheme (javascript:) (3ms)
✔ 6. Validation & Error Handling (15ms)
▶ 7. Applications & Duplicate Protection
  ✔ POST /api/applications succeeds on valid submission (6ms)
  ✔ POST /api/applications rejects duplicate application with 409 Conflict (12ms)
  ✔ POST /api/applications rejects application when applications are closed (6ms)
✔ 7. Applications & Duplicate Protection (24ms)
▶ 8. Database Persistence Across Application Re-connection
  ✔ Data persists in SQLite file after resetting connection (2ms)
✔ 8. Database Persistence Across Application Re-connection (2ms)

ℹ tests 19
ℹ suites 8
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 693.218
```

---

## 📡 REST API Documentation

### Uniform Response Envelopes

#### Success Envelope
```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 9,
    "totalPages": 1
  }
}
```

#### Error Envelope
```json
{
  "status": "error",
  "message": "Clear explanation of the error",
  "errors": ["Optional array of specific field errors"]
}
```

---

### Endpoints Reference

#### 1. System Health Check
- **Route:** `GET /api/health`
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "status": "success",
    "data": {
      "service": "EdVyro Launchpad API",
      "status": "healthy",
      "uptime": 24.5,
      "timestamp": "2026-10-12T06:00:00.000Z",
      "database": "SQLite persistent",
      "version": "1.0.0"
    }
  }
  ```

#### 2. List Internships
- **Route:** `GET /api/internships`
- **Query Parameters:**
  - `page` *(optional, integer, default 1)*
  - `limit` *(optional, integer, default 10, max 50)*
  - `search` or `q` *(optional, string, searches title, domain, location, skills)*
  - `domain` *(optional, string, e.g. `Full Stack Development`)*
  - `mode` *(optional, `Remote` | `Hybrid` | `On-site`)*
  - `sort` *(optional, `newest` | `title_asc` | `duration_desc`)*
- **Status:** `200 OK`

#### 3. Get Internship by ID
- **Route:** `GET /api/internships/:id`
- **Status:** `200 OK` or `404 Not Found`
- **Response:**
  ```json
  {
    "status": "success",
    "data": {
      "id": "INT-101",
      "title": "Frontend Intern",
      "domain": "Full Stack Development",
      "mode": "Remote",
      "location": "India",
      "duration_weeks": 8,
      "openings": 3,
      "skills": ["HTML", "CSS", "JavaScript"],
      "description": "Join our frontend engineering team to build responsive web apps.",
      "applications_open": true
    }
  }
  ```

#### 4. Create Internship
- **Route:** `POST /api/internships`
- **Status:** `201 Created` or `400 Bad Request`
- **Request Body:**
  ```json
  {
    "title": "Cloud DevOps Intern",
    "domain": "Cloud Computing",
    "mode": "Remote",
    "location": "India",
    "duration_weeks": 10,
    "openings": 2,
    "skills": ["Docker", "Kubernetes", "Linux"],
    "description": "Implement automated deployment pipelines."
  }
  ```

#### 5. Update Internship
- **Route:** `PUT /api/internships/:id`
- **Status:** `200 OK` or `404 Not Found`
- **Request Body:**
  ```json
  {
    "title": "Senior Cloud DevOps Intern",
    "openings": 4
  }
  ```

#### 6. Delete Internship
- **Route:** `DELETE /api/internships/:id`
- **Status:** `200 OK` or `404 Not Found`
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Internship 'INT-301' deleted successfully."
  }
  ```

#### 7. Submit Application
- **Route:** `POST /api/applications`
- **Status:** `201 Created`, `400 Bad Request`, or `409 Conflict` (Duplicate prevention)
- **Request Body:**
  ```json
  {
    "internship_id": "INT-101",
    "applicant_name": "Jordan Smith",
    "applicant_email": "jordan.smith@example.com",
    "portfolio_url": "https://github.com/jordansmith",
    "notes": "Excited to contribute to frontend accessibility."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Application submitted successfully.",
    "data": {
      "id": 1,
      "internship_id": "INT-101",
      "internship_title": "Frontend Intern",
      "applicant_name": "Jordan Smith",
      "masked_email": "j***h@example.com",
      "submitted_at": "2026-10-12T06:05:00.000Z"
    }
  }
  ```

#### 8. Audit Applications
- **Route:** `GET /api/applications`
- **Status:** `200 OK`
- *(Returns applicant names and masked emails to protect personal privacy).*

---

## 🔒 Security & Data Integrity Measures

1. **SQL Injection Defense:** 100% of database queries use parameterized SQL prepared statements.
2. **Protocol Safety:** `portfolio_url` values are strictly parsed; only `http://` and `https://` schemes are allowed, rejecting `javascript:` or `data:` payloads.
3. **Duplicate Prevention:** A SQLite table constraint `UNIQUE (internship_id, applicant_email)` guarantees applicants cannot submit multiple entries for the same role.
4. **Safe Error Masking:** Stack traces and internal SQLite errors are caught server-side; clients receive clean error messages.
5. **PII Masking:** Email addresses in application audit logs are masked (e.g. `j***h@example.com`).

---

## ♿ Accessibility & Responsiveness (WCAG 2.1 AA)

- **Keyboard Navigation:** Full tab order throughout the board, search form, and dialog.
- **Accessible Dialog:** Native HTML5 `<dialog>` with `aria-labelledby`, focus trapping, Escape key listener, and focus restoration to trigger button on close.
- **Color Contrast:** Foreground text and interactive elements exceed the WCAG AA minimum contrast ratio of 4.5:1 against dark backgrounds.
- **Form Controls:** Every input and select element has an explicit `<label for="...">`.
- **Reduced Motion:** Fully honors user OS preferences via `@media (prefers-reduced-motion: reduce)`.
- **Strict 360px Mobile Compatibility:** Tested down to 360px viewport width with zero horizontal overflow (`overflow-x: hidden`).

---

## 📸 Screenshots & Evidence

Place your captured application screenshots inside the [`screenshots/`](./screenshots/) folder:

| View | Screenshot File | Description |
| :--- | :--- | :--- |
| **Desktop View** | `screenshots/desktop-view.png` | Desktop browser view showing hero banner, search bar, and grid of internship cards. |
| **Mobile 360px** | `screenshots/mobile-360px-view.png` | Responsive mobile layout at 360px width showing single-column cards with no horizontal scroll. |
| **Filtered View** | `screenshots/filtered-view.png` | Board view after applying search or domain filters (e.g. "Full Stack Development"). |
| **Details Modal** | `screenshots/modal-detail-view.png` | Accessible internship details dialog open with role specs and sample application form. |

### How to Capture Screenshots on Windows:
1. Start the server with `npm start` and visit `http://localhost:5000`.
2. Press `Win + Shift + S` or open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl + Shift + M`), set width to `360px`, and capture.
3. Save the images to `screenshots/` using the filenames above.

---

## 🚢 Public GitHub Publishing Instructions

Follow these steps to publish your project to GitHub:

```powershell
# 1. Initialize git in the workspace (if not already initialized)
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "feat: complete EdVyro Full Stack internship Tasks 2 and 3"

# 4. Create a new public repository on GitHub named 'EdVyro-FullStack-Internship'
# 5. Link and push to your remote repository:
git branch -M main
git remote add origin https://github.com/<your-username>/EdVyro-FullStack-Internship.git
git push -u origin main
```

---

## 🌐 Free Cloud Deployment Instructions

### Option 1: Render.com (Recommended — Runs Both Frontend & API)
1. Sign up for a free account at [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `EdVyro-FullStack-Internship`.
4. Configure service settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**. Render will assign a public URL (e.g. `https://edvyro-internship.onrender.com`).
   *Because Express serves both static frontend files and the `/api` routes on the same port, the entire full-stack app works instantly!*

### Option 2: Frontend on GitHub Pages (Local Demo Mode)
1. Go to repository **Settings** -> **Pages**.
2. Select **Branch: main** and folder **/ (root)**.
3. Save. GitHub Pages will serve `index.html`. It will run in **Local Demo Mode** loading `data/internships.json` automatically!

---

## ❓ Troubleshooting & FAQs

- **Port 5000 already in use?**  
  Change the port in `.env` (e.g., `PORT=5001`) or run `$env:PORT=5001; npm start`.
- **Database reset needed?**  
  Delete `data/launchpad.db` and run `npm run seed` to regenerate fresh tables and seed data.
- **Does SQLite persist across restarts?**  
  Yes! The database file is stored locally on disk at `data/launchpad.db`. On ephemeral serverless cloud hosts, note that local SQLite files reset on redeploy unless mounted to a persistent disk volume.

---

## 📄 License & Disclaimer

This project is created strictly for the **EdVyro Full Stack Development Internship Assessment**. All listed companies and positions are fictional sample records for technical evaluation only.
