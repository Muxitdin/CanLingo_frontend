import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import { profileSlice } from "./profileSlice";

/** UI state only. Persistent data lives in SQLite; slices here mirror what screens need to react to. */
export const store = configureStore({
  reducer: { profile: profileSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
