const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHistory.tsx', 'utf8');

code = code.replace(
`    </div>
      <Dialog open={!!ratingDelivery} onOpenChange={() => setRatingDelivery(null)}>`,
`      <Dialog open={!!ratingDelivery} onOpenChange={() => setRatingDelivery(null)}>`
);

fs.writeFileSync('src/pages/NGOHistory.tsx', code);
