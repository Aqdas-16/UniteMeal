import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, UploadCloud, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const REQUIRED_DOCS = [
  { id: 'gst_certificate', name: 'GST Certificate', description: 'Copy of valid GST registration' },
  { id: 'fssai_certificate', name: 'FSSAI License', description: 'Food Safety and Standards Authority of India' },
  { id: 'restaurant_license', name: 'Business Registration', description: 'Certificate of Incorporation or Shop Act' },
  { id: 'owner_id_proof', name: 'Identity Proof', description: 'Aadhar or PAN card of authorized signatory' },
  { id: 'address_proof', name: 'Address Proof', description: 'Electricity bill or lease agreement' },
];

export function DonorDocuments() {
  const navigate = useNavigate();
  const handleBack = () => {
        if (profile?.role === 'ngo') navigate('/dashboard/ngo');
        else if (profile?.role === 'admin') navigate('/dashboard/admin');
        else navigate('/dashboard/restaurant');
    };
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<Record<string, any>>({});
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        fetchRestaurantAndDocs();
    }
  }, [user]);

  const fetchRestaurantAndDocs = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        // 1. Check if profile exists
        const { data: restData, error: restError } = await supabase
            .from('restaurants')
            .select('restaurant_id')
            .eq('user_id', user.uid)
            .single();
        
        if (restError || !restData) {
            toast.error("Please fill out and save your profile first to upload documents.");
            setIsLoading(false);
            return;
        }
        
        setRestaurantId(user.uid);

        // 2. Fetch docs from Supabase
        const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.uid);
            
        if (docsError) throw docsError;
        
        const docsMap: Record<string, any> = {};
        docsData?.forEach(doc => {
            docsMap[doc.document_type] = {
                document_url: doc.file_url,
                status: doc.status,
                uploaded_at: doc.created_at
            };
        });
        setDocuments(docsMap);
    } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
    } finally {
        setIsLoading(false);
    }
  };

  const handleUploadClick = (docId: string) => {
    document.getElementById(`upload-${docId}`)?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !restaurantId) return;
    
    const file = e.target.files[0];
    setUploadingDocId(docId);
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurantId}-${docId}-${Math.random()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        // 1. Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from('restaurants')
            .upload(filePath, file);

        if (uploadError) {
             // In case bucket is missing, we might fail here
             console.error("Storage upload error:", uploadError);
             throw new Error(uploadError.message || "Storage bucket 'restaurants' may not exist.");
        }

        const { data } = supabase.storage.from('restaurants').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        // 2. Save to Supabase database
        // Delete old document of same type first
        await supabase.from('documents').delete().match({ user_id: user.uid, document_type: docId });
        
        const { error: dbError } = await supabase.from('documents').insert({
            user_id: user.uid,
            document_type: docId,
            file_url: publicUrl,
            status: 'pending'
        });
        
        if (dbError) throw dbError;
        
        toast.success("Document uploaded successfully");
        await fetchRestaurantAndDocs();
    } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.message || 'Failed to upload document');
    } finally {
        setUploadingDocId(null);
    }
  };

  if (isLoading) {
      return <div className="p-8 text-center text-slate-500">Loading documents...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pt-4 px-4 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={handleBack} className="gap-2 shrink-0 h-9 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Document Management</h1>
            <p className="text-slate-500 font-medium text-sm">Upload and manage your required compliance documents. Admin approval is required for platform verification.</p>
        </div>
      </div>

      <div className="grid gap-4">
         {REQUIRED_DOCS.map(docData => {
            const docState = documents[docData.id];
            
            return (
              <Card key={docData.id} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113]">
                 <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                          <FileText className="w-6 h-6 text-indigo-500" />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 dark:text-white">{docData.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{docData.description}</p>
                          {docState && docState.status === 'request_reupload' && (
                            <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/50">
                                <strong>Admin Remarks:</strong> Please upload a clearer version of this document.
                            </p>
                          )}
                          {docState && docState.status === 'rejected' && (
                            <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/50">
                                <strong>Admin Remarks:</strong> Document rejected.
                            </p>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                       <div className="flex-1 md:flex-none">
                         {docState ? (
                            <Badge variant="outline" className={`font-bold py-1 ${
                               docState.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               docState.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               'bg-red-50 text-red-700 border-red-200'
                            }`}>
                               {docState.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                               {docState.status === 'pending' && <Clock className="w-3 h-3 mr-1 inline" />}
                               {(docState.status === 'rejected' || docState.status === 'request_reupload') && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                               {docState.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                         ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold">NOT UPLOADED</Badge>
                         )}
                       </div>
                       
                       <input 
                         type="file" 
                         id={`upload-${docData.id}`} 
                         className="hidden" 
                         accept=".pdf,.png,.jpg,.jpeg"
                         onChange={(e) => handleFileChange(e, docData.id)}
                       />
                       
                       <Button 
                         variant={docState?.status === 'approved' ? 'outline' : 'default'} 
                         className={`rounded-full shadow-sm font-bold shrink-0 ${docState?.status !== 'approved' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                         onClick={() => handleUploadClick(docData.id)}
                         disabled={uploadingDocId === docData.id || !restaurantId}
                       >
                          <UploadCloud className="w-4 h-4 mr-2" />
                          {uploadingDocId === docData.id ? 'Uploading...' : (docState ? 'Update' : 'Upload')}
                       </Button>
                    </div>
                 </CardContent>
              </Card>
            );
         })}
      </div>
    </div>
  );
}
