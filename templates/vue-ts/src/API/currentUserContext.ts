import {
  ref,
  provide,
  inject,
  onMounted,
  type Ref,
  type InjectionKey,
} from "vue";
import { GetCurrentUser } from "./domoApi";

// Define the user context interface
export interface UserContextType {
  currentUser: Ref<string>;
  currentUserId: Ref<string>;
  avatarKey: Ref<string>;
  customer: Ref<string>;
  host: Ref<string>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
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

  // Loading/error state so components can show spinners or fallbacks.
  const loading = ref<boolean>(true);
  const error = ref<unknown>(null);

  onMounted(() => {
    GetCurrentUser()
      .then((data) => {
        currentUser.value = data.displayName || "";
        currentUserId.value = data.userId || "";
        avatarKey.value = data.avatarKey || "";
        customer.value = String(data.customer ?? "");
        host.value = String(data.host ?? "");
      })
      .catch((e: unknown) => {
        error.value = e;
      })
      .finally(() => {
        loading.value = false;
      });
  });

  const userContext: UserContextType = {
    currentUser,
    currentUserId,
    avatarKey,
    customer,
    host,
    loading,
    error,
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
