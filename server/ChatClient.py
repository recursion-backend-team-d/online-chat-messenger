import json
import socket
import struct
import time


class ChatClient:
    MAX_INACTIVE_COUNT = 3

    def __init__(self, name, address, token, is_host=False):
        self.address = address  # (ip, port)
        self.name = name
        self.token = token
        self.is_host = is_host
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.last_active = time.time()
        self.inactive_count = 0
        self.is_active = True

    def send_system_message(self, room_name, payload):
        room_name_data = room_name.encode('utf-8')
        header = struct.pack('!B B', len(room_name_data), 0)
        payload_data = json.dumps(payload).encode('utf-8')
        self.udp_socket.sendto(header + room_name_data + payload_data, self.address)

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
        self.inactive_count += 1
        if self.inactive_count > self.MAX_INACTIVE_COUNT:
            self.is_active = False

    def encode_msg(self, msg):
        room_name_size = 0
        token_size = 0
        header = struct.pack('!B B', room_name_size, token_size)
        encoded_msg = json.dumps(msg).encode('utf-8')
        return header + encoded_msg
