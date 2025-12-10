import { ColorOption, HardwareOption } from './types';

export const POPULAR_COLORS: ColorOption[] = [
  { name: 'Pure White', hex: '#F5F5F5', description: 'Timeless, clean, and bright.' },
  { name: 'Classic Navy', hex: '#2C3E50', description: 'Deep, dramatic, and sophisticated.' },
  { name: 'Sage Green', hex: '#8DA399', description: 'Earthy, calming, and organic.' },
  { name: 'Charcoal Gray', hex: '#36454F', description: 'Modern, sleek, and grounding.' },
  { name: 'Creamy Off-White', hex: '#F0EAD6', description: 'Warm, inviting, and traditional.' },
  { name: 'Slate Blue', hex: '#5B7C99', description: 'Cool, serene, and coastal.' },
  { name: 'Matte Black', hex: '#1A1A1A', description: 'Bold, industrial, and chic.' },
  { name: 'Greige', hex: '#B0A99F', description: 'The perfect balance of gray and beige.' },
];

export const HARDWARE_OPTIONS: HardwareOption[] = [
  { id: 'none', name: 'Keep Existing', description: 'Retain current hardware' },
  { id: 'gold-bar', name: 'Brushed Gold Bar Pulls', description: 'Modern luxury' },
  { id: 'black-matte', name: 'Matte Black Handles', description: 'Sleek contrast' },
  { id: 'chrome-knobs', name: 'Polished Chrome Knobs', description: 'Classic shine' },
  { id: 'bronze-cup', name: 'Oil-Rubbed Bronze Cup Pulls', description: 'Farmhouse style' },
  { id: 'minimalist', name: 'Finger Pulls / Handleless', description: 'Ultra modern' },
];
