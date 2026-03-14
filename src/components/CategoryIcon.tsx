import React from 'react';
import { 
  Tag, ShoppingBag, Car, Utensils, Heart, GraduationCap, 
  Home, Smartphone, Coffee, Gift, Briefcase, 
  TrendingUp, TrendingDown, DollarSign, CreditCard
} from 'lucide-react';

export const ICON_OPTIONS = [
  { name: 'Tag', icon: Tag },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils },
  { name: 'Heart', icon: Heart },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Home', icon: Home },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gift', icon: Gift },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'TrendingDown', icon: TrendingDown },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'CreditCard', icon: CreditCard },
];

interface CategoryIconProps {
  name?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  name, 
  size = 20, 
  strokeWidth = 2, 
  className = "" 
}) => {
  const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || Tag;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} />;
};

export default CategoryIcon;
