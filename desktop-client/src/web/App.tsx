import { useState, useEffect } from "react";
import { Client } from './Client';
import "./App.css";

export const App = () => {
  // const [client, setClient] = useState<Client | null>(null);
  const [client] = useState(new Client());
  const [username, setUsername] = useState('');
  const [roomname, setRoomname] = useState('');
  const [message, setMessage] = useState("");
  // const [chatLog, setChatLog] = useState<string[]>([]);
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState<string[]>([]); // メッセージの状態を保存

  const addMessage = (sender: string, message: string) => {
    setMessages((prev) => [...prev, `${sender}: ${message}`]);
  }

  const handleOperation = async (op: number) => {
    if (client) {
      await client.start(op, username, roomname);
      // その他の処理（メッセージの受信の開始など）をここに追加することができます
    } else {
      console.error("Client is not initialized yet.");
    }
  };

  const sendMessage = () => {
    client.sendMessages(message);
    setMessage(""); // Clear the input
  };

  useEffect(() => {
    client.receiveMessages(addMessage); // コールバック関数を渡す
  }, []);

  

  return (
    <div className="container">
      <div>
        <input 
          placeholder="Your Name" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} />
        <input 
          placeholder="Room Name" 
          value={roomname} 
          onChange={(e) => setRoomname(e.target.value)} />
      </div>
      <div>
        <button onClick={() => handleOperation(1)}>Create</button>
        <button onClick={() => handleOperation(2)}>Join</button> 
      </div>
      <div>
      <div>
            ...
            {messages.map((msg, idx) => (
                <p key={idx}>{msg}</p>
            ))}
            ...
      </div>
            

            <textarea value={message} onChange={e => setMessage(e.target.value)}></textarea>
            <button onClick={sendMessage}>Send Message</button>
        </div>
    </div>
    
  );
};