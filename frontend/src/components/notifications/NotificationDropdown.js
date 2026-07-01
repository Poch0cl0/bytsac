import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Divider,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdNotificationsNone } from "react-icons/md";
import { useNotifications } from "hooks/useNotifications";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationItem } from "./NotificationItem";
import { NOTIFICATION_LABELS } from "constants/notifications";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navbarIcon = useColorModeValue("gray.400", "white");
  const menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorBrand = useColorModeValue("brand.700", "brand.400");
  const shadow = useColorModeValue(
    "14px 17px 40px 4px rgba(112, 144, 176, 0.18)",
    "14px 17px 40px 4px rgba(112, 144, 176, 0.06)"
  );

  useEffect(() => {
    fetchNotifications({ page: 1 }).then((data) => {
      setPage(1);
      setHasMore(data.current_page < data.last_page);
    });
  }, [fetchNotifications]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const data = await fetchNotifications({ page: nextPage });
    setPage(nextPage);
    setHasMore(data.current_page < data.last_page);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Menu>
      <MenuButton p="0px" position="relative">
        <Icon mt="6px" as={MdNotificationsNone} color={navbarIcon} w="18px" h="18px" me="10px" />
        <NotificationBadge count={unreadCount} />
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
            {NOTIFICATION_LABELS.PAGE_TITLE}
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
              {NOTIFICATION_LABELS.MARK_ALL_AS_READ}
            </Text>
          )}
        </Flex>

        <Divider mb="15px" />

        {loading && notifications.length === 0 ? (
          <Flex justify="center" py="20px">
            <Spinner />
          </Flex>
        ) : notifications.length === 0 ? (
          <Flex flexDirection="column" align="center" py="20px" color="gray.500">
            <Text fontSize="36px" mb="8px">
              🔔
            </Text>
            <Text fontSize="sm" textAlign="center">
              {NOTIFICATION_LABELS.EMPTY_DESCRIPTION}
            </Text>
          </Flex>
        ) : (
          <>
            {notifications.map((notif) => (
              <MenuItem
                key={notif.id}
                _hover={{ bg: "none" }}
                _focus={{ bg: "none" }}
                px="0"
                borderRadius="8px"
                mb="8px"
                onClick={(e) => !notif.read_at && handleMarkAsRead(e, notif.id)}
              >
                <NotificationItem notification={notif} />
              </MenuItem>
            ))}

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

            <Button
              mt="10px"
              w="100%"
              variant="brand"
              size="sm"
              onClick={() => handleNavigate("/admin/notificaciones")}
            >
              {NOTIFICATION_LABELS.VIEW_ALL}
            </Button>

            <Button
              mt="10px"
              w="100%"
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("/admin/notificaciones?estado=no_leidas")}
            >
              {NOTIFICATION_LABELS.VIEW_ALERTS}
            </Button>
          </>
        )}
      </MenuList>
    </Menu>
  );
}

export default NotificationDropdown;
