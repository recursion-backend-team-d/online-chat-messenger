import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  Checkbox,
} from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  onClose: () => void;
  handleCreateRoom: (roomName: string, password: string) => void;
};

const CreateRoomModal: React.FC<Props> = ({
  isOpen,
  setIsModalOpen,
  onClose,
  handleCreateRoom,
}) => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);

  const handleSubmit = () => {
    handleCreateRoom(roomName, password);
    setRoomName("");
    setPassword("");
    setUsePassword(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a new room</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Room Name</FormLabel>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </FormControl>
          <Checkbox mt={4} onChange={(e) => setUsePassword(e.target.checked)}>
            Use password
          </Checkbox>
          {usePassword && (
            <FormControl mt={4}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Create
          </Button>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateRoomModal;
