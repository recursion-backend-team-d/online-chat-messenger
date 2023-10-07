import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Heading, VStack } from "@chakra-ui/react";
import ChatRooms from "./ChatRooms";
import ChatRoom from "./ChatRoom";

const App: React.FC = () => {
  return (
    <Router>
      <VStack spacing={4} p={6}>
        <Heading as="h1">Welcome</Heading>
        <Link to="/chatrooms">Chat Rooms</Link>
        <Routes>
          <Route path="/" element={<ChatRoom />} />
          <Route path="/chatrooms" element={<ChatRooms />} />
          <Route path="/chatroom/:roomName" element={<ChatRoom />} />
        </Routes>
      </VStack>
    </Router>
  );
};

export default App;
