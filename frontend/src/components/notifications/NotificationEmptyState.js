import React from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { NOTIFICATION_LABELS } from "constants/notifications";

export function NotificationEmptyState({ variant = "empty" }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");

  const config =
    variant === "filter"
      ? {
          icon: "🔍",
          title: NOTIFICATION_LABELS.FILTER_EMPTY_TITLE,
          description: NOTIFICATION_LABELS.FILTER_EMPTY_DESCRIPTION,
        }
      : {
          icon: "🔔",
          title: NOTIFICATION_LABELS.EMPTY_TITLE,
          description: NOTIFICATION_LABELS.EMPTY_DESCRIPTION,
        };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py="60px"
      color="gray.500"
    >
      <Text fontSize="48px" mb="12px">
        {config.icon}
      </Text>
      <Text fontSize="lg" fontWeight="600" color={textColor}>
        {config.title}
      </Text>
      <Text fontSize="sm" mt="4px">
        {config.description}
      </Text>
    </Flex>
  );
}

export default NotificationEmptyState;
