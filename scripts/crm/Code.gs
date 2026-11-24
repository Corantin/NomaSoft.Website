// Bound Apps Script. Enable the Google Sheets advanced service (v4).
const tables = {
  customers: ['id','name','contact','email'],
  engagements: ['id','customerId','title','stage','owner','nextAction','due','model','scope','terms','github','vercel'],
  charges: ['id','engagementId','label','due','cents','issued'],
  work: ['id','engagementId','date','member','minutes','description'],
  payments: ['id','engagementId','date','cents','reference']
};
function setupCRM() {
  const book = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('BOOK_ID'));
  PropertiesService.getScriptProperties().setProperty('BOOK_ID', book.getId());
  Object.keys(tables).forEach(key => {
    const name = 'CRM_' + key;
    if (book.getSheetByName(name)) return;
    const tab = book.insertSheet(name);
    tab.appendRow(tables[key]);
    tab.setFrozenRows(1);
  });
}
function doPost(e) {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const {secret,payload} = JSON.parse(e.postData.contents);
  const props = PropertiesService.getScriptProperties();
  if (!secret || secret !== props.getProperty('CRM_SECRET')) return output({error:'Access denied'});
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const book = SpreadsheetApp.openById(props.getProperty('BOOK_ID'));
    const snapshot = () => {
      const board = {};
      for (const [key,fields] of Object.entries(tables)) {
        const rows = book.getSheetByName('CRM_'+key).getDataRange().getValues();
        if (fields.some((field,i)=>rows[0][i] !== field)) throw Error('Unexpected header in '+key);
        // Keep physical row positions until after planning writes, including blank rows.
        board[key] = rows.slice(1).map(row=>Object.fromEntries(fields.map((field,i)=>{
          let v = row[i];
          if (v instanceof Date) v = Utilities.formatDate(v,book.getSpreadsheetTimeZone(),'yyyy-MM-dd');
          return [field,field==='issued' ? String(v).toLowerCase()==='true' : ['cents','minutes'].includes(field) ? Number(v) : String(v ?? '')];
        })));
      }
      board.version = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(board)));
      return board;
    };
    let board = snapshot();
    const requests = [];
    function put(key,record) {
      const index = board[key].findIndex(r=>r.id===record.id);
      const sheetId = book.getSheetByName('CRM_'+key).getSheetId();
      const rows = [{values:tables[key].map(field=>({userEnteredValue:typeof record[field]==='number'
        ? {numberValue:record[field]} : {stringValue:String(record[field] ?? '')}}))}];
      requests.push(index<0 ? {appendCells:{sheetId,rows,fields:'userEnteredValue'}} :
        {updateCells:{start:{sheetId,rowIndex:index+1,columnIndex:0},rows,fields:'userEnteredValue'}});
    }
    if (payload.action==='save' || payload.action==='move') {
      if (payload.version!==board.version) return output({conflict:true});
      if (payload.action==='save') {
        if (payload.engagement.customerId !== payload.customer.id) throw Error('Customer mismatch');
        put('customers',payload.customer);
        put('engagements',payload.engagement);
      } else {
        const record = board.engagements.find(r=>r.id===payload.engagementId);
        if (!record) throw Error('Unknown engagement');
        put('engagements',{...record,stage:payload.stage});
      }
    } else if (payload.action==='issue') {
      if (payload.version!==board.version) return output({conflict:true});
      const record = board.charges.find(r=>r.id===payload.chargeId);
      if (!record) throw Error('Unknown installment');
      put('charges',{...record,issued:true});
    } else if (['charge','work'].includes(payload.action)) {
      const record=payload[payload.action], key=payload.action==='charge'?'charges':'work';
      if (!board.engagements.some(r=>r.id===record.engagementId)) throw Error('Unknown engagement');
      if (!board[key].some(r=>r.id===record.id)) put(key,record);
    } else if (payload.action==='payment') {
      if (!board.engagements.some(r=>r.id===payload.payment.engagementId)) throw Error('Unknown engagement');
      if (!board.payments.some(r=>r.id===payload.payment.id)) put('payments',payload.payment);
    } else if (payload.action!=='read') throw Error('Unknown action');
    if (requests.length) {
      Sheets.Spreadsheets.batchUpdate({requests}, book.getId());
      board = snapshot();
    }
    for (const key of Object.keys(tables)) board[key] = board[key].filter(r=>r.id);
    return output({board});
  } finally {lock.releaseLock();}
}
