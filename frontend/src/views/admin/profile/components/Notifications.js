import { NotificationPreferences } from "components/notifications";

export default function Notifications(props) {
  const { ...rest } = props;
  return <NotificationPreferences {...rest} />;
}
