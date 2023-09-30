import json
import os
import secrets
import socket
import sys
import threading

from server.ChatClient import ChatClient
from server.ChatRoom import ChatRoom

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))


class Server:
    BUFFER_SIZE = 1024

    def __init__(self, tcp_address, udp_address):
        self.tcp_address = tcp_address
        self.udp_address = udp_address
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.rooms = {}

    def start(self):
        self.tcp_socket.bind(self.tcp_address)
        self.tcp_socket.listen(5)
        # self.udp_socket.bind(self.udp_address)

        print(f"tcp_socket started on {self.tcp_address}")
        print(f"udp_socket started on {self.udp_address}")
        threading.Thread(target=self.receive, daemon=True).start()
        while True:
            conn, addr = self.tcp_socket.accept()
            threading.Thread(target=self.establish_chat,
                             args=(conn, addr), daemon=True).start()

    def establish_chat(self, conn, addr):
        data = conn.recv(self.BUFFER_SIZE)
        request = json.loads(data.decode('utf-8'))
        room_name = request['roomName']
        username = request['username']

        if room_name not in self.rooms:
            self.rooms[room_name] = ChatRoom(room_name)

        client = ChatClient(self.udp_address, username)
        # client = ChatClient(addr, username)
        if self.rooms[room_name].can_add_client(client):
            token = self.generate_token()
            client.set_token(token)
            self.rooms[room_name].add_client(client)
            response = {
                "status": 201,
                "message": "Successfully joined the room!",
                "token": token
            }
        else:
            response = {
                "status": 202,
                "message": "Username already exists in the room!"
            }

        conn.send(json.dumps(response).encode('utf-8'))
        conn.close()

    def receive(self):
        while True:
            data, _ = self.udp_socket.recvfrom(self.BUFFER_SIZE)
            try:
                data = json.loads(data.decode('utf-8'))
            except json.JSONDecodeError:
                print("Failed to decode JSON. Skipping...")
                continue
            if 'is_chat_client' in data and data['is_chat_client']:
                continue
            room_name = data['roomName']
            sender_name = data['username']
            message = data['msg']
            sender = self.rooms[room_name].get_client_by_name(sender_name)
            if room_name in self.rooms:
                self.rooms[room_name].broadcast(message, sender=sender)

    def generate_token(self):
        return secrets.token_hex(16)


if __name__ == "__main__":
    server = Server(('0.0.0.0', 8000), ('0.0.0.0', 9000))
    server.start()
