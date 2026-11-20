// Optional features (state store, routing): copies add-on files and writes the
// entry files (main + App) that wire everything together.
const fs = require("fs");
const path = require("path");

const ADDONS_DIR = path.join(__dirname, "..", "templates", "_addons");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function write(projectName, rel, content) {
  const file = path.join(projectName, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/^\n/, ""));
}

const lines = (...parts) => parts.filter((p) => p !== false && p != null).join("\n");

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------

function reactMain(ts, { store, router }) {
  const ext = ts ? "tsx" : "jsx";
  // Build the provider tree outside-in, indenting each level by two spaces.
  const wrappers = [
    "StrictMode",
    store && "Provider store={store}",
    "UserProvider",
  ].filter(Boolean);
  const leaf = router ? "<RouterProvider router={router} />" : "<App />";
  const pad = (n) => " ".repeat(2 + n * 2);
  const tree = [
    ...wrappers.map((w, i) => `${pad(i)}<${w}>`),
    `${pad(wrappers.length)}${leaf}`,
    ...wrappers
      .map((w, i) => `${pad(i)}</${w.split(" ")[0]}>`)
      .reverse(),
  ].join("\n");
  return {
    file: `src/main.${ext}`,
    content: lines(
      `import { StrictMode } from "react";`,
      `import { createRoot } from "react-dom/client";`,
      store && `import { Provider } from "react-redux";`,
      router && `import { RouterProvider } from "react-router";`,
      `import { UserProvider } from "@/API/currentUserContext";`,
      store && `import { store } from "@/store";`,
      router ? `import { router } from "@/router";` : `import App from "./App";`,
      `import "./index.css";`,
      ``,
      `// Providers: ${[store && "Redux store", "current Domo user", router && "hash router"].filter(Boolean).join(" → ")}.`,
      `createRoot(document.getElementById("root")${ts ? "!" : ""}).render(`,
      tree,
      `);`,
      ``
    ),
  };
}

function reactApp(ts, { router }) {
  const ext = ts ? "tsx" : "jsx";
  const content = router
    ? lines(
        `import { Outlet } from "react-router";`,
        ``,
        `/** Root layout: put shared chrome (header, nav) here; pages render in <Outlet />. */`,
        `export default function App() {`,
        `  return <Outlet />;`,
        `}`,
        ``
      )
    : lines(
        `import DefaultPage from "@/pages/index";`,
        ``,
        `export default function App() {`,
        `  return <DefaultPage />;`,
        `}`,
        ``
      );
  return { file: `src/App.${ext}`, content };
}

// ---------------------------------------------------------------------------
// Vue
// ---------------------------------------------------------------------------

function vueMain(ts, { store, router }) {
  return {
    file: `src/main.${ts ? "ts" : "js"}`,
    content: lines(
      `import { createApp } from "vue";`,
      store && `import { createPinia } from "pinia";`,
      `import App from "./App.vue";`,
      router && `import { router } from "./router";`,
      `import "./index.css";`,
      ``,
      `const app = createApp(App);`,
      store && `app.use(createPinia());`,
      router && `app.use(router);`,
      `app.mount("#app");`,
      ``
    ),
  };
}

function vueApp(ts, { router }) {
  return {
    file: "src/App.vue",
    content: lines(
      `<script setup${ts ? ' lang="ts"' : ""}>`,
      `import { useUserProvider } from "@/API/currentUserContext";`,
      !router && `import DefaultPage from "@/pages/index.vue";`,
      ``,
      `// Loads the current Domo user once; read it anywhere with useUserContext().`,
      `useUserProvider();`,
      `</script>`,
      ``,
      `<template>`,
      router
        ? `  <!-- Root layout: put shared chrome (header, nav) here. -->\n  <RouterView />`
        : `  <DefaultPage />`,
      `</template>`,
      ``
    ),
  };
}

// ---------------------------------------------------------------------------

/** Copies store/router add-ons and writes main + App for the chosen features. */
function applyFeatures(projectName, templateType, features) {
  const ts = templateType.endsWith("-ts");
  const vue = templateType.startsWith("vue");

  for (const feature of ["store", "router"]) {
    if (!features[feature]) continue;
    const dir = path.join(ADDONS_DIR, templateType, feature);
    if (fs.existsSync(dir)) copyDir(dir, projectName);
  }

  const files = vue
    ? [vueMain(ts, features), vueApp(ts, features)]
    : [reactMain(ts, features), reactApp(ts, features)];
  for (const { file, content } of files) write(projectName, file, content);

  const added = [
    features.store && (vue ? "Pinia" : "Redux Toolkit"),
    features.router && (vue ? "vue-router (hash)" : "react-router (hash)"),
  ].filter(Boolean);
  if (added.length) console.log(`Configured ${added.join(" + ")}`);
}

module.exports = { applyFeatures };

// ---------------------------------------------------------------------------
// AGENTS.md section describing the chosen features
// ---------------------------------------------------------------------------

function featuresDoc(templateType, features, addCmd) {
  const vue = templateType.startsWith("vue");
  const ts = templateType.endsWith("-ts");
  const x = ts ? "ts" : "js";
  const out = ["## State & routing in this project", ""];

  if (features.store && vue) {
    out.push(
      "- **State management: Pinia** — stores in `src/stores/` (`app." + x + "` is an example",
      "  setup store whose actions call `@/API/domoApi` and track `status`/`error`). One store",
      "  per feature; Domo calls only via `domoApi`; keep component-only state in `ref`s."
    );
  } else if (features.store) {
    out.push(
      "- **State management: Redux Toolkit** — `src/store/` (`index." + x + "` store,",
      "  `hooks." + x + "` with `useAppDispatch`/`useAppSelector`, `appSlice." + x + "` example with an",
      "  async thunk calling `@/API/domoApi`). One slice per feature; use the app hooks, not",
      "  raw `useDispatch`/`useSelector`; keep component-only state in `useState`."
    );
  } else {
    const pkg = vue ? "pinia" : "@reduxjs/toolkit react-redux";
    out.push(
      "- **State management: none** — use component state" + (vue ? ", `provide/inject` or composables." : " and context."),
      `  If shared state grows, suggest ${vue ? "Pinia" : "Redux Toolkit"} (\`${addCmd} ${pkg}\`) and ask before adding it.`
    );
  }

  if (features.router && vue) {
    out.push(
      "- **Routing: vue-router with hash history** — `src/router/index." + x + "` (`createWebHashHistory`).",
      "  Add routes there (lazy `() => import(\"@/pages/…\")`), link with `<RouterLink>`; `App.vue`",
      "  renders `<RouterView />`. Never switch to `createWebHistory` — Domo has no server rewrites."
    );
  } else if (features.router) {
    out.push(
      "- **Routing: react-router with hash URLs** — `src/router." + (ts ? "tsx" : "jsx") + "` (`createHashRouter`). Add",
      "  pages as `children` of the root route; `App` is the layout and renders `<Outlet />`;",
      "  link with `<Link to>` / `useNavigate()`. Never use `createBrowserRouter`/`BrowserRouter`."
    );
  } else {
    const pkg = vue ? "vue-router" : "react-router";
    out.push(
      "- **Routing: none** — single page (`App` renders `src/pages/index`). If the app needs",
      `  several pages, suggest \`${pkg}\` with hash ${vue ? "history" : "routing"} (\`${addCmd} ${pkg}\`) and ask first.`
    );
  }
  out.push("- Leaving the app (other Domo pages, external sites) always uses `navigate()` from `domoApi`.");
  return out.join("\n");
}

module.exports.featuresDoc = featuresDoc;
