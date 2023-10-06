import React, { useState, useEffect } from "react";
import { Client } from "./Client";
import {
  Button,
  Input,
  Heading,
  VStack,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
} from "@chakra-ui/react";
import ChatRoom from "./ChatRoom";
import _ from "lodash";

const App: React.FC = () => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [messages, setMessages] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isUserInRoom, setIsUserInRoom] = useState(false);
  const [password, setPassword] = useState("");
  const [roomAction, setRoomAction] = useState<"create" | "join">("create");
  const [usePassword, setUsePassword] = useState(false); // New state for using password
  const [isUserNameSet, setIsUserNameSet] = useState(false);

  const setUserNameAndProceed = () => {
    let firstClient = new Client();
    firstClient.setName(userName);
    setClient(firstClient);
    setIsUserNameSet(true);
  };

  const handleRoomAction = async () => {
    if (roomAction === "create") {
      await client?.start(1, userName, roomName, password);
      setIsUserInRoom(true);
    } else if (roomAction === "join") {
      await client?.start(2, userName, roomName, password);
      setIsUserInRoom(true);
    }
  };

  if (isUserInRoom) {
    return <ChatRoom client={client!} />;
  }

  return (
    <VStack spacing={4} p={6}>
      <Heading as="h1">Welcome {userName ? userName : ""}</Heading>
      {!isUserNameSet ? (
        <>
          <Input
            placeholder="Enter User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value.trim())}
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
            onChange={(e) => setRoomName(e.target.value.trim())}
          />
          {roomAction === "create" && (
            <>
              <Checkbox
                isChecked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
              >
                Use Password
              </Checkbox>
              {usePassword && (
                <Input
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                />
              )}
            </>
          )}
          <Button onClick={handleRoomAction}>
            {roomAction === "create" ? "Create Room" : "Join Room"}
          </Button>
        </>
      )}
    </VStack>
  );
};

export default App;
