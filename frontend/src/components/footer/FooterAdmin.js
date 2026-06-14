/*eslint-disable*/
import React from "react";

import {
  Flex,
  List,
  ListItem,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

export default function Footer() {
  const textColor = useColorModeValue("gray.500", "gray.300");
  const strongColor = useColorModeValue("secondaryGray.900", "white");

  return (
    <Flex
      zIndex="3"
      flexDirection={{ base: "column", xl: "row" }}
      alignItems={{ base: "center", xl: "center" }}
      justifyContent="space-between"
      px={{ base: "30px", md: "50px" }}
      pb="30px"
      gap="12px"
    >
      <Text
        color={textColor}
        fontSize="sm"
        textAlign={{ base: "center", xl: "start" }}
      >
        © {new Date().getFullYear()}
        <Text as="span" color={strongColor} fontWeight="700" mx="4px">
          BYTSAC.
        </Text>
        Plataforma web de gestión comercial y suscripciones.
      </Text>

      <List display="flex" gap={{ base: "18px", md: "32px" }}>
        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            Gestión Comercial
          </Text>
        </ListItem>

        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            Clientes
          </Text>
        </ListItem>

        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            Suscripciones
          </Text>
        </ListItem>
      </List>
    </Flex>
  );
}