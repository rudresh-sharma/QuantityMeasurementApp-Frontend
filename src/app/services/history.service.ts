import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HistoryRecord } from '../models/unit.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly storageKey = 'qm_history';
  private readonly historySubject = new BehaviorSubject<HistoryRecord[]>(this.readPersistedHistory());
  readonly history$ = this.historySubject.asObservable();

  add(record: Omit<HistoryRecord, 'id' | 'createdAt'>): void {
    const nextRecord: HistoryRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    this.updateHistory([nextRecord, ...this.historySubject.value].slice(0, 6));
  }

  clear(): void {
    this.updateHistory([]);
  }

  private updateHistory(records: HistoryRecord[]): void {
    this.historySubject.next(records);
    localStorage.setItem(this.storageKey, JSON.stringify(records));
  }

  private readPersistedHistory(): HistoryRecord[] {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(rawValue) as HistoryRecord[];
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }
}
