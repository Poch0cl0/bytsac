import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
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
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);

  const filtroTipo = searchParams.get("tipo") || NOTIFICATION_STATUS.ALL;
  const filtroEstado = searchParams.get("estado") || NOTIFICATION_STATUS.ALL;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const bgMensaje = useColorModeValue("secondaryGray.50", "whiteAlpha.50");

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
                        cursor="pointer"
                        _hover={{ bg: hoverBg }}
                        onClick={() => {
                          setNotificacionSeleccionada(notif);
                          abrirModal();
                        }}
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
      <Modal isOpen={modalAbierto} onClose={cerrarModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          {notificacionSeleccionada && (() => {
            const notif = notificacionSeleccionada;
            const data = notif.data;
            const config = TIPO_CONFIG[data.tipo] || { colorScheme: "blue", icon: "🔔", label: "Notificación" };
            const isUnread = !notif.read_at;

            const marcarLeida = async () => {
              await handleMarkAsRead(notif.id);
              cerrarModal();
            };

            return (
              <>
                <ModalHeader>
                  <Flex align="center" gap="12px" wrap="wrap">
                    <Badge colorScheme={config.colorScheme} borderRadius="8px" px="12px" py="6px" fontSize="sm">
                      {config.icon} {config.label}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(notif.created_at)}
                    </Text>
                  </Flex>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                  <Text fontSize="xl" fontWeight="700" color={textColor}>
                    {data.cliente}
                  </Text>
                  <Text fontSize="md" color="gray.500" mb="4px">
                    {data.plan}
                  </Text>
                  <Text fontSize="sm" color="gray.400" mb="16px">
                    ID Suscripción: #{data.subscription_id}
                  </Text>

                  <Divider mb="16px" />

                  <Box bg={bgMensaje} p="20px" borderRadius="16px" mb="16px">
                    {data.tipo === "aviso_comercial" ? (
                      <>
                        <Text fontSize="sm" lineHeight="1.8" color={textColor}>
                          Se le informa que la suscripción del cliente{" "}
                          <strong>{data.cliente}</strong> al plan{" "}
                          <strong>{data.plan}</strong> se encuentra próxima a
                          vencer.
                        </Text>
                        <VStack align="start" mt="16px" spacing="8px">
                          <Wrap>
                            <WrapItem>
                              <Text fontSize="sm" color="gray.500">
                                📅 Fecha de vencimiento:
                              </Text>
                            </WrapItem>
                            <WrapItem>
                              <Text fontSize="sm" fontWeight="600">
                                {data.fecha_fin}
                              </Text>
                            </WrapItem>
                          </Wrap>
                          <Wrap>
                            <WrapItem>
                              <Text fontSize="sm" color="gray.500">
                                ⏱ Días restantes:
                              </Text>
                            </WrapItem>
                            <WrapItem>
                              <Text fontSize="sm" fontWeight="600">
                                {data.dias_restantes} días
                              </Text>
                            </WrapItem>
                          </Wrap>
                        </VStack>
                        <Text
                          fontSize="sm"
                          mt="16px"
                          color="gray.600"
                          fontStyle="italic"
                        >
                          Se recomienda contactar al cliente para gestionar la
                          renovación del servicio a la brevedad posible.
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text fontSize="sm" lineHeight="1.8" color={textColor}>
                          Se le informa que la suscripción del cliente{" "}
                          <strong>{data.cliente}</strong> al plan{" "}
                          <strong>{data.plan}</strong> venció hace{" "}
                          <strong>{data.dias_vencido} días</strong>.
                        </Text>
                        <VStack align="start" mt="16px" spacing="8px">
                          <Wrap>
                            <WrapItem>
                              <Text fontSize="sm" color="gray.500">
                                📅 Fecha de vencimiento:
                              </Text>
                            </WrapItem>
                            <WrapItem>
                              <Text fontSize="sm" fontWeight="600">
                                {data.fecha_fin}
                              </Text>
                            </WrapItem>
                          </Wrap>
                          <Wrap>
                            <WrapItem>
                              <Text fontSize="sm" color="gray.500">
                                ⏱ Días vencido:
                              </Text>
                            </WrapItem>
                            <WrapItem>
                              <Text fontSize="sm" fontWeight="600">
                                {data.dias_vencido} días
                              </Text>
                            </WrapItem>
                          </Wrap>
                        </VStack>
                        <Text
                          fontSize="sm"
                          mt="16px"
                          color="gray.600"
                          fontStyle="italic"
                        >
                          {data.dias_vencido <= 7
                            ? "Se requiere realizar las acciones de recuperación pertinentes para reconectar el servicio con el cliente."
                            : "El período de gracia ha expirado. Se recomienda evaluar el caso y determinar las acciones finales de recuperación o baja del servicio."}
                        </Text>
                      </>
                    )}
                  </Box>

                  {(data.email_cliente || data.telefono_cliente) && (
                    <Box mb="16px">
                      <Text fontSize="sm" fontWeight="600" color={textColor} mb="8px">
                        Datos de contacto
                      </Text>
                      <VStack align="start" spacing="4px">
                        {data.email_cliente && (
                          <HStack>
                            <Text fontSize="sm" color="gray.500" w="70px">Email:</Text>
                            <Text fontSize="sm" color={textColor}>{data.email_cliente}</Text>
                          </HStack>
                        )}
                        {data.telefono_cliente && (
                          <HStack>
                            <Text fontSize="sm" color="gray.500" w="70px">Teléfono:</Text>
                            <Text fontSize="sm" color={textColor}>{data.telefono_cliente}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  )}

                  <Divider mb="12px" />
                  <VStack align="start" spacing="4px">
                    <HStack>
                      <Text fontSize="xs" color="gray.400">
                        Recibida:
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(notif.created_at)}
                      </Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="xs" color="gray.400">
                        Estado:
                      </Text>
                      <Badge
                        colorScheme={isUnread ? "blue" : "gray"}
                        fontSize="xs"
                        borderRadius="6px"
                        px="8px"
                        py="2px"
                      >
                        {isUnread ? "No leída" : "Leída"}
                      </Badge>
                    </HStack>
                  </VStack>
                </ModalBody>

                <ModalFooter>
                  {isUnread && (
                    <Button variant="brand" me="12px" onClick={marcarLeida}>
                      Marcar como leída
                    </Button>
                  )}
                  <Button variant="ghost" onClick={cerrarModal}>
                    Cerrar
                  </Button>
                </ModalFooter>
              </>
            );
          })()}
        </ModalContent>
      </Modal>
    </Box>
  );
}
