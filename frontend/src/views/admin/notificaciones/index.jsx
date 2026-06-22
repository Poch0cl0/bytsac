import React, { useEffect, useState, useCallback } from "react";

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
import { notificationApi } from "services/api";

const TIPO_CONFIG = {
  aviso_comercial: { colorScheme: "red", icon: "🔔", label: "Aviso Comercial" },
  seguimiento: { colorScheme: "purple", icon: "📋", label: "Seguimiento" },
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoPagina, setCargandoPagina] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);

  const toast = useToast();
  const { isOpen: modalAbierto, onOpen: abrirModal, onClose: cerrarModal } = useDisclosure();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const bgMensaje = useColorModeValue("secondaryGray.50", "whiteAlpha.50");

  const cargarNotificaciones = useCallback(async (page = 1) => {
    setCargandoPagina(true);
    try {
      const { data } = await notificationApi.getAll(page);
      setNotificaciones(data.data);
      setPaginaActual(data.current_page);
      setUltimaPagina(data.last_page);
      setTotal(data.total);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
      setCargandoPagina(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarNotificaciones(1);
  }, [cargarNotificaciones]);

  const irPagina = (page) => {
    if (page < 1 || page > ultimaPagina) return;
    cargarNotificaciones(page);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
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
        description: "No se pudieron marcar las notificaciones.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
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

  const notificacionesFiltradas = notificaciones.filter((n) => {
    const tipoOk = filtroTipo === "todas" || n.data.tipo === filtroTipo;
    const estadoOk =
      filtroEstado === "todas" ||
      (filtroEstado === "no_leidas" && !n.read_at) ||
      (filtroEstado === "leidas" && n.read_at);
    return tipoOk && estadoOk;
  });

  const unreadCount = notificaciones.filter((n) => !n.read_at).length;

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Flex mb="20px" justify="space-between" align="center" wrap="wrap" gap="10px">
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              Notificaciones
            </Text>
            <Text color="gray.500" fontSize="sm">
              Historial de alertas de vencimiento y seguimientos comerciales.
            </Text>
          </Box>

          {unreadCount > 0 && (
            <Button variant="brand" onClick={handleMarkAllAsRead}>
              Marcar todas como leídas ({unreadCount})
            </Button>
          )}
        </Flex>

        <HStack mb="20px" spacing="12px">
          <Select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            w="200px"
          >
            <option value="todas">Todos los tipos</option>
            <option value="aviso_comercial">Aviso Comercial</option>
            <option value="seguimiento">Seguimiento</option>
          </Select>

          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            w="200px"
          >
            <option value="todas">Todos los estados</option>
            <option value="no_leidas">No leídas</option>
            <option value="leidas">Leídas</option>
          </Select>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" py="60px">
            <Spinner size="lg" />
          </Flex>
        ) : notificaciones.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="60px"
            color="gray.500"
          >
            <Text fontSize="48px" mb="12px">
              🔔
            </Text>
            <Text fontSize="lg" fontWeight="600" color={textColor}>
              No hay notificaciones
            </Text>
            <Text fontSize="sm" mt="4px">
              Las notificaciones de vencimiento y seguimiento aparecerán aquí.
            </Text>
          </Flex>
        ) : notificacionesFiltradas.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="60px"
            color="gray.500"
          >
            <Text fontSize="48px" mb="12px">
              🔍
            </Text>
            <Text fontSize="lg" fontWeight="600" color={textColor}>
              Sin resultados
            </Text>
            <Text fontSize="sm" mt="4px">
              No hay notificaciones con los filtros seleccionados.
            </Text>
          </Flex>
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
                  {notificacionesFiltradas.map((notif) => {
                    const data = notif.data;
                    const config = TIPO_CONFIG[data.tipo] || {
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
                            {isUnread ? "No leída" : "Leída"}
                          </Badge>
                        </Td>

                        <Td borderColor={borderColor}>
                          {isUnread ? (
                            <>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notif.id);
                                }}
                              >
                                ✓ Leer
                              </Button>
                            </>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              —
                            </Text>
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
                Mostrando {notificaciones.length} de {total} notificaciones
              </Text>

              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => irPagina(paginaActual - 1)}
                  isDisabled={paginaActual <= 1}
                  isLoading={cargandoPagina}
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
                        isLoading={cargandoPagina && p !== paginaActual}
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
                  isLoading={cargandoPagina}
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
