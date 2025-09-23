# Dangan - React + FastAPI + PostgreSQL Web Application

A modern full-stack web application built with React (TypeScript), FastAPI (Python), and PostgreSQL database.

## 🚀 Features

- **Frontend**: React with TypeScript, Material-UI components, React Router
- **Backend**: FastAPI with SQLAlchemy ORM, JWT authentication, CORS support
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT-based authentication with protected routes
- **API**: RESTful API with CRUD operations for users and items

## 📁 Project Structure

```
Dangan/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # Authentication utilities
│   │   ├── crud.py         # Database operations
│   │   └── routers/        # API route handlers
│   │       ├── __init__.py
│   │       ├── auth.py     # Authentication routes
│   │       └── items.py    # Items CRUD routes
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main App component
│   │   └── index.tsx       # Application entry point
│   ├── package.json        # Node.js dependencies
│   └── tsconfig.json       # TypeScript configuration
└── README.md
```

## 🛠️ Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**
- **npm** or **yarn**

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Dangan
```

### 2. Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE dangan_db;
CREATE USER dangan_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dangan_db TO dangan_user;
```

### 3. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://dangan_user:your_password@localhost:5432/dangan_db
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### 4. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The React app will be available at `http://localhost:3000`

## 🔧 Development

### Backend Development

- The FastAPI server runs with auto-reload enabled
- API documentation is available at `/docs` (Swagger UI)
- Alternative documentation at `/redoc`

### Frontend Development

- React development server with hot reload
- TypeScript compilation
- Material-UI components with theming

### Database Migrations

To create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend
1. Set production environment variables
2. Use a production ASGI server like Gunicorn with Uvicorn workers
3. Set up reverse proxy (nginx)
4. Configure SSL certificates

### Frontend
1. Build the production bundle:
```bash
cd frontend
npm run build
```
2. Serve the `build` directory with a web server

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - User login
- `GET /api/auth/me` - Get current user

### Items (Protected)
- `GET /api/items/` - List all items
- `POST /api/items/` - Create new item
- `GET /api/items/{id}` - Get item by ID
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are stored in localStorage on the frontend
- Protected routes require valid JWT tokens
- Tokens expire after 30 minutes (configurable)

## 🎨 Frontend Features

- **Responsive Design**: Material-UI components with mobile-first approach
- **Form Validation**: React Hook Form with Yup validation
- **State Management**: React Context for authentication state
- **Type Safety**: Full TypeScript support
- **Modern UI**: Clean, professional interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**: Ensure PostgreSQL is running and credentials are correct
2. **CORS Issues**: Check that the frontend URL is allowed in backend CORS settings
3. **Token Expired**: Tokens expire after 30 minutes; users need to log in again
4. **Migration Errors**: Ensure database exists and user has proper permissions

### Getting Help

- Check the API documentation at `http://localhost:8000/docs`
- Review the console logs for detailed error messages
- Ensure all dependencies are installed correctly
