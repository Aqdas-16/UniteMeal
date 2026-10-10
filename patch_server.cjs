const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

let target1 = `          if (fbData.error) {
              console.error("Firebase Auth Err", fbData.error);
              throw new Error(fbData.error.message);
          }`;

let replacement1 = `          if (fbData.error) {
              console.error("Firebase Auth Err", fbData.error);
              if (fbData.error.message === 'EMAIL_EXISTS') {
                  throw new Error('Username already exists. Please choose a different one.');
              }
              throw new Error(fbData.error.message);
          }`;
code = code.replace(target1, replacement1);

let target2 = `          if (authErr) { console.error("Auth Err", authErr); throw authErr; }`;
let replacement2 = `          if (authErr) { 
              console.error("Auth Err", authErr); 
              if (authErr.message?.includes('already registered')) {
                  throw new Error('Username already exists. Please choose a different one.');
              }
              throw authErr; 
          }`;
code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
