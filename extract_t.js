const fs = require('fs');
const data = fs.readFileSync('C:/Users/hp/.gemini/antigravity/brain/dd988043-299a-4794-9101-e0c92f4217c5/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = data.split('\n');
for (let line of lines) {
  if (line.includes('"step_index":774')) {
    const parsed = JSON.parse(line);
    console.log(parsed.content);
  }
}
