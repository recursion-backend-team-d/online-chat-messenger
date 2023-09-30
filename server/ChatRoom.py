import time


class ChatRoom:
    TIMEOUT = 300

    def __init__(self, name):
        self.clients = {}  # {name: ChatClient}
        self.verified_token_to_address = {}  # {token: address}
        self.name = name

    def can_add_client(self, client):
        if client.name in self.clients:
            return False
        return True

    def add_client(self, client):
        self.verified_token_to_address[client.token] = client.address
        self.clients[client.name] = client

    def remove_client(self, name):
        if name in self.clients:
            if self.clients[name].is_host:
                for client in self.clients.values():
                    self.notify_disconnection(client)
                self.clients.clear()
                self.verified_token_to_address.clear()
            else:
                self.notify_disconnection(self.clients[name])
                del self.clients[name]
                del self.verified_token_to_address[self.clients[name].token]

    def check_timeout(self):
        for client in self.clients.values():
            if client.last_active + self.TIMEOUT < time.time():
                self.remove_client(client.name)

    def notify_disconnection(self, client):
        client.send('You have been disconnected')

    def broadcast(self, msg, sender=None):
        for client in self.clients.values():
            if sender and client.name == sender.name:
                continue
            if self.is_authenticated(client.token, client.address):
                client.send(msg, sender)

    def is_authenticated(self, token, address):
        if token in self.verified_token_to_address and \
           self.verified_token_to_address[token] == address:
            return True
        return False

    def get_client_by_name(self, name):
        return self.clients[name]
