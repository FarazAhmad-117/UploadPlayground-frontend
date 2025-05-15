import { Navigation, Badge, Icon } from "@shopify/polaris";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";
import {
  FiHome,
  FiUpload,
  FiList,
  FiHelpCircle,
  FiBell,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigationClick = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: "Dashboard",
            icon: () => <FiHome size={20} />,
            onClick: () => handleNavigationClick("/"),
            selected: location.pathname === "/",
          },
          {
            label: "Upload Files",
            icon: () => <FiUpload size={20} />,
            badge: <Badge status="new">New</Badge>,
            onClick: () => handleNavigationClick("/upload"),
            selected: location.pathname === "/upload",
          },
          {
            label: "My Files",
            icon: () => <FiList size={20} />,
            onClick: () => handleNavigationClick("/files"),
            selected: location.pathname === "/files",
          },
        ]}
      />

      <Navigation.Section
        title="Account"
        items={[
          {
            label: "Notifications",
            icon: () => <FiBell size={20} />,
            onClick: () => console.log("Notifications clicked"),
          },
          {
            label: "Settings",
            icon: () => <FiSettings size={20} />,
            onClick: () => console.log("Settings clicked"),
          },
          {
            label: "Log out",
            icon: () => <FiLogOut size={20} />,
            onClick: () => console.log("Log out clicked"),
          },
        ]}
      />

      <Navigation.Section
        title="Help"
        items={[
          {
            label: "About",
            icon: () => <FiHelpCircle size={20} />,
            onClick: () => handleNavigationClick("/about"),
            selected: location.pathname === "/about",
          },
        ]}
      />
    </Navigation>
  );
}
