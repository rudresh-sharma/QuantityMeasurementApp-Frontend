import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryRecord } from '../../models/unit.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {
  @Input() records: HistoryRecord[] = [];
  @Input() open = false;
  @Output() closePanel = new EventEmitter<void>();
  @Output() clearHistory = new EventEmitter<void>();

  formatAction(action: HistoryRecord['action']): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }
}
