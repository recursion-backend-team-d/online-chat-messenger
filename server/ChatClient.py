import json
import socket
import struct
import time


class ChatClient:
    MAX_FALSE_COUNT = 3

    def __init__(self, name, address, token, is_host=False):
        self.address = address  # (ip, port)
        self.name = name
        self.token = token
        self.is_host = is_host
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.last_active = time.time()
        self.false_count = 0
        self.is_active = True

    def send(self, msg):
        try:
            self.send_message(msg)
            self.update_last_active()
        except Exception as e:
            self.handle_send_error(e)

    def send_message(self, msg):
        encoded_msg = self.encode_msg(msg)
        self.udp_socket.sendto(encoded_msg, self.address)

    def update_last_active(self):
        self.last_active = time.time()

    def handle_send_error(self, error):
        print(f"Error sending message to {self.name}: {error}")
        self.false_count += 1
        if self.false_count > self.MAX_FALSE_COUNT:
            self.is_active = False

    def encode_msg(self, msg):
        room_name_size = 0
        token_size = 0
        header = struct.pack('!B B', room_name_size, token_size)
        encoded_msg = json.dumps(msg).encode('utf-8')
        return header + encoded_msg
