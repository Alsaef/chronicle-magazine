# Chronicle — Modern Biography & Profile Magazine

An editorial biography & profile magazine web application inspired by *The Verge*, *Time*, and *Medium*. Built with **Next.js (App Router, Pure JavaScript)**, **Tailwind CSS**, **DaisyUI**, **Node.js/Express.js (Pure JavaScript)**, and the **Native MongoDB Driver (`mongodb` npm package — strictly no Mongoose)**.

---

## 🌟 Key Features

### 1. Reader & User Experience
- **Editorial Masthead & Hero Showcase**: High-impact "Person of the Week" banner with cover portraits, pull quotes, and direct call-to-actions.
- **Categorized Exploration**: Instant filtering across *Tech Leaders*, *World Leaders*, *Pioneers*, *Athletes & Sports*, and *Innovators*.
- **Trending Personalities**: Ranked leaderboard of the most-viewed profiles.
- **Dynamic Story Details Page (`/story/:slug` or `/story/:id`)**:
  - High-impact typography with drop-cap styling.
  - Life timeline rendered with DaisyUI vertical `timeline` component.
  - Automatic view counter increment upon page visit (`$inc: { views: 1 }`).
  - Interactive Like button with instantaneous UI feedback & like count.
  - Social Share suite (X/Twitter, LinkedIn, Facebook, and Copy Link with toast alerts).
  - Reader Dialogue / Comments section with live optimistic updates.
- **Theme Switcher**: Dark/Light mode toggle powered by DaisyUI themes (`luxury` and `corporate`).

### 2. Protected Admin Console (`/admin/dashboard`)
- **JWT & Bcrypt Security**: Secure login at `/admin/login` using JSON Web Tokens and salted bcrypt password hashing.
- **Dashboard Overview**: Real-time KPI stats (Total Biographies, Total Views, Total Likes, Total Comments).
- **CRUD Operations**:
  - Create, edit, and delete biographies.
  - Dynamic milestone row editor (Year + Event).
  - Toggle featured status for homepage hero showcase.
- **Comment Moderation**: Review and delete abusive or spam comments across all profiles.
- **One-Click Re-seeding**: Easily reset the database with rich sample data at any time.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router, pure JavaScript), React 18, Tailwind CSS, DaisyUI 4, Lucide Icons.
- **Backend**: Node.js, Express.js 4 (pure JavaScript), consolidated in a single `backend/index.js` file.
- **Database**: Native MongoDB Driver (`mongodb` npm package, version 6).
- **Authentication**: `jsonwebtoken` (JWT) and `bcryptjs`.

---

## 📁 Repository Structure

```
my-ps-blog/
├── backend/
│   ├── .env.example        # Sample environment variables
│   ├── .env                # Active configuration
│   ├── package.json        # Backend dependencies & scripts
│   └── index.js            # Consolidated Express server & Native MongoDB logic
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/page.js  # Admin management console & stats
│   │   │   └── login/page.js      # Admin authentication portal
│   │   ├── story/[id]/page.js     # Dynamic biography profile page
│   │   ├── globals.css            # Editorial typography & Tailwind directives
│   │   ├── layout.js              # Theme provider & root layout
│   │   └── page.js                # Magazine homepage
│   ├── components/
│   │   ├── Navbar.js              # Editorial navbar with search & theme toggle
│   │   ├── Footer.js              # Newsletter & curated links
│   │   └── StoryCard.js           # Biography preview card with like & view metrics
│   ├── context/
│   │   ├── ThemeContext.js        # DaisyUI dark/light theme state
│   │   └── ToastContext.js        # DaisyUI interactive alert notifications
│   ├── lib/
│   │   └── api.js                 # Unified client-side API service
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Tailwind & DaisyUI theme settings
│   └── package.json               # Frontend dependencies & scripts
├── package.json                   # Root workspace scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or v20+) and npm
- MongoDB (running locally, via Docker, or MongoDB Atlas URI)

---

### Step 1: Start MongoDB (Docker or Local)

To start MongoDB locally in Docker:
```bash
docker compose up -d
```
*Alternatively, you can provide an external MongoDB Atlas connection string in `backend/.env`.*

---

### Step 2: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The Express API will run on `http://localhost:5000`. On first run, it automatically connects to MongoDB and seeds:
- 6 rich biography profiles (Steve Jobs, Marie Curie, Nelson Mandela, Muhammad Ali, Ada Lovelace, Leonardo da Vinci).
- Initial reader comments.
- Default administrator account:
  - **Username**: `admin`
  - **Password**: `admin123`

---

### Step 3: Start the Frontend Application

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at:
- **Magazine Homepage**: [http://localhost:3000](http://localhost:3000)
- **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin Dashboard**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

---

## 📡 REST API Reference

All backend endpoints are consolidated in `backend/index.js`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check & database connection status |
| `GET` | `/api/stories` | Public | Browse profiles with `?category=`, `?sort=`, `?search=`, `?featured=` |
| `GET` | `/api/stories/:id` | Public | Fetch story by ID or slug & increment view count |
| `POST` | `/api/stories/:id/like` | Public | Increment story like counter |
| `GET` | `/api/stories/:id/comments` | Public | Fetch comments for a story |
| `POST` | `/api/stories/:id/comments` | Public | Post reader comment |
| `POST` | `/api/admin/login` | Public | Authenticate admin, returns JWT token |
| `GET` | `/api/admin/stats` | Protected | Dashboard statistics (stories, views, likes, comments) |
| `GET` | `/api/admin/stories` | Protected | Fetch all stories for management table |
| `POST` | `/api/stories` | Protected | Create a new biography profile |
| `PUT` | `/api/stories/:id` | Protected | Update an existing biography |
| `DELETE` | `/api/stories/:id` | Protected | Delete a biography and its associated comments |
| `GET` | `/api/admin/comments` | Protected | Fetch all comments across all stories |
| `DELETE` | `/api/comments/:id` | Protected | Delete a comment (moderation) |
| `POST` | `/api/seed` | Public | Reset and re-seed database with default profiles |

