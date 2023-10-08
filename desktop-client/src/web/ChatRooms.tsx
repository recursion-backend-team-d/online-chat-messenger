import React, { useState } from "react";
import {
  Button,
  Heading,
  VStack,
  Grid,
  Box,
  Center,
  Flex,
  Text,
} from "@chakra-ui/react";
import CreateRoomModal from "./CreateRoomModal";
import PasswordModal from "./PasswordModal";
import ClientNameModal from "./ClientNameModal";
import useChatRooms from "./useChatRooms";

const ChatRooms: React.FC = () => {
  const {
    client,
    rooms,
    setSelectedRoom,
    handleEnterRoom,
    handleEnterRoomWithPassword,
    handleCreateRoom,
    handleClientNameSubmit,
  } = useChatRooms();

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isClientNameModalOpen, setIsClientNameModalOpen] = useState<boolean>(
    !client
  );

  const handleOpenPasswordModal = (roomName: string) => {
    setSelectedRoom(roomName);
    setIsPasswordModalOpen(true);
  };

  return (
    <>
      <ClientNameModal
        isOpen={isClientNameModalOpen}
        onClose={() => setIsClientNameModalOpen(false)}
        onSubmit={handleClientNameSubmit}
      />

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
        <Text>Welcome to the chatroom! {client?.getUserName()}</Text>

        <CreateRoomModal
          isOpen={isCreateRoomModalOpen}
          setIsModalOpen={setIsCreateRoomModalOpen}
          onClose={() => setIsCreateRoomModalOpen(false)}
          handleCreateRoom={handleCreateRoom}
        />
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handleEnterRoomWithPassword}
        />

        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {rooms.map((room, index) => (
            <Box
              key={index}
              borderWidth="1px"
              borderRadius="lg"
              padding={4}
              backgroundColor="white"
              boxShadow="sm"
              _hover={{ boxShadow: "md" }}
            >
              <Flex direction="column" height="100%">
                <Center flexGrow={1}>
                  <Heading size="md" color="teal.600">
                    {room.roomName}
                  </Heading>
                </Center>
                <Text color="gray.600">Members: {room.members?.join(", ")}</Text>
                <Button
                  mt={4}
                  alignSelf="center"
                  colorScheme="teal"
                  onClick={() => {
                    if (room.password_required) {
                      handleOpenPasswordModal(room.roomName);
                      return;
                    }
                    handleEnterRoom(room.roomName);
                  }}
                  _hover={{ transform: "scale(1.05)" }}
                  _active={{ transform: "scale(0.95)" }}
                >
                  Enter
                </Button>
              </Flex>
            </Box>
          ))}
        </Grid>
      </VStack>
    </>
  );
};

export default ChatRooms;
