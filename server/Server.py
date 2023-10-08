import json
import secrets
import socket
import struct
import threading
import time
from enum import IntEnum

from ChatClient import ChatClient
from ChatRoom import ChatRoom

STATUS_MESSAGE = {
    200: 'Successfully joined a chat room',
    201: 'Successfully create a chat room',
    202: 'Server accpeted your request',
    401: 'Token or room password is invalid',
    404: 'Requested chat room does not exist',
    409: 'Requested room name or username already exists',
}


class Operation(IntEnum):
    CREATE_ROOM = 1
    JOIN_ROOM = 2
    FETCH_ROOM_INFO = 3


class DataSize(IntEnum):
    REQUEST_HEADER_SIZE = 32
    MESSAGE_SIZE = 4096
    MSG_HEADER_SIZE = 2
    TOKEN_SIZE = 125


class Status(IntEnum):
    ACKNOWLEDGE = 1
    COMPLETE = 2


class Server:
    def __init__(self, tcp_address, udp_address):
        self.tcp_address = tcp_address
        self.udp_address = udp_address
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.rooms = {}

        self.tcp_socket.bind(self.tcp_address)
        self.udp_socket.bind(self.udp_address)
        self.tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

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
                threading.Thread(target=self.establish_chat, args=(conn,)).start()
            except Exception as e:
                print(f'wait_for_client_conn: {e}')
                print('socket closing....')
                self.tcp_socket.close()

    def establish_chat(self, conn):
        room_name, operation, state, operation_payload = self.receive_request(conn)
        print(room_name, operation, state, operation_payload)
        self.send_response(conn, operation, Status.ACKNOWLEDGE, 202)

        token = self.generate_token()
        if operation == Operation.CREATE_ROOM:
            if not self.find_room(room_name):
                client = ChatClient(operation_payload['username'],
                                    (operation_payload['ip'], operation_payload['port'],), token, True)
                # パスワードがpayloadにあれば、ルームにそれを付与する
                if 'password' in operation_payload:
                    self.create_room(room_name, client, operation_payload['password'])
                else:
                    self.create_room(room_name, client)
                self.send_response(conn, operation, Status.COMPLETE, 201, token)
            else:
                self.send_response(conn, operation, Status.COMPLETE, 409)

        if operation == Operation.JOIN_ROOM:
            if self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'],
                    (operation_payload['ip'], operation_payload['port'],),
                    token, False)

                room_to_join = self.find_room(room_name)
                if room_to_join.is_password_required and 'password' not in operation_payload:
                    self.send_response(conn, operation, Status.COMPLETE, 401)
                    return
                if room_to_join.is_password_required \
                        and room_to_join.password != operation_payload['password']:
                    self.send_response(conn, operation, Status.COMPLETE, 400)
                    return
                if self.assign_room(room_name, client):
                    self.send_response(conn, operation, Status.COMPLETE, 200, token)
                else:
                    self.send_response(conn, operation, Status.COMPLETE, 409)
            else:
                self.send_response(conn, operation, Status.COMPLETE, 404)

        if operation == Operation.FETCH_ROOM_INFO:
            print('here')
            self.inform_client_of_available_rooms(conn)

    def inform_client_of_available_rooms(self, conn):
        try:
            payload = {
                "rooms": []
            }
            for room_name, room in self.rooms.items():
                if len(room.clients) == 0:
                    continue
                room_data = {
                    "members": list(room.clients.keys()),
                    "password_required": room.is_password_required,
                }
                payload["rooms"].append({room_name: room_data})
            print(payload)
            payload_data = json.dumps(payload).encode('utf-8')
            header = struct.pack('!B B B 29s', 0, Operation.FETCH_ROOM_INFO, Status.COMPLETE,
                                 len(payload_data).to_bytes(29, 'big'))
            conn.send(header + payload_data)
        except Exception as e:
            print(f'inform_client_of_available_rooms: {e}')
            self.tcp_socket.close()

    def receive_request(self, conn):
        header = conn.recv(DataSize.REQUEST_HEADER_SIZE)
        room_name_size, operation, state, operation_payload_size = struct.unpack('!B B B 29s', header)
        room_name = conn.recv(room_name_size)
        room_name = room_name.decode()
        operation_payload = conn.recv(
            int.from_bytes(operation_payload_size, 'big'))
        operation_payload = json.loads(operation_payload)
        return room_name, operation, state, operation_payload

    def send_response(self, conn, operation, state, status, token=''):
        try:
            payload = {
                'status': status,
                'message': STATUS_MESSAGE[status],
            }
            if token:
                payload['token'] = token
            payload_data = json.dumps(payload).encode('utf-8')
            header = struct.pack('!B B B 29s', 0, operation, state, len(payload_data).to_bytes(29, 'big'))
            conn.send(header + payload_data)
        except Exception as e:
            print(f'send_response: {e}')
            print('socket closing....')
            self.tcp_socket.close()

    def receive(self):
        try:
            while True:
                data, address = self.udp_socket.recvfrom(DataSize.MESSAGE_SIZE)
                room_name_size, token_size = struct.unpack('!B B', data[:DataSize.MSG_HEADER_SIZE])
                room_name = data[DataSize.MSG_HEADER_SIZE:DataSize.MSG_HEADER_SIZE +
                                 room_name_size].decode('utf-8')
                token = data[DataSize.MSG_HEADER_SIZE + room_name_size:DataSize.MSG_HEADER_SIZE +
                             room_name_size + token_size].decode('utf-8')
                payload = json.loads(data[DataSize.MSG_HEADER_SIZE +
                                     room_name_size + token_size:].decode('utf-8'))
                if not self.rooms[room_name].broadcast(address, token, payload):
                    header = struct.pack('!B B', 0, 0)
                    body = {
                        'sender': 'Server',
                        'message': 'You are not authenticated'
                    }
                    body = json.dumps(body).encode('utf-8')
                    self.udp_socket.sendto(header + body, address)
        except Exception as e:
            print(f'receive: {e}')
            self.tcp_socket.close()

    def find_room(self, room_name):
        if room_name in self.rooms and len(self.rooms[room_name].clients) > 0:
            return self.rooms[room_name]
        return None

    def create_room(self, room_name, client, password=''):
        self.rooms[room_name] = ChatRoom(room_name, password)
        self.rooms[room_name].add_client(client)

    def assign_room(self, room_name, client):
        if not self.rooms[room_name].add_client(client):
            return False
        return True

    def generate_token(self):
        return secrets.token_hex(DataSize.TOKEN_SIZE)

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


if __name__ == '__main__':

    server = Server()
    Server.start()
