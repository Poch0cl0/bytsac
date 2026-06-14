import React, { useEffect, useState } from "react";

import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
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
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { MdDelete, MdEdit } from "react-icons/md";

import Card from "components/card/Card";
import api from "services/api";

export default function Planes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState("");
  const [planEditando, setPlanEditando] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio_mensual: "",
    precio_anual: "",
    duracion_dias: "30",
    control_ventas_stock: "0",
    max_usuarios: "1",
    nivel_reportes: "basico",
    activo: "1",
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/plans");
      setPlanes(response.data.data);
    } catch (error) {
      console.error("Error al cargar planes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      descripcion: "",
      precio_mensual: "",
      precio_anual: "",
      duracion_dias: "30",
      control_ventas_stock: "0",
      max_usuarios: "1",
      nivel_reportes: "basico",
      activo: "1",
    });

    setPlanEditando(null);
    setError("");
  };

  const abrirModalNuevo = () => {
    limpiarFormulario();
    onOpen();
  };

  const abrirModalEditar = (plan) => {
    setPlanEditando(plan);

    setForm({
      nombre: plan.nombre || "",
      descripcion: plan.descripcion || "",
      precio_mensual: plan.precio_mensual || "",
      precio_anual: plan.precio_anual || "",
      duracion_dias: plan.duracion_dias || "30",
      control_ventas_stock: plan.control_ventas_stock ? "1" : "0",
      max_usuarios: plan.max_usuarios || "1",
      nivel_reportes: plan.nivel_reportes || "basico",
      activo: plan.activo ? "1" : "0",
    });

    setError("");
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

  const construirPayload = () => {
    return {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio_mensual: Number(form.precio_mensual),
      precio_anual: Number(form.precio_anual),
      duracion_dias: Number(form.duracion_dias),
      control_ventas_stock: form.control_ventas_stock === "1",
      max_usuarios: Number(form.max_usuarios),
      nivel_reportes: form.nivel_reportes,
      activo: form.activo === "1",
    };
  };

  const guardarPlan = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      const payload = construirPayload();

      if (planEditando) {
        await api.put(`/plans/${planEditando.id}`, payload);

        toast({
          title: "Plan actualizado",
          description: "Los datos del plan fueron actualizados correctamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        await api.post("/plans", payload);

        toast({
          title: "Plan registrado",
          description: "El plan fue creado correctamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }

      cerrarModal();
      cargarPlanes();
    } catch (error) {
      console.error("Error al guardar plan:", error);

      if (error.response?.status === 422) {
        setError("Verifica los campos. El nombre del plan podría estar repetido.");
      } else if (error.response?.status === 401) {
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      } else if (error.response?.status === 403) {
        setError("No tienes permiso para realizar esta acción.");
      } else {
        setError("No se pudo guardar el plan. Revisa el backend.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPlan = async (plan) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el plan "${plan.nombre}"?`
    );

    if (!confirmar) return;

    setEliminandoId(plan.id);

    try {
      await api.delete(`/plans/${plan.id}`);

      toast({
        title: "Plan eliminado",
        description: "El plan fue eliminado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      cargarPlanes();
    } catch (error) {
      console.error("Error al eliminar plan:", error);

      toast({
        title: "No se pudo eliminar",
        description:
          error.response?.status === 403
            ? "No tienes permiso para eliminar planes."
            : "Revisa si el plan tiene suscripciones asociadas.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setEliminandoId(null);
    }
  };

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toFixed(2);
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Flex mb="24px" justify="space-between" align="center">
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              Gestión de Planes
            </Text>
            <Text color="gray.500" fontSize="sm">
              Catálogo de planes comerciales disponibles para los clientes.
            </Text>
          </Box>

          <Button variant="brand" onClick={abrirModalNuevo}>
            Nuevo Plan
          </Button>
        </Flex>

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
              minW="760px"
            >
              <Thead>
                <Tr>
                  <Th borderColor={borderColor} w="28%">
                    Plan
                  </Th>
                  <Th borderColor={borderColor} w="18%">
                    Precios
                  </Th>
                  <Th borderColor={borderColor} w="16%">
                    Capacidad
                  </Th>
                  <Th borderColor={borderColor} w="14%">
                    Reportes
                  </Th>
                  <Th borderColor={borderColor} w="12%">
                    Estado
                  </Th>
                  <Th borderColor={borderColor} w="12%" textAlign="center">
                    Acciones
                  </Th>
                </Tr>
              </Thead>

              <Tbody>
                {planes.map((plan) => (
                  <Tr key={plan.id}>
                    <Td borderColor={borderColor}>
                      <Text color={textColor} fontSize="sm" fontWeight="700">
                        {plan.nombre}
                      </Text>

                      <Text fontSize="sm" color="gray.500" noOfLines={2} mt="4px">
                        {plan.descripcion}
                      </Text>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Text fontSize="sm" fontWeight="700" color={textColor}>
                        S/ {formatearPrecio(plan.precio_mensual)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Mensual
                      </Text>

                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={textColor}
                        mt="8px"
                      >
                        S/ {formatearPrecio(plan.precio_anual)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Anual
                      </Text>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Text fontSize="sm" color={textColor} fontWeight="600">
                        {plan.max_usuarios} usuarios
                      </Text>

                      <Badge
                        colorScheme={
                          plan.control_ventas_stock ? "purple" : "gray"
                        }
                        borderRadius="8px"
                        px="10px"
                        py="4px"
                        mt="8px"
                      >
                        Stock: {plan.control_ventas_stock ? "Sí" : "No"}
                      </Badge>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Badge borderRadius="8px" px="10px" py="4px">
                        {plan.nivel_reportes}
                      </Badge>
                    </Td>

                    <Td borderColor={borderColor}>
                      <Badge
                        colorScheme={plan.activo ? "green" : "red"}
                        borderRadius="8px"
                        px="10px"
                        py="4px"
                      >
                        {plan.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </Td>

                    <Td borderColor={borderColor}>
                      <HStack spacing="8px" justify="center">
                        <Tooltip label="Editar plan">
                          <IconButton
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            icon={<MdEdit />}
                            aria-label="Editar plan"
                            onClick={() => abrirModalEditar(plan)}
                          />
                        </Tooltip>

                        <Tooltip label="Eliminar plan">
                          <IconButton
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            icon={<MdDelete />}
                            aria-label="Eliminar plan"
                            isLoading={eliminandoId === plan.id}
                            onClick={() => eliminarPlan(plan)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      <Modal isOpen={isOpen} onClose={cerrarModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <form onSubmit={guardarPlan}>
            <ModalHeader>
              {planEditando ? "Editar plan" : "Registrar nuevo plan"}
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              {error && (
                <Alert status="error" borderRadius="12px" mb="20px">
                  <AlertIcon />
                  <Text fontSize="sm">{error}</Text>
                </Alert>
              )}

              <FormControl mb="16px" isRequired>
                <FormLabel>Nombre del plan</FormLabel>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ejemplo: Plan Premium"
                />
              </FormControl>

              <FormControl mb="16px">
                <FormLabel>Descripción</FormLabel>
                <Input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Ejemplo: Plan para empresas en crecimiento"
                />
              </FormControl>

              <FormControl mb="16px" isRequired>
                <FormLabel>Precio mensual</FormLabel>
                <Input
                  name="precio_mensual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_mensual}
                  onChange={handleChange}
                  placeholder="Ejemplo: 149.90"
                />
              </FormControl>

              <FormControl mb="16px" isRequired>
                <FormLabel>Precio anual</FormLabel>
                <Input
                  name="precio_anual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_anual}
                  onChange={handleChange}
                  placeholder="Ejemplo: 1490.00"
                />
              </FormControl>

              <FormControl mb="16px" isRequired>
                <FormLabel>Duración en días</FormLabel>
                <Input
                  name="duracion_dias"
                  type="number"
                  min="1"
                  value={form.duracion_dias}
                  onChange={handleChange}
                  placeholder="Ejemplo: 30"
                />
              </FormControl>

              <FormControl mb="16px" isRequired>
                <FormLabel>Máximo de usuarios</FormLabel>
                <Input
                  name="max_usuarios"
                  type="number"
                  min="1"
                  value={form.max_usuarios}
                  onChange={handleChange}
                  placeholder="Ejemplo: 10"
                />
              </FormControl>

              <FormControl mb="16px">
                <FormLabel>Control de ventas y stock</FormLabel>
                <Select
                  name="control_ventas_stock"
                  value={form.control_ventas_stock}
                  onChange={handleChange}
                >
                  <option value="0">No</option>
                  <option value="1">Sí</option>
                </Select>
              </FormControl>

              <FormControl mb="16px">
                <FormLabel>Nivel de reportes</FormLabel>
                <Select
                  name="nivel_reportes"
                  value={form.nivel_reportes}
                  onChange={handleChange}
                >
                  <option value="basico">Básico</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="premium">Premium</option>
                </Select>
              </FormControl>

              <FormControl mb="16px">
                <FormLabel>Estado</FormLabel>
                <Select name="activo" value={form.activo} onChange={handleChange}>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
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
                {planEditando ? "Actualizar plan" : "Guardar plan"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}