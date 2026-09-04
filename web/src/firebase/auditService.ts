import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'SALE_CONFIRMED'
  | 'TRANSFER_REQUESTED'
  | 'TRANSFER_CONFIRMED'
  | 'CASH_CLOSURE';

export const logAction = async (userId: string, action: AuditAction, details: any) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
      platform: 'web-pwa'
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};
