import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
} from "@chakra-ui/react";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
}

const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  members,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Members</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {members.map((member, index) => (
            <Box key={index} mb={2}>
              <Text>{member}</Text>
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MembersModal;
