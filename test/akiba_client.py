import json
import socket
import threading


class Client:
    BUFFER_SIZE = 1024

    def __init__(self, server_ip, tcp_port, udp_port):
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.name = self.prompt_for_name()
        self.token = None
        self.tcp_address = (server_ip, tcp_port)
        self.udp_address = (server_ip, udp_port)
        self.room_name = None

    def start(self):
        self.connect_server()
        self.udp_socket.bind(self.udp_address)
        threading.Thread(target=self.receive_messages, daemon=True).start()
        while True:
            msg = input("Enter your message: ")
            self.send_messages(self.name, msg)

    def receive_messages(self):
        print("Listening for messages...")
        while True:
            data, _ = self.udp_socket.recvfrom(self.BUFFER_SIZE)
            print(data)
            data = json.loads(data.decode('utf-8'))

    def prompt_for_name(self):
        return input("Enter your username: ")

    def connect_server(self):
        self.tcp_socket.connect(self.tcp_address)
        room_name = input("Enter room name: ")
        request = {
            "roomName": room_name,
            "username": self.name
        }
        self.tcp_socket.send(json.dumps(request).encode('utf-8'))
        response = json.loads(self.tcp_socket.recv(
            self.BUFFER_SIZE).decode('utf-8'))
        if 'token' in response:
            self.token = response['token']

        self.room_name = room_name
        print(response['message'])

    def send_messages(self, username, msg):
        message = {
            "roomName": self.room_name,
            "username": username,
            "msg": msg
        }
        self.udp_socket.sendto(json.dumps(
            message).encode('utf-8'), self.udp_address)


if __name__ == "__main__":
    client = Client('0.0.0.0', 8000, 9000)
    client.start()
