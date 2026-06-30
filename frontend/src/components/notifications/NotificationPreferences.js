import React, { useEffect } from "react";
import { Box, Flex, Spinner, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import Card from "components/card/Card";
import SwitchField from "components/fields/SwitchField";
import { useNotifications } from "hooks/useNotifications";
import { NOTIFICATION_LABELS, NOTIFICATION_TYPES } from "constants/notifications";

export function NotificationPreferences({ ...rest }) {
  const toast = useToast();
  const { preferences, preferencesLoading, fetchPreferences, updatePreferences } = useNotifications();

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchPreferences().catch(() => {
      toast({
        title: "Error",
        description: NOTIFICATION_LABELS.LOADING_ERROR,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    });
  }, [fetchPreferences, toast]);

  const handleToggle = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    try {
      await updatePreferences(next);
      toast({
        title: NOTIFICATION_LABELS.PREFERENCES_SUCCESS,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch {
      toast({
        title: "Error",
        description: NOTIFICATION_LABELS.PREFERENCES_ERROR,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  return (
    <Card mb="20px" mt="40px" mx="auto" maxW="410px" {...rest}>
      <Flex align="center" w="100%" justify="space-between" mb="20px">
        <Box>
          <Text color={textColorPrimary} fontWeight="bold" fontSize="2xl" mb="4px">
            {NOTIFICATION_LABELS.PREFERENCES_TITLE}
          </Text>
          <Text color={textColorSecondary} fontSize="sm">
            {NOTIFICATION_LABELS.PREFERENCES_SUBTITLE}
          </Text>
        </Box>
      </Flex>

      {preferencesLoading && (
        <Flex justify="center" py="20px">
          <Spinner />
        </Flex>
      )}

      <SwitchField
        isChecked={preferences[NOTIFICATION_TYPES.AVISO_COMERCIAL]}
        reversed={true}
        fontSize="sm"
        mb="20px"
        id="pref-aviso-comercial"
        label={NOTIFICATION_LABELS.PREFERENCE_AVISO_COMERCIAL}
        onChange={() => handleToggle(NOTIFICATION_TYPES.AVISO_COMERCIAL)}
      />
      <SwitchField
        isChecked={preferences[NOTIFICATION_TYPES.SEGUIMIENTO]}
        reversed={true}
        fontSize="sm"
        mb="20px"
        id="pref-seguimiento"
        label={NOTIFICATION_LABELS.PREFERENCE_SEGUIMIENTO}
        onChange={() => handleToggle(NOTIFICATION_TYPES.SEGUIMIENTO)}
      />
    </Card>
  );
}

export default NotificationPreferences;
