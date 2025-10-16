from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from .config import settings

# Enhanced database engine with connection pooling and timeout settings
engine = create_engine(
    settings.database_url,
    pool_size=5,                    # Number of connections to maintain in pool
    max_overflow=10,                # Additional connections beyond pool_size
    pool_pre_ping=True,             # Verify connections before use
    pool_recycle=3600,              # Recycle connections every hour
    connect_args={
        "connect_timeout": 10,      # Connection timeout in seconds
        "application_name": "dangan_backend"
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"❌ Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def ensure_app_schema_exists():
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        conn.commit()


def test_database_connection():
    """Test database connection and return status"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def get_database_status():
    """Get detailed database status information"""
    try:
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            
            # Check connection pool status
            pool = engine.pool
            pool_status = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            }
            
            print(f"✅ Database Status:")
            print(f"   PostgreSQL Version: {version}")
            print(f"   Pool Size: {pool_status['size']}")
            print(f"   Connections Checked In: {pool_status['checked_in']}")
            print(f"   Connections Checked Out: {pool_status['checked_out']}")
            print(f"   Overflow Connections: {pool_status['overflow']}")
            print(f"   Invalid Connections: {pool_status['invalid']}")
            
            return {
                "status": "healthy",
                "version": version,
                "pool": pool_status
            }
    except Exception as e:
        print(f"❌ Database status check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
