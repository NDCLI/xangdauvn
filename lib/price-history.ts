import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import type { FuelSnapshot } from './fuel-types';

const PRICE_HISTORY_COL = 'fuel_price_history';
const LOCAL_KEY = 'xangdau:priceHistory_v2';

export async function savePriceSnapshot(snapshot: FuelSnapshot) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    const isDuplicate = arr.some((item: any) => item.region === snapshot.region && item.effectiveDate === snapshot.effectiveDate);
    if (isDuplicate) return;

    const col = collection(db, PRICE_HISTORY_COL);
    await addDoc(col, { ...snapshot, timestamp: new Date().toISOString() });
    saveLocal(snapshot);
  } catch (err) {
    console.warn('Firestore save failed, falling back to localStorage', err);
    saveLocal(snapshot);
  }
}

export async function getPreviousSnapshot(region: string, currentCrawledAt?: number): Promise<FuelSnapshot | null> {
  try {
    const q = query(collection(db, PRICE_HISTORY_COL), orderBy('crawledAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docs = snap.docs.map(doc => doc.data() as FuelSnapshot);
    const match = docs.find(d => 
      d.region === region && 
      (!currentCrawledAt || d.crawledAt < currentCrawledAt) &&
      !Object.values(d.prices || {}).some((p: any) => p !== null && p < 1000)
    );
    return match || null;
  } catch (err) {
    console.warn('Firestore read failed, using local', err);
    return getLocalPrevious(region, currentCrawledAt);
  }
}

function saveLocal(snapshot: FuelSnapshot) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    if (arr.some((item: any) => item.region === snapshot.region && item.crawledAt === snapshot.crawledAt)) {
      return;
    }
    arr.unshift(snapshot);
    arr.splice(20); // keep 20
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  } catch (e) { console.warn(e); }
}

function getLocalPrevious(region: string, currentCrawledAt?: number): FuelSnapshot | null {
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return arr.find((item: any) => 
      item.region === region && 
      (!currentCrawledAt || item.crawledAt < currentCrawledAt) &&
      !Object.values(item.prices || {}).some((p: any) => p !== null && p < 1000)
    ) || null;
  } catch (e) { return null; }
}
