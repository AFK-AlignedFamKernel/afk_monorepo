from sqlalchemy import create_engine, Boolean
from sqlalchemy.sql import text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

def add_is_active_column():
    """Add is_active column to trend_queries table"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Add is_active column with default value True
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'trend_queries' 
                AND column_name = 'is_active'
            """))
            
            if not result.fetchone():
                # Add column if it doesn't exist
                connection.execute(text("""
                    ALTER TABLE trend_queries 
                    ADD COLUMN is_active BOOLEAN DEFAULT TRUE
                """))
                connection.commit()
                print("Successfully added is_active column to trend_queries table")
            else:
                print("is_active column already exists in trend_queries table")
                
    except Exception as e:
        print(f"Error adding is_active column: {str(e)}")
        raise

if __name__ == "__main__":
    add_is_active_column() 