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

interface Props {
  client: Client;
}

const ChatRoom: React.FC<Props> = ({ client }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const notifyError = (message: string) => {
    toast({
      title: "System Notification",
      description: message,
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
  };

  useEffect(() => {
    const messageCallback = (sender: string, messageContent: string) => {
      if (sender === "system") {
        notifyError(messageContent);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          `${sender}: ${messageContent}`,
        ]);
      }
    };

    client.receiveMessages(messageCallback);

    return () => {
      client.removeMessageListener(messageCallback);
    };
  }, [client]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (message) {
      await client.sendMessages(message.trim());
      setMessage("");
      setMessages((prevMessages) => [
        ...prevMessages,
        `${client.getUserName()}: ${message}`,
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
      >
        <Heading as="h2">{client.getRoomName()}</Heading>
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
        // position="fixed"
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
    </Flex>
  );
};

export default ChatRoom;
