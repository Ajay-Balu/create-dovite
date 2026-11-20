/**
 * Redux Toolkit store. Add a slice per feature in this folder and register its
 * reducer below. Components use the typed hooks from ./hooks.
 */
import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./appSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
