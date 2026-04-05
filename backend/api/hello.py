"""
Netlify Function - FastAPI handler
"""
import json
from main import app

def handler(event, context):
    """Handle Netlify function invocation"""
    from fastapi.testclient import TestClient

    client = TestClient(app)
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    query = event.get('queryStringParameters', {})

    # Build query string
    query_string = '&'.join([f"{k}={v}" for k, v in query.items()]) if query else ''

    # Map HTTP method to requests
    method_map = {
        'GET': client.get,
        'POST': client.post,
        'PUT': client.put,
        'DELETE': client.delete,
        'PATCH': client.patch
    }

    try:
        if http_method in method_map:
            response = method_map[http_method](f"{path}?{query_string}" if query_string else path)
        else:
            return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

        return {
            'statusCode': response.status_code,
            'headers': {'Content-Type': 'application/json'},
            'body': response.text
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }