import { Utensils, Apple, Box, Wheat, Coffee, CupSoda, Snowflake, PackageOpen, Cherry, Carrot, Cookie, HelpCircle } from 'lucide-react';
import React from 'react';

export const FOOD_CATEGORIES = [
  'Cooked',
  'Produce',
  'Packaged',
  'Bakery',
  'Dairy',
  'Beverage',
  'Frozen',
  'Dry Goods',
  'Fruits',
  'Vegetables',
  'Snacks',
  'Other'
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];

export const CATEGORY_OPTIONS = [
  { id: 'Cooked', icon: React.createElement(Utensils), title: 'Cooked' },
  { id: 'Produce', icon: React.createElement(Apple), title: 'Produce' },
  { id: 'Packaged', icon: React.createElement(Box), title: 'Packaged' },
  { id: 'Bakery', icon: React.createElement(Wheat), title: 'Bakery' },
  { id: 'Dairy', icon: React.createElement(Coffee), title: 'Dairy' },
  { id: 'Beverage', icon: React.createElement(CupSoda), title: 'Beverage' },
  { id: 'Frozen', icon: React.createElement(Snowflake), title: 'Frozen' },
  { id: 'Dry Goods', icon: React.createElement(PackageOpen), title: 'Dry Goods' },
  { id: 'Fruits', icon: React.createElement(Cherry), title: 'Fruits' },
  { id: 'Vegetables', icon: React.createElement(Carrot), title: 'Vegetables' },
  { id: 'Snacks', icon: React.createElement(Cookie), title: 'Snacks' },
  { id: 'Other', icon: React.createElement(HelpCircle), title: 'Other' },
];

export function normalizeCategory(cat: string): FoodCategory {
  if (!cat) return 'Other';
  const c = cat.toLowerCase().trim();
  if (c.includes('cooked')) return 'Cooked';
  if (c.includes('produce') || c.includes('raw')) return 'Produce';
  if (c.includes('package')) return 'Packaged';
  if (c.includes('bake')) return 'Bakery';
  if (c.includes('dairy')) return 'Dairy';
  if (c.includes('beverage') || c.includes('drink')) return 'Beverage';
  if (c.includes('frozen')) return 'Frozen';
  if (c.includes('dry')) return 'Dry Goods';
  if (c.includes('fruit')) return 'Fruits';
  if (c.includes('veg')) return 'Vegetables';
  if (c.includes('snack')) return 'Snacks';
  
  // exact match
  const exact = FOOD_CATEGORIES.find(f => f.toLowerCase() === c);
  if (exact) return exact;

  return 'Other';
}
