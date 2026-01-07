import { ref, provide, inject, onMounted } from "vue";
import DomoApi from "./domoAPI";

// Create a symbol for the injection key
const UserContextKey = Symbol("UserContext");

// Composable to provide user context
export function useUserProvider() {
  const currentUser = ref("");
  const currentUserId = ref("");
  const avatarKey = ref("");
  const customer = ref("");
  const host = ref("");

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

  const userContext = {
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
export function useUserContext() {
  const context = inject(UserContextKey);
  if (!context) {
    throw new Error(
      "useUserContext must be used within a component that calls useUserProvider"
    );
  }
  return context;
}

export { UserContextKey };
