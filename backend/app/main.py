from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, items, clients, candidates
from .database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dangan API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Dangan API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
