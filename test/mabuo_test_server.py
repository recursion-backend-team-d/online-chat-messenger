import socket
import json
import struct
import threading


class Server:
    def __init__(self, tcp_port=8000, udp_port=9000):
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.tcp_socket.bind(('0.0.0.0', tcp_port))
        self.udp_socket.bind(('0.0.0.0', udp_port))
        self.clients = {}

    def start(self):
        self.tcp_socket.listen()
        print("TCP Server is listening...")
        while True:
            conn, addr = self.tcp_socket.accept()
            print(f"Connection from {addr}")
            threading.Thread(target=self.handle_client, args=(conn,)).start()

    def handle_client(self, conn):

        header = conn.recv(32)
        room_name_size, operation, state, payload_size = struct.unpack(
            "!B B B 29s", header)
        room_name = conn.recv(room_name_size)
        payload_data = conn.recv(int.from_bytes(payload_size, 'big'))
        print(
            f"Header: {room_name_size}, {operation}, {state}, {payload_size}")
        print("Received payload_data:", payload_data)

        payload = json.loads(payload_data.decode('utf-8'))
        print(payload)

        username = payload["username"]
        ip = payload["ip"]
        port = payload["port"]
        

        # クライアントへの応答
        response_payload = {"status": 202, "message": "Room exist"}
        response_header = struct.pack("!B B B 29s", room_name_size, operation, 1, len(
            json.dumps(response_payload).encode('utf-8')).to_bytes(29, 'big'))
        conn.send(response_header +
                  json.dumps(response_payload).encode('utf-8'))

        if operation == 1:  # Create room
            if room_name not in self.clients:
                self.clients[room_name] = []
            else:
                # Room already exists
                response = {
                    "status": 400,
                    "message": "Room already exists."
                }
                self.send_response(conn, response)
                return

        if operation == 2:  # Join room
            if room_name not in self.clients:
                response = {
                    "status": 404,
                    "message": "Room not found."
                }
                self.send_response(conn, response)
                return

        token = f"{username}_token"
        self.clients[room_name].append((conn, token))

        response = {
            "status": 201,
            "token": token
        }
        self.send_response(conn, response)

        threading.Thread(target=self.handle_udp_messages, args=(
            room_name, token,), daemon=True).start()

    def send_response(self, conn, response):
        print("Sending compleet response")
        payload_data = json.dumps(response).encode('utf-8')
        header = struct.pack("!B B B 29s", 0, 0, 2, len(
            payload_data).to_bytes(29, 'big'))
        conn.send(header + payload_data)

    def handle_udp_messages(self, room_name, token):
        print("handle_udp_messages")
        while True:
            message, addr = self.udp_socket.recvfrom(4096)
            room_name_size, token_size = struct.unpack("!B B", message[:2])
            room_name = message[2:2 + room_name_size].decode('utf-8')
            print(room_name)
            token = message[2 + room_name_size:2 +
                            room_name_size + token_size].decode('utf-8')
            print(token)
            payload = json.loads(message[2 + room_name_size + token_size:].decode('utf-8'))
            print(payload["sender"] + ": " + payload["message"])
            self.udp_socket.sendto(message, addr)


if __name__ == "__main__":
    server = Server()
    server.start()
