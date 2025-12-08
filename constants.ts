import { ColorOption, HardwareOption } from './types';

export const POPULAR_COLORS: ColorOption[] = [
  { name: 'Pure White', hex: '#F5F5F5', description: 'Timeless, clean, and bright.', manufacturer: 'Sherwin Williams', code: 'SW 7005' },
  { name: 'Classic Navy', hex: '#2C3E50', description: 'Deep, dramatic, and sophisticated.', manufacturer: 'Benjamin Moore', code: 'HC-154' },
  { name: 'Sage Green', hex: '#8DA399', description: 'Earthy, calming, and organic.', manufacturer: 'Farrow & Ball', code: 'No. 293' },
  { name: 'Charcoal Gray', hex: '#36454F', description: 'Modern, sleek, and grounding.', manufacturer: 'Behr', code: 'PPU18-01' },
  { name: 'Creamy Off-White', hex: '#F0EAD6', description: 'Warm, inviting, and traditional.', manufacturer: 'Benjamin Moore', code: 'OC-96' },
  { name: 'Slate Blue', hex: '#5B7C99', description: 'Cool, serene, and coastal.', manufacturer: 'Sherwin Williams', code: 'SW 9136' },
  { name: 'Matte Black', hex: '#1A1A1A', description: 'Bold, industrial, and chic.', manufacturer: 'Benjamin Moore', code: '2132-10' },
  { name: 'Greige', hex: '#B0A99F', description: 'The perfect balance of gray and beige.', manufacturer: 'Sherwin Williams', code: 'SW 7029' },
];

export const HARDWARE_OPTIONS: HardwareOption[] = [
  { id: 'none', name: 'Keep Existing', description: 'Retain current hardware' },
  { id: 'gold-bar', name: 'Brushed Gold Bar Pulls', description: 'Modern luxury' },
  { id: 'black-matte', name: 'Matte Black Handles', description: 'Sleek contrast' },
  { id: 'chrome-knobs', name: 'Polished Chrome Knobs', description: 'Classic shine' },
  { id: 'bronze-cup', name: 'Oil-Rubbed Bronze Cup Pulls', description: 'Farmhouse style' },
  { id: 'minimalist', name: 'Finger Pulls / Handleless', description: 'Ultra modern' },
];