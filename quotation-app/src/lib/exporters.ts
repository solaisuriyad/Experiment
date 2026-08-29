import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as LegacyFS from 'expo-file-system/legacy';
import { CompanyProfile, Quotation } from './types';
import { buildQuotePdf } from './pdf';
import {
  ExportFormat,
  ExportOption,
  EXPORT_OPTIONS,
  filenameFor,
  quoteDoc,
  quoteHtml,
  quoteHtmlFile,
  quoteText,
} from './export-content';

export type { ExportFormat, ExportOption };
export { EXPORT_OPTIONS };

type NativeSaveResult = { action: 'saved' | 'shared'; uri: string };

async function saveTextFile(
  filename: string,
  content: string,
  mime: string,
): Promise<NativeSaveResult> {
  // 1) Android: ask the user where to save it (real "download to device").
  if (Platform.OS === 'android' && LegacyFS.StorageAccessFramework) {
    try {
      const perm = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perm.granted) {
        const safUri = await LegacyFS.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, mime);
        await LegacyFS.writeAsStringAsync(safUri, content, { encoding: LegacyFS.EncodingType.UTF8 });
        return { action: 'saved', uri: safUri };
      }
    } catch {
      // fall through to share sheet
    }
  }
  // 2) Fallback: write to app documents and open the share sheet
  //    ("Save to Files", WhatsApp, Drive, etc. all available there).
  const base = (LegacyFS.documentDirectory || LegacyFS.cacheDirectory || '') as string;
  const uri = `${base}${filename}`;
  await LegacyFS.writeAsStringAsync(uri, content, { encoding: LegacyFS.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: filename, UTI: mime });
  }
  return { action: 'shared', uri };
}

async function saveNativePdf(
  profile: CompanyProfile,
  q: Quotation,
  filename: string,
): Promise<NativeSaveResult> {
  const srcUri = await buildQuotePdf(profile, q);
  if (Platform.OS === 'android' && LegacyFS.StorageAccessFramework) {
    try {
      const perm = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perm.granted) {
        const safUri = await LegacyFS.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'application/pdf');
        const b64 = await LegacyFS.readAsStringAsync(srcUri, { encoding: LegacyFS.EncodingType.Base64 });
        await LegacyFS.writeAsStringAsync(safUri, b64, { encoding: LegacyFS.EncodingType.Base64 });
        return { action: 'saved', uri: safUri };
      }
    } catch {
      // fall through
    }
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(srcUri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
  } else {
    await import('expo-print').then((m) => m.printAsync({ uri: srcUri }));
  }
  return { action: 'shared', uri: srcUri };
}

function downloadOnWeb(filename: string, content: string, mime: string): void {
  const doc = (globalThis as any).document;
  if (!doc) return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = url;
  a.download = filename;
  doc.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** On web, PDFs are produced via the browser print dialog (Save as PDF). */
function printPdfOnWeb(profile: CompanyProfile, q: Quotation): void {
  const win = (globalThis as any).open('', '_blank');
  if (!win) return;
  win.document.write(quoteHtml(profile, q));
  win.document.close();
  win.focus();
  setTimeout(() => {
    try {
      win.print();
    } catch {
      /* user can use browser menu */
    }
  }, 600);
}

export interface ExportOutcome {
  format: ExportFormat;
  action: 'downloaded' | 'saved' | 'shared' | 'printed';
  filename: string;
  detail: string;
}

export async function exportQuote(
  profile: CompanyProfile,
  q: Quotation,
  format: ExportFormat,
): Promise<ExportOutcome> {
  const opt: ExportOption = EXPORT_OPTIONS.find((o) => o.id === format)!;
  const filename = filenameFor(q, opt.ext);

  if (Platform.OS === 'web') {
    if (format === 'pdf') {
      printPdfOnWeb(profile, q);
      return {
        format,
        action: 'printed',
        filename,
        detail: 'Print dialog opened — choose "Save as PDF" to download it.',
      };
    }
    const content =
      format === 'doc' ? quoteDoc(profile, q) : format === 'html' ? quoteHtmlFile(profile, q) : quoteText(profile, q);
    downloadOnWeb(filename, content, opt.mime);
    return { format, action: 'downloaded', filename, detail: `Downloaded ${filename}.` };
  }

  if (format === 'pdf') {
    const r = await saveNativePdf(profile, q, filename);
    return {
      format,
      action: r.action,
      filename,
      detail:
        r.action === 'saved'
          ? `Saved ${filename} to the folder you picked.`
          : `Share sheet opened — pick "Save to Files" or an app to send ${filename}.`,
    };
  }

  const content =
    format === 'doc' ? quoteDoc(profile, q) : format === 'html' ? quoteHtmlFile(profile, q) : quoteText(profile, q);
  const r = await saveTextFile(filename, content, opt.mime);
  return {
    format,
    action: r.action,
    filename,
    detail:
      r.action === 'saved'
        ? `Saved ${filename} to the folder you picked.`
        : `Share sheet opened — pick "Save to Files" or an app to send ${filename}.`,
  };
}
