const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');

// In-memory array to store students and SMS status
let studentsData = [];
// Flag to prevent overlapping send processes
let isSending = false;

/**
 * Handle Excel file upload and processing
 */
exports.uploadExcel = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use header: 1 to get a natively mapped 2D array. raw: true (default) is REQUIRED to prevent 
        // the xlsx module from aggressively coercing large integer phone numbers into scientific notation.
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

        let headerRowIndex = -1;
        let headerCols = [];
        let maxHits = 0;

        // Find the actual header row by scoring rows (look for 'name', 'reg', 'phone', etc.)
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const row = rawData[i];
            if (!Array.isArray(row)) continue;

            let hits = 0;
            for (let j = 0; j < row.length; j++) {
                const val = String(row[j] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
                if (['name', 'student', 'regno', 'registration', 'rollno', 'phone', 'mobile', 'contact', 'whatsapp', 'remarks'].includes(val) || val.includes('name') || val.includes('reg') || val.includes('mobile') || val.includes('phone') || val.includes('contact')) {
                    hits++;
                }
            }

            if (hits > maxHits) {
                maxHits = hits;
                headerRowIndex = i;
                headerCols = row.map(v => String(v || '').trim());
            }

            // If we found a row with 2 or more matches, it's almost certainly the real header row
            if (hits >= 2) {
                break;
            }
        }

        if (headerRowIndex === -1 && rawData.length > 0) {
            headerRowIndex = 0; // Fallback
            headerCols = rawData[0].map(v => String(v || '').trim());
        }

        // Extract Title Text for Message Prefix (College Name, Dept, Exam Topic located above the Header)
        let headerTopTextArray = [];
        if (headerRowIndex > 0) {
            for (let i = 0; i < headerRowIndex; i++) {
                const titleRow = rawData[i];
                if (!Array.isArray(titleRow)) continue;
                // Join non-empty cells in the row
                let rowText = titleRow
                    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
                    .map(v => String(v).trim())
                    .join(' - ');
                if (rowText) {
                    headerTopTextArray.push(rowText);
                }
            }
        }
        let headerTopText = headerTopTextArray.join('\n');

        const mappedData = [];

        // Process each data row below the identified header
        if (headerRowIndex !== -1) {
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const rowArray = rawData[i];
                if (!rowArray || rowArray.length === 0) continue;

                // skip completely empty rows 
                const isEmpty = rowArray.every(val => val === null || val === undefined || val === '');
                if (isEmpty) continue;

                let Name = '';
                let RegNo = '';
                let Phone = '';
                let Remarks = '';
                const marks = [];

                for (let j = 0; j < headerCols.length; j++) {
                    const key = headerCols[j];
                    if (!key) continue;

                    const val = rowArray[j];
                    if (val === null || val === undefined || val === '') continue;

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
                        // In case of multiple phone columns, prioritize 'parent'/'whatsapp'/'father'
                        if (!Phone || normalizedKey.includes('parent') || normalizedKey.includes('whatsapp') || normalizedKey.includes('mother') || normalizedKey.includes('father')) {
                            Phone = val;
                        }
                    } else if (['remarks', 'remark', 'comments', 'comment'].includes(normalizedKey)) {
                        Remarks = val;
                    } else if (!['sno', 'serialno', 'slno'].includes(normalizedKey)) {
                        // Any other column goes to marks
                        marks.push({ subject: key, score: val });
                    }
                }

                // Format message
                let messagePrefix = headerTopText ? `${headerTopText}\n\n` : '';
                let marksText = marks.map(m => `${m.subject}: ${m.score}`).join('\n');
                let message = `${messagePrefix}Dear Parent,\nStudent name: ${Name || 'Student name:'}\nReg No: ${RegNo || 'N/A'}\n\nMarks:\n${marksText}\n\nRemarks: ${Remarks || 'None'}\n\nRegards, Class Advisor`;

                // Clean phone number (remove spaces, symbols except +)
                Phone = Phone ? Phone.toString().replace(/[^\d+]/g, '') : '';
                // Standardize: if it starts with 0 and is longer than 10, strip the 0
                if (Phone.length > 10 && Phone.startsWith('0')) {
                    Phone = Phone.substring(1);
                }

                // Keep '91' or '+91' because many mobile gateways *require* the country code.
                // We will NOT enforce 10-digit strict truncation. If user provided 12 digits, we pass 12 digits.

                mappedData.push({
                    id: Math.random().toString(36).substring(7),
                    name: Name || 'Unknown',
                    regNo: RegNo || 'N/A',
                    phone: Phone,
                    marks,
                    remarks: Remarks,
                    message,
                    status: 'Pending'
                });
            }
        }

        console.log(`[DEBUG] Raw Rows Processed: ${rawData.length}, Mapped Students: ${mappedData.length}`);
        studentsData = mappedData;

        // Clean up the uploaded file to save space
        fs.unlinkSync(req.file.path);

        res.json({ message: 'File parsed successfully', total: studentsData.length, data: studentsData });
    } catch (error) {
        console.error('Error parsing Excel:', error);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
};

/**
 * Start sending SMS sequentially with delays
 */
exports.sendSms = async (req, res) => {
    if (isSending) {
        return res.status(400).json({ error: 'Message sending is already in progress' });
    }

    const { gatewayUrl } = req.body;
    if (!gatewayUrl) {
        return res.status(400).json({ error: 'Gateway URL is required' });
    }

    const studentsToSend = studentsData.filter(s => s.status === 'Pending' || s.status === 'Failed');
    if (studentsToSend.length === 0) {
        return res.status(400).json({ error: 'No pending or failed messages to send' });
    }

    // Acknowledge the request immediately
    res.json({ message: 'Started sending SMS in the background' });
    isSending = true;

    // Send messages sequentially in background
    for (let student of studentsData) {
        if (student.status !== 'Pending' && student.status !== 'Failed') continue;

        try {
            // Basic phone number validation
            if (!student.phone || student.phone.length < 10) {
                throw new Error('Invalid or missing phone number');
            }

            // Dynamic payload delivery based on the provided URL format
            let response;
            if (gatewayUrl.includes('{phone}') || gatewayUrl.includes('{message}')) {
                // If it's a GET request with template placeholders
                const finalUrl = gatewayUrl
                    .replace('{phone}', encodeURIComponent(student.phone))
                    .replace('{message}', encodeURIComponent(student.message));
                response = await axios.get(finalUrl);
            } else {
                // Default POST request with a robust payload covering most Gateway apps
                response = await axios.post(gatewayUrl, {
                    phone: student.phone,
                    to: student.phone,
                    number: student.phone,
                    phoneNumber: student.phone,
                    message: student.message,
                    text: student.message,
                    msg: student.message
                });
            }

            student.status = 'Sent';
        } catch (error) {
            console.error(`Failed to send SMS to ${student.name} (${student.phone}):`, error.message);
            student.status = 'Failed';
        }

        // Sequentially delay 1-2 seconds between messages
        const delay = Math.floor(Math.random() * 1000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    isSending = false;
};

/**
 * Get current statuses
 */
exports.getStatus = (req, res) => {
    res.json({ data: studentsData, isSending });
};
