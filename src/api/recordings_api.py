# recordings_api.py - Flask blueprint for Auth0-secured MongoDB user-partitioned recordings

from flask import Blueprint, request, jsonify
from functools import wraps
import os
import pymongo
from jose import jwt, JWTError

recordings_api = Blueprint('recordings_api', __name__)

# Auth0 and MongoDB configuration
AUTH0_DOMAIN = os.getenv('REACT_APP_AUTH0_DOMAIN')
API_IDENTIFIER = os.getenv('REACT_APP_AUTH0_API_AUDIENCE')
MONGODB_URI = os.getenv('MONGODB_URI')
DB_NAME = os.getenv('DB_NAME')

mongo_client = pymongo.MongoClient(MONGODB_URI)
db = mongo_client[DB_NAME]
collection = db['recordings']

# Auth0 config
ALGORITHMS = ['RS256']

# Helper: Auth0 JWT validation
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401
        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return jsonify({'error': 'Invalid Authorization header'}), 401
        token = parts[1]
        try:
            # Get public key from Auth0
            from urllib.request import urlopen
            import json
            jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
            jwks = json.loads(urlopen(jwks_url).read())
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in jwks['keys']:
                if key['kid'] == unverified_header['kid']:
                    rsa_key = {
                        'kty': key['kty'],
                        'kid': key['kid'],
                        'use': key['use'],
                        'n': key['n'],
                        'e': key['e']
                    }
            if not rsa_key:
                return jsonify({'error': 'Appropriate key not found'}), 401
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=API_IDENTIFIER,
                issuer=f'https://{AUTH0_DOMAIN}/'
            )
        except JWTError as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
        except Exception as e:
            return jsonify({'error': 'Token validation error', 'details': str(e)}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated

# Save a new recording
@recordings_api.route('/recordings', methods=['POST'])
@requires_auth
def save_recording():
    user_id = request.user['sub']
    recording = request.json
    doc = {**recording, 'userId': user_id, 'timestamp': pymongo.datetime.datetime.utcnow()}
    result = collection.insert_one(doc)
    return jsonify({'_id': str(result.inserted_id)})

# Get all recordings for a user
@recordings_api.route('/recordings', methods=['GET'])
@requires_auth
def get_recordings():
    user_id = request.user['sub']
    recordings = list(collection.find({'userId': user_id}).sort('timestamp', -1))
    for r in recordings:
        r['_id'] = str(r['_id'])
    return jsonify(recordings)

# Delete a recording
@recordings_api.route('/recordings/<recording_id>', methods=['DELETE'])
@requires_auth
def delete_recording(recording_id):
    user_id = request.user['sub']
    result = collection.delete_one({'_id': pymongo.ObjectId(recording_id), 'userId': user_id})
    return jsonify({'deleted_count': result.deleted_count})

# Update a recording
@recordings_api.route('/recordings/<recording_id>', methods=['PUT'])
@requires_auth
def update_recording(recording_id):
    user_id = request.user['sub']
    updates = request.json
    result = collection.update_one({'_id': pymongo.ObjectId(recording_id), 'userId': user_id}, {'$set': updates})
    return jsonify({'modified_count': result.modified_count})
