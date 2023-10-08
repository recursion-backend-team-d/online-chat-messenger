import * as dgram from "dgram";
import * as net from "net";
import { Buffer } from "buffer";

type MessageCallback = (sender: string, message: string) => void;
type SystemCallback = (
  sender: string,
  operation: number,
  username: string
) => void;

export class Client {
  private static readonly ROOM_NAME_SIZE = 255;
  private static readonly NAME_SIZE = 255;
  private static readonly BUFFER_SIZE = 4096;
  private static readonly SERVER_ADDRESS = "127.0.0.1";
  private static readonly TCP_PORT = 8000;
  private static readonly UDP_PORT = 9000;
  private static readonly TIMEOUT_MS = 5000; // 例: 5秒

  public tcpSocket: net.Socket;
  public udpSocket: dgram.Socket;
  private tcpServerAddress: [string, number];
  private udpServerAddress: [string, number];
  private udpAddress: string = "127.0.0.1";
  private udpPort: number = 0;
  private nameSize: number = 0;
  private username: string = "";
  private roomName: string = "";
  private roomNameSize: number = 0;
  private token: string = "";
  private tokenSize: number = 0;
  private residualData: Buffer | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    console.log("This is a constructor.");
    this.tcpSocket = new net.Socket();
    this.udpSocket = dgram.createSocket("udp4");
    this.tcpServerAddress = [Client.SERVER_ADDRESS, Client.TCP_PORT];
    this.udpServerAddress = [Client.SERVER_ADDRESS, Client.UDP_PORT];

    this.udpSocket.bind(() => {
      // Node.jsのaddress()メソッドは、ソケットがバインドされたアドレスを返す。
      // address() メソッドは、オブジェクト { port: number, family: string, address: string } を返す。
      const address = this.udpSocket.address();
      // this.udpAddress = address.address;
      this.udpPort = address.port;
      console.log(address);
    });
    console.log("Success constructor");
  }

  async getAvailableRoomForLoop(callback: (rooms: any) => void){
    // if (this.intervalId) {
    //   console.warn("Requests are already being sent periodically. If you want to restart, please stop first.");
    //   return;
    // }

    const sendRequestToServer = async () => {
      // ここでサーバーへのリクエストを実装します
      console.log("Sending request to server...");
      const header = Buffer.alloc(32);
      header.writeUInt8(this.roomNameSize, 0);
      header.writeUInt8(3, 1);
      header.writeUInt8(0, 2);
      const payloadSizeBuffer = Buffer.alloc(29);
      const payload = {
        username: this.username,
        ip: this.udpAddress,
        port: this.udpPort,
      };
      const payloadData = Buffer.from(JSON.stringify(payload), "utf-8");
      payloadSizeBuffer.writeBigUInt64BE(BigInt(payloadData.length), 21); // ペイロードの長さを最後の8バイトに書き込む
      header.set(payloadSizeBuffer, 3); // 第3バイトから始まる位置にpayloadSizeBufferをセット
      // console.log(header.length)
      const roomNameBuffer = Buffer.from(this.roomName, "utf-8");

      // Combine the header, room name, and payload data into a single buffer
      const fullMessage = Buffer.concat([header, roomNameBuffer, payloadData]);
      this.tcpSocket.write(fullMessage);
      console.log("Sending request to server for rooms");
      // 例: this.tcpSocket.write(requestData);

      // サーバーから入室可能なルームの情報のheaderを受け取る
      const headerBuffer = await this.getResponseData(32);
      // headerの解析
      const resHeader = this.readHeader(headerBuffer);
      console.log(resHeader);
      console.log("receiving responsePayload");
      // サーバーから入室可能なルームの情報を受け取る
      const responsePayloadDate = await this.getResponseData(
        resHeader.payloadLength
      );
      console.log("get responsePayload");
      console.log(responsePayloadDate);
      // 受け取った情報をデコードしてJSON形式からJSのオブジェクトへ変換
      const responsePayload = JSON.parse(responsePayloadDate.toString("utf-8"));
      callback(responsePayload["rooms"]);
    }

    // 5秒ごとにsendRequestToServer関数を実行する
    this.intervalId = setInterval(sendRequestToServer, 5000); // 5秒毎に実行
  }

  // リクエストの送信を停止するメソッド
  stopSendingRequests(): void {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log("Stopped sending periodic requests.");
    } else {
        console.warn("No periodic requests are currently being sent.");
    }
  }

  // usernameをセットするボタンを押した瞬間にこのメソッドを使用することを想定
  async getAvailableRoom(callback: (rooms: any) => void) {
    // サーバーにコネクト
    await this.connectServer();
    // サーバーから入室可能なルームの情報のheaderを受け取る
    const headerBuffer = await this.getResponseData(32);
    // headerの解析
    const header = this.readHeader(headerBuffer);
    console.log(header);
    console.log("receiving responsePayload");
    // サーバーから入室可能なルームの情報を受け取る
    const responsePayloadDate = await this.getResponseData(
      header.payloadLength
    );
    console.log("get responsePayload");
    console.log(responsePayloadDate);
    // 受け取った情報をデコードしてJSON形式からJSのオブジェクトへ変換
    const responsePayload = JSON.parse(responsePayloadDate.toString("utf-8"));
    callback(responsePayload["rooms"]);
  }

  async start(
    operation: number,
    name: string,
    roomname: string,
    password: string = ""
  ) {
    await this.joinRoom(operation, name, roomname, password);
  }

  setName(name: string): void {
    if (new TextEncoder().encode(name).length > Client.NAME_SIZE) {
      throw new Error(
        `Your name must be equal to or less than ${Client.NAME_SIZE} bytes`
      );
    }
    this.nameSize = new TextEncoder().encode(name).length;
    this.username = name;
  }

  setRoomname(roomname: string): void {
    if (new TextEncoder().encode(roomname).length > Client.NAME_SIZE) {
      throw new Error(
        `Room name must be equal to or less than ${Client.ROOM_NAME_SIZE} bytes`
      );
    }
    this.roomNameSize = new TextEncoder().encode(roomname).length;
    this.roomName = roomname;
  }

  async connectServer(): Promise<void> {
    this.tcpSocket.connect(this.tcpServerAddress[1], this.tcpServerAddress[0]);
  }

  async joinRoom(
    operation: number,
    name: string,
    roomname: string,
    password: string
  ): Promise<void> {
    this.setName(name);
    this.setRoomname(roomname);

    const payload = {
      username: this.username,
      ip: this.udpAddress,
      port: this.udpPort,
    };

    // payloadをJSON形式の文字列に変換してからencode
    const payloadData = Buffer.from(JSON.stringify(payload), "utf-8");
    console.log(payloadData);
    const payloadLength = payloadData.length;
    console.log("payloadLength: " + payloadLength);
    const roomNameBuffer = Buffer.from(this.roomName, "utf-8");

    // Create the header buffer
    const header = Buffer.alloc(32);
    header.writeUInt8(this.roomNameSize, 0);
    header.writeUInt8(operation, 1);
    header.writeUInt8(0, 2);
    const payloadSizeBuffer = Buffer.alloc(29);
    payloadSizeBuffer.writeBigUInt64BE(BigInt(payloadData.length), 21); // ペイロードの長さを最後の8バイトに書き込む
    header.set(payloadSizeBuffer, 3); // 第3バイトから始まる位置にpayloadSizeBufferをセット
    // console.log(header.length)

    // Combine the header, room name, and payload data into a single buffer
    const fullMessage = Buffer.concat([header, roomNameBuffer, payloadData]);
    this.tcpSocket.write(fullMessage);

    // サーバーから応答、完了待ち header + payload
    while (true) {
      console.log("Success request!!");

      // const headerBuffer = await this.getResponseData(32);

      try {
        const headerBuffer = await Promise.race([
          this.getResponseData(32),
          this.timeout(Client.TIMEOUT_MS),
        ]);

        // const readHeader = (data: Buffer) => {
        //   const roomNameSize = data.readUInt8(0);
        //   const operation = data.readUInt8(1);
        //   const state = data.readUInt8(2);

        //   // 29バイトの長さを持つpayload_lengthをBigIntとして読み取る
        //   const payloadLengthData = data.subarray(3, 32);
        //   let payloadLength = 0n; // BigIntの初期値
        //   for (let i = 0; i < payloadLengthData.length; i++) {
        //     payloadLength = payloadLength * 256n + BigInt(payloadLengthData[i]);
        //   }

        //   return {
        //     roomNameSize,
        //     operation,
        //     state,
        //     payloadLength: Number(payloadLength), // 必要に応じてBigIntのまま使うこともできます
        //   };
        // };

        // headerBufferを解析
        const header = this.readHeader(headerBuffer);

        console.log(header);

        console.log("receiving responsePayload");

        const responsePayloadDate = await this.getResponseData(
          header.payloadLength
        );

        console.log("get responsePayload");
        console.log(responsePayloadDate);
        console.log(responsePayloadDate.toString("utf-8"))
        const responsePayload = JSON.parse(
          responsePayloadDate.toString("utf-8")
        );

        if (header.state === 1) {
          console.log("Received a request response from the server.");
          console.log(responsePayload.message);
          continue;
        } else if (header.state === 2) {
          console.log(responsePayload);
          this.token = responsePayload.token;
          console.log(this.token);
          this.tokenSize = Buffer.from(this.token, "hex").length;
          console.log(this.tokenSize);
          console.log("Connection successfully established.");
          this.tcpSocket.end();
          this.residualData = null;
          break;
        }
      } catch (error) {
        if (typeof error === "string") {
          console.error("Error sending message:", error);
        } else if (error instanceof Error) {
          console.error("Error sending message:", error.message);
        } else {
          console.error(
            "An unknown error occurred when sending message:",
            error
          );
        }
        console.log("socket closing...");
        this.tcpSocket.end();
        this.residualData = null;
        return; // またはエラーをUIに伝えるための処理
      }
    }
  }

  readHeader(data: Buffer) {
    const roomNameSize = data.readUInt8(0);
    const operation = data.readUInt8(1);
    const state = data.readUInt8(2);

    // 29バイトの長さを持つpayload_lengthをBigIntとして読み取る
    const payloadLengthData = data.subarray(3, 32);
    let payloadLength = 0n; // BigIntの初期値
    for (let i = 0; i < payloadLengthData.length; i++) {
      payloadLength = payloadLength * 256n + BigInt(payloadLengthData[i]);
    }

    return {
      roomNameSize,
      operation,
      state,
      payloadLength: Number(payloadLength), // 必要に応じてBigIntのまま使うこともできます
    };
  }

  private async getResponseData(Length: number): Promise<Buffer> {
    let responsePayloadData: Buffer;
    if (this.residualData === null || this.residualData.length < Length) {
      responsePayloadData = await this.readFromSocket(this.tcpSocket, Length);
    } else {
      responsePayloadData = this.residualData.subarray(0, Length);
      this.residualData = this.residualData.subarray(Length);
    }
    return responsePayloadData;
  }

  readFromSocket(socket: net.Socket, length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let accumulatedData: Buffer[] = [];
      if (this.residualData) {
        accumulatedData.push(this.residualData);
        this.residualData = null;
      }

      let accumulatedLength = 0;

      const dataListener = (chunk: Buffer) => {
        console.log(`Received chunk of length: ${chunk.length}`);
        console.log(`Received chunk content: ${chunk.toString("utf-8")}`);
        accumulatedLength += chunk.length;
        accumulatedData.push(chunk);

        if (accumulatedLength >= length) {
          socket.removeListener("data", dataListener); // リスナーの削除

          const combinedData = Buffer.concat(accumulatedData);
          console.log(`combineDate: ${combinedData}`);
          const finalData = combinedData.subarray(0, length);
          console.log(`finalDate: ${finalData}`);
          this.residualData = combinedData.subarray(length);
          console.log(`residualData: ${this.residualData}`);

          resolve(finalData);
        }
      };

      socket.on("data", dataListener);

      socket.on("error", (err) => {
        console.error("Error while reading from socket:", err);
        reject(err);
      });

      socket.on("end", () => {
        reject(new Error("Socket ended before required bytes were read."));
      });
    });
  }

  // UDP通信のsend
  // GUIでsendボタンが押された時にmessageをもらうことを想定
  async sendMessages(messageContent: string) {
    try {
      const header = Buffer.alloc(2); // 2バイトのBufferを作成
      header.writeUInt8(this.roomNameSize, 0);
      header.writeUInt8(this.tokenSize, 1);

      const sendPayload = {
        sender: this.username,
        message: messageContent,
      };

      const body = Buffer.concat([
        Buffer.from(this.roomName, "utf-8"),
        Buffer.from(this.token, "hex"),
        Buffer.from(JSON.stringify(sendPayload), "utf-8"),
      ]);

      if (header.length + body.length > Client.BUFFER_SIZE) {
        console.log(
          `Messages must be equal to or less than ${
            Client.BUFFER_SIZE -
            header.length -
            this.roomNameSize -
            this.tokenSize
          } bytes`
        );
        return; // Reactの場合は、ここでエラーメッセージをstateに設定して、ユーザーにフィードバックを提供できます。
      }

      const message = Buffer.concat([header, body]);
      this.udpSocket.send(
        message,
        this.udpServerAddress[1],
        this.udpServerAddress[0]
      );
      console.log("transmission complete");
    } catch (error) {
      console.error("Error sending message:", error);
      console.log("socket closing...");
      this.udpSocket.close();
    }
  }

  // UDP通信のreceive
  async receiveMessages(
    messageCallback: MessageCallback,
    systemCallback: SystemCallback
  ): Promise<void> {
    // 既存の 'message' イベントリスナを削除
    this.udpSocket.removeAllListeners("message");
    this.udpSocket.on("message", (msg: Buffer, rinfo: any) => {
      const roomNameSize: number = msg.readUInt8(0);
      const tokenSize: number = msg.readUInt8(1);
      const receivePayloadBuffer: Buffer = msg.subarray(
        2 + roomNameSize + tokenSize
      );
      const receivePayloadString: string =
        receivePayloadBuffer.toString("utf-8");
      const receivePayload = JSON.parse(receivePayloadString);
      console.log(`${receivePayload["sender"]}: ${receivePayload["message"]}`);
      // コールバック関数を呼び出して、senderがsystemかそれ以外でコールバック関数変えています。
      if (receivePayload["sender"] === "system") {
        systemCallback(
          receivePayload["sender"],
          receivePayload["operation"],
          receivePayload["username"]
        );
      } else {
        messageCallback(receivePayload["sender"], receivePayload["message"]);
      }
    });

    this.udpSocket.on("error", (err) => {
      console.error("Error:", err);
      this.udpSocket.close();
    });

    this.udpSocket.on("close", () => {
      console.log("Socket closing...");
    });
  }

  public removeMessageListener(
    messageCallback: MessageCallback,
    systemCallback: SystemCallback
  ): void {
    this.udpSocket.removeListener("message", messageCallback);
    this.udpSocket.removeListener("message", systemCallback);
  }

  // タイムアウトを処理するためのユーティリティ関数
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    );
  }

  public getUserName(): string {
    return this.username;
  }

  public getRoomName(): string {
    return this.roomName;
  }

  createExitMessage(): Buffer {
    // 退出メッセージの作成
    const header = Buffer.alloc(2); // 2バイトのBufferを作成
    header.writeUInt8(this.roomNameSize, 0);
    header.writeUInt8(this.tokenSize, 1);

    const payload = {
      sender: "system",
      operation: 2,
      username: this.username,
    };

    const body = Buffer.concat([
      Buffer.from(this.roomName, "utf-8"),
      Buffer.from(this.token, "hex"),
      Buffer.from(JSON.stringify(payload), "utf-8"),
    ]);

    const exitMessage = Buffer.concat([header, body]);
    return exitMessage;
  }

  leaveRoomUsingUDP(): void {
    // 退出処理のリクエストをサーバーに送信する
    const exitMessage = this.createExitMessage();
    this.udpSocket.send(
      exitMessage,
      this.udpServerAddress[1],
      this.udpServerAddress[0],
      (error) => {
        if (error) {
          console.error("Failed to send exit message:", error);
          return;
        }
        console.log("Exit message sent.");
        // 必要に応じてUDPソケットをクローズ
        // this.udpSocket.close();

        // ステータスの更新や内部変数のクリア
        // this.resetInternalState();
      }
    );
  }
}
