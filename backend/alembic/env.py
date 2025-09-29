from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your settings and Base AFTER path is set
try:
    from app.config import settings
    from app.database import Base
    target_metadata = Base.metadata
    print("✅ Successfully imported settings and Base")
except ImportError as e:
    print(f"❌ Import error: {e}")
    # Fallback to empty metadata if import fails
    from sqlalchemy import MetaData
    target_metadata = MetaData()

def get_url():
    try:
        url = settings.database_url
        print(f"🔗 Database URL: {url}")  # Debug output
        return url
    except Exception as e:
        print(f"❌ Error getting database URL: {e}")
        # Fallback to alembic.ini configuration
        fallback_url = config.get_main_option("sqlalchemy.url")
        print(f"🔄 Using fallback URL: {fallback_url}")
        return fallback_url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    print(f"🔧 Running migrations offline with URL: {url}")
    
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = get_url()
    print(f"🔧 Running migrations online with URL: {url}")
    
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = url
    
    try:
        connectable = engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection, 
                target_metadata=target_metadata
            )

            with context.begin_transaction():
                context.run_migrations()
        print("✅ Migrations completed successfully!")
                
    except Exception as e:
        print(f"❌ Migration error: {e}")
        raise

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()