export type ExportRecord = {
  id: string; scope: string; createdAt: string; agency: string; period: string;
  reports: string[]; records: number; filename: string; blob: Blob;
  source: string; generatedBy: string;
};
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('eves-report-exports', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('exports', { keyPath: 'id' });
      store.createIndex('scope', 'scope');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Export history is blocked by another tab.'));
  });
}
export async function saveExport(record: ExportRecord): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('exports', 'readwrite');
      tx.objectStore('exports').put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function readExports(scope: string): Promise<ExportRecord[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('exports', 'readonly').objectStore('exports').index('scope').getAll(scope);
      request.onsuccess = () => resolve((request.result as ExportRecord[]).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
