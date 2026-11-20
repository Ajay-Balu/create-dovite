import { ref, provide, inject, onMounted } from "vue";
import { GetCurrentUser } from "./domoApi";

// Create a symbol for the injection key
const UserContextKey = Symbol("UserContext");

// Composable to provide user context
export function useUserProvider() {
  const currentUser = ref("");
  const currentUserId = ref("");
  const avatarKey = ref("");
  const customer = ref("");
  const host = ref("");

  // Loading/error state so components can show spinners or fallbacks.
  const loading = ref(true);
  const error = ref(null);

  onMounted(() => {
    GetCurrentUser()
      .then((data) => {
        currentUser.value = data.displayName || "";
        currentUserId.value = data.userId || "";
        avatarKey.value = data.avatarKey || "";
        customer.value = String(data.customer ?? "");
        host.value = String(data.host ?? "");
      })
      .catch((e) => {
        error.value = e;
      })
      .finally(() => {
        loading.value = false;
      });
  });

  const userContext = {
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
