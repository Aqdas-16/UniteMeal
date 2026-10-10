const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreateDonation.tsx', 'utf8');

const convertFn = `
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      result = result.split(',')[1];
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};
`;

code = code.replace("export function CreateDonationContent() {", convertFn + "\nexport function CreateDonationContent() {");

const analyzeCode = `
          await supabase.from('donation_images').insert({
            donation_id: newDoc.id,
            image_url: publicUrlData.publicUrl,
            file_name: imageFile.name,
            file_size: imageFile.size,
            mime_type: imageFile.type
          });

          // Call AI Vision Analysis
          try {
            const base64Image = await fileToBase64(imageFile);
            const aiResponse = await fetch('/api/ai/vision-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: base64Image,
                mimeType: imageFile.type
              })
            });
            const aiData = await aiResponse.json();
            
            if (aiData && aiData.result) {
               await supabase.from('food_quality_assessments').insert({
                 donation_id: newDoc.id,
                 food_name: aiData.result.foodName,
                 food_category: aiData.result.foodCategory,
                 freshness_score: aiData.result.freshnessScore,
                 spoilage_risk: aiData.result.spoilageRisk,
                 visible_mold: aiData.result.visibleMold,
                 estimated_age: aiData.result.estimatedAge,
                 recommended_donation_time: aiData.result.recommendedDonationTime,
                 safe_to_donate: aiData.result.safeToDonate,
                 confidence_score: aiData.result.confidenceScore,
                 explanation: aiData.result.explanation,
                 authenticity_result: aiData.authenticity?.result,
                 authenticity_confidence: aiData.authenticity?.confidence
               });
            }
          } catch (aiErr) {
             console.error("AI Vision classification failed:", aiErr);
             // Non-blocking, so we continue
          }
`;

code = code.replace(/await supabase\.from\('donation_images'\)\.insert\(\{[\s\S]*?\}\);/, analyzeCode);

fs.writeFileSync('src/components/dashboard/CreateDonation.tsx', code);
