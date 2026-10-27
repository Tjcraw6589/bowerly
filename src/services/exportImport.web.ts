import * as DocumentPicker from 'expo-document-picker';

import { toISODate } from '@/lib/dates';

export type ExportOutcome = { ok: true; uri: string; shared: boolean } | { ok: false; message: string };
export type PickOutcome = { ok: true; text: string; fileName: string } | { ok: false; cancelled: boolean; message: string };

/** On the web the export is a plain browser download. */
export async function exportCSVFile(csv: string, now = new Date()): Promise<ExportOutcome> {
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bowerly-export-${toISODate(now)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, uri: url, shared: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not create the download.' };
  }
}

export async function pickCSVFile(): Promise<PickOutcome> {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain'], multiple: false });
    if (result.canceled) return { ok: false, cancelled: true, message: '' };
    const asset = result.assets[0];
    if (!asset) return { ok: false, cancelled: false, message: 'No file was selected.' };
    const file = asset.file;
    if (!file) return { ok: false, cancelled: false, message: 'The browser did not provide the file contents.' };
    const text = await file.text();
    return { ok: true, text, fileName: asset.name };
  } catch (error) {
    return { ok: false, cancelled: false, message: error instanceof Error ? error.message : 'Could not read that file.' };
  }
}
