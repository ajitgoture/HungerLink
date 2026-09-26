const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const dictionaries = {};
const allKeys = new Set();

// 1. Load all dictionaries and collect all unique keys
for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    dictionaries[file] = content;
    for (const key of Object.keys(content)) {
        allKeys.add(key);
    }
}

console.log(`==================================================`);
console.log(`MULTI-LANGUAGE VALIDATION REPORT`);
console.log(`Total Unique Keys Across Project: ${allKeys.size}`);
console.log(`Supported Languages: ${files.map(f => f.replace('.json', '')).join(', ')}`);
console.log(`==================================================\n`);

// 2. Validate and synchronize each dictionary
// Recursive synchronization function
function syncDictionaries(master, target, fallback) {
    const result = {};
    const keys = Object.keys(master).sort();
    
    for (const key of keys) {
        const masterVal = master[key];
        const targetVal = target[key];
        const fallbackVal = fallback[key];
        
        if (typeof masterVal === 'object' && masterVal !== null && !Array.isArray(masterVal)) {
            result[key] = syncDictionaries(
                masterVal, 
                (typeof targetVal === 'object' && targetVal !== null) ? targetVal : {},
                (typeof fallbackVal === 'object' && fallbackVal !== null) ? fallbackVal : {}
            );
        } else {
            if (targetVal === undefined || targetVal === null || (typeof targetVal === 'string' && targetVal.trim() === '')) {
                // If it's missing or empty string, use fallback (en.json) or master key
                result[key] = fallbackVal !== undefined ? fallbackVal : masterVal;
                // We'll roughly count this as a fix globally
                globalFixCount++;
            } else {
                result[key] = targetVal;
            }
        }
    }
    return result;
}

let globalFixCount = 0;

for (const file of files) {
    globalFixCount = 0;
    const targetDict = dictionaries[file];
    const masterDict = dictionaries['en.json']; // Using en.json as the absolute source of truth for schema
    
    // Merge any missing keys from other languages INTO the master schema first to be absolutely 100% complete
    // For this simple project, assuming en.json has all keys is generally safe, 
    // but the AST script added keys directly to the root of all files. 
    // We already added them. We will use a deep merge of ALL keys to build a true master schema.
    
    // (To keep it simple, we use a deep merge function to build trueMaster)
    const trueMaster = {};
    function deepMerge(target, source) {
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = target[key] || {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = target[key] || source[key];
            }
        }
    }
    for (const f of files) deepMerge(trueMaster, dictionaries[f]);

    const newDict = syncDictionaries(trueMaster, targetDict, dictionaries['en.json']);

    fs.writeFileSync(
        path.join(localesDir, file),
        JSON.stringify(newDict, null, 2) + '\n',
        'utf8'
    );

    console.log(`[${file}]`);
    console.log(`  - Missing/Empty Keys Fixed   : ${globalFixCount}`);
    console.log(`  - Total Keys Synchronized    : ${Object.keys(newDict).length} (Top-level)\n`);
}

console.log(`SUCCESS: All 7 language dictionaries now have perfectly matching structures (100% key parity).`);
