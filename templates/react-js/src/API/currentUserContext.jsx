import { createContext, useContext, useEffect, useState } from "react";
import { GetCurrentUser } from "./domoApi";

const initialState = {
  currentUser: "",
  currentUserId: "",
  avatarKey: "",
  customer: "",
  host: "",
  loading: true,
  error: null,
};
// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(initialState);

/** Wrap the app with <UserProvider> to load the current Domo user once. */
export const UserProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

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
      .catch((error) => {
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
