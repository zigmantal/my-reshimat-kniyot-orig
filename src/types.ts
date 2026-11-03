export type CategoryId =
  | 'produce'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'meat'
  | 'frozen'
  | 'cleaning'
  | 'beverages'
  | 'other';

export interface Category {
  id: CategoryId;
  nameHe: string;
  nameEn: string;
  iconName: string;
  color: string;
}

export type UnitType = 'units' | 'kg' | 'g' | 'pack' | 'bottle' | 'box';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  categoryId: CategoryId;
  checked: boolean;
  notes?: string;
  createdAt: number;
}

export type Language = 'he' | 'en';

export type FilterStatus = 'all' | 'active' | 'completed';

export interface PresetList {
  id: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  items: Array<{
    nameHe: string;
    nameEn: string;
    quantity: number;
    unit: UnitType;
    categoryId: CategoryId;
  }>;
}
