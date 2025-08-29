import { storage, db } from './client';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Upload the captured JPEG blob to Firebase Storage and create a corresponding Firestore document.
 * The blob is stored under captures/YYYYMMDD/{uuid}.jpg and the metadata is written to captures/{uuid}.
 */
export async function uploadCapture(blob: Blob, meta: Record<string, any>): Promise<void> {
  const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const storageRef = ref(storage, `captures/${ymd}/${id}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const docRef = doc(db, 'captures', id);
  await setDoc(docRef, { ...meta, ts: Date.now(), id });
}