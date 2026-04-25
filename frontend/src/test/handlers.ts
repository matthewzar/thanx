import { http, HttpResponse } from 'msw'
import type { Reward } from '../features/rewards/types'

export const mockRewards: Reward[] = [
  {
    id: 1,
    name: 'Free Coffee',
    description: 'Any coffee on us',
    cost: 200,
    category: 'Coffee',
    stock: 10,
    active: true,
    available: true,
  },
  {
    id: 2,
    name: 'Coffee Size Upgrade',
    description: 'Upgrade any drink to next size',
    cost: 100,
    category: 'Coffee',
    stock: null,
    active: true,
    available: true,
  },
  {
    id: 3,
    name: 'Free Lunch Sandwich',
    description: 'One free sandwich',
    cost: 800,
    category: 'Food',
    stock: 0,
    active: true,
    available: false,
  },
]

export const handlers = [
  http.get('http://localhost:3000/api/v1/rewards', () =>
    HttpResponse.json(mockRewards),
  ),
]
