const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldEndpoint = `  app.post("/api/admin/create-volunteer", express.json(), async (req, res) => {
    try {
      const { ngo_id, name, phone, email, vehicleType, vehicleNumber, password } = req.body;
      
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        // Fallback to local error if keys aren't present (e.g. preview environment)
        return res.status(500).json({ error: "Server missing Supabase credentials" });
      }

      // We need to parse URL if it's the connection string
      const realUrl = supabaseUrl.startsWith('postgresql') 
          ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' 
          : supabaseUrl;

      const supabaseAdmin = createClient(realUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // 1. Create auth user
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: email || \`vol_\${Date.now()}@unitemeal.org\`,
        password: password,
        email_confirm: true,
        user_metadata: { name: name, role: 'volunteer', ngo_id: ngo_id }
      });

      if (authErr) { console.error("Auth Err", authErr); throw authErr; }
      const userId = authData.user.id;`;

const newEndpoint = `  app.post("/api/admin/create-volunteer", express.json(), async (req, res) => {
    try {
      const { ngo_id, name, phone, email, vehicleType, vehicleNumber, password } = req.body;
      
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server missing Supabase credentials" });
      }

      const realUrl = supabaseUrl.startsWith('postgresql') 
          ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' 
          : supabaseUrl;

      const supabaseAdmin = createClient(realUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      let userId;
      // 1. Create Firebase Auth user using REST API if FIREBASE_API_KEY exists
      if (firebaseApiKey) {
          const fbResponse = await fetch(\`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\${firebaseApiKey}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, returnSecureToken: true })
          });
          const fbData = await fbResponse.json();
          if (fbData.error) {
              console.error("Firebase Auth Err", fbData.error);
              throw new Error(fbData.error.message);
          }
          userId = fbData.localId;
          
          // Optionally set display name
          await fetch(\`https://identitytoolkit.googleapis.com/v1/accounts:update?key=\${firebaseApiKey}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: fbData.idToken, displayName: name, returnSecureToken: false })
          });
      } else {
          // Fallback to Supabase Auth if no Firebase Key (shouldn't happen in this environment)
          const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name, role: 'volunteer', ngo_id: ngo_id }
          });
          if (authErr) { console.error("Auth Err", authErr); throw authErr; }
          userId = authData.user.id;
      }`;

if (code.includes(oldEndpoint)) {
    code = code.replace(oldEndpoint, newEndpoint);
    fs.writeFileSync('server.ts', code);
    console.log("Updated server.ts");
} else {
    console.log("Could not find the endpoint in server.ts");
}
