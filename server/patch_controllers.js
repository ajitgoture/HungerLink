const fs = require('fs');

function patchController(filePath, errorMsg) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the catch block of get*DonationById
  // Note: we'll just replace the specific catch block for the get by id.
  const oldCatch = `    } catch (error) {
      res.status(500).json({ message: '${errorMsg}' });
    }`;
  
  const newCatch = `    } catch (error) {
      if (error.name === 'CastError' || error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid donation ID format' });
      }
      res.status(500).json({ message: '${errorMsg}' });
    }`;

  if (content.includes(oldCatch)) {
    content = content.replace(oldCatch, newCatch);
    fs.writeFileSync(filePath, content);
    console.log('Patched:', filePath);
  } else {
    console.log('Could not find old catch in', filePath);
  }
}

patchController('controllers/foodDonationController.js', 'Error fetching donation details');
patchController('controllers/clothDonationController.js', 'Error fetching clothes donation details');
