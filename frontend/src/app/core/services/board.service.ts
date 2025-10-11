import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BoardResponse, TaskBoard } from '../types/board.types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/board`;

  getBoard() {
    return this.http.get<BoardResponse>(this.baseUrl).pipe(map((response) => this.mapResponse(response)));
  }

  createColumn(title: string) {
    return this.http
      .post<BoardResponse>(`${this.baseUrl}/columns`, { title })
      .pipe(map((response) => this.mapResponse(response)));
  }

  updateColumn(columnId: string, title: string) {
    return this.http
      .patch<BoardResponse>(`${this.baseUrl}/columns/${columnId}`, { title })
      .pipe(map((response) => this.mapResponse(response)));
  }

  createTask(columnId: string, title: string, description?: string) {
    return this.http
      .post<BoardResponse>(`${this.baseUrl}/columns/${columnId}/tasks`, { title, description })
      .pipe(map((response) => this.mapResponse(response)));
  }

  updateTask(columnId: string, taskId: string, title: string, description?: string) {
    return this.http
      .patch<BoardResponse>(`${this.baseUrl}/columns/${columnId}/tasks/${taskId}`, { title, description })
      .pipe(map((response) => this.mapResponse(response)));
  }

  moveTask(taskId: string, sourceColumnId: string, destinationColumnId: string, destinationIndex: number) {
    return this.http
      .post<BoardResponse>(`${this.baseUrl}/tasks/move`, {
        taskId,
        sourceColumnId,
        destinationColumnId,
        destinationIndex
      })
      .pipe(map((response) => this.mapResponse(response)));
  }

  reorderColumns(columnOrder: string[]) {
    return this.http
      .post<BoardResponse>(`${this.baseUrl}/columns/reorder`, { columnOrder })
      .pipe(map((response) => this.mapResponse(response)));
  }

  private mapResponse(response: BoardResponse): TaskBoard {
    return response.board;
  }
}
