import json
import socket
import struct
import threading
import secrets

# TODO destroy empty room periodically


class ChatRoom:
    pass


class ChatClient:
    pass


class Server:
    HEADER_SIZE = 32
    BODY_SIZE = 4096
    MSG_HEADER_SIZE = 2
    MSG_BODY_SIZE = 2
    TOKEN_SIZE = 255

    def __init__(self, address):
        self.address = address
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.rooms = {}

        self.tcp_socket.bind(self.address)
        self.udp_socket.bind(self.address)

    def start(self):
        threading.Thread(target=self.wait_for_client_con, daemon=True).start()
        threading.Thread(target=self.receive, daemon=True).start()

    def wait_for_client_con(self):
        # TODO listen arg
        self.tcp_socket.listen()

        while True:
            conn, client_address = self.tcp_socket.accept()
            threading.Thread(target=self.establish_chat,
                             args=(conn, client_address,)).start()

    def establish_chat(self, conn, client_address):
        room_name, operation, state, operation_payload = self.accept_request()
        # TODO accept response

        token = self.generate_token()
        # Create a new chat room
        if operation == 1:
            # Success
            if not self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'], client_address, token, True)
                self.create_room(room_name, client)
                # TODO success response
            # Failure
            else:
                # TODO failure response
                pass

        # Join a existing room
        if operation == 2:
            # Success
            if self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'],
                    client_address, token, False)
                self.assign_room()
                # TODO success response
            # Failure
            else:
                # TODO failure response
                pass

    def accept_request(self, conn):
        header = conn.recv(Server.HEADER_SIZE)
        body = conn.recv(Server.BODY_SIZE)
        # TODO accept response
        # TODO unpack error
        room_name_size, operation, state, operation_payload_size = \
            struct.unpack('BBB29c', header)
        room_name, operation_payload = struct.unpack(
            f'{room_name_size}c{operation_payload_size}c', body)
        room_name = room_name.decode()
        operation_payload = json.loads(operation_payload)
        return room_name, operation, state, operation_payload

    def send_response(self, conn, status, msg):
        pass

    def receive(self):
        while True:
            data, address = self.udp_socket.recv(Server.MSG_HEADER_SIZE)
            room_name_size, token_size = struct.unpack(
                'BB', data[0:Server.MSG_HEADER_SIZE])
            room_name, token, msg = \
                struct.unpack(f'{room_name_size}c{token_size}c \
                        {Server.MSG_BODY_SIZE - room_name_size - token_size}',
                              data[Server.MSG_HEADER_SIZE:])
            # TODO token authentication
            # TODO error response when broadcast fails
            self.rooms[room_name.decode()].broadcast(
                address, token, msg.decode())

    def find_room(self, room_name):
        if room_name in self.rooms and len(self.rooms[room_name].clients) > 0:
            return True
        else:
            del self.rooms[room_name]
            return False

    def create_room(self, room_name, client):
        self.rooms[room_name] = ChatRoom(room_name)
        # TODO error response when add clients fails
        self.rooms[room_name].add_client(client)

    def assign_room(self, room_name, client):
        # TODO error response when add clients fails
        self.rooms[room_name].add_client(client)

    def generate_token(self):
        return secrets.token_bytes(Server.TOKEN_SIZE)


if __name__ == "__main__":

    server = Server()
    server.start()
