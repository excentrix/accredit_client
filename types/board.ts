// types/board.ts
export interface Board {
  id: number;
  name: string;
  code: string;
  description?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardCriteria {
  id: number;
  board: string;
  number: string;
  name: string;
  description: string;
  max_score?: number;
  parent?: number;
  children?: BoardCriteria[];
}
