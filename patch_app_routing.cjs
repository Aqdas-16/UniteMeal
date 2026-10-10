const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  '<Route path="/volunteer/:trackingId" element={<VolunteerDashboard />} />',
  `{/* Volunteer Dashboard */}
            <Route path="/dashboard/volunteer" element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route element={<VolunteerDashboardLayout />}>
                <Route index element={<div className="w-full flex-1 p-4 md:p-8"><VolunteerPortal /></div>} />
                <Route path="history" element={<div className="w-full flex-1 p-4 md:p-8"><VolunteerHistory /></div>} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>`
);
fs.writeFileSync('src/App.tsx', app);
