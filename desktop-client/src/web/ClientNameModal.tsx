import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  ModalFooter,
  Button,
} from "@chakra-ui/react";

interface ClientNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientName: string) => void;
}

const ClientNameModal: React.FC<ClientNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [enteredClientName, setEnteredClientName] = React.useState<string>("");

  const handleClientNameSubmit = () => {
    onSubmit(enteredClientName);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter Client Name</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Enter your client name"
            value={enteredClientName}
            onChange={(e) => setEnteredClientName(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleClientNameSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClientNameModal;
