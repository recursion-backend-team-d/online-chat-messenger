import socket
import threading


class Client:
    NAME_SIZE = 255
    BUFFER_SIZE = 4096
    
    def __init__(self, server_address='0.0.0.0', server_port=9001):
        self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.server_address = server_address
        self.server_port = server_port
        self.name_size = 0
        self.username = ''

    def start(self):
        self.prompt_for_name()
        threading.Thread(target=self.send_messages, daemon=True).start()
        self.receive_messages()
    
    def prompt_for_name(self):
        while True:
            username = input('Enter your username: ')
            if len(username.encode()) > Client.NAME_SIZE:
                print(f'Your name must equal to less than {Client.NAME_SIZE} bytes')
                continue
            self.name_size = len(username.encode())
            self.username = username
            break
    

    def receive_messages(self):
        try:
            while True:
                message, _ = self.client_socket.recvfrom(Client.BUFFER_SIZE)
                print(message.decode('utf-8'))
        finally:
            print('socket closig....')
            self.client_socket.close()

    def send_messages(self):
        try:
            print('Enter your message')
            while True:
                message_content = input('')
                if len(message_content.encode()) + self.name_size + 1 > Client.BUFFER_SIZE:
                    print(f'Messeges must be equal to or less than {Client.BUFFER_SIZE} bytes')
                    continue
                message = self.encode_message(self.username, message_content)
                self.client_socket.sendto(message, (self.server_address, self.server_port))
        finally:
            print('socket closig....')
            self.client_socket.close()

    def encode_message(self, username, message_content):
        username_byte = username.encode('utf-8')
        username_len_byte = len(username_byte).to_bytes(1, byteorder='big')
        message_byte = message_content.encode('utf-8')
        return username_len_byte + username_byte + message_byte


if __name__ == "__main__":
    client = Client()
    client.start()
