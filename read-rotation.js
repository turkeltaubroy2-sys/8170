const XLSX = require('xlsx');
const path = require('path');

const filePath = "C:\\Users\\YaelDrori\\Documents\\roy cv\\סבב יציאות עורף.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}
