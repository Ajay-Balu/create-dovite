/**
 * Example Pinia store (setup syntax). Shows the pattern for Domo data: actions
 * call functions from @/API/domoApi (never ryuu.js directly) and track
 * loading/error state. Add one store per feature in this folder.
 *
 *   const app = useAppStore();
 *   onMounted(() => app.loadDataset("sales"));
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { queryData } from "@/API/domoApi";

export const useAppStore = defineStore("app", () => {
  const rows = ref([]);
  const status = ref("idle");
  const error = ref(null);
  /** Loads up to 100 rows from a dataset alias mapped in public/manifest.json. */
  async function loadDataset(alias) {
    status.value = "loading";
    error.value = null;
    try {
      rows.value = await queryData(alias, { limit: 100 });
      status.value = "succeeded";
    } catch (e) {
      status.value = "failed";
      error.value = e instanceof Error ? e.message : "Failed to load data";
    }
  }
  function clearRows() {
    rows.value = [];
    status.value = "idle";
    error.value = null;
  }
  return { rows, status, error, loadDataset, clearRows };
});
