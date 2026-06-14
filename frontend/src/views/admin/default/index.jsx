import React, { useEffect, useState } from "react";

import {
  Badge,
  Box,
  Flex,
  Icon,
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
} from "@chakra-ui/react";

import {
  MdAttachMoney,
  MdBusiness,
  MdErrorOutline,
  MdInventory,
  MdSubscriptions,
  MdWarning,
} from "react-icons/md";

import Card from "components/card/Card";
import api from "services/api";

export default function DashboardComercial() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.300");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const cardBg = useColorModeValue("white", "navy.700");
  const iconBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [clientesResponse, planesResponse, suscripcionesResponse] =
        await Promise.all([
          api.get("/clients"),
          api.get("/plans"),
          api.get("/subscriptions"),
        ]);

      setClientes(clientesResponse.data.data || []);
      setPlanes(planesResponse.data.data || []);
      setSuscripciones(suscripcionesResponse.data.data || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toFixed(2);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const obtenerColorEstado = (estado) => {
    if (estado === "activo") return "green";
    if (estado === "por_vencer") return "orange";
    if (estado === "vencido") return "red";
    if (estado === "cancelado") return "gray";

    return "blue";
  };

  const suscripcionesActivas = suscripciones.filter(
    (item) => item.estado === "activo"
  );

  const suscripcionesPorVencer = suscripciones.filter((item) => {
    const dias = Number(item.dias_restantes);

    return (
      item.estado !== "cancelado" &&
      item.estado !== "vencido" &&
      dias >= 0 &&
      dias <= 7
    );
  });

  const suscripcionesVencidas = suscripciones.filter((item) => {
    const dias = Number(item.dias_restantes);

    return item.estado === "vencido" || dias <= 0;
  });

  const ingresosMensualesEstimados = suscripcionesActivas.reduce((total, item) => {
    const planRelacionado = planes.find(
      (plan) =>
        Number(plan.id) === Number(item.plan_id || item.plan?.id)
    );
  
    return total + Number(planRelacionado?.precio_mensual || item.plan?.precio_mensual || 0);
  }, 0);

  const MetricCard = ({ title, value, subtitle, icon, color }) => {
    return (
      <Card p="22px">
        <Flex align="center">
          <Flex
            w="56px"
            h="56px"
            borderRadius="18px"
            bg={iconBg}
            align="center"
            justify="center"
            me="16px"
          >
            <Icon as={icon} w="28px" h="28px" color={color} />
          </Flex>

          <Box>
            <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
              {title}
            </Text>
            <Text color={textColor} fontSize="28px" fontWeight="800">
              {value}
            </Text>
            {subtitle && (
              <Text color={textColorSecondary} fontSize="xs" fontWeight="500">
                {subtitle}
              </Text>
            )}
          </Box>
        </Flex>
      </Card>
    );
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {loading ? (
        <Flex justify="center" align="center" py="80px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px" mb="20px">
            <MetricCard
              title="Clientes registrados"
              value={clientes.length}
              subtitle="Empresas registradas"
              icon={MdBusiness}
              color="brand.500"
            />

            <MetricCard
              title="Planes comerciales"
              value={planes.length}
              subtitle="Planes activos disponibles"
              icon={MdInventory}
              color="brand.500"
            />

            <MetricCard
              title="Suscripciones activas"
              value={suscripcionesActivas.length}
              subtitle="Clientes con servicio vigente"
              icon={MdSubscriptions}
              color="green.500"
            />

            <MetricCard
              title="Por vencer"
              value={suscripcionesPorVencer.length}
              subtitle="Vencen en 7 días o menos"
              icon={MdWarning}
              color="orange.500"
            />

            <MetricCard
              title="Vencidas"
              value={suscripcionesVencidas.length}
              subtitle="Requieren seguimiento"
              icon={MdErrorOutline}
              color="red.500"
            />

            <MetricCard
              title="Ingresos mensuales estimados"
              value={`S/ ${formatearPrecio(ingresosMensualesEstimados)}`}
              subtitle="Según suscripciones activas"
              icon={MdAttachMoney}
              color="green.500"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px">
            <Card>
              <Flex mb="20px" justify="space-between" align="center">
                <Box>
                  <Text color={textColor} fontSize="22px" fontWeight="700">
                    Suscripciones recientes
                  </Text>
                  <Text color={textColorSecondary} fontSize="sm">
                    Últimos clientes vinculados a planes comerciales.
                  </Text>
                </Box>
              </Flex>

              <Box overflowX="auto">
                <Table variant="simple" color="gray.500">
                  <Thead>
                    <Tr>
                      <Th borderColor={borderColor}>Cliente</Th>
                      <Th borderColor={borderColor}>Plan</Th>
                      <Th borderColor={borderColor}>Vencimiento</Th>
                      <Th borderColor={borderColor}>Estado</Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {suscripciones.slice(0, 5).map((item) => (
                      <Tr key={item.id}>
                        <Td borderColor={borderColor}>
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {item.client?.razon_social || "Sin cliente"}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm">
                            {item.plan?.nombre || "Sin plan"}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm">
                            {formatearFecha(item.fecha_fin)}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Badge
                            colorScheme={obtenerColorEstado(item.estado)}
                            borderRadius="8px"
                            px="10px"
                            py="4px"
                            textTransform="capitalize"
                          >
                            {item.estado?.replace("_", " ")}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Card>

            <Card>
              <Flex mb="20px" justify="space-between" align="center">
                <Box>
                  <Text color={textColor} fontSize="22px" fontWeight="700">
                    Resumen de planes
                  </Text>
                  <Text color={textColorSecondary} fontSize="sm">
                    Catálogo comercial registrado en BYTSAC.
                  </Text>
                </Box>
              </Flex>

              <Box overflowX="auto">
                <Table variant="simple" color="gray.500">
                  <Thead>
                    <Tr>
                      <Th borderColor={borderColor}>Plan</Th>
                      <Th borderColor={borderColor}>Precio mensual</Th>
                      <Th borderColor={borderColor}>Duración</Th>
                      <Th borderColor={borderColor}>Estado</Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {planes.slice(0, 5).map((plan) => (
                      <Tr key={plan.id}>
                        <Td borderColor={borderColor}>
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {plan.nombre}
                          </Text>
                          <Text color={textColorSecondary} fontSize="xs">
                            {plan.nivel_reportes}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm">
                            S/ {formatearPrecio(plan.precio_mensual)}
                          </Text>
                        </Td>

                        <Td borderColor={borderColor}>
                          <Text fontSize="sm">
                            {plan.duracion_dias || 0} días
                          </Text>
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
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Card>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}