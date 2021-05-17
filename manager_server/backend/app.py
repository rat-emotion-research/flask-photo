from flask import Flask, request, send_file, jsonify
from flask.views import MethodView
import json
import os

app = Flask(__name__, static_folder='web-build/static')

@app.route("/index.html")
def home():
    return send_file('web-build/index.html')

fake_data = [
    '10.0.0.192', 
    '10.0.0.105'
]

def build_response(results=None, errmsg=None):
    """Helper function that ensures responses follow similar format"""
    data = {}

    if results:
        data['results'] = results

    if errmsg:
        data['errmsg'] = errmsg

    return jsonify(data)


class CameraServers(MethodView):
    def get(self, device):
        """Get information about devices"""
        if device is None:
            return build_response(fake_data)
        else:
            return 'A device'

    def post(self):
        """Add a new device"""
        return build_response(fake_data)

    def delete(self, device):
        """Remove the device server"""
        for i in range(len(fake_data)):
            if fake_data[i] == device:
                fake_data.pop(i)
                return build_response(fake_data)

    def put(self, device_id):
        """Update a device's settings"""
        pass

# Add the Device API
user_view = CameraServers.as_view('device_api')
app.add_url_rule('/devices/', defaults={'device': None},
    view_func=user_view, methods=['GET',])
app.add_url_rule('/devices/', view_func=user_view, methods=['POST',])
app.add_url_rule('/devices/<int:device>', view_func=user_view, 
    methods=['GET', 'PUT', 'DELETE'])

