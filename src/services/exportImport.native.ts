import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { toISODate } from '@/lib/dates';

export type ExportOutcome = { ok: true; uri: string; shared: boolean } | { ok: false; message: string };
export type PickOutcome = { ok: true; text: string; fileName: string } | { ok: false; cancelled: boolean; message: string };

/** Writes the CSV to the cache directory and opens the system share sheet. */
export async function exportCSVFile(csv: string, now = new Date()): Promise<ExportOutcome> {
  try {
    const file = new File(Paths.cache, `subtally-export-${toISODate(now)}.csv`);
    if (file.exists) file.delete();
    file.create();
    await file.write(csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export subscriptions',
        UTI: 'public.comma-separated-values-text',
      });
      return { ok: true, uri: file.uri, shared: true };
    }
    return { ok: true, uri: file.uri, shared: false };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not write the export file.' };
  }
}

/** Lets the user pick a CSV and returns its text. */
export async function pickCSVFile(): Promise<PickOutcome> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return { ok: false, cancelled: true, message: '' };
    const asset = result.assets[0];
    if (!asset) return { ok: false, cancelled: false, message: 'No file was selected.' };
    const file = new File(asset.uri);
    const text = await file.text();
    return { ok: true, text, fileName: asset.name };
  } catch (error) {
    return { ok: false, cancelled: false, message: error instanceof Error ? error.message : 'Could not read that file.' };
  }
}
