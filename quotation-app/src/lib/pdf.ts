import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { CompanyProfile, Quotation } from './types';
import { quoteHtml } from './export-content';

export { quoteHtml };

export async function buildQuotePdf(profile: CompanyProfile, q: Quotation): Promise<string> {
  const html = quoteHtml(profile, q);
  const { uri } = await Print.printToFileAsync({ html });
  // expo-file-system API changed between SDK versions; handle both shapes.
  const fs: any = FileSystem as any;
  const move = fs.moveAsync ? fs.moveAsync.bind(fs) : null;
  let fileUri = uri;
  if (move && fs.documentDirectory) {
    const dest = `${fs.documentDirectory}Quote_${q.number.replace(/[^A-Za-z0-9_-]/g, '')}_${Date.now()}.pdf`;
    try {
      await move({ from: uri, to: dest });
      fileUri = dest;
    } catch {
      fileUri = uri;
    }
  }
  return fileUri;
}

export async function sharePdf(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share quotation' });
  } else {
    await Print.printAsync({ uri });
  }
}
