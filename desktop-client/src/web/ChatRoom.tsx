import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Textarea,
  Flex,
} from "@chakra-ui/react";

interface Props {
  userName: string;
  roomName: string;
}

const ChatRoom: React.FC<Props> = ({ userName, roomName }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, `${userName}: ${input}`]);
      setInput("");
    }
  };

  return (
    <Flex direction="column" h="100vh">
      <VStack spacing={4} p={6} width="100%" maxW="600px" margin="0 auto">
        <Heading as="h2">{roomName}</Heading>
        <Box
          width="100%"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          flexGrow={1}
          overflowY="auto"
        >
          {messages.map((message, index) => (
            <Text key={index} mb={2}>
              {message}
            </Text>
          ))}
        </Box>
      </VStack>
      <Box mt="auto" width="100%" maxW="600px" margin="0 auto" p={6}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          mb={2}
        />
        <Button onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box>
    </Flex>
  );
};

export default ChatRoom;
