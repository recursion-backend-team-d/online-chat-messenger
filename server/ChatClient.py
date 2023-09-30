import json
import socket
import time


class ChatClient:
    def __init__(self, address, name, is_host=False):
        self.address = address  # (ip, port)
        self.name = name
        self.token = None
        self.is_host = is_host
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.last_active = time.time()

    def send(self, msg):
        try:
            self.udp_socket.sendto(self.encode_msg(msg), self.address)
            self.last_active = time.time()
        except Exception as e:
            print(f"Error sending message to {self.name}: {e}")

    def encode_msg(self, msg):
        if msg.isjson():
            return json.dumps(msg).encode('utf-8')
        return msg.encode('utf-8')

    def set_token(self, token):
        self.token = token
