const fs = require('fs');
const content = fs.readFileSync('src/pages/DonorFeatures.tsx', 'utf8');

const match = content.match(/export function DonationHistoryContent.*?^export function DonorTrackContent/ms);
if (match) {
  let extract = match[0].replace(/^export function DonorTrackContent/ms, '');
  
  // We need to write this to components/dashboard/DonationHistory.tsx
  // Let's add the imports at the top
  const imports = `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, Truck, Box, Zap, Share, Store, Search, Filter, RefreshCcw, Plus, Utensils, Leaf, Drumstick, Croissant, ShoppingBag, Wheat, X, ArrowLeft, Download, Printer, Copy, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

`;

  fs.writeFileSync('components/dashboard/DonationHistory.tsx', imports + extract);
  
  // Replace in original
  let newContent = content.replace(extract, `export { DonationHistoryContent } from "@/components/dashboard/DonationHistory";\n\n`);
  fs.writeFileSync('src/pages/DonorFeatures.tsx', newContent);
}
