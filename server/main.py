from Server import Server

if __name__ == "__main__":
    tcp_address = ('127.0.0.1', 8000)
    udp_address = ('127.0.0.1', 9000)
    server = Server(tcp_address, udp_address)
    server.start()
