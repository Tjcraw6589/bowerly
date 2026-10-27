import { OTHER_CATEGORY_ID } from './categories';
import { isValidISODate, toISODate } from './dates';
import { parsePriceInput } from './money';
import type { Category, CycleUnit, ItemKind, Subscription, SubscriptionDraft, SubscriptionStatus } from './types';

export const CSV_HEADERS = [
  'name',
  'type',
  'price',
  'amount_varies',
  'autopay',
  'paid_through',
  'currency',
  'cycle_every',
  'cycle_unit',
  'first_bill_date',
  'category',
  'color',
  'emoji',
  'notes',
  'reminder_days_before',
  'status',
  'trial_end_date',
] as const;

export function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** RFC 4180 parser: handles quoted fields, escaped quotes, embedded newlines, CRLF and LF. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const src = text.startsWith('﻿') ? text.slice(1) : text;

  while (i < src.length) {
    const ch = src[i] as string;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r' || ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      if (ch === '\r' && src[i + 1] === '\n') i++;
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

export function subscriptionsToCSV(subs: readonly Subscription[], categories: readonly Category[]): string {
  const lines: string[] = [CSV_HEADERS.join(',')];
  for (const s of subs) {
    const category = categories.find((c) => c.id === s.categoryId);
    const cells = [
      s.name,
      s.kind,
      s.price.toFixed(2),
      s.amountVaries ? 'yes' : 'no',
      s.kind === 'bill' ? (s.autopay ? 'yes' : 'no') : '',
      s.paidThrough ?? '',
      s.currency,
      String(s.cycle.every),
      s.cycle.unit,
      s.firstBillDate,
      category?.name ?? 'Other',
      s.color,
      s.emoji,
      s.notes,
      s.reminderDaysBefore === null ? '' : String(s.reminderDaysBefore),
      s.status,
      s.trialEndDate ?? '',
    ];
    lines.push(cells.map(csvEscape).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  drafts: SubscriptionDraft[];
  newCategories: Category[];
  errors: ImportError[];
}

const UNITS: readonly CycleUnit[] = ['day', 'week', 'month', 'year'];
const STATUSES: readonly SubscriptionStatus[] = ['active', 'paused', 'cancelled'];

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/^﻿/, '').replace(/[\s-]+/g, '_');
}

/** Reads yes/no style cells; returns null for anything unrecognised. Empty means the default. */
function booleanFromText(text: string, fallback: boolean): boolean | null {
  const t = text.trim().toLowerCase();
  if (!t) return fallback;
  if (['yes', 'y', 'true', '1'].includes(t)) return true;
  if (['no', 'n', 'false', '0'].includes(t)) return false;
  return null;
}

function kindFromText(text: string): ItemKind | null {
  const t = text.trim().toLowerCase();
  if (!t || t === 'subscription' || t === 'subscriptions' || t === 'sub') return 'subscription';
  if (t === 'bill' || t === 'bills') return 'bill';
  return null;
}

function unitFromText(text: string): CycleUnit | null {
  const t = text.trim().toLowerCase();
  if (!t) return 'month';
  const singular = t.endsWith('s') ? t.slice(0, -1) : t;
  if (singular === 'daily') return 'day';
  if (singular === 'weekly') return 'week';
  if (singular === 'monthly') return 'month';
  if (singular === 'yearly' || singular === 'annual' || singular === 'annually') return 'year';
  return (UNITS as readonly string[]).includes(singular) ? (singular as CycleUnit) : null;
}

/**
 * Parses a CSV exported by Bowerly (or a hand-made one with at least `name` and `price` columns).
 * Unknown categories are created. Rows with problems are skipped and reported, never imported half-formed.
 */
export function parseSubscriptionsCSV(
  text: string,
  categories: readonly Category[],
  defaults: { currency: string; today: Date; newCategoryId: () => string },
): ImportResult {
  const rows = parseCSV(text);
  const errors: ImportError[] = [];
  const drafts: SubscriptionDraft[] = [];
  const newCategories: Category[] = [];
  const header = rows[0];
  if (!header) return { drafts, newCategories, errors: [{ row: 0, message: 'The file is empty.' }] };

  const columns = header.map(normaliseHeader);
  const col = (name: string): number => columns.indexOf(name);
  if (col('name') < 0 || col('price') < 0) {
    return { drafts, newCategories, errors: [{ row: 1, message: 'The header must include "name" and "price" columns.' }] };
  }

  const allCategories: Category[] = [...categories];
  const cell = (r: string[], name: string): string => {
    const i = col(name);
    return i < 0 ? '' : (r[i] ?? '').trim();
  };

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as string[];
    const rowNumber = r + 1;
    const name = cell(row, 'name');
    if (!name) {
      errors.push({ row: rowNumber, message: 'Missing name.' });
      continue;
    }
    const price = parsePriceInput(cell(row, 'price'));
    if (price === null) {
      errors.push({ row: rowNumber, message: `Invalid price for "${name}".` });
      continue;
    }
    const everyText = cell(row, 'cycle_every');
    const every = everyText ? Number(everyText) : 1;
    if (!Number.isInteger(every) || every < 1 || every > 365) {
      errors.push({ row: rowNumber, message: `Invalid cycle count for "${name}".` });
      continue;
    }
    const unit = unitFromText(cell(row, 'cycle_unit'));
    if (!unit) {
      errors.push({ row: rowNumber, message: `Invalid cycle unit for "${name}" (use day, week, month or year).` });
      continue;
    }
    const firstBillDate = cell(row, 'first_bill_date') || toISODate(defaults.today);
    if (!isValidISODate(firstBillDate)) {
      errors.push({ row: rowNumber, message: `Invalid first bill date for "${name}" (use yyyy-mm-dd).` });
      continue;
    }
    const trialText = cell(row, 'trial_end_date');
    if (trialText && !isValidISODate(trialText)) {
      errors.push({ row: rowNumber, message: `Invalid trial end date for "${name}" (use yyyy-mm-dd).` });
      continue;
    }
    const statusText = cell(row, 'status').toLowerCase() || 'active';
    if (!(STATUSES as readonly string[]).includes(statusText)) {
      errors.push({ row: rowNumber, message: `Invalid status for "${name}" (use active, paused or cancelled).` });
      continue;
    }
    const reminderText = cell(row, 'reminder_days_before');
    let reminderDaysBefore: number | null = null;
    if (reminderText) {
      const n = Number(reminderText);
      if (!Number.isInteger(n) || n < 0 || n > 30) {
        errors.push({ row: rowNumber, message: `Invalid reminder days for "${name}".` });
        continue;
      }
      reminderDaysBefore = n;
    }
    const currency = (cell(row, 'currency') || defaults.currency).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.push({ row: rowNumber, message: `Invalid currency code for "${name}".` });
      continue;
    }
    const kind = kindFromText(cell(row, 'type'));
    if (!kind) {
      errors.push({ row: rowNumber, message: `Invalid type for "${name}" (use subscription or bill).` });
      continue;
    }
    const autopay = booleanFromText(cell(row, 'autopay'), true);
    const amountVaries = booleanFromText(cell(row, 'amount_varies'), false);
    if (autopay === null || amountVaries === null) {
      errors.push({ row: rowNumber, message: `Use yes or no for autopay and amount_varies on "${name}".` });
      continue;
    }
    const paidThroughText = cell(row, 'paid_through');
    if (paidThroughText && !isValidISODate(paidThroughText)) {
      errors.push({ row: rowNumber, message: `Invalid paid-through date for "${name}" (use yyyy-mm-dd).` });
      continue;
    }

    const categoryName = cell(row, 'category');
    let category = categoryName
      ? allCategories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
      : allCategories.find((c) => c.id === OTHER_CATEGORY_ID);
    if (!category) {
      category = {
        id: defaults.newCategoryId(),
        name: categoryName,
        emoji: '🏷️',
        color: '#64748B',
        builtIn: false,
      };
      allCategories.push(category);
      newCategories.push(category);
    }

    const colorText = cell(row, 'color');
    const color = /^#[0-9a-fA-F]{6}$/.test(colorText) ? colorText : category.color;

    drafts.push({
      name,
      kind,
      autopay: kind === 'bill' ? autopay : true,
      amountVaries,
      paidThrough: kind === 'bill' && !autopay ? paidThroughText || null : null,
      price,
      currency,
      cycle: { every, unit },
      firstBillDate,
      categoryId: category.id,
      color,
      emoji: cell(row, 'emoji') || category.emoji,
      notes: cell(row, 'notes'),
      reminderDaysBefore,
      status: statusText as SubscriptionStatus,
      trialEndDate: trialText || null,
      cancelledAt: statusText === 'cancelled' ? defaults.today.toISOString() : null,
    });
  }

  return { drafts, newCategories, errors };
}
