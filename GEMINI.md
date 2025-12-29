# SMART_MED_2.0 Project Context

## Project Overview

**SMART_MED_2.0** is a comprehensive diabetes management system featuring interactive family tree visualization and medical document OCR capabilities. It allows users to manage health profiles, track medications, visualize family health history, and digitize medical records.

### Architecture
*   **Type:** Full-stack Web Application (Monorepo-style structure)
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Shadcn/ui
*   **Backend:** Node.js, Express.js
*   **Database:** MySQL
*   **Authentication:** JWT (JSON Web Tokens)

## Tech Stack Details

### Client (`/client`)
*   **Framework:** React 18 with Vite
*   **Language:** TypeScript
*   **State Management:** Zustand, React Query (`@tanstack/react-query`)
*   **Styling:** Tailwind CSS, Shadcn/ui (Radix UI primitives)
*   **Forms:** React Hook Form + Zod validation
*   **Visualization:** React Flow (Family Tree), Recharts (Charts)
*   **HTTP Client:** Axios

### Server (`/server`)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database Client:** `mysql2`
*   **OCR:** Tesseract.js
*   **File Handling:** Multer, Sharp
*   **Security:** `bcryptjs`, `jsonwebtoken`, `cors`, `express-validator`

## Key Directories

*   **`client/src/components`**: UI components organized by feature (auth, dashboard, family-tree, etc.).
*   **`client/src/services`**: API integration logic.
*   **`client/src/store`**: Global state (Zustand).
*   **`server/controllers`**: Request handlers for API endpoints.
*   **`server/models`**: Database interaction logic (likely raw SQL or query builder pattern).
*   **`server/routes`**: API route definitions.
*   **`database`**: SQL schema (`schema.sql`) and seed data.

## Setup & Development

### Installation
Run the following from the root directory to install dependencies for root, client, and server:
```bash
npm run install-all
```

### Database Setup
1.  Ensure MySQL is running.
2.  Create database: `CREATE DATABASE SMART_MED_2;`
3.  Import schema: `mysql -u <user> -p SMART_MED_2 < database/schema.sql`
4.  Seed data: `node database/seeds/medicines.js`

### Running the Application
Start both client and server in development mode:
```bash
npm run dev
```
*   **Frontend:** `http://localhost:3000` (or the port Vite selects)
*   **Backend:** `http://localhost:5000`

### Individual Commands
*   **Client only:** `npm run client` (Root) or `npm run dev` (in `/client`)
*   **Server only:** `npm run server` (Root) or `npm run dev` (in `/server`)

## Development Conventions

*   **Formatting:** Prettier/ESLint usage is implied.
*   **Component Structure:** Feature-based organization in `client/src/components`.
*   **API Pattern:** Controller-Service-Model pattern in the backend.
*   **Type Safety:** Strict TypeScript usage in the frontend; JSDoc/CommonJS in the backend.

## Common Tasks

*   **New Feature:** Add UI in `client/src/components/<feature>`, add route in `client/src/App.tsx`, create backend route in `server/routes`, and controller in `server/controllers`.
*   **Database Change:** Update `database/schema.sql` and manually apply changes to the local database.
