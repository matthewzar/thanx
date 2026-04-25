export interface Reward {
  id: number
  name: string
  description: string | null
  cost: number
  category: string
  stock: number | null
  active: boolean
  available: boolean
}
