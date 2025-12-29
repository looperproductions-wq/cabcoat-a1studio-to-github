
import { ColorOption, HardwareOption } from './types';

export const POPULAR_COLORS: ColorOption[] = [
  { name: 'White Dove', hex: '#F0EFE7', manufacturer: 'Benjamin Moore', code: 'OC-17', description: 'The gold standard for off-white cabinets.' },
  { name: 'Chantilly Lace', hex: '#F4F6F1', manufacturer: 'Benjamin Moore', code: 'OC-65', description: 'A crisp, clean white with no visible undertones.' },
  { name: 'Hale Navy', hex: '#2C3E50', manufacturer: 'Benjamin Moore', code: 'HC-154', description: 'A classic, deeply saturated navy blue.' },
  { name: 'Revere Pewter', hex: '#CBC5B9', manufacturer: 'Benjamin Moore', code: 'HC-172', description: 'The most popular bridge between gray and beige.' },
  { name: 'Gray Owl', hex: '#D4D5CD', manufacturer: 'Benjamin Moore', code: 'OC-52', description: 'A cool, crisp gray that works in any lighting.' },
  { name: 'Stonington Gray', hex: '#BDBDB5', manufacturer: 'Benjamin Moore', code: 'HC-170', description: 'A sophisticated, mid-toned silvery gray.' },
  { name: 'Edgecomb Gray', hex: '#D1CBC1', manufacturer: 'Benjamin Moore', code: 'HC-173', description: 'A soft, airy greige that adds warmth.' },
  { name: 'Swiss Coffee', hex: '#F1EFE3', manufacturer: 'Benjamin Moore', code: 'OC-45', description: 'A warm, creamy white that feels cozy.' },
  { name: 'Simply White', hex: '#F7F5ED', manufacturer: 'Benjamin Moore', code: 'OC-117', description: 'A multi-purpose white with a hint of warmth.' },
  { name: 'Kendall Charcoal', hex: '#4E4E4A', manufacturer: 'Benjamin Moore', code: 'HC-166', description: 'A rich, deep gray with a high-end feel.' },
];

export const HARDWARE_OPTIONS: HardwareOption[] = [
  { id: 'none', name: 'Keep Existing', description: 'Retain current hardware' },
  { id: 'gold-bar', name: 'Brushed Gold Bar Pulls', description: 'Modern luxury' },
  { id: 'black-matte', name: 'Matte Black Handles', description: 'Sleek contrast' },
  { id: 'chrome-knobs', name: 'Polished Chrome Knobs', description: 'Classic shine' },
  { id: 'bronze-cup', name: 'Oil-Rubbed Bronze Cup Pulls', description: 'Farmhouse style' },
  { id: 'minimalist', name: 'Finger Pulls / Handleless', description: 'Ultra modern' },
];
