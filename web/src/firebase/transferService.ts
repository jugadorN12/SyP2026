import {
  collection,
  addDoc,
  doc,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';
import { Transfer, TransferStatus } from '../types/pos';
import { logAction } from './auditService';

export const transferService = {
  // 1. Solicitar traspaso (Estado: pendiente)
  requestTransfer: async (transferData: Omit<Transfer, 'id' | 'createdAt' | 'estado'>, userId: string) => {
    const docRef = await addDoc(collection(db, 'transfers'), {
      ...transferData,
      estado: 'pendiente' as TransferStatus,
      createdAt: Date.now()
    });

    await logAction(userId, 'TRANSFER_REQUESTED', {
      transferId: docRef.id,
      producto: transferData.productoNombre,
      cantidad: transferData.cantidadEnviada
    });

    return docRef;
  },

  // 2. Confirmar salida (Estado: en_transito)
  confirmExit: async (transferId: string, userId: string) => {
    const transferRef = doc(db, 'transfers', transferId);

    await runTransaction(db, async (transaction: any) => {
      const transferDoc = await transaction.get(transferRef);
      if (!transferDoc.exists()) throw new Error("El traspaso no existe");

      // Update transfer status
      transaction.update(transferRef, {
        estado: 'en_transito',
        usuarioConfirmaSalidaId: userId,
        sentAt: Date.now()
      });
    });

    await logAction(userId, 'TRANSFER_CONFIRMED', {
      transferId,
      step: 'EXIT'
    });
  },

  // 3. Confirmar entrada (Estado: cerrado o en_disputa)
  confirmEntry: async (transferId: string, userId: string, cantidadRecibida: number) => {
    const transferRef = doc(db, 'transfers', transferId);

    await runTransaction(db, async (transaction: any) => {
      const transferDoc = await transaction.get(transferRef);
      if (!transferDoc.exists()) throw new Error("El traspaso no existe");

      const data = transferDoc.data() as Transfer;
      const isDispute = cantidadRecibida !== data.cantidadEnviada;

      transaction.update(transferRef, {
        estado: isDispute ? 'en_disputa' : 'cerrado',
        cantidadRecibida,
        usuarioConfirmaEntradaId: userId,
        receivedAt: Date.now()
      });
    });

    await logAction(userId, 'TRANSFER_CONFIRMED', {
      transferId,
      step: 'ENTRY',
      cantidadRecibida
    });
  }
};
