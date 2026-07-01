import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
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
} from "@chakra-ui/react";

import {
  MdAutorenew,
  MdCancel,
  MdDelete,
  MdInsights,
  MdSync,
} from "react-icons/md";

import Card from "components/card/Card";
import api, { renewalPredictionApi } from "services/api";
import {
  formatearPorcentajeRenovacion,
  mapPredictionsBySubscriptionId,
  obtenerColorNivelRenovacion,
  obtenerEtiquetaNivelRenovacion,
} from "utils/renewalPrediction";

export default function Suscripciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const tableRef = useRef(null);

  const [suscripciones, setSuscripciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState(null);
  const [error, setError] = useState("");

  const [prediccionesMap, setPrediccionesMap] = useState({});
  const [resumenIA, setResumenIA] = useState(null);
  const [cargandoPredicciones, setCargandoPredicciones] = useState(false);
  const [errorML, setErrorML] = useState("");

  const [form, setForm] = useState({
    client_id: "",
    plan_id: "",
    renovacion_automatica: "1",
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const resumenIaBg = useColorModeValue("purple.50", "whiteAlpha.50");

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [suscripcionesResponse, clientesResponse, planesResponse] =
        await Promise.all([
          api.get("/subscriptions"),
          api.get("/clients"),
          api.get("/plans"),
        ]);

      setSuscripciones(suscripcionesResponse.data.data);
      setClientes(clientesResponse.data.data);
      setPlanes(planesResponse.data.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!highlightId || !tableRef.current || suscripciones.length === 0) return;

    const row = tableRef.current.querySelector(`[data-id="${highlightId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.style.backgroundColor = "rgba(67, 24, 255, 0.1)";
      setTimeout(() => {
        row.style.backgroundColor = "";
      }, 3000);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("highlight");
    setSearchParams(next, { replace: true });
  }, [highlightId, suscripciones, searchParams, setSearchParams]);

  const limpiarFormulario = () => {
    setForm({
      client_id: "",
      plan_id: "",
      renovacion_automatica: "1",
    });

    setError("");
  };

  const abrirModalNuevo = () => {
    limpiarFormulario();
    onOpen();
  };

  const cerrarModal = () => {
    limpiarFormulario();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearEstado = (estado) => {
    if (!estado) return "-";

    return estado.replace("_", " ");
  };

  const obtenerColorEstado = (estado) => {
    if (estado === "activo") return "green";
    if (estado === "por_vencer") return "orange";
    if (estado === "vencido") return "red";
    if (estado === "cancelado") return "gray";

    return "blue";
  };

  const obtenerDiasRestantes = (dias) => {
    if (dias === null || dias === undefined) return "-";

    const numero = Math.ceil(Number(dias));

    if (numero <= 0) return "0 días";

    return `${numero} días`;
  };

  const generarPredicciones = async () => {
    setCargandoPredicciones(true);
    setErrorML("");

    try {
      const response = await renewalPredictionApi.getAll();

      setResumenIA(response.data.summary || null);
      setPrediccionesMap(
        mapPredictionsBySubscriptionId(response.data.predictions || [])
      );

      toast({
        title: "Predicciones IA generadas",
        description: `Se analizaron ${response.data.summary?.total_analyzed || 0} suscripciones.`,
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error al generar predicciones:", error);

      if (error.response?.status === 503) {
        setErrorML(
          error.response?.data?.message ||
            "El servicio de predicción no está disponible."
        );
      } else {
        setErrorML("No se pudieron generar las predicciones IA.");
      }

      toast({
        title: "Predicción no disponible",
        description:
          error.response?.data?.message ||
          "Verifica que el modelo ML esté entrenado en el backend.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setCargandoPredicciones(false);
    }
  };

  const generarPrediccionIndividual = async (suscripcion) => {
    setAccionId(suscripcion.id);

    try {
      const response = await renewalPredictionApi.getOne(suscripcion.id);
      const prediction = response.data.prediction;

      setPrediccionesMap((prev) => ({
        ...prev,
        [suscripcion.id]: prediction,
      }));

      toast({
        title: "Predicción generada",
        description: `${prediction.client_name || "Cliente"}: ${formatearPorcentajeRenovacion(prediction.probabilidad_renovacion)} de renovación.`,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error al predecir suscripción:", error);

      toast({
        title: "No se pudo predecir",
        description:
          error.response?.data?.message ||
          "Revisa que el modelo ML esté disponible.",
        status: "error",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setAccionId(null);
    }
  };

  const guardarSuscripcion = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      const payload = {
        client_id: Number(form.client_id),
        plan_id: Number(form.plan_id),
        renovacion_automatica: form.renovacion_automatica === "1",
      };

      await api.post("/subscriptions", payload);

      toast({
        title: "Suscripción registrada",
        description:
          "La suscripción fue creada correctamente. Las fechas fueron calculadas automáticamente.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });

      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar suscripción:", error);

      if (error.response?.status === 422) {
        setError(
          "Verifica los campos. Este cliente podría tener una suscripción activa."
        );
      } else if (error.response?.status === 401) {
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      } else if (error.response?.status === 403) {
        setError("No tienes permiso para crear suscripciones.");
      } else {
        setError("No se pudo registrar la suscripción. Revisa el backend.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const renovarSuscripcion = async (suscripcion) => {
    const confirmar = window.confirm(
      `¿Deseas renovar la suscripción de "${
        suscripcion.client?.razon_social || "este cliente"
      }"?`
    );

    if (!confirmar) return;

    setAccionId(suscripcion.id);

    try {
      await api.post(`/subscriptions/${suscripcion.id}/renew`);

      toast({
        title: "Suscripción renovada",
        description: "La fecha de vencimiento fue extendida correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al renovar suscripción:", error);

      toast({
        title: "No se pudo renovar",
        description:
          error.response?.status === 403
            ? "No tienes permiso para renovar suscripciones."
            : "Revisa el backend o el estado de la suscripción.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setAccionId(null);
    }
  };

  const cancelarSuscripcion = async (suscripcion) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas cancelar la suscripción de "${
        suscripcion.client?.razon_social || "este cliente"
      }"?`
    );

    if (!confirmar) return;

    setAccionId(suscripcion.id);

    try {
      await api.post(`/subscriptions/${suscripcion.id}/cancel`);

      toast({
        title: "Suscripción cancelada",
        description: "La suscripción fue cancelada correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);

      toast({
        title: "No se pudo cancelar",
        description:
          error.response?.status === 403
            ? "No tienes permiso para cancelar suscripciones."
            : "Revisa el backend o el estado de la suscripción.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setAccionId(null);
    }
  };

  const cambiarRenovacion = async (suscripcion) => {
    setAccionId(suscripcion.id);

    try {
      await api.patch(`/subscriptions/${suscripcion.id}/toggle-auto-renew`);

      toast({
        title: "Renovación actualizada",
        description: "La renovación automática fue actualizada correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al cambiar renovación:", error);

      toast({
        title: "No se pudo actualizar",
        description:
          error.response?.status === 403
            ? "No tienes permiso para editar suscripciones."
            : "Revisa el backend.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setAccionId(null);
    }
  };

  const eliminarSuscripcion = async (suscripcion) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la suscripción de "${
        suscripcion.client?.razon_social || "este cliente"
      }"?`
    );

    if (!confirmar) return;

    setAccionId(suscripcion.id);

    try {
      await api.delete(`/subscriptions/${suscripcion.id}`);

      toast({
        title: "Suscripción eliminada",
        description: "La suscripción fue eliminada correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar suscripción:", error);

      toast({
        title: "No se pudo eliminar",
        description:
          error.response?.status === 403
            ? "No tienes permiso para eliminar suscripciones."
            : "Revisa el backend.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setAccionId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Flex
          mb="24px"
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="16px"
        >
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              Gestión de Suscripciones
            </Text>
            <Text color="gray.500" fontSize="sm">
              Control del ciclo de vida de las suscripciones de los clientes.
            </Text>
          </Box>

          <Flex gap="12px" wrap="wrap">
            <Button
              variant="outline"
              colorScheme="purple"
              leftIcon={<MdInsights />}
              isLoading={cargandoPredicciones}
              loadingText="Analizando..."
              onClick={generarPredicciones}
            >
              Generar predicciones IA
            </Button>

            <Button variant="brand" onClick={abrirModalNuevo}>
              Nueva Suscripción
            </Button>
          </Flex>
        </Flex>

        {errorML && (
          <Alert status="warning" borderRadius="12px" mb="20px">
            <AlertIcon />
            <Text fontSize="sm">{errorML}</Text>
          </Alert>
        )}

        {resumenIA && resumenIA.total_analyzed > 0 && (
          <Box
            mb="24px"
            p="20px"
            borderRadius="16px"
            border="1px solid"
            borderColor={borderColor}
            bg={resumenIaBg}
          >
            <Text color={textColor} fontSize="md" fontWeight="700" mb="12px">
              Resumen general de renovaciones (IA)
            </Text>

            <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} gap="16px">
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Analizadas
                </Text>
                <Text fontSize="xl" fontWeight="800" color={textColor}>
                  {resumenIA.total_analyzed}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500">
                  Prob. promedio
                </Text>
                <Text fontSize="xl" fontWeight="800" color="purple.500">
                  {formatearPorcentajeRenovacion(
                    resumenIA.promedio_probabilidad_renovacion
                  )}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500">
                  Renovarán
                </Text>
                <Text fontSize="xl" fontWeight="800" color="green.500">
                  {resumenIA.prediccion_renovaran}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500">
                  No renovarán
                </Text>
                <Text fontSize="xl" fontWeight="800" color="red.500">
                  {resumenIA.prediccion_no_renovaran}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500">
                  Prob. alta
                </Text>
                <Text fontSize="xl" fontWeight="800" color="green.500">
                  {resumenIA.nivel_alta}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500">
                  Prob. baja
                </Text>
                <Text fontSize="xl" fontWeight="800" color="red.500">
                  {resumenIA.nivel_baja}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {loading ? (
          <Flex justify="center" align="center" py="40px">
            <Spinner size="lg" />
          </Flex>
        ) : (
          <Box overflowX="auto" w="100%">
            <Table
              variant="simple"
              color="gray.500"
              mb="24px"
              w="100%"
              minW="1100px"
            >
              <Thead>
                <Tr>
                  <Th borderColor={borderColor} w="22%">
                    Cliente / Plan
                  </Th>
                  <Th borderColor={borderColor} w="15%">
                    Fechas
                  </Th>
                  <Th borderColor={borderColor} w="9%">
                    Días
                  </Th>
                  <Th borderColor={borderColor} w="14%">
                    Predicción IA
                  </Th>
                  <Th borderColor={borderColor} w="10%">
                    Auto-renov.
                  </Th>
                  <Th borderColor={borderColor} w="10%">
                    Estado
                  </Th>
                  <Th borderColor={borderColor} w="20%" textAlign="center">
                    Acciones
                  </Th>
                </Tr>
              </Thead>

              <Tbody ref={tableRef}>
                {suscripciones.map((suscripcion) => {
                  const prediccion = prediccionesMap[suscripcion.id];

                  return (
                  <Tr key={suscripcion.id} data-id={suscripcion.id}>
                    <Td borderColor={borderColor}>
                      <Text color={textColor} fontSize="sm" fontWeight="700">
                        {suscripcion.client?.razon_social || "Sin cliente"}
                      </Text>
                      <Text fontSize="sm" color="gray.500" mt="4px">
                        {suscripcion.plan?.nombre || "Sin plan"}
                      </Text>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Text fontSize="sm" fontWeight="700" color={textColor}>
                        {formatearFecha(suscripcion.fecha_inicio)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Inicio
                      </Text>

                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={textColor}
                        mt="8px"
                      >
                        {formatearFecha(suscripcion.fecha_fin)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Vencimiento
                      </Text>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Text
                        fontSize="sm"
                        color={textColor}
                        fontWeight="700"
                        whiteSpace="nowrap"
                      >
                        {obtenerDiasRestantes(suscripcion.dias_restantes)}
                      </Text>
                    </Td>

                    <Td borderColor={borderColor}>
                      {prediccion ? (
                        <Box>
                          <Text
                            fontSize="sm"
                            fontWeight="800"
                            color={textColor}
                          >
                            {formatearPorcentajeRenovacion(
                              prediccion.probabilidad_renovacion
                            )}
                          </Text>
                          <Badge
                            mt="6px"
                            colorScheme={obtenerColorNivelRenovacion(
                              prediccion.nivel_probabilidad_renovacion
                            )}
                            borderRadius="8px"
                            px="8px"
                          >
                            {obtenerEtiquetaNivelRenovacion(
                              prediccion.nivel_probabilidad_renovacion
                            )}
                          </Badge>
                          <Text fontSize="xs" color="gray.500" mt="4px">
                            {prediccion.prediccion_renovara
                              ? "Renovará"
                              : "Riesgo de no renovar"}
                          </Text>
                        </Box>
                      ) : (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="purple"
                          leftIcon={<MdInsights />}
                          isLoading={accionId === suscripcion.id}
                          onClick={() =>
                            generarPrediccionIndividual(suscripcion)
                          }
                        >
                          Predecir
                        </Button>
                      )}
                    </Td>

                    <Td borderColor={borderColor}>
                      <Badge
                        colorScheme={
                          suscripcion.renovacion_automatica ? "green" : "gray"
                        }
                        borderRadius="8px"
                        px="10px"
                        py="4px"
                      >
                        {suscripcion.renovacion_automatica ? "Sí" : "No"}
                      </Badge>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Badge
                        colorScheme={obtenerColorEstado(suscripcion.estado)}
                        borderRadius="8px"
                        px="10px"
                        py="4px"
                        textTransform="capitalize"
                      >
                        {formatearEstado(suscripcion.estado)}
                      </Badge>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Flex direction="column" gap="10px" align="center">
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="green"
                          borderRadius="full"
                          minW="130px"
                          leftIcon={<MdAutorenew />}
                          isLoading={accionId === suscripcion.id}
                          onClick={() => renovarSuscripcion(suscripcion)}
                        >
                          Renovar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme={
                            suscripcion.renovacion_automatica
                              ? "orange"
                              : "gray"
                          }
                          borderRadius="full"
                          minW="130px"
                          leftIcon={<MdSync />}
                          isLoading={accionId === suscripcion.id}
                          onClick={() => cambiarRenovacion(suscripcion)}
                        >
                          Auto-renov.
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          borderRadius="full"
                          minW="130px"
                          leftIcon={<MdCancel />}
                          isDisabled={suscripcion.estado === "cancelado"}
                          isLoading={accionId === suscripcion.id}
                          onClick={() => cancelarSuscripcion(suscripcion)}
                        >
                          Cancelar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          borderRadius="full"
                          minW="130px"
                          leftIcon={<MdDelete />}
                          isLoading={accionId === suscripcion.id}
                          onClick={() => eliminarSuscripcion(suscripcion)}
                        >
                          Eliminar
                        </Button>
                      </Flex>
                    </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      <Modal isOpen={isOpen} onClose={cerrarModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <form onSubmit={guardarSuscripcion}>
            <ModalHeader>Registrar nueva suscripción</ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              {error && (
                <Alert status="error" borderRadius="12px" mb="20px">
                  <AlertIcon />
                  <Text fontSize="sm">{error}</Text>
                </Alert>
              )}

              <Alert status="info" borderRadius="12px" mb="20px">
                <AlertIcon />
                <Text fontSize="sm">
                  La fecha de inicio y vencimiento se calculan automáticamente
                  según la duración del plan seleccionado.
                </Text>
              </Alert>

              <FormControl mb="16px" isRequired>
                <FormLabel>Cliente</FormLabel>
                <Select
                  name="client_id"
                  value={form.client_id}
                  onChange={handleChange}
                  placeholder="Selecciona un cliente"
                >
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razon_social}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl mb="16px" isRequired>
                <FormLabel>Plan</FormLabel>
                <Select
                  name="plan_id"
                  value={form.plan_id}
                  onChange={handleChange}
                  placeholder="Selecciona un plan"
                >
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - S/ {Number(plan.precio_mensual).toFixed(2)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl mb="16px">
                <FormLabel>Renovación automática</FormLabel>
                <Select
                  name="renovacion_automatica"
                  value={form.renovacion_automatica}
                  onChange={handleChange}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" me="12px" onClick={cerrarModal}>
                Cancelar
              </Button>

              <Button
                variant="brand"
                type="submit"
                isLoading={guardando}
                loadingText="Guardando..."
              >
                Guardar suscripción
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}