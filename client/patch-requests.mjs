import fs from 'fs';

let content = fs.readFileSync('src/pages/food/RequestsReceived.jsx', 'utf-8');

const regex = /<Phone className="w-4 h-4" \/> \{t\("View Connected Contact"\)\}\n\s*<\/button>\}\n\s*<\/div>\n\s*<\/div>;/;

const replaceWith = `<Phone className="w-4 h-4" /> {t("View Connected Contact")}
                      </button>}
                  </div>
                </div>
                <div className="w-full">
                  <PickupVerification request={req} isDonorView={true} onUpdate={() => fetchRequests()} />
                </div>
              </div>;`;

content = content.replace(regex, replaceWith);

const regex2 = /className={`bg-white rounded-3xl p-6 border shadow-md transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6/;
const replace2 = `className={\`bg-white rounded-3xl p-6 border shadow-md transition-all duration-200 flex flex-col items-start justify-between gap-6`;

content = content.replace(regex2, replace2);

const regex3 = /<div className="space-y-3 flex-1">/;
const replace3 = `<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full"><div className="space-y-3 flex-1">`;

content = content.replace(regex3, replace3);

fs.writeFileSync('src/pages/food/RequestsReceived.jsx', content);
console.log("Patched RequestsReceived successfully");
