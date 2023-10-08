import { useState, useEffect } from "react";
import { Client } from "./Client";
import { useNavigate } from "react-router-dom";

interface Room {
  roomName: string;
  members: string[];
  password_required: boolean;
}

const Operation = {
  CREATE_ROOM: 1,
  ENTER_ROOM: 2,
};

const useChatRooms = () => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  let navigate = useNavigate();

  const handleEnterRoom = async (roomName: string) => {
    try {
      await client?.start(
        Operation.ENTER_ROOM,
        client?.getUserName(),
        roomName,
        ""
      );
      navigate(`/chatroom/${roomName}/${client?.getUserName()}`);
    } catch (e) {
      console.log(e);
    }
  };

  const handleEnterRoomWithPassword = async (password: string) => {
    try {
      await client?.start(
        Operation.ENTER_ROOM,
        client?.getUserName()!,
        selectedRoom!,
        password
      );
      navigate(`/chatroom/${selectedRoom}/${client?.getUserName()}`);
    } catch (e) {
      console.log(e);
    }
  };

  const handleCreateRoom = async (roomName: string, password: string) => {
    await client?.start(
      Operation.CREATE_ROOM,
      client?.getUserName()!,
      roomName,
      password
    );
    navigate(`/chatroom/${roomName}/${client?.getUserName()}`);
  };

  const handleClientNameSubmit = (clientName: string) => {
    const newClient = new Client();
    newClient.setName(clientName);
    setClient(newClient);
  };

  useEffect(() => {
    if (client) {
      const getAvailableRoomCallback = (roomsData: any) => {
        if (!roomsData) return;
        const roomNames = Object.keys(roomsData);
        const availableRooms = [];
        for (let roomName of roomNames) {
          const room: Room = {
            roomName: roomName,
            members: roomsData[roomName]?.members,
            password_required: roomsData[roomName].password_required,
          };
          availableRooms.push(room);
        }
        setRooms(availableRooms);
      };

      client.getAvailableRoom(getAvailableRoomCallback);
    }
  }, [client]);

  return {
    client,
    rooms,
    selectedRoom,
    setSelectedRoom,
    handleEnterRoom,
    handleEnterRoomWithPassword,
    handleCreateRoom,
    handleClientNameSubmit,
  };
};

export default useChatRooms;
