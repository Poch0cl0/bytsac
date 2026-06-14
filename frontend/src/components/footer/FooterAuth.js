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
      flexDirection={{ base: "column", lg: "row" }}
      alignItems={{ base: "center", lg: "center" }}
      justifyContent="space-between"
      px={{ base: "30px", md: "0px" }}
      pb="30px"
      gap="12px"
    >
      <Text
        color={textColor}
        fontSize="sm"
        textAlign={{ base: "center", lg: "start" }}
      >
        © {new Date().getFullYear()}
        <Text as="span" color={strongColor} fontWeight="700" mx="4px">
          BYTSAC.
        </Text>
        Acceso seguro a la plataforma comercial.
      </Text>

      <List display="flex" gap={{ base: "18px", md: "32px" }}>
        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            Login
          </Text>
        </ListItem>

        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            Seguridad
          </Text>
        </ListItem>

        <ListItem>
          <Text color={textColor} fontSize="sm" fontWeight="500">
            BYTSAC
          </Text>
        </ListItem>
      </List>
    </Flex>
  );
}