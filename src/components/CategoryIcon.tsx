import React from 'react';
import {
  Apple,
  Milk,
  Croissant,
  Beef,
  Wheat,
  Coffee,
  Snowflake,
  Sparkles,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { CategoryId } from '../types';

interface CategoryIconProps {
  categoryId: CategoryId;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryId,
  className = 'w-4 h-4',
}) => {
  switch (categoryId) {
    case 'produce':
      return <Apple className={className} />;
    case 'dairy':
      return <Milk className={className} />;
    case 'bakery':
      return <Croissant className={className} />;
    case 'meat':
      return <Beef className={className} />;
    case 'pantry':
      return <Wheat className={className} />;
    case 'beverages':
      return <Coffee className={className} />;
    case 'frozen':
      return <Snowflake className={className} />;
    case 'cleaning':
      return <Sparkles className={className} />;
    case 'other':
    default:
      return <Package className={className} />;
  }
};
