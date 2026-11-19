import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GetCurrentUser } from "./domoApi";

export interface UserContextType {
  currentUser: string;
  currentUserId: string;
  avatarKey: string;
  customer: string;
  host: string;
  loading: boolean;
  error: unknown;
}

const initialState: UserContextType = {
  currentUser: "",
  currentUserId: "",
  avatarKey: "",
  customer: "",
  host: "",
  loading: true,
  error: null,
};

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext<UserContextType>(initialState);

/** Wrap the app with <UserProvider> to load the current Domo user once. */
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserContextType>(initialState);

  useEffect(() => {
    let cancelled = false;

    GetCurrentUser()
      .then((data) => {
        if (cancelled) return;
        setState({
          currentUser: data.displayName || "",
          currentUserId: data.userId || "",
          avatarKey: data.avatarKey || "",
          customer: String(data.customer ?? ""),
          host: String(data.host ?? ""),
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
};

/** Read the current Domo user anywhere inside <UserProvider>. */
// eslint-disable-next-line react-refresh/only-export-components
export const useCurrentUser = () => useContext(UserContext);
