import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ChatRooms from "./ChatRooms";
import ChatRoom from "./ChatRoom";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/chatrooms" element={<ChatRooms />} />
        <Route path="/chatroom/:roomName/:clientName" element={<ChatRoom />} />
        <Route path="*" element={<ChatRooms />} />
      </Routes>
    </Router>
  );
};

export default App;
