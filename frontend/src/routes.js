import React from "react";

import { Icon } from "@chakra-ui/react";
import {
  MdBarChart,
  MdNotifications,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdSubscriptions,
} from "react-icons/md";

// Admin Imports
import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import DataTables from "views/admin/dataTables";
import Clientes from "views/admin/clientes";
import Planes from "views/admin/planes";
import Suscripciones from "views/admin/suscripciones";
import Notificaciones from "views/admin/notificaciones";

// Auth Imports
import SignInCentered from "views/auth/signIn";

const routes = [
  {
    name: "Dashboard Comercial",
    layout: "/admin",
    path: "/default",
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  {
    name: "Clientes",
    layout: "/admin",
    path: "/clientes",
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Clientes />,
  },
  {
    name: "Planes",
    layout: "/admin",
    path: "/planes",
    icon: (
      <Icon
        as={MdOutlineShoppingCart}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <Planes />,
  },
  {
    name: "Suscripciones",
    layout: "/admin",
    path: "/suscripciones",
    icon: (
      <Icon
        as={MdSubscriptions}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <Suscripciones />,
  },
  {
    name: "Notificaciones",
    layout: "/admin",
    path: "/notificaciones",
    icon: (
      <Icon
        as={MdNotifications}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <Notificaciones />,
  },
  {
    name: "Perfil",
    layout: "/admin",
    path: "/profile",
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  {
    name: "Iniciar Sesión",
    layout: "/auth",
    path: "/sign-in",
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
];

export default routes;