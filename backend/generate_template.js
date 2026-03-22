const xlsx = require("xlsx");

const aoa = [
  [],
  ['', '', '', 'V.S.B. ENGINEERING COLLEGE, KARUR'],
  ['', '', '', 'Department of Information Technology'],
  ['', '', '', 'Internal test - I'],
  ['NAME', 'REGISTER NUMBER', 'PHONE', 'OOSE', 'RES', 'CC', 'DM', 'N5', 'percentag', 'REMARKS'],
  ['varunan k.m', '922523205172', '9566668691', 60, 80, 55, 78, 64, '56%', 'good'],
  ['sudharsan', '922523205172', '97886264621', 96, 70, 62, 40, 56, '56%', 'average'],
  ['rajesh', '922523205172', '8248909490', 60, 94, 99, 78, 10, '56%', 'to improve'],
  ['vijaykumar', '922523205172', '9788626461', 60, 70, 62, 95, 64, '56%', 'wrost'],
  ['vicky', '922523205172', '7373855555', 56, 36, 40, 78, 100, '56%', 'excelent'],
  ['kam raj', '922523205172', '7373855555', 60, 65, 62, 90, 64, '56%', 'excelent'],
  ['kumar', '922523205172', '8248909490', 46, 23, 62, 78, 28, '56%', 'good'],
  ['mekala', '922523205172', '7373855555', 60, 90, 62, 78, 64, '56%', 'good'],
  ['tamilselvan', '922523205172', '8012266773', 66, 70, 72, 55, 23, '56%', 'badd'],
  ['tamilselvan', '922523205172', '8012266773', 66, 70, 72, 55, 23, '56%', 'badd'],
  ['sudharsan', '922523205172', '97886264621', 96, 70, 62, 40, 56, '56%', 'average']
];

const ws = xlsx.utils.aoa_to_sheet(aoa);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

xlsx.writeFile(wb, '../frontend/public/Student_Marks_Template.xlsx');
console.log('Template created successfully.');
