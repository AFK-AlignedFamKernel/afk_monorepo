from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.sql import text
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

def run_migration():
    """Add updated_at column to trend_queries table"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Add updated_at column
        with engine.connect() as conn:
            # Add column
            conn.execute(text("""
                ALTER TABLE trend_queries 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            
            # Update existing rows
            conn.execute(text("""
                UPDATE trend_queries 
                SET updated_at = created_at 
                WHERE updated_at IS NULL
            """))
            
            # Add trigger for automatic updates
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
                
                CREATE TRIGGER update_trend_queries_updated_at
                    BEFORE UPDATE ON trend_queries
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            """))
            
            conn.commit()
            
        print("Successfully added updated_at column to trend_queries table")
        
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration() 