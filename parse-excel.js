const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('C:\\Users\\YaelDrori\\Documents\\roy cv\\אלפון\\Copy of אלפון פלוגה ב - Sheet1.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  
  if (data.length > 0) {
    console.log("Headers:", Object.keys(data[0]));
    console.log("Row 1 Sample:", data[0]);
    console.log("Total rows:", data.length);
  }
} catch(e) {
  console.error(e);
}
