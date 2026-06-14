import React from "react";

// Chakra imports
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";

// Custom components
import { HSeparator } from "components/separator/Separator";

export function SidebarBrand() {
  const logoColor = useColorModeValue("navy.700", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.300");

  return (
    <Flex align="center" direction="column">
      <Text
        color={logoColor}
        fontSize="28px"
        fontWeight="800"
        letterSpacing="1px"
        mt="32px"
        mb="4px"
      >
        BYTSAC
      </Text>

      <Text
        color={subtitleColor}
        fontSize="12px"
        fontWeight="500"
        mb="24px"
      >
        Gestión Comercial
      </Text>

      <HSeparator mb="20px" />
    </Flex>
  );
}

export default SidebarBrand;