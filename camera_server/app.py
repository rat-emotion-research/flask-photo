"""API endpoints for taking photos.
"""

import cv2
import flask

app = flask.Flask(__name__)
cap = cv2.VideoCapture(0)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/take-photo')
def take_photo():
    cap.read() # clear the buffer
    ret, frame = cap.read()
    success, encoded_image = cv2.imencode('.png', frame)
    resp = flask.make_response(encoded_image.tobytes())
    resp.content_type = "image/jpeg"
    return resp