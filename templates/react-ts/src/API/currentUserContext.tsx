/* eslint-disable react/prop-types */
// @ts-ignore
import { createContext, useState, useEffect, ReactNode } from "react";
import DomoApi from "./domoAPI";

export interface UserContextType {
  currentUser: string;
  currentUserId: string;
  avatarKey: string;
  customer: string;
  host: string;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [avatarKey, setAvatarKey] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    let isUserFetched = false;

    DomoApi.GetCurrentUser().then((data: any) => {
      // console.log("User Data",data);

      if (!isUserFetched) {
        const userId = data?.userId;
        const displayName = data?.displayName;
        const avatarKey = data?.avatarKey;
        const customer = data?.customer;
        const host = data?.host;

        setCurrentUser(displayName || "");
        setCurrentUserId(userId || "");
        setAvatarKey(avatarKey || "");
        setCustomer(customer || "");
        setHost(host || "");

        isUserFetched = true;
      }
    });

    return () => {
      isUserFetched = true;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentUserId,
        avatarKey,
        customer,
        host,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
