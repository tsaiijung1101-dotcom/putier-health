import { google } from "googleapis";
import "dotenv/config";

const auth = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY ? new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
}) : null;

const sheets = google.sheets({ version: 'v4', auth: auth as any });

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!auth || !spreadsheetId) {
    console.error("Missing Google Sheets credentials in .env");
    process.exit(1);
  }

  console.log("Connecting to Google Sheets ID:", spreadsheetId);

  try {
    // 1. Get spreadsheet metadata to see existing sheet names
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets || [];
    const sheetTitles = existingSheets.map(s => s.properties?.title || "");
    console.log("Current sheets:", sheetTitles);

    const sheetsToCreate = [
      {
        title: "領導人名冊",
        headers: ["時間", "姓名", "電話", "Email", "暱稱/自訂ID", "LINE ID", "LINE連結"]
      },
      {
        title: "評估報告",
        headers: ["時間", "LINE ID", "客戶姓名/暱稱", "出生年月日", "性別", "BMI", "每日建議飲水量", "身體症狀", "細胞修復建議服用量", "服用天數建議", "目前服用藥物", "曾做過手術", "評估ID"]
      },
      {
        title: "修復日誌",
        headers: ["時間", "LINE ID", "服用量", "身體反應", "備註/補充說明", "回報日期"]
      },
      {
        title: "客戶每日追蹤",
        headers: ["時間", "領導人ID", "客戶代碼/暱稱", "單日服總顆數", "服用次數/餐數", "已連續服用天數", "身體反應", "補充說明/備註"]
      }
    ];

    const requests: any[] = [];

    // Create sheets that don't exist
    for (const item of sheetsToCreate) {
      if (!sheetTitles.includes(item.title)) {
        console.log(`Adding sheet: ${item.title}`);
        requests.push({
          addSheet: {
            properties: {
              title: item.title
            }
          }
        });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
      console.log("Sheets created successfully!");
    }

    // Now write headers for all worksheets
    for (const item of sheetsToCreate) {
      console.log(`Writing headers for sheet: ${item.title}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${item.title}!A1:${String.fromCharCode(65 + item.headers.length - 1)}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [item.headers]
        }
      });
    }
    console.log("Headers updated successfully!");

    // Delete default Sheet1 / 工作表1 if it is blank and we have our sheets
    const defaultSheet = existingSheets.find(s => s.properties?.title === "工作表1" || s.properties?.title === "Sheet1");
    if (defaultSheet && defaultSheet.properties?.sheetId !== undefined) {
      console.log(`Deleting default sheet: ${defaultSheet.properties.title}`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: defaultSheet.properties.sheetId
              }
            }
          ]
        }
      });
      console.log("Default sheet deleted successfully!");
    }

    console.log("Google Sheets Initialization Completed Successfully! 🎉");

  } catch (err: any) {
    console.error("Failed to initialize Google Sheets:", err);
  }
}

main();
