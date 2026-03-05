# নবারুণ অ্যালামনাই — SASIMS

![নবারুণ লোগো](public/logo.png)

### Student Alumni & Staff Information Management System

_A full-stack web application for managing alumni, staff, and student records for the Nabarun Education Family._

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://alumni-connect-main.vercel.app)

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-alumni--connect--main.vercel.app-blue?style=for-the-badge)](https://alumni-connect-main.vercel.app)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Author](#-author)

---

## 🔍 Overview

SASIMS is a comprehensive **alumni management system** built for the Nabarun Education Family. It provides role-based access for administrators and students, with features for managing profiles, events, gallery, notices, donations, and testimonials — all backed by a real-time Supabase database.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🔐 **Authentication** | Secure login & registration via Supabase Auth |
| 👤 **Student Profiles** | Complete profile management with photo upload |
| 🗂️ **Alumni Directory** | Searchable and filterable alumni list |
| 📢 **Notice Board** | Admin-managed announcements |
| 📅 **Events** | Create and publish upcoming events |
| 🖼️ **Gallery** | Photo gallery with admin controls |
| 💰 **Donations** | Donation campaigns and transaction tracking |
| 💬 **Testimonials** | Alumni success stories |
| 📩 **Contact** | Public contact form with admin inbox |
| 🛡️ **Role-Based Access** | Separate dashboards for Admin and Student |

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State / Data** | TanStack React Query |
| **Forms** | React Hook Form + Zod |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+ (LTS recommended)
- A [Supabase](https://supabase.com) project

### Installation

```sh
# 1. Clone the repository
git clone https://github.com/hasib61714/nabarun-alumni-sasims.git
cd nabarun-alumni-sasims

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials in .env

# 4. Start the development server
npm run dev
```

The app will be available at <http://localhost:8080>

---

## 📁 Project Structure

```text
nabarun-alumni-sasims/
├── public/                   # Static assets (favicon, logo)
├── src/
│   ├── assets/               # Images and media files
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components
│   │   └── home/             # Home page sections
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client & generated types
│   ├── lib/                  # Utility functions
│   └── pages/
│       ├── admin/            # Admin dashboard
│       └── student/          # Student dashboard
├── supabase/
│   ├── config.toml           # Supabase CLI config
│   └── migrations/           # Database migration files
├── .env.example              # Environment variable template
├── vercel.json               # Vercel SPA routing config
└── vite.config.ts            # Vite build configuration
```

---

## 📜 Available Scripts

```sh
npm run dev        # Start development server (port 8080)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
npm run test       # Run unit tests
```

---

## 🔑 Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 🗄️ Database Schema

| Table | Purpose |
| --- | --- |
| `user_roles` | Admin / Student role assignment |
| `student_profiles` | Alumni profile data |
| `contact_messages` | Contact form submissions |
| `notices` | Notice board entries |
| `gallery_photos` | Gallery images |
| `events` | Event listings |
| `donations` | Donation records |
| `donation_campaigns` | Fundraising campaigns |
| `testimonials` | Alumni testimonials |

Row Level Security (RLS) is enabled on all tables.

---

## 👤 Author

### Md. Hasibul Hasan

🎓 BSc in Computer Science & Engineering | 🏫 Green University of Bangladesh

🏫 **Alumni:** নবারুণ পাবলিক স্কুল (NPS) — SSC Batch 2017

🚀 **Interests:** Web Development · Artificial Intelligence · Machine Learning · Software Engineering

[![Portfolio](https://img.shields.io/badge/Portfolio-hasib61714.github.io-blueviolet?style=flat-square&logo=google-chrome&logoColor=white)](https://hasib61714.github.io/hasibul-portfolio-v5/)
[![GitHub](https://img.shields.io/badge/GitHub-hasib61714-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/hasib61714)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-md--hasibul--hasan-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/md-hasibul-hasan-10749537a/)

---

Made with ❤️ for **Nabarun Education Family**
