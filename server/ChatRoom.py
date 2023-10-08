import time


class ChatRoom:
    TIMEOUT = 300

    def __init__(self, name, password=""):
        self.clients = {}  # {name: ChatClient}
        self.verified_token_to_address = {}  # {token: address}
        self.name = name
        self.is_password_required = (password != "")
        self.password = password

    def add_client(self, client):
        if client.name in self.clients:
            return False
        self.verified_token_to_address[client.token] = client.address
        self.clients[client.name] = client
        return True

    def remove_client(self, name):
        if name not in self.clients:
            return

        if self.clients[name].is_host:
            self.remove_all_clients()
        else:
            self.notify_disconnection(self.clients[name])
            del self.verified_token_to_address[self.clients[name].token]
            del self.clients[name]

    def remove_all_clients(self):
        for client in self.clients.values():
            self.notify_disconnection(client)
        self.clients.clear()
        self.verified_token_to_address.clear()

    def check_timeout(self):
        timed_out_clients = []
        for client in self.clients.values():
            if client.last_active + self.TIMEOUT < time.time():
                timed_out_clients.append(client.name)
        for client_name in timed_out_clients:
            self.remove_client(client_name)

    def notify_disconnection(self, client):
        client.send('You have been disconnected')

    def broadcast(self, address, token, msg):
        if not self.is_authenticated(address, token):
            return False
        for client in self.clients.values():
            if (client.token, client.address) != (token, address):
                client.send(msg)
        return True

    def is_authenticated(self, address, token):
        is_token_verified = token in self.verified_token_to_address
        is_address_matched = self.verified_token_to_address.get(
            token) == address
        print(address)
        print(self.verified_token_to_address)
        return is_token_verified and is_address_matched

    def get_client_by_name(self, name):
        return self.clients.get(name)

    def delete_inactive_clients(self):
        inactive_clients = []
        for client in self.clients.values():
            if not client.is_active:
                inactive_clients.append(client)

        for client in inactive_clients:
            self.remove_client(client.name)
