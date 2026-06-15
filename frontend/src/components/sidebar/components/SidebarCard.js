import { Button, Flex, Icon, Text, Badge } from "@chakra-ui/react";
import React, { useState, useEffect, useCallback } from "react";
import { MdNotificationsActive } from "react-icons/md";
import { notificationApi } from "services/api";

export default function SidebarDocs() {
  const bgColor = "linear-gradient(135deg, #868CFF 0%, #4318FF 100%)";
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await notificationApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      console.error("Error al obtener conteo de notificaciones");
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

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
        position="relative"
      >
        <Icon as={MdNotificationsActive} color="white" w="34px" h="34px" />
        {unreadCount > 0 && (
          <Badge
            position="absolute"
            top="-4px"
            right="-4px"
            colorScheme="red"
            borderRadius="full"
            fontSize="12px"
            w="24px"
            h="24px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
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
        {unreadCount > 0
          ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} pendiente${unreadCount !== 1 ? "s" : ""}.`
          : "No hay alertas pendientes."}
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