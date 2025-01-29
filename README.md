# SMART_MED_2.0

A comprehensive diabetes management system with family tree visualization and medical document OCR capabilities.

## Features

- 👥 Interactive Family Tree Visualization
- 🔒 Hierarchical Access Control
- 📄 Medical Document Management
- 🔍 OCR Text Extraction
- 💊 Medicine Name Detection
- 📊 Real-time Updates
- 🎯 Profile Management

## Prerequisites

- Node.js (v18.19.0 or higher)
- npm (v10.2.3 or higher)
- MySQL (v8.0+)
- Git

## Tech Stack

### Frontend
- React 18.3.1
- TypeScript 5.6.3
- Vite 6.0.11
- React Query 5.64.2
- React Flow 11.11.4
- Tailwind CSS 3.4.1
- Shadcn/ui Components

### Backend
- Node.js 18.19.0
- Express 4.21.2
- MySQL 3.12.0
- JWT Authentication
- Tesseract.js 6.0.0
- Sharp 0.33.5

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SMART_MED_2.0.git
cd SMART_MED_2.0
```

### 2. Install Dependencies

Install all dependencies for client, server, and root project:

```bash
npm run install-all
```

Or install separately:

```bash
# Root dependencies
npm install

# Client dependencies
cd client
npm install

# Server dependencies
cd ../server
npm install
```

### 3. Environment Setup

#### Client (.env)
Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_JWT_SECRET=your_jwt_secret
```

#### Server (.env)
Create `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=SMART_MED_2
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=uploads
```

### 4. Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE SMART_MED_2;
```

2. Run database schema:
```bash
cd database
mysql -u your_username -p SMART_MED_2 < schema.sql
```

3. Import medicine reference data:
```bash
cd seeds
node medicines.js
```

### 5. Start Development Servers

Run both frontend and backend in development mode:

```bash
npm run dev
```

Or run separately:

```bash
# Frontend only
npm run client

# Backend only
npm run server
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
SMART_MED_2.0/
├── client/                 # Frontend React application
│   ├── public/            # Public assets
│   └── src/               # Source files
│       ├── assets/        # Static assets
│       ├── components/    # React components
│       ├── contexts/      # React contexts
│       ├── hooks/         # Custom hooks
│       ├── interfaces/    # TypeScript interfaces
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── utils/         # Utility functions
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── services/         # Business logic
└── database/             # Database related files
    ├── migrations/       # Database migrations
    └── seeds/            # Seed data
```

## API Documentation

### Authentication
```
POST /api/auth/register  - Register new user
POST /api/auth/login     - User login
POST /api/auth/logout    - User logout
```

### Profiles
```
GET    /api/profiles     - Get all profiles
POST   /api/profiles     - Create new profile
GET    /api/profiles/:id - Get specific profile
PUT    /api/profiles/:id - Update profile
DELETE /api/profiles/:id - Delete profile
```

### Family Relations
```
GET    /api/family/tree         - Get family tree
POST   /api/family/relation     - Create relation
DELETE /api/family/relation/:id - Delete relation
```

### Documents
```
POST /api/documents/upload    - Upload document
GET  /api/documents/:id       - Get document
GET  /api/documents/extract/:id - Extract text from document
```

## Features in Detail

### Family Tree Visualization
- Interactive D3-based visualization
- Drag and drop interface
- Real-time updates
- Relationship validation
- Context menu for quick actions

### Document Management
- Secure file upload
- OCR text extraction
- Medicine name detection
- Version control
- Access permissions

### Profile Management
- Hierarchical access control
- Parent-child relationships
- Profile linking
- Activity tracking

## Security Features

- JWT authentication
- Password hashing (bcrypt)
- Input validation
- File type validation
- Access control
- Rate limiting
- XSS protection
- CSRF protection

## Performance Optimizations

- Image optimization
- Caching strategies
- Database indexing
- Lazy loading
- Efficient state management
- Optimized queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

