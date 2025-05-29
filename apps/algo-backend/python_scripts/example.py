import json
import sys
from typing import Dict, Any

def process_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Example function that processes data and returns a result.
    This can be called from Node.js using child_process.
    """
    try:
        # Example processing
        result = {
            "status": "success",
            "processed_data": {
                "input": data,
                "message": "Data processed successfully"
            }
        }
        return result
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    # Process the data
    result = process_data(input_data)
    
    # Output the result as JSON
    print(json.dumps(result)) 