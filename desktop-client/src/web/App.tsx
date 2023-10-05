import React, { useState } from "react";
import {
  Button,
  Input,
  Heading,
  VStack,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import ChatRoom from "./ChatRoom";

const App: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isUserNameSet, setIsUserNameSet] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomAction, setRoomAction] = useState<"create" | "join" | undefined>(
    undefined
  );

  const setUserNameAndProceed = () => {
    if (userName.trim()) {
      setIsUserNameSet(true);
    }
  };

  const handleRoomAction = () => {
    // TODO: Connect to server
    if (roomAction === "create") {
      // Logic to create a room
    } else if (roomAction === "join") {
      setIsInRoom(true);
    }
  };

  if (isInRoom) {
    return <ChatRoom userName={userName} roomName={roomName} />;
  }

  return (
    <VStack spacing={4} p={6}>
      <Heading as="h1">Welcome {isUserNameSet ? userName : ""}</Heading>
      {!isUserNameSet ? (
        <>
          <Input
            placeholder="Enter User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button onClick={setUserNameAndProceed}>Set Username</Button>
        </>
      ) : (
        <>
          <RadioGroup
            onChange={(value) => setRoomAction(value as "create" | "join")}
            value={roomAction}
          >
            <Stack direction="row">
              <Radio value="create">Create Room</Radio>
              <Radio value="join">Join Room</Radio>
            </Stack>
          </RadioGroup>
          <Input
            placeholder="Enter Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <Button onClick={handleRoomAction}>
            {roomAction === "create" ? "Create Room" : "Join Room"}
          </Button>
        </>
      )}
    </VStack>
  );
};

export default App;
