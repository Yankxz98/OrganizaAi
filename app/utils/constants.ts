export const EXPENSE_CATEGORIES = [
  {
    id: 'snack',
    label: 'Lanche',
    icon: 'Coffee',
    color: '#f97316' // Orange
  },
  {
    id: 'grocery',
    label: 'Mercado',
    icon: 'ShoppingBag',
    color: '#22c55e' // Green
  },
  {
    id: 'gas',
    label: 'Gasolina',
    icon: 'Car',
    color: '#3b82f6' // Blue
  },
  {
    id: 'pet',
    label: 'Pet',
    icon: 'Heart',
    color: '#ec4899' // Pink
  },
  {
    id: 'personal',
    label: 'Pessoal',
    icon: 'User',
    color: '#8b5cf6' // Purple
  },
  {
    id: 'others',
    label: 'Outros',
    icon: 'Package',
    color: '#64748b' // Gray
  }
] as const;

export type ExpenseCategoryId = typeof EXPENSE_CATEGORIES[number]['id']; 