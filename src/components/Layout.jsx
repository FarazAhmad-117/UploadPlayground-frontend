import { Frame, TopBar } from "@shopify/polaris";
import { useState } from "react";
import { Navbar } from "./Navbar";

export function Layout({ children }) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);

  const userMenuMarkup = (
    <TopBar.UserMenu
      name="Admin User"
      detail="File Uploader"
      initials="AU"
      open={userMenuActive}
      onToggle={() => setUserMenuActive(!userMenuActive)}
      actions={[
        {
          items: [{ content: "Account settings", icon: "SettingsMajor" }],
        },
        {
          items: [{ content: "Log out", icon: "LogOutMinor" }],
        },
      ]}
    />
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      onNavigationToggle={() =>
        setMobileNavigationActive(!mobileNavigationActive)
      }
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={<Navbar />}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={() => setMobileNavigationActive(false)}
    >
      <div className="container mx-auto px-4 py-6">{children}</div>
    </Frame>
  );
}
