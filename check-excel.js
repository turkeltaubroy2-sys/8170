const xlsx = require('xlsx');
const path = require('path');

try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'alfon.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const alfonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    console.log('Columns:', Object.keys(alfonData[0]));
    console.log('Sample Data:', JSON.stringify(alfonData.slice(0, 2), null, 2));
} catch (error) {
    console.error('Error reading excel:', error.message);
}
