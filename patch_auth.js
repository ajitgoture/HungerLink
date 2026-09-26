const fs = require('fs');

const loginPath = 'client/src/pages/Login.jsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

loginContent = loginContent.replace(
  /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
  `import { useAuth } from '../context/AuthContext';\nimport { getDashboardRoute } from '../utils/routeUtils';`
);

loginContent = loginContent.replace(
  /else if \(user\.role === 'Food Donor'\) \{[\s\S]*?navigate\('\/dashboard'\);\n\s*\}/,
  `else {\n        navigate(getDashboardRoute(user.role));\n      }`
);

fs.writeFileSync(loginPath, loginContent);
console.log('Patched Login.jsx');

const registerPath = 'client/src/pages/Register.jsx';
let registerContent = fs.readFileSync(registerPath, 'utf8');

registerContent = registerContent.replace(
  /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
  `import { useAuth } from '../context/AuthContext';\nimport { getDashboardRoute } from '../utils/routeUtils';`
);

registerContent = registerContent.replace(
  /navigate\(role === 'Food Receiver' \? '\/food\/receiver-dashboard' : '\/food\/donor-dashboard'\);/,
  `navigate(getDashboardRoute(role));`
);

fs.writeFileSync(registerPath, registerContent);
console.log('Patched Register.jsx');
