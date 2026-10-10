import { supabase } from '@/lib/supabase';

// Helper: Haversine distance in KM
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(2));
}

// Estimate travel time in minutes based on distance
export function estimateTravelTime(distanceKm: number): number {
  const speedStrKmH = 30; // Avg city driving speed
  return parseFloat(((distanceKm / speedStrKmH) * 60).toFixed(0));
}

// AI Smart NGO Matching logic
export function calculateNGOScore(params: {
  ngoLat: number;
  ngoLon: number;
  donationLat: number;
  donationLon: number;
  ngoCapacity: number;
  donationQuantity: number;
  ngoAcceptanceRate: number;
  ngoPendingRequests: number;
}): { score: number; distance: number; travelTime: number } {
  const { ngoLat, ngoLon, donationLat, donationLon, ngoCapacity, donationQuantity, ngoAcceptanceRate, ngoPendingRequests } = params;
  
  const distance = calculateDistance(ngoLat, ngoLon, donationLat, donationLon);
  const travelTime = estimateTravelTime(distance);
  
  // Normalize Distance (Max score 100 decreasing to 0 at 50km)
  const distScore = Math.max(0, 100 - (distance * 2)); 
  
  // Normalize Travel Time (Max score 100 decreasing)
  const timeScore = Math.max(0, 100 - (travelTime));
  
  // Capacity ratio (higher is better, cap at 100)
  const capacityScore = Math.min(100, Math.max(0, (ngoCapacity / Math.max(1, donationQuantity)) * 100));
  
  // Simulated load impact
  const loadScore = Math.max(0, 100 - (ngoPendingRequests * 10));

  // 30% Distance + 25% Travel Time + 20% Capacity + 15% Acceptance Rate + 10% Current Load
  const finalScore = (distScore * 0.3) + (timeScore * 0.25) + (capacityScore * 0.2) + (ngoAcceptanceRate * 0.15) + (loadScore * 0.1);
  
  return {
    score: parseFloat(finalScore.toFixed(0)),
    distance,
    travelTime
  };
}

// AI Delivery Partner Assignment
export function calculateVolunteerScore(params: {
  volLat: number;
  volLon: number;
  pickupLat: number;
  pickupLon: number;
  activeAssignments: number;
  successRate: number;
}): { score: number; distance: number; etaMins: number } {
  const { volLat, volLon, pickupLat, pickupLon, activeAssignments, successRate } = params;
  
  const distance = calculateDistance(volLat, volLon, pickupLat, pickupLon);
  const etaMins = estimateTravelTime(distance);
  
  // Distance preference
  const distScore = Math.max(0, 100 - (distance * 5)); // More aggressive drop-off for volunteers farther away

  // Load penalty
  const loadScore = Math.max(0, 100 - (activeAssignments * 20));

  // Weightings for Delivery Partner: 40% Distance + 30% Load + 30% Historic Success
  const finalScore = (distScore * 0.4) + (loadScore * 0.3) + (successRate * 0.3);

  return {
    score: parseFloat(finalScore.toFixed(0)),
    distance,
    etaMins
  };
}

// Food Priority Prediction
export function calculateUrgency(expiryTimeSeconds: number, distanceMeters: number): { priority: string; score: number } {
  // Score 0-100 where higher is more urgent
  const hoursLeft = Math.max(0, expiryTimeSeconds / 3600);
  let score = 0;
  
  if (hoursLeft <= 2) score = 95;
  else if (hoursLeft <= 6) score = 70;
  else if (hoursLeft <= 12) score = 40;
  else score = 10;

  let label = "Low";
  if (score >= 80) label = "Critical";
  else if (score >= 60) label = "High";
  else if (score >= 30) label = "Medium";

  return { priority: label, score };
}

// Fraud Detection AI basic simulator
export function analyzeFraudRisk(user: {
  recentCancellations: number;
  distanceJumpKm: number;
  timeDiffMins: number;
}): { flag: boolean; riskScore: number; reason?: string } {
  let risk = 0;
  let reason = undefined;

  // Very rapid movements (Teleportation check)
  if (user.timeDiffMins > 0 && (user.distanceJumpKm / user.timeDiffMins) > 3) {
      risk += 60; // Moving faster than 180km/h
      reason = "Impossible GPS movement detected";
  }

  // Excessive cancellations
  if (user.recentCancellations > 3) {
      risk += 40;
      if (!reason) reason = "Multiple rapid cancellations";
  }

  return {
    flag: risk >= 70,
    riskScore: risk,
    reason
  };
}

// Predictive Analytics Aggregation
export async function getPredictiveInsights() {
   // This would analyze recent transactions to build a model.
   // Instead of just calling Gemini directly, it computes statistical trends.
   
   const { data: donations } = await supabase.from('donations').select('quantity, created_at').order('created_at', { ascending: false }).limit(100);
   
   let weekdayTally = [0,0,0,0,0,0,0];
   let totalKg = 0;

   if (donations) {
       donations.forEach(d => {
          totalKg += Number(d.quantity) || 0;
          const day = new Date(d.created_at).getDay();
          weekdayTally[day]++;
       });
   }
   
   const maxDay = weekdayTally.indexOf(Math.max(...weekdayTally));
   const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

   return {
     expectedDonationsTomorrow: Math.round(totalKg / (donations?.length || 1)),
     peakWeekday: days[maxDay],
     highDemandZones: ["Koramangala, BLR", "Andheri West, MUM"], // Simulated geographic clusters
     deliveryWorkloadForecast: totalKg > 50 ? "High" : "Normal"
   };
}
