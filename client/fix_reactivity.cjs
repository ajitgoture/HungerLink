const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      replaceAll(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      const original = c;
      
      // Fix setError(t('...')) -> setError('...')
      c = c.replace(/setError\(t\((['"`].*?['"`])\)\)/g, 'setError($1)');
      c = c.replace(/setSuccess\(t\((['"`].*?['"`])\)\)/g, 'setSuccess($1)');
      c = c.replace(/setErrors\(\[t\((['"`].*?['"`])\)\]\)/g, 'setErrors([$1])');
      
      // Render fixes: >{error}< -> >{error ? t(error) : ''}<
      // This is a bit tricky with regex, we should just find {error} and {success} and replace them.
      c = c.replace(/>\s*\{error\}\s*</g, '>{error ? t(error) : ""}<');
      c = c.replace(/>\s*\{success\}\s*</g, '>{success ? t(success) : ""}<');

      if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Fixed state Reactivity in ' + p);
      }
    }
  });
}
replaceAll('src');
