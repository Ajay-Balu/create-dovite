import {
  ref,
  provide,
  inject,
  onMounted,
  type Ref,
  type InjectionKey,
} from "vue";
import DomoApi from "./domoAPI";

// Define the user context interface
export interface UserContextType {
  currentUser: Ref<string>;
  currentUserId: Ref<string>;
  avatarKey: Ref<string>;
  customer: Ref<string>;
  host: Ref<string>;
}

// Create a typed symbol for the injection key
export const UserContextKey: InjectionKey<UserContextType> =
  Symbol("UserContext");

// Composable to provide user context
export function useUserProvider(): UserContextType {
  const currentUser = ref<string>("");
  const currentUserId = ref<string>("");
  const avatarKey = ref<string>("");
  const customer = ref<string>("");
  const host = ref<string>("");

  onMounted(() => {
    let isUserFetched = false;

    DomoApi.GetCurrentUser().then((data) => {
      if (!isUserFetched) {
        const userId = data?.userId;
        const displayName = data?.displayName;
        const avatar = data?.avatarKey;
        const cust = data?.customer;
        const hostVal = data?.host;

        currentUser.value = displayName || "";
        currentUserId.value = userId || "";
        avatarKey.value = avatar || "";
        customer.value = cust || "";
        host.value = hostVal || "";

        isUserFetched = true;
      }
    });
  });

  const userContext: UserContextType = {
    currentUser,
    currentUserId,
    avatarKey,
    customer,
    host,
  };

  provide(UserContextKey, userContext);

  return userContext;
}

// Composable to consume user context
export function useUserContext(): UserContextType {
  const context = inject(UserContextKey);
  if (!context) {
    throw new Error(
      "useUserContext must be used within a component that calls useUserProvider"
    );
  }
  return context;
}
