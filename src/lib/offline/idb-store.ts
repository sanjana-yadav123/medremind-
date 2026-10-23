import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DoseEvent, Medicine, MedicationSchedule } from '@/lib/types/database';

export interface PendingSyncAction {
  id: string; // unique operation id
  actionType: 'confirm_dose' | 'skip_dose' | 'correct_dose';
  doseEventId: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

interface MedRemindDB extends DBSchema {
  medicines: {
    key: string;
    value: Medicine;
  };
  schedules: {
    key: string;
    value: MedicationSchedule;
  };
  dose_events: {
    key: string;
    value: DoseEvent;
  };
  sync_queue: {
    key: string;
    value: PendingSyncAction;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'medremind_local_store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MedRemindDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null;

  if (!dbPromise) {
    dbPromise = openDB<MedRemindDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('medicines')) {
          db.createObjectStore('medicines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('dose_events')) {
          db.createObjectStore('dose_events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save medicines locally for offline viewing
 */
export async function cacheMedicinesLocally(medicines: Medicine[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('medicines', 'readwrite');
  for (const med of medicines) {
    await tx.store.put(med);
  }
  await tx.done;
}

/**
 * Get locally cached medicines
 */
export async function getCachedMedicines(): Promise<Medicine[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('medicines');
}

/**
 * Record a dose action locally and enqueue sync operation
 */
export async function recordOfflineDoseAction(
  doseEventId: string,
  actionType: 'confirm_dose' | 'skip_dose' | 'correct_dose',
  payload: any
): Promise<PendingSyncAction> {
  const db = await getDB();
  if (!db) throw new Error('IndexedDB not supported in current environment');

  const action: PendingSyncAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    actionType,
    doseEventId,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  // Update local dose event state optimistically
  const currentEvent = await db.get('dose_events', doseEventId);
  const updatedStatus = actionType === 'confirm_dose' ? 'taken' : actionType === 'skip_dose' ? 'skipped' : payload.corrected_status || 'scheduled';

  const updatedEvent: DoseEvent = currentEvent || {
    id: doseEventId,
    medicine_id: payload.medicine_id || 'unknown',
    patient_id: payload.patient_id || 'offline_patient',
    scheduled_for: new Date().toISOString(),
    status: updatedStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  updatedEvent.status = updatedStatus;
  updatedEvent.confirmed_at = new Date().toISOString();
  updatedEvent.confirmation_source = 'offline_sync';

  const tx = db.transaction(['dose_events', 'sync_queue'], 'readwrite');
  await tx.objectStore('dose_events').put(updatedEvent);
  await tx.objectStore('sync_queue').put(action);
  await tx.done;

  return action;
}

/**
 * Get all queued offline actions
 */
export async function getPendingSyncActions(): Promise<PendingSyncAction[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('sync_queue', 'by-timestamp');
}

/**
 * Process offline sync queue when connection returns
 */
export async function flushSyncQueue(apiCaller: (action: PendingSyncAction) => Promise<boolean>): Promise<{ success: number; failed: number }> {
  const db = await getDB();
  if (!db) return { success: 0, failed: 0 };

  const actions = await getPendingSyncActions();
  let successCount = 0;
  let failedCount = 0;

  for (const action of actions) {
    try {
      action.status = 'syncing';
      await db.put('sync_queue', action);

      const ok = await apiCaller(action);
      if (ok) {
        await db.delete('sync_queue', action.id);
        successCount++;
      } else {
        action.status = 'failed';
        action.retryCount += 1;
        await db.put('sync_queue', action);
        failedCount++;
      }
    } catch (err) {
      action.status = 'failed';
      action.retryCount += 1;
      await db.put('sync_queue', action);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}
