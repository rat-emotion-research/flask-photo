"""API endpoints for taking photos. Uses multiprocessing to collect frames in
a seperate process.
"""

import cv2
import flask
import time

from multiprocessing import Process, Queue

def camera_process(queue, fps=30):
    """Frame-capturing process"""

    cap = cv2.VideoCapture('/dev/video0')

    # These properties may not be settable on your cameras
    # To view settable properties for camera (on an RPI), run `v4l2-ctl -l`
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_EXPOSURE, 0)
    cap.set(cv2.CAP_PROP_FPS, fps)

    while True:
        cap.read() # Clear the buffer

        # Read the frame
        ret, frame = cap.read() 
        success, encoded_image = cv2.imencode('.png', frame)

        # If the encoding was successful, put it in the queue and clear
        if success:
            queue.put(encoded_image.tobytes())

        # Clear out old frames, make sure there is at least one
        if queue.qsize() > 1:
            queue.get()

        # Delay so that not all of the CPU is being used 
        time.sleep(1/fps)

# Start the process
queue = Queue(2)
process = Process(target=camera_process, args=(queue,))
process.start()

# Flask App
app = flask.Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/take-photo')
def take_photo():
    encoded_image = queue.get()
    resp = flask.make_response(encoded_image)
    resp.content_type = "image/jpeg"
    return resp
