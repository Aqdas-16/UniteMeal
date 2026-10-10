const url = process.env.SUPABASE_URL + '/pgmeta/v1/query';
fetch(url, {
  method: 'POST',
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: 'SELECT 1;' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
