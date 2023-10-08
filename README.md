# online-chat-messenger

### Class Diagram

#### Server

```mermaid
classDiagram
class ChatClient {
  -MAX_INACTIVE_COUNT: int
  -address: tuple
  -name: str
  -token: str
  -is_host: bool
  -udp_socket: socket
  -last_active: float
  -inactive_count: int
  -is_active: bool

  +init(name: str, address: tuple, token: str, is_host: bool)
  +send(msg: str): None
  -send_message(msg: str): None
  -update_last_active(): None
  -handle_send_error(error: Exception): None
  -encode_msg(msg: str): bytes
}

class ChatRoom {
  -TIMEOUT: int
  -clients: dict
  -verified_token_to_address: dict
  -name: str
  -is_password_required: bool
  -password: str

  +init(name: str, password: str)
  +add_client(client: ChatClient): bool
  +remove_client(name: str): None
  +remove_all_clients(): None
  +check_timeout(): None
  +notify_disconnection(client: ChatClient): None
  +broadcast(address: str, token: str, msg: str): bool
  +is_authenticated(address: str, token: str): bool
  +get_client_by_name(name: str): ChatClient
  +delete_inactive_clients(address: str, token: str): None
}

class Server {
  +BUFFER_SIZE: int
  +address: tuple
  +tcp_sokcet: socket.socket
  +udp_socket: socket.socket
  +rooms: dict

  +init(tcp_address: tuple, udp_address: tuple): None
  +start(): None
  +wait_for_client_conn(): None
  +establish_chat(conn): None
  +inform_client_of_available_rooms: None
  +accept_request(conn)
  +send_response(conn, operation, state, status, token): None
  +find_room(room_name): ChatRoom
  +create_room(room_name, client): bool
  +assign_room(room_name, client): bool
  +receive(): None
  +destoroy_empty_room_periodically(): None
}
Server o-- ChatRoom
ChatRoom o-- ChatClient
```

##### Server Class

|  Property  | Description                                                                                                                                              |
| :--------: | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  tcp_address   | tuple で address を受け取る。ソケットを作成する時の引数でもタプルで扱うし、init の引数やプロパティもクラスのプロパティも少なくなるので見通し良くなりそう |
|  udp_address   |  |
| tcp_socket | クライアントと接続を確立する他確立するためのソケット                                                                                                     |
| udp_socket | クライアントとチャットをするために用いるするために用いるソケット                                                                                         |
|   rooms    | ChatRoom を格納しておくための dict key=roomName, value=ChatRoom                                                                                          |

|       Method        | Description                                                                                                                                                                                                                                                                                                                                                                          |
| :-----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|        init         | TCP / UDP addresをtupleで受け取る |
|        start        | サーバーをスタートする。wait_for_client_con, destoroy_empty_room_periodicallyメソッドをそれぞれ別スレッドで呼び出す。receiveはメインスレッドで呼び出す。                                                                                                                                                                                                                                                                                          |
| wait_for_client_con | クライアントの TCP 接続を listen しておく。accept するたびに、別スレッドで establish_chat を呼び出す。その時に、accept の戻り値である、新しく作られたソケットオブジェクトを establish_chat に渡す。                                                                                                                                                                      |
|   establish_chat    | 引数として受け取ったソケットオブジェクト conn を用いて、クライアントとやり取りする。データを受信したのち、ヘッダーの Operation によって create_room か assign_room を呼び出す。その時に ChatClient クラスをインスタンス化してクライアントを作る。インスタンス化には、リクエストのpayloadにあるUDPソケットのIP/ポート番号を渡す。状態ごとに、クライアントにレスポンスを送る |
| inform_client_of_available_rooms | クライアントに入室可能なルームを通知する |
| accept_request | クライアントからのリクエストを受け取る。structモジュールで、room_name, etcに分割、デコードして返す |
| send_response | TCPでレスポンスを返す |
| find_room | 指定されたroom_nameのルームが存在すればそれを返す |
|     create_room     | クライアントのリクエストに基づいて、ChatRoom を作成する。Server の self.rooms に追加する。client を host にする。追加に失敗したらその旨をクライアントにレスポンスする。                                                                                                                                                                                                                                                                      |
|     assign_room     | クライアントのリクエストに基づいて、ChatRoom を割り当てる。self.rooms から対象のルームを探し、そのルームの add_client メソッドを介してクライアントを追加する。追加できたかboolで返す。                                                                                                                                                                                                                       |
|       receive       | UDP ソケットでクライアントからのメッセージを読み取る。ヘッダの roomNameSize, tokenSize を読み取って、適切な ChatRoom の broadcast メソッドでメンバーにメッセージを送信する。追加できたかboolで返す。                                                                                                                                                                                                           |
| generate_token | tokenを生成する |
| destoroy_empty_room_periodically | クライアンいないルームを定期的に削除する |

##### ChatRoom Class

|         Property          | Description                                                  |
| :-----------------------: | :----------------------------------------------------------- |
|          TIMEOUT          | クライアントのタイムアウト                                   |
|          clients          | クライアントを dict で管理する。key=name, value=ChatClient ? |
| verified_token_to_address | 参加したクライアントの token と address を dict で管理する   |
|           name            | ルームの名前。                                               |
| is_password_required | |
| password | |

|         Method          | Description                                                                    |
| :---------------------: | :----------------------------------------------------------------------------- |
|       add_client        | クライアントを追加する。クライアントの name が重複しないようにする。           |
|      remove_client      | クライアントを削除する。ホストを削除する場合には、ルームも解散する。           |
|    remove_all_client    | すべてのクライアントを削除する。                                               |
|     generate_token      | クライアントに対してトークンを生成する。secrets ライブラリを使用する。         |
|      check_timeout      | それぞれのクライアントについてタイムアウトを確認する。                         |
|  notify_disconnection   | タイムアウトしたクライアントにその旨を通知する                                 |
|        broadcast        | 送信者以外にメッセージを送信する。is_authenticated メソッドで token を検証する |
|    is_authenticated     | 引数の token と address の組み合わせを持つクライアントを検索する               |
|   get_client_by_name    | name をキーにして ChatClient を取ってくる                                      |
| delete_inactive_clients | アクティブでないアカウントを削除する                                           |

##### ChatClient Class

|      Property      | Description                                      |
| :----------------: | :----------------------------------------------- |
| MAX_INACTIVE_COUNT | 許容される inactive 数の MAX                     |
|      address       | クライアントの address。tuple で受け取る         |
|        name        | クライアントの名前                               |
|       token        | token                                            |
|      is_host       | ホストか否か                                     |
|     udp_socket     | クライアントにメッセージを送信するためのソケット |
|    last_active     | 最後にアクティブだった時                         |
|   inactive_count   | inactive だった回数                              |
|    last_active     | 最後にアクティブだった時                         |
|     is_active      | 現在アクティブか                                 |

|       Method       | Description                                                                         |
| :----------------: | :---------------------------------------------------------------------------------- |
|        init        | address の tuple を受け取る                                                         |
|        send        | self.udp_socket の sendto メソッドを使い、self.address に対してメッセージを送信する |
|    send_message    | send 関数内のヘルパー関数                                                           |
| update_last_active | send 関数内の last_active の更新                                                    |
| handle_send_error  | send 関数内の例外処理                                                               |
|     encode_msg     | msg をエンコードする                                                                |

#### Client

```mermaid
classDiagram
class Client {
  +ROOM_NAME_SIZE: int
  +NAME_SIZE: int
  +BUFFER_SIZE: int
  +tcp_socket: socket.socket
  +udp_socket: socket.socket
  +tcp_server_address: tuple
  +udp_server_address: tuple
  +client_udp_address: str
  +client_udp_port: int
  +name_size: int
  +username: str
  +room_name: str
  +room_name_size: int
  +token: str
  +token_size: int

  +init(server_address, server_port): None
  +start(): None
  +prompt_for_name(): None
  +prompt_for_operation(): int
  +prompt_for_roomname(): None
  +connect_server(): None
  +join_room(): None
  +send_messages(): None
  +receive_messages(): None
}
```

##### Client Class

|  Property  | Description                  |
| :--------: | :--------------------------- |
| ROOM_NAME_SIZE | roomnameの最大サイズ |
| NAME_SIZE | usernameの最大サイズ |
| BUFFER_SIZE | 1度に送受信できるデータの最大サイズ |
| tcp_socket | 接続を確立するためのソケット |
| udp_socket | チャットのためのソケット     |
| tcp_server_address | TCP接続用のサーバのアドレス     |
| udp_server_address | UDP接続用のサーバのアドレス     |
| client_udp_address | クライアントのudp接続する際のIPアドレス     |
| client_udp_port | クライアントのudp接続する際のポート番号     |
|    name_size    | ユーザーのnameサイズ                         |
|    username    | ユーザーの名前                    |
|    room_name    | 部屋の名前                    |
|    room_name_size    | 部屋の名前のサイズ                    |
|   token    | token                        |
|   token_size    | tokenのサイズ                        |

|     Method      | Description                                                                                                                                                                                     |
| :-------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      init       | サーバの address を tuple で受け取る                                                                                                                                                            |
|      start      | connect_server を呼び出す。                                                                                                                                                                     |
| prompt_for_name | username の入力を促す                                                                                                                                                                               |
| prompt_for_operation | 部屋を作成するか参加するかの入力を促す                                                                                                                                                                               |
| prompt_for_roomname | room_name の入力を促す                                                                                                                                                                               |
| connect_server  | TCP でサーバに接続を行う                                                                                                                                                                        |
|    join_room    | roomName の入力を受け付ける。リクエストを送り、サーバのレスポンスを待つ。正常にルームの作成(op 1)、参加(op 2)完了のレスポンスを受け取る。receive を別スレッドで呼び出す。同時に send を呼び出す |
|     receive     | self.udp_socket でメッセージを受信する                                                                                                                                                          |
|      send_messages       | udp_socket でメッセージをサーバに送信する                                                                                                                                                       |
|      receive_messages       | udp_socket でメッセージをサーバから受信する                                                                                                                                                       |

### TCP
- ヘッダー（32バイト）：RoomNameSize（1バイト） | Operation（1バイト） | State（1バイト） | OperationPayloadSize（29バイト）
- ボディ：最初のRoomNameSizeバイトがルーム名で、その後にOperationPayloadSizeバイトが続きます。ルーム名の最大バイト数は2^8バイトであり、OperationPayloadSizeの最大バイト数は2^29バイトです。
#### Client Request
```json
// op 1 (create room), op 2 (join room)
  {
  "rooms": [
      "room_name1": {
      "members": ["member_name1", "member_name2"...],
      "password_required": true
      }
  ]
  }
  // サーバの初期化（0）
  {
    "username": "example",
    "ip": "",
    "port": "",
    "password": "", // Optional
  }
```

#### Server Response
```json
// op 1 (create room), op 2 (join room)
  // リクエストの応答（1）
  {
    "status": 202,
    "message": "example message"
  }

  // リクエストの完了（2）
  {
    "status": 201,
    "message": "example message"
    "token" "example token"
  }
```

### UDP
- Client側でメッセージのサイズを検証。4096を超えたら再入力を促す。
- ヘッダー：RoomNameSize（1バイト）| TokenSize（1バイト）
- ボディ：最初のRoomNameSizeバイトはルーム名、次のTokenSizeバイトはトークン文字列、そしてその残りが実際のメッセージです。
```
// 通常メッセージ
{
  "sender": "example sender",
  "message": "example",
}
// システム（送受信）
// ヘッダー：RoomNameSize（1バイト）| TokenSize（1バイト）
// operation 1(入室), 2（退室）
{
  "sender": "system",
  "operation": 0,
  "username": "example,
}
```