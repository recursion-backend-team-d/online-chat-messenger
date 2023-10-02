import json
import socket
import struct
import threading
import secrets
import ChatClient
import ChatRoom

# TODO destroy empty room periodically


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
        self.tcp_socket.listen(10)

        while True:
            conn, client_address = self.tcp_socket.accept()
            threading.Thread(target=self.establish_chat,
                             args=(conn, client_address,)).start()

    def establish_chat(self, conn, client_address):
        room_name, operation, state, operation_payload = self.accept_request()
        self.send_response(
            conn,
            operation,
            state,
            {"status": 202, "message": "Server ackowledged your request."})

        token = self.generate_token()
        # Create a new chat room
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
                    state,
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
                    state,
                    {
                        "status": 400,
                        "message": "Requested chat room already exists."
                    })

        # Join a existing room
        if operation == 2:
            # Success
            if self.find_room(room_name):
                client = ChatClient(
                    operation_payload['username'],
                    (operation_payload["ip"], operation_payload["port"],),
                    token, False)
                if self.assign_room():
                    self.send_response(conn,
                                       operation,
                                       state,
                                       {
                                           "status": 200,
                                           "message": "Server successfully \
                            assigned you to a chat room.",
                                           "token": token
                                       })
                else:
                    self.send_response(conn,
                                       operation,
                                       state,
                                       {
                                           "status": 400,
                                           "message": "Requested \
                                           username is already taken."
                                       })
            # Failure
            else:
                self.send_response(
                    conn,
                    operation,
                    state,
                    {
                        "status": 400,
                        "message": "Requested chat room does not exist."
                    })

    def accept_request(self, conn):
        header = conn.recv(Server.HEADER_SIZE)
        room_name_size, operation, state, operation_payload_size = \
            struct.unpack('!B B B 29s', header)
        room_name = conn.recv(int.from_bytes(room_name_size, 'big'))
        room_name = room_name.decode()
        operation_payload = conn.recv(
            int.from_bytes(operation_payload_size, 'big'))
        operation_payload = json.loads(operation_payload.decode('utf-8'))
        return room_name, operation, state, operation_payload

    def send_response(self, conn, operation, state, payload):
        payload_data = json.dumps(payload).encode('utf-8')
        header = struct.pack('!B B B 29s', 0, operation, state, len(
            payload_data).to_bytes(29, 'big'))
        conn.send(header + payload_data)

    def receive(self):
        while True:
            data, address = self.udp_socket.recv(Server.MSG_HEADER_SIZE)
            room_name_size, token_size = struct.unpack(
                'BB', data[0:Server.MSG_HEADER_SIZE])
            room_name, token, msg = \
                struct.unpack(f'{room_name_size}c{token_size}c \
                        {Server.MSG_BODY_SIZE - room_name_size - token_size}',
                              data[Server.MSG_HEADER_SIZE:])
            if not self.rooms[room_name.decode()].broadcast(
                    address, token, msg.decode()):
                self.udp_socket.sendto(
                    "You are not authenticated".encode('utf-8'), address)

    def find_room(self, room_name):
        if room_name in self.rooms and len(self.rooms[room_name].clients) > 0:
            return True
        else:
            del self.rooms[room_name]
            return False

    def create_room(self, room_name, client):
        self.rooms[room_name] = ChatRoom(room_name)
        self.rooms[room_name].add_client(client)

    def assign_room(self, room_name, client):
        self.rooms[room_name].add_client(client)

    def generate_token(self):
        return secrets.token_bytes(Server.TOKEN_SIZE)


if __name__ == "__main__":

    server = Server()
    server.start()
