import json
import socket
import struct
import threading
import secrets
import time
from ChatRoom import ChatRoom
from ChatClient import ChatClient


class Server:
    HEADER_SIZE = 32
    BODY_SIZE = 4096
    MSG_HEADER_SIZE = 2
    MSG_BODY_SIZE = 2
    TOKEN_SIZE = 125

    def __init__(self, tcp_address, udp_address):
        self.tcp_address = tcp_address
        self.udp_address = udp_address
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.rooms = {}

        self.tcp_socket.bind(self.tcp_address)
        self.udp_socket.bind(self.udp_address)

    def start(self):
        threading.Thread(target=self.wait_for_client_con, daemon=True).start()
        threading.Thread(
            target=self.destroy_empty_room_periodically, daemon=True).start()
        self.receive()

    def wait_for_client_con(self):
        self.tcp_socket.listen(10)

        while True:
            try:
                conn, _ = self.tcp_socket.accept()
                threading.Thread(target=self.establish_chat,
                                 args=(conn,)).start()
            except Exception as e:
                print(f'wait_for_client_conn: {e}')
                print('socket closing....')
                self.tcp_socket.close()

    def establish_chat(self, conn):
        room_name, operation, state, operation_payload = self.receive_request(
            conn)
        print(room_name, operation, state, operation_payload)
        self.send_response(
            conn,
            operation,
            1,
            {"status": 202, "message": "Server ackowledged your request."})

        token = self.generate_token()
        # 新しいルームを作る
        if operation == 1:
            # Success
            if not self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'],
                    (operation_payload["ip"], operation_payload["port"],),
                    token, True)
                self.create_room(room_name, client)
                self.send_response(
                    conn,
                    operation,
                    2,
                    {
                        "status": 201,
                        "message": "Server successfully created a chat room.",
                        "token": token
                    })
            # Failure
            else:
                self.send_response(
                    conn,
                    operation,
                    2,
                    {
                        "status": 400,
                        "message": "Requested chat room already exists."
                    })

        # 既存のルームに入る
        if operation == 2:
            # Success
            if self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'],
                    (operation_payload["ip"], operation_payload["port"],),
                    token, False)
                if self.assign_room(room_name, client):
                    self.send_response(conn,
                                       operation,
                                       2,
                                       {
                                           "status": 200,
                                           "message": "Server successfully assigned you to a chat room.",
                                           "token": token
                                       })
                else:
                    self.send_response(conn,
                                       operation,
                                       2,
                                       {
                                           "status": 400,
                                           "message": "Requested username is already taken."
                                       })
            # Failure
            else:
                self.send_response(
                    conn,
                    operation,
                    3,
                    {
                        "status": 400,
                        "message": "Requested chat room does not exist."
                    })

    def receive_request(self, conn):
        header = conn.recv(Server.HEADER_SIZE)
        room_name_size, operation, state, operation_payload_size = \
            struct.unpack('!B B B 29s', header)
        room_name = conn.recv(room_name_size)
        room_name = room_name.decode()
        operation_payload = conn.recv(
            int.from_bytes(operation_payload_size, 'big'))
        operation_payload = json.loads(operation_payload)
        return room_name, operation, state, operation_payload

    def send_response(self, conn, operation, state, payload):
        try:
            payload_data = json.dumps(payload).encode('utf-8')
            header = struct.pack('!B B B 29s', 0, operation, state, len(
                payload_data).to_bytes(29, 'big'))
            conn.send(header + payload_data)
        except Exception as e:
            print(f'send_response: {e}')
            print('socket closing....')
            self.tcp_socket.close()

    def receive(self):
        try:
            while True:
                data, address = self.udp_socket.recvfrom(Server.BODY_SIZE)
                room_name_size, token_size = struct.unpack(
                    '!B B', data[:Server.MSG_HEADER_SIZE])
                room_name = data[Server.MSG_HEADER_SIZE:Server.MSG_HEADER_SIZE +
                                 room_name_size].decode('utf-8')
                token = data[Server.MSG_HEADER_SIZE + room_name_size:Server.MSG_HEADER_SIZE +
                             room_name_size + token_size].decode('utf-8')
                payload = json.loads(
                    data[Server.MSG_HEADER_SIZE + room_name_size + token_size:].decode('utf-8'))
                if not self.rooms[room_name].broadcast(
                        address, token, payload):
                    header = struct.pack('!B B', 0, 0)
                    body = {
                        "sender": "Server",
                        "message": "You are not authenticated"
                    }
                    body = json.dumps(body).encode('utf-8')
                    self.udp_socket.sendto(
                        header + body, address)
        except Exception as e:
            print(f'receive: {e}')
            self.tcp_socket.close()

    def find_room(self, room_name):
        if room_name in self.rooms and len(self.rooms[room_name].clients) > 0:
            return True
        return False

    def create_room(self, room_name, client):
        self.rooms[room_name] = ChatRoom(room_name)
        self.rooms[room_name].add_client(client)

    def assign_room(self, room_name, client):
        if not self.rooms[room_name].add_client(client):
            return False
        return True

    def generate_token(self):
        return secrets.token_hex(Server.TOKEN_SIZE)

    def destroy_empty_room_periodically(self):
        while True:
            empty_room = []
            for room in self.rooms.values():
                room.check_timeout()
                room.delete_inactive_clients()
                if len(room.clients) == 0:
                    empty_room.append(room.name)
            for room_name in empty_room:
                del self.rooms[room_name]
            time.sleep(10)


if __name__ == "__main__":

    server = Server()
    server.start()
