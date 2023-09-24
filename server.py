import socket
import threading
import time

class Server:
    def __init__(self, server_address='0.0.0.0', server_port=9001):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.server_socket.bind((server_address, server_port))
        self.clients = {} # アドレスをキーとし、ユーザー名と最後の活動時間を値とする
        self.TIMEOUT = 60  # クライアントがタイムアウトするまでの秒数
        

    def start(self):
        threading.Thread(target=self.check_client_timeout).start()
        self.receive_messages()
        
        
    def receive_messages(self):
        try:
            while True:
                print('\nwaiting to receive message')
                message, address = self.server_socket.recvfrom(4096)
                username_len = int.from_bytes(message[:1], byteorder='big')
                username = message[1:1 + username_len].decode('utf-8')
                self.clients[address] = {'username': username, 'last_time': time.time()}
                
                message_for_send = f"{username}: {message[1 + username_len:].decode('utf-8')}"
                print(message_for_send)
                message_for_send = message_for_send.encode('utf-8')
                self.broadcast(message_for_send, address)
        finally:
            print('socket closig....')
            self.server_socket.close()


    def broadcast(self, message, sender_address):
        for address in self.clients:
            self.server_socket.sendto(message, address)

 
    def check_client_timeout(self):
        try:
            while True:
                current_time = time.time()
                inactive_clients = []
                for address, client_info in self.clients.items():
                    if current_time - client_info['last_time'] > self.TIMEOUT:
                        username = client_info['username']
                        print(f"Client {username} ({address}) has timed out.")
                        timeout_message = f"{username} has timed out and left the chat.".encode('utf-8')
                        self.broadcast(timeout_message, address)
                        inactive_clients.append(address)
                for address in inactive_clients:
                    del self.clients[address]
                time.sleep(10)  # タイムアウトチェックの間隔
        finally:
            print('socket closig....')
            self.server_socket.close()


if __name__ == "__main__":
    
    server = Server()
    server.start()
