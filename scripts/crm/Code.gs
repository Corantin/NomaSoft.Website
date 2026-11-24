// The workspace validates project membership before sending a time entry.
const hourFields = ['id', 'engagementId', 'date', 'member', 'minutes', 'description'];
function setupCRM() {
  const props = PropertiesService.getScriptProperties();
  const book = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(props.getProperty('BOOK_ID'));
  props.setProperty('BOOK_ID', book.getId());
  if (!book.getSheetByName('CRM_work')) book.insertSheet('CRM_work').appendRow(hourFields);
}
function doPost(e) {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const props = PropertiesService.getScriptProperties();
  const {secret, payload} = JSON.parse(e.postData.contents);
  if (!secret || secret !== props.getProperty('CRM_SECRET')) return output({error:'Access denied'});
  if (!['read','work'].includes(payload.action)) return output({error:'Unknown hours action'});
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const book = SpreadsheetApp.openById(props.getProperty('BOOK_ID'));
    const tab = book.getSheetByName('CRM_work');
    const [header,...rows] = tab.getDataRange().getValues();
    if (hourFields.some((key,i)=>key!==header[i])) throw Error('Unexpected time entry header');
    const work = rows.filter(row=>row[0]).map(row=>Object.fromEntries(hourFields.map((key,i)=>
      [key, row[i] instanceof Date ? Utilities.formatDate(row[i],book.getSpreadsheetTimeZone(),'yyyy-MM-dd') : row[i]])));
    if (payload.action === 'work' && !work.some(row=>row.id===payload.work.id)) {
      const entry = payload.work;
      const values = hourFields.map(key => ({userEnteredValue: key==='minutes' ? {numberValue:entry.minutes} : {stringValue:String(entry[key] || '')}}));
      Sheets.Spreadsheets.batchUpdate({requests:[{appendCells:{sheetId:tab.getSheetId(),rows:[{values}],fields:'userEnteredValue'}}]},book.getId());
      work.push(entry);
    }
    return output({work});
  } finally { lock.releaseLock(); }
}
