import { http, HttpResponse } from 'msw'
import type { User } from '../features/points/types'
import type { Redemption } from '../features/redemptions/types'
import type { Reward } from '../features/rewards/types'

export const mockUser: User = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  points_balance: 1500,
}

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

export const mockRedemption: Redemption = {
  id: 1,
  points_spent: 200,
  created_at: '2026-04-25T14:00:00.000Z',
  reward: {
    id: 1,
    name: 'Free Coffee',
    description: 'Any coffee on us',
    cost: 200,
    category: 'Coffee',
    stock: 9,
    active: true,
    available: true,
  },
}

export const handlers = [
  http.get('http://localhost:3000/api/v1/user', () =>
    HttpResponse.json(mockUser),
  ),
  http.get('http://localhost:3000/api/v1/rewards', () =>
    HttpResponse.json(mockRewards),
  ),
  http.post('http://localhost:3000/api/v1/redemptions', () =>
    HttpResponse.json(mockRedemption, { status: 201 }),
  ),
  http.get('http://localhost:3000/api/v1/redemptions', () =>
    HttpResponse.json([]),
  ),
]
