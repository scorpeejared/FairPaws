import { create } from 'zustand';
import { deleteBill, getBill, saveBill } from '@/db/billRepo';
import { getDb } from '@/db/database';
import {
  changeCurrency,
  createBill,
  createParticipant,
  isBlankBill,
  removeParticipant as withoutParticipant,
} from '@/domain/bill';
import type { Adjustment, Bill, Item, Rounding, SplitMode } from '@/domain/types';
import { MAX_ITEMS, MAX_PARTICIPANTS } from '@/domain/validation';

type Status = 'idle' | 'loading' | 'ready' | 'missing' | 'error';
export type AdjustmentKey = 'service' | 'tax' | 'discount' | 'tip';

const AUTOSAVE_DELAY_MS = 400;

interface EditorState {
  bill: Bill | null;
  status: Status;
  error: string | null;
  saveError: string | null;

  startNew: (currency: string) => string;
  open: (id: string) => Promise<void>;
  close: () => Promise<void>;
  flush: () => Promise<void>;

  update: (change: (bill: Bill) => Bill) => void;
  setTitle: (title: string) => void;
  setCurrency: (currency: string) => void;
  setMode: (mode: SplitMode) => void;
  setEqualAmount: (amount: number) => void;
  setAdjustment: (key: AdjustmentKey, adjustment: Adjustment) => void;
  setRounding: (rounding: Rounding) => void;

  addParticipant: (name: string) => void;
  renameParticipant: (id: string, name: string) => void;
  removeParticipant: (id: string) => void;

  saveItem: (item: Item) => void;
  removeItem: (id: string) => void;
  toggleShare: (itemId: string, participantId: string) => void;
}

// Persistence bookkeeping lives outside the store: it never drives rendering.
let timer: ReturnType<typeof setTimeout> | null = null;
let persisted = false;
let queue: Promise<void> = Promise.resolve();

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export const useEditorStore = create<EditorState>((set, get) => {
  const mapItem = (id: string, change: (item: Item) => Item) =>
    get().update((bill) => ({
      ...bill,
      items: bill.items.map((item) => (item.id === id ? change(item) : item)),
    }));

  return {
    bill: null,
    status: 'idle',
    error: null,
    saveError: null,

    startNew(currency) {
      const bill = createBill(currency);
      persisted = false;
      set({ bill, status: 'ready', error: null, saveError: null });
      return bill.id;
    },

    async open(id) {
      const current = get();
      if (current.bill?.id === id && current.status === 'ready') return;
      set({ status: 'loading', error: null, saveError: null, bill: null });
      try {
        const bill = await getBill(await getDb(), id);
        persisted = bill !== null;
        set(bill ? { bill, status: 'ready' } : { bill: null, status: 'missing' });
      } catch (e) {
        set({ status: 'error', error: message(e) });
      }
    },

    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const bill = get().bill;
      if (!bill || (!persisted && isBlankBill(bill))) return queue;
      queue = queue.then(async () => {
        try {
          await saveBill(await getDb(), bill);
          persisted = true;
          set({ saveError: null });
        } catch (e) {
          set({ saveError: message(e) });
        }
      });
      return queue;
    },

    async close() {
      const closing = get().bill;
      await get().flush();
      // Another bill may have been opened while the save was in flight; leave it alone.
      if (get().bill?.id !== closing?.id) return;
      // A bill that was emptied out again isn't worth keeping in history.
      if (closing && isBlankBill(closing) && persisted) {
        try {
          await deleteBill(await getDb(), closing.id);
        } catch {
          // Leaving an empty row behind is harmless.
        }
      }
      if (get().bill?.id !== closing?.id) return;
      persisted = false;
      set({ bill: null, status: 'idle', error: null, saveError: null });
    },

    update(change) {
      const bill = get().bill;
      if (!bill) return;
      set({ bill: { ...change(bill), updatedAt: Date.now() } });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void get().flush(), AUTOSAVE_DELAY_MS);
    },

    setTitle: (title) => get().update((b) => ({ ...b, title: title.slice(0, 80) })),
    setCurrency: (currency) => get().update((b) => changeCurrency(b, currency)),
    setMode: (mode) => get().update((b) => ({ ...b, mode })),
    setEqualAmount: (equalAmount) => get().update((b) => ({ ...b, equalAmount })),
    setAdjustment: (key, adjustment) => get().update((b) => ({ ...b, [key]: adjustment })),
    setRounding: (rounding) => get().update((b) => ({ ...b, rounding })),

    addParticipant: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      get().update((b) =>
        b.participants.length >= MAX_PARTICIPANTS
          ? b
          : {
              ...b,
              participants: [...b.participants, createParticipant(trimmed.slice(0, 40), b.participants)],
            },
      );
    },
    renameParticipant: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      get().update((b) => ({
        ...b,
        participants: b.participants.map((p) => (p.id === id ? { ...p, name: trimmed.slice(0, 40) } : p)),
      }));
    },
    removeParticipant: (id) => get().update((b) => withoutParticipant(b, id)),

    saveItem: (input) =>
      get().update((b) => {
        const item = { ...input, name: input.name.trim().slice(0, 80) };
        const exists = b.items.some((i) => i.id === item.id);
        if (!exists && b.items.length >= MAX_ITEMS) return b;
        return {
          ...b,
          items: exists ? b.items.map((i) => (i.id === item.id ? item : i)) : [...b.items, item],
        };
      }),
    removeItem: (id) => get().update((b) => ({ ...b, items: b.items.filter((i) => i.id !== id) })),

    toggleShare: (itemId, participantId) =>
      mapItem(itemId, (item) => {
        const { [participantId]: current, ...rest } = item.shares;
        return { ...item, shares: current ? rest : { ...rest, [participantId]: 1 } };
      }),
  };
});
