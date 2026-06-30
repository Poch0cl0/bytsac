import React from "react";
import { Box, Flex, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { NOTIFICATION_TYPE_CONFIG } from "constants/notifications";

export function NotificationItem({ notification, onClick, showIcon = true }) {
  const data = notification.data || {};
  const config = NOTIFICATION_TYPE_CONFIG[data.tipo] || {
    colorScheme: "blue",
    icon: "🔔",
    label: "Notificación",
  };
  const isUnread = !notification.read_at;

  const textColor = useColorModeValue("secondaryGray.900", "white");

  return (
    <Flex
      w="100%"
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
      opacity={isUnread ? 1 : 0.6}
    >
      {showIcon && (
        <Flex
          justify="center"
          align="center"
          borderRadius="16px"
          minH={{ base: "50px", md: "56px" }}
          h={{ base: "50px", md: "56px" }}
          minW={{ base: "50px", md: "56px" }}
          w={{ base: "50px", md: "56px" }}
          me="14px"
          bg={
            isUnread
              ? "linear-gradient(135deg, #868CFF 0%, #4318FF 100%)"
              : "gray.100"
          }
        >
          <Text fontSize="xl">{config.icon}</Text>
        </Flex>
      )}
      <Flex flexDirection="column" flex="1">
        <Text
          mb="3px"
          fontWeight={isUnread ? "bold" : "500"}
          color={textColor}
          fontSize={{ base: "sm", md: "sm" }}
        >
          {data.mensaje || `Notificación de ${config.label}`}
        </Text>
        <HStack alignItems="center" justify="space-between">
          <Text fontSize={{ base: "xs", md: "xs" }} color="gray.500">
            {config.label}
          </Text>
          {isUnread && (
            <Box w="8px" h="8px" borderRadius="full" bg="brand.500" />
          )}
        </HStack>
      </Flex>
    </Flex>
  );
}

export default NotificationItem;
