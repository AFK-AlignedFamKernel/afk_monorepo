from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
import os
from dotenv import load_dotenv
import models
from database import DATABASE_URL

def init_database():
    """Initialize the database and create all tables."""
    try:
        # Create engine without database name
        base_url = DATABASE_URL.rsplit('/', 1)[0]
        engine = create_engine(f"{base_url}/postgres")
        
        # Connect to postgres database to create new database
        with engine.connect() as conn:
            # Get database name from URL
            db_name = DATABASE_URL.split('/')[-1]
            
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
            if not result.scalar():
                # Create database if it doesn't exist
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                print(f"Created database: {db_name}")
            else:
                print(f"Database {db_name} already exists")
        
        # Create engine with database name
        engine = create_engine(DATABASE_URL)
        
        # Create all tables
        models.Base.metadata.create_all(bind=engine)
        print("Created all tables successfully")
        
        return True
        
    except ProgrammingError as e:
        print(f"Error creating database: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return False

def drop_database():
    """Drop the database if it exists."""
    try:
        # Create engine without database name
        base_url = DATABASE_URL.rsplit('/', 1)[0]
        engine = create_engine(f"{base_url}/postgres")
        
        # Connect to postgres database to drop the database
        with engine.connect() as conn:
            # Get database name from URL
            db_name = DATABASE_URL.split('/')[-1]
            
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
            if result.scalar():
                # Drop database if it exists
                conn.execute(text(f"DROP DATABASE {db_name}"))
                print(f"Dropped database: {db_name}")
            else:
                print(f"Database {db_name} does not exist")
        
        return True
        
    except ProgrammingError as e:
        print(f"Error dropping database: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return False

def reset_database():
    """Drop and recreate the database."""
    if drop_database():
        return init_database()
    return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database initialization script")
    parser.add_argument(
        "--action",
        choices=["init", "drop", "reset"],
        default="init",
        help="Action to perform: init (create), drop, or reset (drop and create)"
    )
    
    args = parser.parse_args()
    
    if args.action == "init":
        init_database()
    elif args.action == "drop":
        drop_database()
    elif args.action == "reset":
        reset_database() 