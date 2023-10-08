import React, { useState } from "react";
import {
  IconButton,
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Textarea,
  Flex,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import MembersModal from "./MembersModal";
import useChatRoom from "./useChatRoom";

const ChatRoom: React.FC = () => {
  const { roomName, clientName } = useParams<{
    roomName: string;
    clientName: string;
  }>();

  const {
    client,
    message,
    setMessage,
    messages,
    members,
    messagesEndRef,
    handleLeaveRoom,
    sendMessage,
  } = useChatRoom(clientName!);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const handleOpenMembersModal = () => {
    setIsMembersModalOpen(true);
  };
  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
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
        <Flex
          width="100%"
          bgGradient="linear(to-b, gray.50, gray.100)"
          boxShadow="base"
          borderRadius="lg"
          p={4}
          overflowY="auto"
          maxHeight="60vh"
          maxWidth={"80vw"}
          height="100%"
          resize={"none"}
          flexDirection="column"
        >
          {messages.map((message, index) => {
            const isClientMessage = message.startsWith(client!.getUserName());
            const sender = message.split(":")[0];
            const messageContent = message.split(":")[1];
            return (
              <Flex
                key={index}
                mb={2}
                p={2}
                borderRadius="md"
                bg={isClientMessage ? "green.100" : "gray.100"}
                color={"black"}
                alignSelf={isClientMessage ? "flex-end" : "flex-start"}
                maxWidth="70%"
                justifyContent={"column"}
                display={"table-column"}
              >
                <Text
                  fontSize="lg"
                  fontWeight="medium"
                  color={isClientMessage ? "white" : "gray.600"}
                  isTruncated
                >
                  {sender}
                </Text>
                <Text
                  fontSize="lg"
                  fontWeight="medium"
                  wordBreak={"break-word"}
                >
                  {messageContent}
                </Text>
              </Flex>
            );
          })}
          <div ref={messagesEndRef} />
        </Flex>
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
          <IconButton
            onClick={sendMessage}
            colorScheme="blue"
            marginLeft={4}
            icon={<FontAwesomeIcon icon={faPaperPlane} />}
            aria-label="Send"
          />
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
