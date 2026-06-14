/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Chakra imports
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

// Custom components
import DefaultAuth from "layouts/auth/Default";

// Assets
import illustration from "assets/img/auth/auth.png";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";

// API
import api from "services/api";

function SignIn() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = () => setShow(!show);

  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.300");
  const brandStars = useColorModeValue("brand.500", "brand.400");
  const badgeBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const badgeColor = useColorModeValue("brand.500", "white");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem("bytsac_token", response.data.token);
      localStorage.setItem("bytsac_user", JSON.stringify(response.data.user));
      localStorage.setItem(
        "bytsac_roles",
        JSON.stringify(response.data.roles || [])
      );

      navigate("/admin/default");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.response?.status === 401) {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else if (error.response?.status === 422) {
        setError("Completa correctamente los campos requeridos.");
      } else {
        setError(
          "No se pudo iniciar sesión. Verifica que el backend esté activo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex
        maxW={{ base: "100%", md: "max-content" }}
        w="100%"
        mx={{ base: "auto", lg: "0px" }}
        me="auto"
        h="100%"
        alignItems="start"
        justifyContent="center"
        mb={{ base: "30px", md: "60px" }}
        px={{ base: "25px", md: "0px" }}
        mt={{ base: "40px", md: "10vh" }}
        flexDirection="column"
      >
        <Box me="auto" mb="20px">
          <Box
            bg={badgeBg}
            color={badgeColor}
            px="14px"
            py="6px"
            borderRadius="full"
            fontSize="sm"
            fontWeight="700"
            display="inline-block"
            mb="22px"
          >
            Plataforma Comercial BYTSAC
          </Box>

          <Heading color={textColor} fontSize="38px" mb="10px">
            Bienvenido
          </Heading>

          <Text
            mb="8px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md"
          >
            Ingresa tus credenciales para acceder al sistema de gestión
            comercial y suscripciones.
          </Text>

          <Text ms="4px" color={textColorSecondary} fontSize="sm">
            Acceso exclusivo para usuarios autorizados.
          </Text>
        </Box>

        <Flex
          zIndex="2"
          direction="column"
          w={{ base: "100%", md: "420px" }}
          maxW="100%"
          background="transparent"
          borderRadius="15px"
          mx={{ base: "auto", lg: "unset" }}
          me="auto"
          mb={{ base: "20px", md: "auto" }}
        >
          {error && (
            <Alert status="error" borderRadius="12px" mb="20px">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <FormControl>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="600"
                color={textColor}
                mb="8px"
              >
                Correo electrónico<Text color={brandStars}>*</Text>
              </FormLabel>

              <Input
                isRequired={true}
                variant="auth"
                fontSize="sm"
                type="email"
                placeholder="admin@bytsac.pe"
                mb="24px"
                fontWeight="500"
                size="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <FormLabel
                ms="4px"
                fontSize="sm"
                fontWeight="600"
                color={textColor}
                display="flex"
                mb="8px"
              >
                Contraseña<Text color={brandStars}>*</Text>
              </FormLabel>

              <InputGroup size="md">
                <Input
                  isRequired={true}
                  fontSize="sm"
                  placeholder="Ingresa tu contraseña"
                  mb="24px"
                  size="lg"
                  type={show ? "text" : "password"}
                  variant="auth"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{ cursor: "pointer" }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={handleClick}
                  />
                </InputRightElement>
              </InputGroup>

              <Button
                type="submit"
                fontSize="sm"
                variant="brand"
                fontWeight="700"
                w="100%"
                h="50px"
                mb="24px"
                isLoading={loading}
                loadingText="Ingresando..."
              >
                Iniciar sesión
              </Button>
            </FormControl>
          </form>

          <Text color={textColorSecondary} fontWeight="400" fontSize="14px">
            © {new Date().getFullYear()} BYTSAC. Plataforma web de gestión
            comercial.
          </Text>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;