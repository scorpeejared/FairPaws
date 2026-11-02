import { create } from 'zustand';
import {
  deleteAllBills,
  deleteBill,
  getBill,
  listBillSummaries,
  saveBill,
  type BillSummary,
} from '@/db/billRepo';
import { getDb } from '@/db/database';
import { duplicateBill } from '@/domain/bill';

type Status = 'loading' | 'ready' | 'error';

interface HistoryState {
  bills: BillSummary[];
  status: Status;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<string | null>;
  clearAll: () => Promise<void>;
}

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export const useHistoryStore = create<HistoryState>((set, get) => ({
  bills: [],
  status: 'loading',
  error: null,

  async refresh() {
    // Keep showing existing rows during a refresh; only the first load shows a spinner.
    if (get().bills.length === 0) set({ status: 'loading' });
    try {
      const bills = await listBillSummaries(await getDb());
      set({ bills, status: 'ready', error: null });
    } catch (e) {
      set({ status: 'error', error: message(e) });
    }
  },

  async remove(id) {
    const previous = get().bills;
    set({ bills: previous.filter((b) => b.id !== id) });
    try {
      await deleteBill(await getDb(), id);
    } catch (e) {
      set({ bills: previous, error: message(e) });
      throw e;
    }
  },

  async duplicate(id) {
    const db = await getDb();
    const original = await getBill(db, id);
    if (!original) return null;
    const copy = duplicateBill(original);
    await saveBill(db, copy);
    await get().refresh();
    return copy.id;
  },

  async clearAll() {
    await deleteAllBills(await getDb());
    set({ bills: [] });
  },
}));
