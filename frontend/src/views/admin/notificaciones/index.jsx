import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

import Card from "components/card/Card";
import { NotificationEmptyState } from "components/notifications";
import { useNotifications } from "hooks/useNotifications";
import {
  NOTIFICATION_LABELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_CONFIG,
} from "constants/notifications";

const TYPE_OPTIONS = [
  { value: NOTIFICATION_STATUS.ALL, label: "Todos los tipos" },
  { value: NOTIFICATION_TYPES.AVISO_COMERCIAL, label: "Aviso Comercial" },
  { value: NOTIFICATION_TYPES.SEGUIMIENTO, label: "Seguimiento" },
];

const STATUS_OPTIONS = [
  { value: NOTIFICATION_STATUS.ALL, label: "Todos los estados" },
  { value: NOTIFICATION_STATUS.UNREAD, label: "No leídas" },
  { value: NOTIFICATION_STATUS.READ, label: "Leídas" },
];

export default function Notificaciones() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const filtroTipo = searchParams.get("tipo") || NOTIFICATION_STATUS.ALL;
  const filtroEstado = searchParams.get("estado") || NOTIFICATION_STATUS.ALL;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const cargarNotificaciones = useCallback(
    async (page = 1) => {
      const params = { page };
      if (filtroTipo !== NOTIFICATION_STATUS.ALL) params.tipo = filtroTipo;
      if (filtroEstado !== NOTIFICATION_STATUS.ALL) params.estado = filtroEstado;

      try {
        const data = await fetchNotifications(params);
        setPaginaActual(data.current_page);
        setUltimaPagina(data.last_page);
        setTotal(data.total);
      } catch {
        toast({
          title: "Error",
          description: NOTIFICATION_LABELS.LOADING_ERROR,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top-right",
        });
      }
    },
    [filtroTipo, filtroEstado, fetchNotifications, toast]
  );

  useEffect(() => {
    cargarNotificaciones(1);
  }, [cargarNotificaciones]);

  const irPagina = (page) => {
    if (page < 1 || page > ultimaPagina) return;
    cargarNotificaciones(page);
  };

  const handleFiltroTipo = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === NOTIFICATION_STATUS.ALL) {
      next.delete("tipo");
    } else {
      next.set("tipo", value);
    }
    setSearchParams(next);
  };

  const handleFiltroEstado = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === NOTIFICATION_STATUS.ALL) {
      next.delete("estado");
    } else {
      next.set("estado", value);
    }
    setSearchParams(next);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Notificaciones marcadas como leídas",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch {
      toast({
        title: "Error",
        description: NOTIFICATION_LABELS.MARK_ERROR,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch {
      toast({
        title: "Error",
        description: NOTIFICATION_LABELS.MARK_SINGLE_ERROR,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleVerSuscripcion = (subscriptionId) => {
    navigate(`/admin/suscripciones?highlight=${subscriptionId}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEmpty = notifications.length === 0;

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Flex mb="20px" justify="space-between" align="center" wrap="wrap" gap="10px">
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              {NOTIFICATION_LABELS.PAGE_TITLE}
            </Text>
            <Text color="gray.500" fontSize="sm">
              {NOTIFICATION_LABELS.PAGE_SUBTITLE}
            </Text>
          </Box>

          {unreadCount > 0 && (
            <Button variant="brand" onClick={handleMarkAllAsRead}>
              {NOTIFICATION_LABELS.MARK_ALL_AS_READ} ({unreadCount})
            </Button>
          )}
        </Flex>

        <HStack mb="20px" spacing="12px">
          <Select
            value={filtroTipo}
            onChange={(e) => handleFiltroTipo(e.target.value)}
            w="200px"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={filtroEstado}
            onChange={(e) => handleFiltroEstado(e.target.value)}
            w="200px"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </HStack>

        {loading && isEmpty ? (
          <Flex justify="center" align="center" py="60px">
            <Spinner size="lg" />
          </Flex>
        ) : isEmpty ? (
          <NotificationEmptyState
            variant={
              filtroTipo !== NOTIFICATION_STATUS.ALL ||
              filtroEstado !== NOTIFICATION_STATUS.ALL
                ? "filter"
                : "empty"
            }
          />
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple" color="gray.500" mb="24px">
                <Thead>
                  <Tr>
                    <Th borderColor={borderColor}>Tipo</Th>
                    <Th borderColor={borderColor}>Mensaje</Th>
                    <Th borderColor={borderColor}>Cliente</Th>
                    <Th borderColor={borderColor}>Plan</Th>
                    <Th borderColor={borderColor}>Fecha</Th>
                    <Th borderColor={borderColor}>Estado</Th>
                    <Th borderColor={borderColor}>Acción</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {notifications.map((notif) => {
                    const data = notif.data || {};
                    const config = NOTIFICATION_TYPE_CONFIG[data.tipo] || {
                      colorScheme: "blue",
                      icon: "🔔",
                      label: "Notificación",
                    };
                    const isUnread = !notif.read_at;

                    return (
                      <Tr
                        key={notif.id}
                        opacity={isUnread ? 1 : 0.6}
                        cursor={isUnread ? "pointer" : "default"}
                        _hover={{ bg: isUnread ? "gray.50" : undefined }}
                        onClick={() => isUnread && handleMarkAsRead(notif.id)}
                      >
                        <Td borderColor={borderColor}>
                          <HStack spacing="8px">
                            <Text fontSize="lg">{config.icon}</Text>
                            <Badge
                              colorScheme={config.colorScheme}
                              borderRadius="8px"
                              px="10px"
                              py="4px"
                            >
                              {config.label}
                            </Badge>
                          </HStack>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text
                            color={textColor}
                            fontSize="sm"
                            fontWeight={isUnread ? "700" : "500"}
                            maxW="320px"
                            noOfLines={2}
                          >
                            {data.mensaje}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm" fontWeight="600" color={textColor}>
                            {data.cliente}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm">{data.plan}</Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm" whiteSpace="nowrap">
                            {formatDate(notif.created_at)}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Badge
                            colorScheme={isUnread ? "blue" : "gray"}
                            borderRadius="8px"
                            px="10px"
                            py="4px"
                          >
                            {isUnread ? NOTIFICATION_LABELS.UNREAD : NOTIFICATION_LABELS.READ}
                          </Badge>
                        </Td>

                        <Td borderColor={borderColor}>
                          {isUnread ? (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                            >
                              {NOTIFICATION_LABELS.MARK_AS_READ}
                            </Button>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              —
                            </Text>
                          )}
                          {data.subscription_id && (
                            <Button
                              size="xs"
                              colorScheme="brand"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerSuscripcion(data.subscription_id);
                              }}
                            >
                              Ver suscripción
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            <HStack justify="space-between" mt="10px" wrap="wrap" gap="10px">
              <Text fontSize="sm" color="gray.500">
                Mostrando {notifications.length} de {total} notificaciones
              </Text>

              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => irPagina(paginaActual - 1)}
                  isDisabled={paginaActual <= 1}
                  isLoading={loading}
                >
                  Anterior
                </Button>

                {Array.from({ length: ultimaPagina }, (_, i) => i + 1)
                  .filter((p) => {
                    const dist = Math.abs(p - paginaActual);
                    return dist === 0 || dist === 1 || p === 1 || p === ultimaPagina;
                  })
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push(
                        <Text key={`dots-${p}`} px="4px" color="gray.400">
                          ...
                        </Text>
                      );
                    }
                    acc.push(
                      <Button
                        key={p}
                        size="sm"
                        variant={p === paginaActual ? "solid" : "ghost"}
                        colorScheme={p === paginaActual ? "brand" : undefined}
                        onClick={() => irPagina(p)}
                        isLoading={loading && p !== paginaActual}
                      >
                        {p}
                      </Button>
                    );
                    return acc;
                  }, [])}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => irPagina(paginaActual + 1)}
                  isDisabled={paginaActual >= ultimaPagina}
                  isLoading={loading}
                >
                  Siguiente
                </Button>
              </HStack>
            </HStack>
          </>
        )}
      </Card>
    </Box>
  );
}
