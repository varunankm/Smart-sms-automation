const xlsx = require('xlsx');
const fs = require('fs');

const files = [
  'c:\\Users\\varun\\Desktop\\itc3rdmobilenumber.xlsx',
  'c:\\Users\\varun\\Desktop\\Book1.xlsx'
];

let out = '';
for(const f of files) {
  try {
    const workbook = xlsx.readFile(f);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // header: 1 returns 2D array
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    out += `\n--- ${f} ---\n`;
    out += "Total rows: " + data.length + "\n";
    for(let i=0; i<Math.min(5, data.length); i++) {
        out += `Row ${i}: ` + JSON.stringify(data[i]) + "\n";
    }
  } catch(e) {
    out += `Error reading ${f}: ` + e.message + "\n";
  }
}
fs.writeFileSync('test_out3.txt', out, 'utf-8');
