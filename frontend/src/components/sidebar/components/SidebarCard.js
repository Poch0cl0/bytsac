import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import React from "react";
import { MdNotificationsActive } from "react-icons/md";

export default function SidebarDocs() {
  const bgColor = "linear-gradient(135deg, #868CFF 0%, #4318FF 100%)";

  return (
    <Flex
      justify="center"
      direction="column"
      align="center"
      bg={bgColor}
      borderRadius="30px"
      position="relative"
      px="15px"
      py="24px"
    >
      <Flex
        bg="whiteAlpha.300"
        borderRadius="50%"
        w="70px"
        h="70px"
        align="center"
        justify="center"
        mx="auto"
        mb="14px"
      >
        <Icon as={MdNotificationsActive} color="white" w="34px" h="34px" />
      </Flex>

      <Text
        fontSize={{ base: "lg", xl: "18px" }}
        color="white"
        fontWeight="bold"
        lineHeight="150%"
        textAlign="center"
        mb="6px"
      >
        Alertas BYTSAC
      </Text>

      <Text
        fontSize="14px"
        color="white"
        fontWeight="500"
        mb="16px"
        textAlign="center"
      >
        Revisa suscripciones próximas a vencer y da seguimiento a tus clientes.
      </Text>

      <Button
        bg="whiteAlpha.300"
        _hover={{ bg: "whiteAlpha.200" }}
        _active={{ bg: "whiteAlpha.100" }}
        color="white"
        fontWeight="regular"
        fontSize="sm"
        minW="185px"
        mx="auto"
      >
        Ver alertas
      </Button>
    </Flex>
  );
}