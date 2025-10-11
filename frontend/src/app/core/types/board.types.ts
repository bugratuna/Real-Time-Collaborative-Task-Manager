export interface TaskItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  id: string;
  title: string;
  tasks: TaskItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskBoard {
  id: string;
  user: string;
  columns: TaskColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardResponse {
  board: TaskBoard;
}
