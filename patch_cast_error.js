const fs = require('fs');

function fix(file, msg) {
  let f = fs.readFileSync(file, 'utf8');
  let regex = new RegExp(`catch \\(error\\) \\{[\\s\\r\\n]*res\\.status\\(500\\)\\.json\\(\\{ message: '${msg}' \\}\\);[\\s\\r\\n]*\\}`);
  let replacement = `catch (error) {
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid donation ID format' });
    }
    res.status(500).json({ message: '${msg}' });
  }`;
  if (f.match(regex)) {
    f = f.replace(regex, replacement);
    fs.writeFileSync(file, f);
    console.log('Fixed', file);
  } else {
    console.log('No match in', file);
  }
}

fix('server/controllers/foodDonationController.js', 'Error fetching donation details');
fix('server/controllers/clothDonationController.js', 'Error fetching clothes donation details');
