// Chakra imports
import {
  Box,
  Flex,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

// Custom components
import Footer from "components/footer/FooterAuth";

// Icons
import {
  MdBusinessCenter,
  MdGroups,
  MdInsights,
  MdSubscriptions,
} from "react-icons/md";

function AuthIllustration(props) {
  const { children } = props;

  const bgColor = useColorModeValue("white", "navy.900");
  const textColor = useColorModeValue("navy.700", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.300");

  return (
    <Flex minH="100vh" bg={bgColor} position="relative" overflow="hidden">
      <Flex
        w={{ base: "100%", lg: "50%" }}
        minH="100vh"
        direction="column"
        justify="space-between"
        px={{ base: "28px", md: "70px", xl: "90px" }}
        py={{ base: "28px", md: "36px" }}
        zIndex="2"
      >
        <Box>
          <Flex align="center" mb={{ base: "28px", md: "40px" }}>
            <Box
              w="42px"
              h="42px"
              borderRadius="14px"
              bg="linear-gradient(135deg, #4318FF 0%, #868CFF 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              me="12px"
            >
              <Icon as={MdBusinessCenter} color="white" w="24px" h="24px" />
            </Box>

            <Box>
              <Text color={textColor} fontSize="xl" fontWeight="800">
                BYTSAC
              </Text>
              <Text color={subtitleColor} fontSize="sm" fontWeight="500">
                Plataforma comercial
              </Text>
            </Box>
          </Flex>

          {children}
        </Box>

        <Footer />
      </Flex>

      <Box
        display={{ base: "none", lg: "block" }}
        position="fixed"
        top="0"
        right="0"
        w="50%"
        h="100vh"
        p="28px"
      >
        <Flex
          w="100%"
          h="100%"
          borderRadius="0px 0px 0px 180px"
          bg="linear-gradient(135deg, #4318FF 0%, #5B5CFF 45%, #05CD99 100%)"
          align="center"
          justify="center"
          px={{ lg: "50px", xl: "80px" }}
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-120px"
            right="-120px"
            w="300px"
            h="300px"
            borderRadius="full"
            bg="whiteAlpha.200"
          />

          <Box
            position="absolute"
            bottom="-90px"
            left="-90px"
            w="240px"
            h="240px"
            borderRadius="full"
            bg="whiteAlpha.200"
          />

          <Box maxW="560px" color="white" zIndex="1">
            <Text fontSize="56px" fontWeight="900" lineHeight="1">
              BYTSAC
            </Text>

            <Text fontSize="2xl" fontWeight="700" mt="16px">
              Gestión comercial y suscripciones
            </Text>

            <Text fontSize="md" color="whiteAlpha.800" mt="12px" lineHeight="1.8">
              Administra clientes, planes comerciales y suscripciones desde una
              plataforma web moderna, segura y centralizada.
            </Text>

            <SimpleGrid columns={1} gap="16px" mt="42px">
              <Flex
                bg="whiteAlpha.200"
                border="1px solid"
                borderColor="whiteAlpha.300"
                borderRadius="24px"
                p="20px"
                align="center"
              >
                <Icon as={MdGroups} w="30px" h="30px" me="16px" />
                <Box>
                  <Text fontWeight="800" fontSize="md">
                    Clientes centralizados
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    Registro y seguimiento de empresas atendidas.
                  </Text>
                </Box>
              </Flex>

              <Flex
                bg="whiteAlpha.200"
                border="1px solid"
                borderColor="whiteAlpha.300"
                borderRadius="24px"
                p="20px"
                align="center"
              >
                <Icon as={MdSubscriptions} w="30px" h="30px" me="16px" />
                <Box>
                  <Text fontWeight="800" fontSize="md">
                    Control de suscripciones
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    Renovaciones, cancelaciones y vencimientos.
                  </Text>
                </Box>
              </Flex>

              <Flex
                bg="whiteAlpha.200"
                border="1px solid"
                borderColor="whiteAlpha.300"
                borderRadius="24px"
                p="20px"
                align="center"
              >
                <Icon as={MdInsights} w="30px" h="30px" me="16px" />
                <Box>
                  <Text fontWeight="800" fontSize="md">
                    Información para decisiones
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    Indicadores comerciales para mejorar la gestión.
                  </Text>
                </Box>
              </Flex>
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}

AuthIllustration.propTypes = {
  children: PropTypes.node,
  illustrationBackground: PropTypes.string,
  image: PropTypes.any,
};

export default AuthIllustration;