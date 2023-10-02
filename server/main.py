from Server import Server

if __name__ == "__main__":
    tcp_address = ('localhost', 8000)
    udp_address = ('localhost', 9000)
    server = Server(tcp_address, udp_address)
    server.start()
