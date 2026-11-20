/**
 * Example slice. Shows the pattern for Domo data: async thunks call functions
 * from @/API/domoApi (never ryuu.js directly) and track loading/error state.
 *
 *   const dispatch = useAppDispatch();
 *   const { rows, status } = useAppSelector((s) => s.app);
 *   useEffect(() => { dispatch(loadDataset("sales")); }, [dispatch]);
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { queryData } from "@/API/domoApi";

const initialState = {
  rows: [],
  status: "idle",
  error: null,
};

/** Loads up to 100 rows from a dataset alias mapped in public/manifest.json. */
export const loadDataset = createAsyncThunk("app/loadDataset", (alias) =>
  queryData(alias, { limit: 100 }),
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    clearRows(state) {
      state.rows = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadDataset.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rows = action.payload;
      })
      .addCase(loadDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load data";
      });
  },
});

export const { clearRows } = appSlice.actions;

export default appSlice.reducer;
