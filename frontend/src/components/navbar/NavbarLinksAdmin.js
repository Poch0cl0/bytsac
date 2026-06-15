import {
  Avatar,
  Badge,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useColorMode,
  Box,
  Divider,
  Spinner,
} from "@chakra-ui/react";

import { ItemContent } from "components/menu/ItemContent";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { SidebarResponsive } from "components/sidebar/Sidebar";

import PropTypes from "prop-types";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { MdNotificationsNone, MdInfoOutline } from "react-icons/md";
import { IoMdMoon, IoMdSunny } from "react-icons/io";

import routes from "routes";
import api, { notificationApi } from "services/api";

const TIPO_CONFIG = {
  aviso_comercial: { color: "red", icon: "🔔" },
  seguimiento: { color: "purple", icon: "📋" },
};

export default function HeaderLinks(props) {
  const { secondary } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const navbarIcon = useColorModeValue("gray.400", "white");
  const menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorBrand = useColorModeValue("brand.700", "brand.400");
  const borderColor = useColorModeValue("#E6ECFA", "rgba(135, 140, 189, 0.3)");
  const shadow = useColorModeValue(
    "14px 17px 40px 4px rgba(112, 144, 176, 0.18)",
    "14px 17px 40px 4px rgba(112, 144, 176, 0.06)"
  );

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const user = JSON.parse(localStorage.getItem("bytsac_user") || "null");

  const userName = user?.name || "Administrador BYTSAC";
  const userEmail = user?.email || "admin@bytsac.pe";

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      console.error("Error al obtener conteo de notificaciones");
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll(pageNum);
      if (pageNum === 1) {
        setNotifications(data.data);
      } else {
        setNotifications((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.current_page < data.last_page);
    } catch {
      console.error("Error al obtener notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      console.error("Error al marcar todas como leídas");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      console.error("Error al marcar notificación como leída");
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      console.error("Error al cerrar sesión");
    } finally {
      localStorage.removeItem("bytsac_token");
      localStorage.removeItem("bytsac_user");
      localStorage.removeItem("bytsac_roles");
      navigate("/auth/sign-in");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Flex
      w={{ sm: "100%", md: "auto" }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      flexWrap={secondary ? { base: "wrap", md: "nowrap" } : "unset"}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      <SearchBar
        mb={() => {
          if (secondary) {
            return { base: "10px", md: "unset" };
          }
          return "unset";
        }}
        me="10px"
        borderRadius="30px"
      />

      <SidebarResponsive routes={routes} />

      <Menu>
        <MenuButton p="0px" position="relative">
          <Icon
            mt="6px"
            as={MdNotificationsNone}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
          {unreadCount > 0 && (
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
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </MenuButton>

        <MenuList
          boxShadow={shadow}
          p="20px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
          mt="22px"
          me={{ base: "30px", md: "unset" }}
          minW={{ base: "unset", md: "400px", xl: "450px" }}
          maxW={{ base: "360px", md: "unset" }}
          maxH="460px"
          overflowY="auto"
        >
          <Flex w="100%" mb="15px" align="center">
            <Text fontSize="md" fontWeight="600" color={textColor}>
              Notificaciones
            </Text>

            {unreadCount > 0 && (
              <Text
                fontSize="sm"
                fontWeight="500"
                color={textColorBrand}
                ms="auto"
                cursor="pointer"
                onClick={handleMarkAllAsRead}
              >
                Marcar como leídas
              </Text>
            )}
          </Flex>

          <Divider mb="15px" />

          {loading && notifications.length === 0 ? (
            <Flex justify="center" py="20px">
              <Spinner />
            </Flex>
          ) : notifications.length === 0 ? (
            <Flex flexDirection="column">
              <MenuItem _hover={{ bg: "none" }} _focus={{ bg: "none" }} px="0" borderRadius="8px">
                <ItemContent info="No hay notificaciones pendientes." />
              </MenuItem>
            </Flex>
          ) : (
            <>
              {notifications.map((notif) => {
                const data = notif.data;
                const config = TIPO_CONFIG[data.tipo] || { color: "blue", icon: "🔔" };

                return (
                  <MenuItem
                    key={notif.id}
                    _hover={{ bg: "none" }}
                    _focus={{ bg: "none" }}
                    px="0"
                    borderRadius="8px"
                    mb="8px"
                    onClick={() => !notif.read_at && handleMarkAsRead(notif.id)}
                    opacity={notif.read_at ? 0.6 : 1}
                    cursor="pointer"
                  >
                    <Flex w="100%">
                      <Flex
                        justify="center"
                        align="center"
                        borderRadius="16px"
                        minH={{ base: "50px", md: "56px" }}
                        h={{ base: "50px", md: "56px" }}
                        minW={{ base: "50px", md: "56px" }}
                        w={{ base: "50px", md: "56px" }}
                        me="14px"
                        bg={
                          notif.read_at
                            ? "gray.100"
                            : `linear-gradient(135deg, #868CFF 0%, #4318FF 100%)`
                        }
                      >
                        <Text fontSize="xl">{config.icon}</Text>
                      </Flex>
                      <Flex flexDirection="column" flex="1">
                        <Text
                          mb="3px"
                          fontWeight={notif.read_at ? "500" : "bold"}
                          color={textColor}
                          fontSize={{ base: "sm", md: "sm" }}
                        >
                          {data.mensaje || `Notificación de ${data.tipo}`}
                        </Text>
                        <Flex alignItems="center" justify="space-between">
                          <Text
                            fontSize={{ base: "xs", md: "xs" }}
                            color="gray.500"
                          >
                            {formatDate(notif.created_at)}
                          </Text>
                          {!notif.read_at && (
                            <Box
                              w="8px"
                              h="8px"
                              borderRadius="full"
                              bg="brand.500"
                            />
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                  </MenuItem>
                );
              })}

              {hasMore && (
                <Button
                  mt="10px"
                  w="100%"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  isLoading={loading}
                >
                  Cargar más
                </Button>
              )}
            </>
          )}
        </MenuList>
      </Menu>

      <Menu>
        <MenuButton p="0px">
          <Icon
            mt="6px"
            as={MdInfoOutline}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
        </MenuButton>

        <MenuList
          boxShadow={shadow}
          p="20px"
          me={{ base: "30px", md: "unset" }}
          borderRadius="20px"
          bg={menuBg}
          border="none"
          mt="22px"
          minW={{ base: "unset", md: "300px" }}
          maxW={{ base: "360px", md: "unset" }}
        >
          <Flex flexDirection="column">
            <Text color={textColor} fontSize="md" fontWeight="700" mb="8px">
              Plataforma BYTSAC
            </Text>

            <Text color="gray.500" fontSize="sm" mb="16px">
              Sistema web para la gestión comercial de clientes, planes y
              suscripciones.
            </Text>

            <Button w="100%" h="44px" variant="brand">
              Panel comercial
            </Button>
          </Flex>
        </MenuList>
      </Menu>

      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === "light" ? IoMdMoon : IoMdSunny}
        />
      </Button>

      <Menu>
        <MenuButton p="0px">
          <Avatar
            _hover={{ cursor: "pointer" }}
            color="white"
            name={userName}
            bg="#11047A"
            size="sm"
            w="40px"
            h="40px"
          />
        </MenuButton>

        <MenuList
          boxShadow={shadow}
          p="0px"
          mt="10px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
        >
          <Flex w="100%" mb="0px">
            <Text
              ps="20px"
              pt="16px"
              pb="10px"
              w="100%"
              borderBottom="1px solid"
              borderColor={borderColor}
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋&nbsp; Hola, {userName}
            </Text>
          </Flex>

          <Flex flexDirection="column" p="10px">
            <MenuItem
              _hover={{ bg: "none" }}
              _focus={{ bg: "none" }}
              borderRadius="8px"
              px="14px"
            >
              <Flex direction="column">
                <Text fontSize="sm" fontWeight="600">
                  Usuario autenticado
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {userEmail}
                </Text>
              </Flex>
            </MenuItem>

            <MenuItem
              _hover={{ bg: "none" }}
              _focus={{ bg: "none" }}
              color="red.400"
              borderRadius="8px"
              px="14px"
              onClick={handleLogout}
            >
              <Text fontSize="sm" fontWeight="600">
                Cerrar sesión
              </Text>
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};