const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

code = code.replace(/import \{ AddressAutocompleteInput \} from '@\/components\/ui\/AddressAutocomplete';/, "import { LocationEditor } from '../components/dashboard/LocationEditor';");
code = code.replace(/import \{ AddressAutocompleteInput \} from '\.\.\/components\/ui\/AddressAutocomplete';/, "import { LocationEditor } from '../components/dashboard/LocationEditor';");

fs.writeFileSync('src/pages/DonorProfile.tsx', code);
console.log('Replaced imports');
