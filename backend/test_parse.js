const rawData = [
  [null,"NAME","REGISTER NUMBER","PHONE","OOSE","RES","CC","DM","NS","REMARKS"],
  [null,"varunan k.m","922523205172",9566668691,"60",70,62,"78","64","good"],
  [null,"sudharsan","922523205172",9566668691,"60",70,62,"78","64","good"],
  [null,"varunan k.m","922523205172",9566668691,"60",70,62,"78","64","good"],
  [null,"varunan k.m","922523205172",9566668691,"60",70,62,"78","64","good"]
];

let headerRowIndex = -1;
let headerCols = [];
let maxHits = 0;

for(let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    if (!Array.isArray(row)) continue;
    
    let hits = 0;
    for(let j=0; j<row.length; j++) {
        const val = String(row[j] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
        if(['name', 'student', 'regno', 'registration', 'rollno', 'phone', 'mobile', 'contact', 'whatsapp', 'remarks'].includes(val) || val.includes('name') || val.includes('reg') || val.includes('mobile') || val.includes('phone') || val.includes('contact')) {
            hits++;
        }
    }
    
    if(hits > maxHits) {
        maxHits = hits;
        headerRowIndex = i;
        headerCols = row.map(v => String(v || '').trim());
    }
    
    if(hits >= 2) {
        break;
    }
}

const mappedData = [];
for(let i = headerRowIndex + 1; i < rawData.length; i++) {
    const rowArray = rawData[i];
    if(!rowArray || rowArray.length === 0) continue;
    
    const isEmpty = rowArray.every(val => val === null || val === undefined || val === '');
    if(isEmpty) continue;

    let Name = '';
    let RegNo = '';
    let Phone = '';
    let Remarks = '';
    const marks = [];

    for(let j = 0; j < headerCols.length; j++) {
        const key = headerCols[j];
        if(!key) continue;
        
        const val = rowArray[j];
        if(val === null || val === undefined || val === '') continue;

        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (['name', 'studentname', 'student'].includes(normalizedKey)) {
            Name = val;
        } else if (
            ['regno', 'regnumber', 'registrationnumber', 'rollno', 'rollnumber', 'registrationno', 'reg'].includes(normalizedKey) || 
            normalizedKey.includes('reg') || 
            normalizedKey.includes('roll')
        ) {
            RegNo = val;
        } else if (
            ['phone', 'phoneno', 'phonenumber', 'mobile', 'mobileno', 'mobilenumber', 'contact', 'contactnumber', 'contactno', 'whatsapp', 'parentswhatsappnumber', 'parentswhatsapp', 'studentnumber'].includes(normalizedKey) || 
            normalizedKey.includes('mobile') || 
            normalizedKey.includes('whatsapp') || 
            normalizedKey.includes('phone') || 
            normalizedKey.includes('contact')
        ) {
            if (!Phone || normalizedKey.includes('parent') || normalizedKey.includes('whatsapp') || normalizedKey.includes('mother') || normalizedKey.includes('father')) {
                Phone = val;
            }
        } else if (['remarks', 'remark', 'comments', 'comment'].includes(normalizedKey)) {
            Remarks = val;
        } else if (!['sno', 'serialno', 'slno'].includes(normalizedKey)) {
            marks.push({ subject: key, score: val });
        }
    }

    Phone = Phone ? Phone.toString().replace(/[^\d+]/g, '') : '';
    if (Phone.length > 10 && Phone.startsWith('0')) {
        Phone = Phone.substring(1);
    }
    
    mappedData.push({
        id: Math.random().toString(36).substring(7),
        name: Name || 'Unknown',
        regNo: RegNo || 'N/A',
        phone: Phone,
        marks,
        remarks: Remarks,
        status: 'Pending'
    });
}
console.log("Mapped Data Length:", mappedData.length);
console.log(mappedData[0]);
console.log(mappedData[1]);
