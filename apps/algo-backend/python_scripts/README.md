# Google Trends Microservice

A FastAPI-based microservice that fetches, stores, and visualizes Google Trends data. The service provides RESTful endpoints to query Google Trends, store the results in PostgreSQL, and generate visualizations.

## Features

- Fetch Google Trends data for any keyword
- Store trends data in PostgreSQL
- Generate and store trend visualizations
- RESTful API endpoints for data access
- Support for multiple timeframes and geographical regions

## Prerequisites

- Python 3.8+
- PostgreSQL
- pip (Python package manager)

## Setup

1. **Clone the repository and navigate to the project directory**
   ```bash
   cd apps/algo-backend/python_scripts
   ```

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the project directory with the following content:
   ```
   # Database configuration
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trends_db
   
   # Or use individual variables
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=trends_db
   ```

5. **Initialize the database**
   ```bash
   python init_db.py --action init
   ```

## Running the Service

1. **Start the FastAPI server**
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

2. **Access the API documentation**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Create a new trend query
```bash
POST /trends/
```
Parameters:
- `keyword`: Search term (required)
- `timeframe`: Time range (default: "today 12-m")
- `geo`: Geographical region (default: "US")

Example:
```bash
curl -X POST "http://localhost:8000/trends/?keyword=AI&timeframe=today%205-y&geo=US"
```

### Get a specific trend query
```bash
GET /trends/{query_id}
```
Example:
```bash
curl "http://localhost:8000/trends/1"
```

### List trend queries
```bash
GET /trends/
```
Parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 10)
- `keyword`: Filter by keyword (optional)

Example:
```bash
curl "http://localhost:8000/trends/?keyword=AI&skip=0&limit=10"
```

## Database Management

The service includes a database management script (`init_db.py`) with the following commands:

- Initialize database:
  ```bash
  python init_db.py --action init
  ```

- Drop database:
  ```bash
  python init_db.py --action drop
  ```

- Reset database (drop and recreate):
  ```bash
  python init_db.py --action reset
  ```

## Project Structure

```
python_scripts/
├── main.py              # FastAPI application
├── models.py            # SQLAlchemy models
├── database.py          # Database configuration
├── init_db.py           # Database initialization
├── google_trends.py     # Google Trends data fetching
├── process_trends.py    # Data processing and visualization
├── requirements.txt     # Python dependencies
└── plots/              # Generated plot storage
```

## Data Models

- `TrendQuery`: Stores query parameters
- `TrendData`: Stores trend data points
- `TrendPlot`: Stores generated plot information

## Error Handling

The service includes comprehensive error handling for:
- Database connection issues
- Invalid query parameters
- Google Trends API errors
- File system operations

## Development

To modify the service:

1. Make changes to the relevant files
2. Restart the server (automatic with --reload flag)
3. Test the changes using the API documentation

## Troubleshooting

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. **Plot Generation Issues**
   - Check write permissions in plots directory
   - Verify matplotlib installation
   - Check disk space

3. **API Errors**
   - Check API documentation for correct parameters
   - Verify network connectivity
   - Check server logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 