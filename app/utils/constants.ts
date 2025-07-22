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
    id: 'home',
    label: 'Casa & Contas',
    icon: 'Home',
    color: '#ef4444' // Red
  },
  {
    id: 'personal',
    label: 'Pessoal',
    icon: 'User',
    color: '#8b5cf6' // Purple
  },
  {
    id: 'investment',
    label: 'Investimento',
    icon: 'TrendingUp',
    color: '#10b981' // Green Dark
  },
  {
    id: 'entertainment',
    label: 'Lazer',
    icon: 'Gamepad2',
    color: '#f59e0b' // Yellow
  },
  {
    id: 'others',
    label: 'Outros',
    icon: 'Package',
    color: '#64748b' // Gray
  }
] as const;

export type ExpenseCategoryId = typeof EXPENSE_CATEGORIES[number]['id']; 