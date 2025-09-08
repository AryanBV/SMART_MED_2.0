# SMART_MED_2.0

A modern diabetes management system with family tree visualization and medical document OCR capabilities, built with React, Node.js, and Supabase.

## 🚀 Features

- 👥 Interactive Family Tree Visualization
- 🔒 Secure Authentication with Supabase Auth
- 📄 Medical Document Management
- 🔍 OCR Text Extraction for Medicine Detection
- 💊 Medicine Name Detection and Tracking
- 📊 Real-time Updates
- 🎯 Profile Management for Family Members

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS & Shadcn/ui
- React Query for data fetching
- React Flow for family tree visualization
- Supabase Client for real-time data

### Backend
- Node.js & Express
- Supabase for database and authentication
- Tesseract.js for OCR
- Sharp for image processing

## 📋 Prerequisites

- Node.js (v18.19.0 or higher)
- npm (v10.0.0 or higher)
- Supabase account (free tier available)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/AryanBV/SMART_MED_2.0.git
cd SMART_MED_2.0
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run install-all
```

### 3. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the SQL script in the SQL Editor

### 4. Environment Configuration

#### Root Directory (.env)
Copy `.env.example` to `.env` and update:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

#### Client Directory (client/.env)
Copy `client/.env.example` to `client/.env` and update:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Server Directory (server/.env)
Copy `server/.env.example` to `server/.env` and update:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

### 5. Start Development Servers

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run client  # Frontend only
npm run server  # Backend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Project Structure

```
SMART_MED_2.0/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
├── server/                # Node.js backend
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   └── services/        # Business logic
└── supabase/            # Database migrations
    └── migrations/      # SQL migration files
```

## 🔐 Security Features

- Supabase Authentication
- Row Level Security (RLS) policies
- JWT token validation
- Input validation
- File type validation
- Secure file upload

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Aryan BV

## 🙏 Acknowledgments

- Supabase for the excellent backend platform
- Shadcn/ui for beautiful UI components
- React Flow for the family tree visualization
