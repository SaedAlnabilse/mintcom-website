import { UtensilsCrossed, Coffee, ShoppingBag, Building2, Store, type LucideIcon } from 'lucide-react';

export const getBusinessTypeIcon = (type: string): LucideIcon => {
  if (!type) return Store;

  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
    case 'restaurant':
      return UtensilsCrossed;
    case 'cafe':
      return Coffee;
    case 'retail':
      return ShoppingBag;
    case 'other':
      return Building2;
    default:
      return Store;
  }
};
