const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

code = code.replace(
  /\{isAdding \? \([\s\S]*?\) : \(/m,
  '('
);

// We need to also remove the closing parenthesis of the ternary if we did that. Let's just do a simpler replacement of the return block.
