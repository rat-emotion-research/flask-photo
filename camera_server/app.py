"""API endpoints for taking photos.
"""

import cv2
import flask
import subprocess
import re 
import json

from flask_cors import CORS
from flask import request, make_response, jsonify

app = flask.Flask(__name__)
CORS(app)

cap = cv2.VideoCapture(0)

# If using a buffer then frames will appear to lag 
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/take-photo')
def take_photo():
    cap.read() # clear the buffer
    ret, frame = cap.read()
    success, encoded_image = cv2.imencode('.png', frame)
    resp = make_response(encoded_image.tobytes())
    resp.content_type = "image/jpeg"
    return resp

@app.route('/settings', methods=['GET'])
def settings():
    result = subprocess.check_output(['v4l2-ctl', '-d', '0', '-l']).decode('utf-8')
    reg = re.compile(
        '\s+(?P<name>[\w\_]+)'              # Name
        '\s[\w\d]+'
        '\s\((?P<dtype>\w+)\)'              # Dtype
        '.*?\:\s' 
        '(min\=(?P<min>\-?\d+)\s)?'         # Min
        '(max\=(?P<max>\d+)\s)?'            # Max
        '(step\=(?P<step>\d+)\s)?'          # Step
        '(default\=(?P<default>\d+)\s?)?'   # Default
        '(value\=(?P<value>\d+)\s?)?'       # Value
    )

    lines = result.split('\n')
    items = [reg.match(line) for line in lines]
    items = [item.groupdict() for item in items if item]
    return jsonify(items)

@app.route('/settings/<string:setting>', methods=['PUT'])
def set_setting(setting):
    value = request.get_data(cache=False, as_text=True)
    print('update:', setting, value)
    try: 
        result = subprocess.check_output(['v4l2-ctl', '-c', f"{setting}={value}"])
        return jsonify({'results': 'good'})
    except Exception as e:
        print(e)
        return jsonify({'errmsg': str(e)}), 500