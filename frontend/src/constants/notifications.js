export const NOTIFICATION_TYPES = {
  AVISO_COMERCIAL: "aviso_comercial",
  SEGUIMIENTO: "seguimiento",
};

export const NOTIFICATION_STATUS = {
  ALL: "todas",
  READ: "leidas",
  UNREAD: "no_leidas",
};

export const NOTIFICATION_TYPE_CONFIG = {
  [NOTIFICATION_TYPES.AVISO_COMERCIAL]: {
    colorScheme: "red",
    icon: "🔔",
    label: "Aviso Comercial",
  },
  [NOTIFICATION_TYPES.SEGUIMIENTO]: {
    colorScheme: "purple",
    icon: "📋",
    label: "Seguimiento",
  },
};

export const NOTIFICATION_LABELS = {
  PAGE_TITLE: "Notificaciones",
  PAGE_SUBTITLE: "Historial de alertas de vencimiento y seguimientos comerciales.",
  EMPTY_TITLE: "No hay notificaciones",
  EMPTY_DESCRIPTION: "Las notificaciones de vencimiento y seguimiento aparecerán aquí.",
  FILTER_EMPTY_TITLE: "Sin resultados",
  FILTER_EMPTY_DESCRIPTION: "No hay notificaciones con los filtros seleccionados.",
  MARK_ALL_AS_READ: "Marcar todas como leídas",
  MARK_AS_READ: "✓ Leer",
  READ: "Leída",
  UNREAD: "No leída",
  VIEW_ALL: "Ver todas",
  VIEW_ALERTS: "Ver alertas",
  PREFERENCES_TITLE: "Preferencias de notificación",
  PREFERENCES_SUBTITLE: "Activa o desactiva los tipos de alertas que deseas recibir.",
  PREFERENCE_AVISO_COMERCIAL: "Alertas comerciales de vencimiento",
  PREFERENCE_SEGUIMIENTO: "Seguimientos de suscripciones vencidas",
  LOADING_ERROR: "No se pudieron cargar las notificaciones.",
  MARK_ERROR: "No se pudieron marcar las notificaciones.",
  MARK_SINGLE_ERROR: "No se pudo marcar la notificación.",
  PREFERENCES_ERROR: "No se pudieron guardar las preferencias.",
  PREFERENCES_SUCCESS: "Preferencias guardadas correctamente.",
};
