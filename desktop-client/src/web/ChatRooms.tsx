import React, { useState, useEffect } from "react";
import { Client } from "./Client";
import {
  Button,
  Heading,
  VStack,
  Grid,
  Box,
  Center,
  Flex,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import CreateRoomModal from "./CreateRoomModal";
import PasswordModal from "./PasswordModal";

interface Room {
  roomName: string;
  members: string[];
  password_required: boolean;
}

const defaultRooms: Room[] = [
  {
    roomName: "room1",
    members: ["user1", "user2"],
    password_required: false,
  },
  {
    roomName: "room2",
    members: ["user1", "user2"],
    password_required: true,
  },
];

const ChatRooms: React.FC = () => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const handleEnterRoom = async (clientName: string, roomName: string) => {
    if (rooms.find((room) => room.roomName === roomName)?.password_required) {
      setSelectedRoom(roomName);
      setIsPasswordModalOpen(true);
    } else {
      await client?.start(2, clientName, roomName, "");
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    await client?.start(2, "Anonymous", selectedRoom!, password);
    setIsPasswordModalOpen(false);
  };

  const handleCreateRoom = async (roomName: string, password: string) => {
    await client?.start(1, "Anonymous", roomName, password);
    setIsCreateRoomModalOpen(false);
  };

  useEffect(() => {
    if (!client) {
      const anonymousClient = new Client();
      anonymousClient.setName("Anonymous");
      setClient(anonymousClient);
      return;
    }

    const getAvailableRoomCallback = (roomsData: any) => {
      if (!roomsData) return;
      const roomNames = Object.keys(roomsData);
      const availableRooms = [];
      for (let roomName of roomNames) {
        const room: Room = {
          roomName: roomName,
          members: roomsData[roomName].members,
          password_required: roomsData[roomName].password_required,
        };
        availableRooms.push(room);
      }
      setRooms(availableRooms);
    };

    client!.getAvailableRoom(getAvailableRoomCallback);
  }, [client]);

  return (
    <VStack spacing={4} align="stretch">
      <Button
        alignSelf="flex-start"
        backgroundColor="lightblue"
        textColor="Blue"
        maxW="sm"
        onClick={() => setIsCreateRoomModalOpen(true)}
      >
        Create Room
      </Button>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        setIsModalOpen={setIsCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        handleCreateRoom={handleCreateRoom}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />

      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        {rooms.map((room, index) => (
          <Box key={index} borderWidth="1px" borderRadius="lg" padding={4}>
            <Flex direction="column" height="100%">
              <Center flexGrow={1}>
                <Heading size="md">{room.roomName}</Heading>
              </Center>
              <p>Members: {room.members.join(", ")}</p>
              <Button
                mt={4}
                alignSelf="center"
                onClick={() => {
                  if (room.password_required) {
                    setIsPasswordModalOpen(true);
                    return;
                  }
                  const clientName = prompt("Enter your name");
                  if (clientName) handleEnterRoom(clientName, room.roomName);
                }}
              >
                <Link to={`/chatroom/${room.roomName}`}>Enter</Link>
              </Button>
            </Flex>
          </Box>
        ))}
      </Grid>
    </VStack>
  );
};

export default ChatRooms;
