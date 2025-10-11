import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { BoardService } from '../../core/services/board.service';
import { SocketService } from '../../core/services/socket.service';
import { TaskBoard, TaskColumn, TaskItem } from '../../core/types/board.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DragDropModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly boardService = inject(BoardService);
  private readonly socketService = inject(SocketService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.currentUser;
  readonly board = signal<TaskBoard | null>(null);
  readonly loading = signal(true);
  readonly isMutating = signal(false);
  readonly taskDrafts = signal<Record<string, string>>({});
  readonly editingColumnId = signal<string | null>(null);
  readonly editingTask = signal<{ columnId: string; taskId: string } | null>(null);

  readonly newColumnControl = this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]);
  readonly editColumnControl = this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]);
  readonly editTaskControl = this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]);

  readonly dropListIds = computed(() => this.board()?.columns.map((column) => column.id) ?? []);

  constructor() {
    this.loadBoard();

    this.socketService.boardUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedBoard) => {
        this.board.set(updatedBoard);
        this.loading.set(false);
      });

    effect(() => {
      const currentUser = this.user();

      if (currentUser) {
        void this.socketService.connect();
      } else {
        this.socketService.disconnect();
      }
    });

    effect(() => {
      const currentBoard = this.board();

      if (!currentBoard) {
        return;
      }

      const columnIds = new Set(currentBoard.columns.map((column) => column.id));

      this.taskDrafts.update((drafts) => {
        const next: Record<string, string> = {};
        for (const id of columnIds) {
          if (drafts[id]) {
            next[id] = drafts[id];
          }
        }
        return next;
      });

      const currentEditingColumn = this.editingColumnId();
      if (currentEditingColumn && !columnIds.has(currentEditingColumn)) {
        this.editingColumnId.set(null);
      }

      const currentEditingTask = this.editingTask();
      if (currentEditingTask) {
        const column = currentBoard.columns.find((col) => col.id === currentEditingTask.columnId);
        const taskExists = column?.tasks.some((task) => task.id === currentEditingTask.taskId) ?? false;
        if (!taskExists) {
          this.editingTask.set(null);
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      this.socketService.disconnect();
    });
  }

  get hasColumns(): boolean {
    return (this.board()?.columns.length ?? 0) > 0;
  }

  loadingBoard(): boolean {
    return this.loading();
  }

  mutating(): boolean {
    return this.isMutating();
  }

  trackColumn = (_: number, column: TaskColumn) => column.id;
  trackTask = (_: number, task: TaskItem) => task.id;

  connectedDropLists(columnId: string): string[] {
    return this.dropListIds().filter((id) => id !== columnId);
  }

  taskDraft(columnId: string): string {
    return this.taskDrafts()[columnId] ?? '';
  }

  setTaskDraft(columnId: string, value: string): void {
    this.taskDrafts.update((drafts) => ({ ...drafts, [columnId]: value }));
  }

  clearTaskDraft(columnId: string): void {
    this.taskDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[columnId];
      return next;
    });
  }

  isEditingTask(columnId: string, taskId: string): boolean {
    const editing = this.editingTask();
    return Boolean(editing && editing.columnId === columnId && editing.taskId === taskId);
  }

  addColumn(): void {
    if (this.newColumnControl.invalid || this.mutating()) {
      this.newColumnControl.markAsTouched();
      return;
    }

    const title = this.newColumnControl.getRawValue().trim();

    if (!title) {
      this.newColumnControl.setValue('');
      this.newColumnControl.markAsTouched();
      return;
    }

    this.isMutating.set(true);

    this.boardService
      .createColumn(title)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false))
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.newColumnControl.setValue('');
        },
        error: () => {
          this.loadBoard();
        }
      });
  }

  startEditColumn(column: TaskColumn): void {
    if (this.mutating()) {
      return;
    }

    this.editingColumnId.set(column.id);
    this.editColumnControl.setValue(column.title);
  }

  commitColumnTitle(columnId: string, event?: Event): void {
    event?.preventDefault();

    if (this.editingColumnId() !== columnId || this.mutating()) {
      return;
    }

    if (this.editColumnControl.invalid) {
      this.editColumnControl.markAsTouched();
      return;
    }

    const title = this.editColumnControl.getRawValue().trim();

    if (!title) {
      this.editColumnControl.markAsTouched();
      return;
    }

    const currentTitle = this.board()?.columns.find((column) => column.id === columnId)?.title?.trim();

    if (currentTitle && currentTitle === title) {
      this.editingColumnId.set(null);
      return;
    }

    this.isMutating.set(true);

    this.boardService
      .updateColumn(columnId, title)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false))
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.editingColumnId.set(null);
        },
        error: () => {
          this.editingColumnId.set(null);
          this.loadBoard();
        }
      });
  }

  cancelColumnEdit(): void {
    if (this.mutating()) {
      return;
    }

    this.editingColumnId.set(null);
  }

  addTask(columnId: string): void {
    if (this.mutating()) {
      return;
    }

    const draft = this.taskDraft(columnId).trim();

    if (!draft) {
      return;
    }

    this.isMutating.set(true);

    this.boardService
      .createTask(columnId, draft)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false))
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.clearTaskDraft(columnId);
        },
        error: () => {
          this.loadBoard();
        }
      });
  }

  startEditTask(columnId: string, task: TaskItem): void {
    if (this.mutating()) {
      return;
    }

    this.editingTask.set({ columnId, taskId: task.id });
    this.editTaskControl.setValue(task.title);
  }

  commitTaskTitle(columnId: string, taskId: string, event?: Event): void {
    event?.preventDefault();

    if (!this.isEditingTask(columnId, taskId) || this.mutating()) {
      return;
    }

    if (this.editTaskControl.invalid) {
      this.editTaskControl.markAsTouched();
      return;
    }

    const title = this.editTaskControl.getRawValue().trim();

    if (!title) {
      this.editTaskControl.markAsTouched();
      return;
    }

    const board = this.board();
    const existingTitle = board
      ?.columns.find((column) => column.id === columnId)
      ?.tasks.find((task) => task.id === taskId)?.title?.trim();

    if (existingTitle && existingTitle === title) {
      this.editingTask.set(null);
      return;
    }

    this.isMutating.set(true);

    this.boardService
      .updateTask(columnId, taskId, title)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false))
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.editingTask.set(null);
        },
        error: () => {
          this.editingTask.set(null);
          this.loadBoard();
        }
      });
  }

  cancelTaskEdit(): void {
    if (this.mutating()) {
      return;
    }

    this.editingTask.set(null);
  }

  handleTaskDrop(event: CdkDragDrop<TaskItem[]>, destinationColumn: TaskColumn): void {
    const board = this.board();

    if (!board) {
      return;
    }

    const dragged = event.item.data as { task: TaskItem; columnId: string } | undefined;

    if (!dragged) {
      return;
    }

    const sourceColumnId = dragged.columnId;

    if (sourceColumnId === destinationColumn.id && event.previousIndex === event.currentIndex) {
      return;
    }

    const updatedBoard = this.reorderTasksLocally(board, sourceColumnId, destinationColumn.id, event.previousIndex, event.currentIndex);
    this.board.set(updatedBoard);

    this.boardService
      .moveTask(dragged.task.id, sourceColumnId, destinationColumn.id, event.currentIndex)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latestBoard) => {
          this.board.set(latestBoard);
        },
        error: () => {
          this.loadBoard();
        }
      });
  }

  handleColumnDrop(event: CdkDragDrop<TaskColumn[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const board = this.board();

    if (!board) {
      return;
    }

    const columns = [...board.columns];
    const [moved] = columns.splice(event.previousIndex, 1);

    if (!moved) {
      return;
    }

    columns.splice(event.currentIndex, 0, moved);

    const updatedBoard: TaskBoard = { ...board, columns };
    this.board.set(updatedBoard);

    this.boardService
      .reorderColumns(columns.map((column) => column.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latestBoard) => {
          this.board.set(latestBoard);
        },
        error: () => {
          this.loadBoard();
        }
      });
  }

  logout(): void {
    this.socketService.disconnect();
    this.authService.logout();
  }

  private loadBoard(): void {
    this.loading.set(true);

    this.boardService
      .getBoard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
        },
        error: () => {
          this.board.set(null);
        }
      });
  }

  private reorderTasksLocally(
    board: TaskBoard,
    sourceColumnId: string,
    destinationColumnId: string,
    previousIndex: number,
    currentIndex: number
  ): TaskBoard {
    const columns = board.columns.map((column) => ({ ...column, tasks: [...column.tasks] }));
    const sourceColumn = columns.find((column) => column.id === sourceColumnId);
    const destinationColumn = columns.find((column) => column.id === destinationColumnId);

    if (!sourceColumn || !destinationColumn) {
      return board;
    }

    const [task] = sourceColumn.tasks.splice(previousIndex, 1);

    if (!task) {
      return board;
    }

    const insertIndex = Math.min(Math.max(currentIndex, 0), destinationColumn.tasks.length);
    destinationColumn.tasks.splice(insertIndex, 0, task);

    return { ...board, columns };
  }
}
