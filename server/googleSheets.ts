import { google } from 'googleapis';
import { ENV } from './_core/env';

const auth = ENV.googleServiceAccountEmail && ENV.googlePrivateKey ? new google.auth.JWT({
  email: ENV.googleServiceAccountEmail,
  key: ENV.googlePrivateKey.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
}) : null;

const sheets = google.sheets({ version: 'v4', auth: auth as any });

export async function appendRow(range: string, values: any[]) {
  if (!auth || !ENV.googleSheetsId) {
    console.warn("[Google Sheets] Service Account or Sheet ID not configured, simulating sync...");
    console.log(`[Mock Sync] ${range}:`, values);
    return;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: ENV.googleSheetsId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    console.log(`[Google Sheets] Successfully appended row to ${range}`);
  } catch (error) {
    console.error("[Google Sheets] Error appending row:", error);
  }
}
