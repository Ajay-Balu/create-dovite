/**
 * App routes. Hash history (`#/path`) is required inside Domo: the app is served
 * as a single index.html with no server rewrites, so HTML5 history URLs break on
 * reload. Navigate in-app with <RouterLink to="/x"> / router.push(); leave the
 * app with `navigate()` from @/API/domoApi.
 */
import { createRouter, createWebHashHistory } from "vue-router";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/index.vue"),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
