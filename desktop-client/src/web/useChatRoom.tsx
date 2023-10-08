import { useState, useEffect, useRef } from "react";
import { Client } from "./Client";
import { useToast } from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";

const useChatRoom = (clientName: string) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [members, setMembers] = useState<string[]>([]);
  const { roomName } = useParams<{ roomName: string }>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

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
      navigate("/");
    } catch (error) {
      notifyError("Error leaving the room.");
    }
  };

  useEffect(() => {
    if (!client) {
      const newClient = new Client();
      newClient.setName(clientName);
      setClient(newClient);
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

    if (client) {
      client.receiveMessages(messageCallback, systemCallback);
      const getAvailableRoomCallback = (roomsData: any) => {
        const roomMembers = roomsData[roomName!].members;
        setMembers(roomMembers);
      };
      client.getAvailableRoom(getAvailableRoomCallback);

      return () => {
        client.removeMessageListener(messageCallback, systemCallback);
      };
    }
  }, [client]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (message) {
      try {
        await client!.sendMessages(message.trim());
        setMessage("");
        setMessages((prevMessages) => [
          ...prevMessages,
          `${client!.getUserName()}: ${message}`,
        ]);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return {
    client,
    message,
    setMessage,
    messages,
    members,
    messagesEndRef,
    handleLeaveRoom,
    sendMessage,
  };
};

export default useChatRoom;
