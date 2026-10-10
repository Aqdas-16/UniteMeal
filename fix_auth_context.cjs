const fs = require('fs');

let auth = fs.readFileSync('components/auth/AuthContext.tsx', 'utf8');

auth = auth.replace(
  /if \(assignedRole === 'donor'\) \{[\s\S]*?\}\n\s*\} catch\(err: any\) \{/,
  `if (assignedRole === 'donor') {
                const { error: donorError } = await supabase.from('donors').insert({
                    id: firebaseUser.uid,
                    donor_type: 'restaurant',
                    organization_name: pendingFullName || firebaseUser.displayName || 'New Restaurant'
                });
                if (donorError) throw donorError;
            } else if (assignedRole === 'ngo') {
                const { error: ngoError } = await supabase.from('ngos').insert({
                    id: firebaseUser.uid,
                    organization_name: pendingFullName || firebaseUser.displayName || 'New NGO'
                });
                if (ngoError) throw ngoError;
            } else if (assignedRole === 'volunteer') {
                const { error: volError } = await supabase.from('volunteers').insert({
                    id: firebaseUser.uid
                });
                if (volError) throw volError;
            }
          } catch(err: any) {`
);

fs.writeFileSync('components/auth/AuthContext.tsx', auth);
