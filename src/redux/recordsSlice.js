import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  loading: false,
  error: null,
  searchQuery: '',
  filterCategory: 'All',
};

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    recordsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setRecordsSuccess: (state, action) => {
      state.loading = false;
      state.records = action.payload;
      state.error = null;
    },
    addRecordSuccess: (state, action) => {
      state.loading = false;
      state.records = [action.payload, ...state.records];
    },
    updateRecordSuccess: (state, action) => {
      state.loading = false;
      state.records = state.records.map((record) =>
        record.id === action.payload.id ? action.payload : record
      );
    },
    deleteRecordSuccess: (state, action) => {
      state.loading = false;
      state.records = state.records.filter((record) => record.id !== action.payload);
    },
    recordsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload;
    },
    clearRecords: (state) => {
      state.records = [];
      state.searchQuery = '';
      state.filterCategory = 'All';
    },
  },
});

export const {
  recordsStart,
  setRecordsSuccess,
  addRecordSuccess,
  updateRecordSuccess,
  deleteRecordSuccess,
  recordsFailure,
  setSearchQuery,
  setFilterCategory,
  clearRecords,
} = recordsSlice.actions;

export default recordsSlice.reducer;
