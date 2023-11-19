# server.py

import socketio
import base64
sio = socketio.Server()

sio = socketio.Server(cors_allowed_origins='*') 

@sio.event
def connect(sid, environ):
    print('New client connected')

@sio.event
def image(sid, data):
    image_data = base64.b64decode(data['base64'])
    # Emit a 'newImage' event with the base64 string of the new image
    sio.emit('newImage', data['base64'])

@sio.event
def disconnect(sid):
    print('Client disconnected')

if __name__ == '__main__':
    app = socketio.WSGIApp(sio)
    from gevent.pywsgi import WSGIServer
    http_server = WSGIServer(('0.0.0.0', 3000), app)
    http_server.serve_forever()