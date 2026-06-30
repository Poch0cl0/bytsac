import React from "react";
import { Badge } from "@chakra-ui/react";

export function NotificationBadge({ count, ...rest }) {
  if (count <= 0) return null;

  return (
    <Badge
      position="absolute"
      top="-4px"
      right="4px"
      colorScheme="red"
      borderRadius="full"
      fontSize="10px"
      w="18px"
      h="18px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

export default NotificationBadge;
