import socket
import threading
import struct
import json


class Client:
    ROOM_NAME_SIZE = 255
    NAME_SIZE = 255
    BUFFER_SIZE = 4096

    def __init__(self, server_address='localhost', tcp_server_port=8000, udp_server_port=9000):
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.tcp_server_address = (server_address, tcp_server_port)
        self.udp_server_address = (server_address, udp_server_port)
        self.udp_socket.bind(('localhost', 0))
        self.client_udp_address = self.udp_socket.getsockname()[0]
        self.client_udp_port = self.udp_socket.getsockname()[1]
        self.name_size = 0
        self.username = ''
        self.room_name = ''
        self.room_name_size = 0
        self.token = ''
        self.token_size = 0

    def start(self):
        self.prompt_for_name()
        self.connect_server()
        self.join_room()
        threading.Thread(target=self.send_messages, daemon=True).start()
        self.receive_messages()

    def connect_server(self):
        self.tcp_socket.connect(self.tcp_server_address)

    def join_room(self):
        operation = self.prompt_for_operation()
        self.prompt_for_roomname()

        # サーバーへリクエストの送信
        payload = {
            "username": self.username,
            "ip": self.client_udp_address,
            "port": self.client_udp_port,
        }

        payload_data = json.dumps(payload).encode('utf-8')
        header = struct.pack("!B B B 29s", self.room_name_size, operation, 0, len(
            payload_data).to_bytes(29, 'big'))
        self.tcp_socket.send(
            header + self.room_name.encode('utf-8') + payload_data)

        # サーバーから応答、完了待ち
        while True:
            response_header = self.tcp_socket.recv(32)
            response_room_name_size, _, response_state, response_payload_size = struct.unpack(
                "!B B B 29s", response_header)
            response_payload_data = self.tcp_socket.recv(
                int.from_bytes(response_payload_size, 'big'))
            response_payload = json.loads(
                response_payload_data.decode('utf-8'))

            if response_state == 1:
                print("Received a request response from the server.")
                print(response_payload["message"])
                continue

            elif response_state == 2:
                print(response_payload)
                self.token = response_payload["token"]
                self.token_size = len(self.token.encode('utf-8'))
                print("Connection successfully established.")
                self.tcp_socket.close()
                break

        # UDP通信を行なっていく
        threading.Thread(target=self.receive_messages, daemon=True).start()
        self.send_messages()

    def prompt_for_operation(self):
        while True:
            choice = input(
                "Do you want to create a new chat room \
                    or join an existing one? (Type 'create' or 'join'): ")
            choice = choice.replace(" ", "").lower()  # 空白を取り除いて、小文字に変換。
            if choice == 'create' or choice == 'join':  # 小文字に変換して空白を取り除く。
                return 1 if choice == 'create' else 2
                break  # 正しい入力がされたらループを抜ける
            else:
                print("Invalid input. Please enter 'create' or 'join'.")

    def prompt_for_roomname(self):
        while True:
            room_name = input("Enter room name: ")
            room_name_size = len(room_name.encode('utf-8'))
            if room_name_size > Client.ROOM_NAME_SIZE:
                print(
                    f'Room name must be equal to \
                        or less than {Client.ROOM_NAME_SIZE} bytes')
                continue
            self.room_name = room_name
            self.room_name_size = room_name_size
            break

    def prompt_for_name(self):
        while True:
            username = input('Enter your username: ')
            if len(username.encode('utf-8')) > Client.NAME_SIZE:
                print(
                    f'Your name must be equal to \
                        or less than {Client.NAME_SIZE} bytes')
                continue
            self.name_size = len(username.encode('utf-8'))
            self.username = username
            break

    def receive_messages(self):
        try:
            while True:
                message, _ = self.udp_socket.recvfrom(Client.BUFFER_SIZE)
                room_name_size, token_size = struct.unpack("!B B", message[:2])
                receive_payload = json.loads(
                    message[2 + room_name_size + token_size:].decode('utf-8'))
                print(
                    f'{receive_payload["sender"]}: {receive_payload["message"]}')
        finally:
            print('socket closig....')
            self.udp_socket.close()

    def send_messages(self):
        try:
            header = struct.pack("!B B", self.room_name_size, self.token_size)
            print("Enter message: ")
            while True:
                message_content = input()
                send_payload = {
                    "sender": self.username,
                    "message": message_content,
                }
                body = self.room_name.encode(
                    'utf-8') + self.token.encode('utf-8') + json.dumps(send_payload).encode('utf-8')

                if len(header) + len(body) > Client.BUFFER_SIZE:
                    print(
                        f'Messeges must be equal to  or less than \
                        {Client.BUFFER_SIZE - len(header) - self.room_name_size - self.token_size} bytes')
                    continue
                message = header + body
                self.udp_socket.sendto(message, self.udp_server_address)
        finally:
            print('socket closig....')
            self.udp_socket.close()
