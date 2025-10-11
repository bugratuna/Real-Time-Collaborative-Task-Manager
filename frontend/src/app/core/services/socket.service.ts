import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TaskBoard } from '../types/board.types';
import { AuthService } from './auth.service';

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, unknown>) => any;
  }
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly authService = inject(AuthService);
  private readonly boardUpdatesSubject = new Subject<TaskBoard>();

  private socket: any;
  private clientLoader?: Promise<void>;

  readonly boardUpdates$ = this.boardUpdatesSubject.asObservable();

  async connect(): Promise<void> {
    const token = this.authService.token();

    if (!token) {
      return;
    }

    try {
      await this.loadClient();
    } catch (error) {
      console.error('Failed to load Socket.IO client:', error);
      return;
    }

    if (!window.io) {
      console.error('Socket.IO client could not be loaded.');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = window.io(environment.socketUrl, {
      auth: { token }
    });

    this.socket.on('board:updated', (board: TaskBoard) => {
      this.boardUpdatesSubject.next(board);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  private loadClient(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    if (window.io) {
      return Promise.resolve();
    }

    if (!this.clientLoader) {
      this.clientLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${environment.socketUrl}/socket.io/socket.io.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Socket.IO client script'));
        document.head.append(script);
      });
    }

    return this.clientLoader;
  }
}
