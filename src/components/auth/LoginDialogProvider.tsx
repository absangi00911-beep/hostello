"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import LoginDialog from "./LoginDialog";

interface LoginDialogContextValue {
  openLogin: (callbackUrl: string) => void;
}

const LoginDialogContext = createContext<LoginDialogContextValue | null>(null);

export function LoginDialogProvider({
  children,
  googleEnabled,
}: {
  children: ReactNode;
  googleEnabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const openLogin = useCallback((returnTo: string) => {
    setCallbackUrl(returnTo);
    setIsOpen(true);
  }, []);

  return (
    <LoginDialogContext.Provider value={{ openLogin }}>
      {children}
      {isOpen && (
        <LoginDialog
          callbackUrl={callbackUrl}
          googleEnabled={googleEnabled}
          onClose={() => setIsOpen(false)}
          verified={false}
        />
      )}
    </LoginDialogContext.Provider>
  );
}

export function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (!context) {
    throw new Error("useLoginDialog must be used within a LoginDialogProvider.");
  }
  return context;
}
