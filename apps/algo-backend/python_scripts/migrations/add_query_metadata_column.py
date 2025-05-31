from sqlalchemy import create_engine, JSON
from sqlalchemy.sql import text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

def add_query_metadata_column():
    """Add query_metadata column to trend_queries table"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Add query_metadata column with default value {}
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'trend_queries' 
                AND column_name = 'query_metadata'
            """))
            
            if not result.fetchone():
                # Add column if it doesn't exist
                connection.execute(text("""
                    ALTER TABLE trend_queries 
                    ADD COLUMN query_metadata JSONB DEFAULT '{}'::jsonb
                """))
                connection.commit()
                print("Successfully added query_metadata column to trend_queries table")
            else:
                print("query_metadata column already exists in trend_queries table")
                
    except Exception as e:
        print(f"Error adding query_metadata column: {str(e)}")
        raise

if __name__ == "__main__":
    add_query_metadata_column() 