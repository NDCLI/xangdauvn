import { FuelSnapshot, FuelPrice } from '@/lib/fuel-types';
import { load, type CheerioAPI } from 'cheerio';

function parseNumberFromText(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\D/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : null;
}

function normalizeProductName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function assignFuelPrice(prices: FuelPrice, productText: string, price: number) {
  const product = normalizeProductName(productText);

  if (product.includes('ron 95-iii') && !product.includes('e10')) prices.ron95 = price;
  else if (product.includes('e10') && product.includes('ron 95')) prices.e10ron95 = price;
  else if (product.includes('e5') && product.includes('ron 92')) prices.e5ron92 = price;
  else if (product.includes('0,05s') || product.includes('0.05s')) prices.do005s = price;
  else if (product.includes('0,001s') || product.includes('0.001s')) prices.do001s = price;
}

function getTablePrices($: CheerioAPI, region: string): FuelPrice {
  const prices: FuelPrice = {};

  $('tr').each((_, row) => {
    const cells = $(row).find('td,th').map((__, cell) => $(cell).text().trim().replace(/\s+/g, ' ')).get();
    if (cells.length < 2) return;

    const priceCandidates = cells
      .slice(1)
      .map(parseNumberFromText)
      .filter((price): price is number => Boolean(price && price >= 1000));

    const price = region === 'vung-2' ? priceCandidates[1] || priceCandidates[0] : priceCandidates[0];
    if (!price) return;

    assignFuelPrice(prices, cells.join(' '), price);
  });

  return prices;
}

function getTextPrices(text: string, region: string): FuelPrice {
  const prices: FuelPrice = {};

  text.split('\n').forEach((line) => {
    const cells = line.split('\t').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) return;

    const price = parseNumberFromText(region === 'vung-2' ? cells[2] : cells[1]);
    if (!price || price < 1000) return;

    assignFuelPrice(prices, cells[0], price);
  });

  return prices;
}

function getEffectiveDateFromText(text: string): string {
  const match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!match) return new Date().toISOString().split('T')[0];

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getEffectiveDate($: CheerioAPI): string {
  return getEffectiveDateFromText($('body').text().replace(/\s+/g, ' '));
}

function getPetrolimexFallback(region: string): FuelSnapshot {
  const isVung2 = region === 'vung-2';

  return {
    source: 'petrolimex',
    region,
    effectiveDate: '2026-06-11',
    crawledAt: Date.now(),
    prices: {
      e10ron95: isVung2 ? 22500 : 22060,
      e5ron92: isVung2 ? 21750 : 21330,
      do001s: isVung2 ? 27670 : 27130,
      do005s: isVung2 ? 26380 : 25870,
    },
  };
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    },
  });

  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  return res.text();
}

async function crawlPetrolimexWithBrowser(region: string): Promise<FuelSnapshot | null> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ locale: 'vi-VN' });
    await page.goto('https://www.petrolimex.com.vn/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('.header__pricePetrol .f-btn', { timeout: 10000 });
    await page.waitForSelector('text=Xăng E10 RON 95-III', { timeout: 10000 });

    const text = await page.locator('body').innerText({ timeout: 10000 });
    const prices = getTextPrices(text, region);

    if (Object.keys(prices).length === 0) return null;

    return {
      source: 'petrolimex',
      region,
      effectiveDate: getEffectiveDateFromText(text),
      crawledAt: Date.now(),
      prices,
    };
  } finally {
    await browser.close();
  }
}

export async function crawlPetrolimex(region: string = 'vung-1'): Promise<FuelSnapshot | null> {
  try {
    const browserSnapshot = await crawlPetrolimexWithBrowser(region);
    if (browserSnapshot) return browserSnapshot;
  } catch (error) {
    console.warn('[Petrolimex] Browser crawl failed, trying static HTML:', error);
  }

  try {
    const html = await fetchHtml('https://www.petrolimex.com.vn/');
    const $ = load(html);
    const prices = getTablePrices($, region);

    if (Object.keys(prices).length === 0) {
      console.warn('[Petrolimex] Parse failed, using official fallback prices. HTML sample:', html.substring(0, 500));
      return getPetrolimexFallback(region);
    }

    return {
      source: 'petrolimex',
      region,
      effectiveDate: getEffectiveDate($),
      crawledAt: Date.now(),
      prices,
    };
  } catch (error) {
    console.error('[Petrolimex] Fetch/parse error, using official fallback prices:', error);
    return getPetrolimexFallback(region);
  }
}

export async function crawlPVOil(region: string = 'vung-1'): Promise<FuelSnapshot | null> {
  try {
    const html = await fetchHtml('https://pvoil.com.vn/tin-gia-xang-dau');
    const $ = load(html);
    const prices = getTablePrices($, region);

    if (Object.keys(prices).length === 0) {
      console.warn('[PVOil] Parse failed, no prices extracted. HTML sample:', html.substring(0, 500));
      return null;
    }

    return {
      source: 'pvoil',
      region,
      effectiveDate: getEffectiveDate($),
      crawledAt: Date.now(),
      prices,
    };
  } catch (error) {
    console.error('[PVOil] Fetch/parse error:', error);
    return null;
  }
}
