import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return <div className="h-screen">{children}</div>;
};

export default AppShell;
