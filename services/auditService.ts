import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLogEntry, AuditAction } from '../types';

const AUDIT_LOGS_COLLECTION = 'auditLogs';

interface FirestoreAuditLog {
  action: AuditAction;
  userId: string;
  userEmail: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
}

const docToAuditLog = (id: string, data: FirestoreAuditLog): AuditLogEntry => ({
  id,
  action: data.action,
  userId: data.userId,
  userEmail: data.userEmail,
  targetId: data.targetId,
  targetName: data.targetName,
  details: data.details,
  timestamp: data.timestamp.toDate().toISOString(),
});

/**
 * Log an admin action. Fire-and-forget — errors never break the primary operation.
 */
export const logAuditEvent = async (
  action: AuditAction,
  userId: string,
  userEmail: string,
  targetId?: string,
  targetName?: string,
  details?: Record<string, unknown>,
): Promise<void> => {
  try {
    const doc: FirestoreAuditLog = {
      action,
      userId,
      userEmail,
      timestamp: Timestamp.now(),
    };
    if (targetId) doc.targetId = targetId;
    if (targetName) doc.targetName = targetName;
    if (details) doc.details = details;

    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), doc);
  } catch (err) {
    if (import.meta.env.DEV) console.error('Audit log failed:', err);
  }
};

export interface AuditLogFilters {
  action?: AuditAction;
  userEmail?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Paginated fetch with optional filters. Returns entries + last doc for cursor pagination.
 */
export const getAuditLogs = async (
  filters: AuditLogFilters = {},
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot,
): Promise<{ entries: AuditLogEntry[]; lastDoc: DocumentSnapshot | null }> => {
  const constraints: ReturnType<typeof where>[] = [];

  if (filters.action) {
    constraints.push(where('action', '==', filters.action));
  }
  if (filters.userEmail) {
    constraints.push(where('userEmail', '==', filters.userEmail));
  }
  if (filters.startDate) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
  }
  if (filters.endDate) {
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
  }

  const q = query(
    collection(db, AUDIT_LOGS_COLLECTION),
    ...constraints,
    orderBy('timestamp', 'desc'),
    limit(pageSize),
    ...(lastDoc ? [startAfter(lastDoc)] : []),
  );

  const snapshot = await getDocs(q);

  const entries = snapshot.docs.map(d =>
    docToAuditLog(d.id, d.data() as FirestoreAuditLog),
  );

  return {
    entries,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
};
