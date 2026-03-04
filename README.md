# নবারুণ অ্যালামনাই - SASIMS

**Student Alumni & Staff Information Management System**

A full-stack web application for managing alumni, staff, and student information for the Nabarun Education Family.

> Designed & developed by **Md. Hasibul Hasan** ([@hasib61714](https://github.com/hasib61714))

## Tech Stack

- **Vite** — build tool & dev server
- **React** + **TypeScript**
- **Tailwind CSS** — styling
- **shadcn/ui** — UI components
- **Supabase** — backend & database
- **React Query** — data fetching
- **React Hook Form** + **Zod** — forms & validation

## Getting Started

### Prerequisites

- Node.js (LTS) or Bun

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd alumni-connect-main

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Project Structure

```
src/
├── components/     # Shared UI components
├── pages/          # Route-level page components
│   ├── admin/      # Admin dashboard pages
│   └── student/    # Student dashboard pages
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations (Supabase)
└── lib/            # Utility functions
supabase/
├── config.toml     # Supabase configuration
└── migrations/     # Database migration files
```

## Environment Variables

Create a `.env` file in the root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
