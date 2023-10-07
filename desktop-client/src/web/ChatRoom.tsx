import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Textarea,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { Client } from "./Client";
import { useParams, useNavigate } from "react-router-dom"; // Corrected this line
import MembersModal from "./MembersModal";

const ChatRoom: React.FC = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const { roomName } = useParams<{ roomName: string }>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();
  const navigate = useNavigate(); // Replaced useHistory with useNavigate

  const handleOpenMembersModal = () => {
    setIsMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const notifyError = (message: string) => {
    toast({
      title: "System Notification",
      description: message,
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  };

  const handleLeaveRoom = async () => {
    try {
      client!.leaveRoomUsingUDP();
      toast({
        title: "System Notification",
        description: "You have left the room.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      navigate("/"); // Updated this line
    } catch (error) {
      notifyError("Error leaving the room.");
    }
  };

  useEffect(() => {
    if (!client) {
      const anonymousClient = new Client();
      anonymousClient.setName("Anonymous");
      setClient(anonymousClient);
      return;
    }

    const messageCallback = (sender: string, messageContent: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        `${sender}: ${messageContent}`,
      ]);
    };

    const systemCallback = (
      sender: string,
      operation: number,
      username: string
    ) => {
      notifyError(`${sender}: operation:${operation} username:${username}`);
    };
    client!.receiveMessages(messageCallback, systemCallback);
    const getAvailableRoomCallback = (roomsData: any) => {
      const roomMembers = roomsData[roomName!].members;
      setMembers(roomMembers);
    };
    client!.getAvailableRoom(getAvailableRoomCallback);

    return () => {
      client!.removeMessageListener(messageCallback, systemCallback);
    };
  }, [client]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (message) {
      await client!.sendMessages(message.trim());
      setMessage("");
      setMessages((prevMessages) => [
        ...prevMessages,
        `${client!.getUserName()}: ${message}`,
      ]);
    }
  };

  return (
    <Flex direction="column" h="100vh">
      <VStack
        spacing={4}
        p={6}
        width="100%"
        maxW="600px"
        margin="0 auto"
        flexGrow={1}
        position="relative"
      >
        <Heading as="h2">{roomName}</Heading>
        <Button
          position="absolute"
          top={4}
          right={4}
          size="sm"
          colorScheme="red"
          onClick={handleLeaveRoom}
        >
          Leave Room
        </Button>
        <Button
          position="absolute"
          top={4}
          left={4}
          size="sm"
          colorScheme="blue"
          onClick={handleOpenMembersModal}
        >
          View Members
        </Button>
        <Box
          width="100%"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          overflowY="auto"
          maxHeight="60vh"
        >
          {messages.map((message, index) => (
            <Text key={index} mb={2}>
              {message}
            </Text>
          ))}
          <div ref={messagesEndRef} />
        </Box>
      </VStack>
      <Box
        bottom={0}
        width="100%"
        maxW="600px"
        margin="auto"
        justifyContent="center"
        p={6}
        bg="white"
        zIndex={1}
      >
        <Flex justifyContent={"center"} alignItems={"center"}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            flexGrow={1}
            maxWidth={"80%"}
          />
          <Button onClick={sendMessage} colorScheme="blue" marginLeft={4}>
            Send
          </Button>
        </Flex>
      </Box>
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={handleCloseMembersModal}
        members={members}
      />
    </Flex>
  );
};

export default ChatRoom;
