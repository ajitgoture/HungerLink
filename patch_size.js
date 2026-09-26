const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix garbled hyphen in Size options
content = content.replace(/'0"3 Months', '3"6 Months', '6"12 Months', '1"2 Years', '2"3 Years', '3"4 Years', '4"5 Years', '5"6 Years', '6"8 Years', '8"10 Years', '10"12 Years', '12"14 Years', '14"16 Years'/g, 
  `'0-3 Months', '3-6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years', '6-8 Years', '8-10 Years', '10-12 Years', '12-14 Years', '14-16 Years'`
);

// Fallback in case regex doesn't match the specific garbled character exactly
content = content.replace(/['"]0[^0-9]3 Months['"], ['"]3[^0-9]6 Months['"]/g, `'0-3 Months', '3-6 Months'`);
content = content.replace(/['"]6[^0-9]12 Months['"], ['"]1[^0-9]2 Years['"]/g, `'6-12 Months', '1-2 Years'`);
content = content.replace(/['"]2[^0-9]3 Years['"], ['"]3[^0-9]4 Years['"]/g, `'2-3 Years', '3-4 Years'`);
content = content.replace(/['"]4[^0-9]5 Years['"], ['"]5[^0-9]6 Years['"]/g, `'4-5 Years', '5-6 Years'`);
content = content.replace(/['"]6[^0-9]8 Years['"], ['"]8[^0-9]10 Years['"]/g, `'6-8 Years', '8-10 Years'`);
content = content.replace(/['"]10[^0-9]12 Years['"], ['"]12[^0-9]14 Years['"]/g, `'10-12 Years', '12-14 Years'`);
content = content.replace(/['"]14[^0-9]16 Years['"], ['"]Other['"]/g, `'14-16 Years', 'Other'`);

fs.writeFileSync(file, content);
console.log('Fixed Size options encoding.');
