const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/data/alfon.xlsx');

function updateExcel() {
  console.log('Reading Excel file from:', filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  // Check if already exists
  const exists = data.some(row => String(row['מ.א']) === '8129902');
  if (exists) {
    console.log('Soldier 8129902 already exists in Excel.');
    return;
  }

  const newRow = {
    'פלוגה': 'ב',
    'מחלקה': 1,
    'חיל': 'רובוטיקה',
    'דרגה': 'קצין',
    'מ.א': 8129902,
    'שם משפחה': 'לי',
    'שם פרטי': 'יובלי',
    'תפקיד': 'מפקד פלוגת רובוטיקה'
  };

  data.push(newRow);
  const newWorksheet = xlsx.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;

  xlsx.writeFile(workbook, filePath);
  console.log('Successfully updated Excel file with Yuval Li.');
}

updateExcel();
