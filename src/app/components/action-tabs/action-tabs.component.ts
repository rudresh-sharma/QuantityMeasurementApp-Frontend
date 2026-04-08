import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionType } from '../../models/unit.model';

@Component({
  selector: 'app-action-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-tabs.component.html',
  styleUrl: './action-tabs.component.scss'
})
export class ActionTabsComponent {
  @Input() selectedAction: ActionType | null = null;
  @Output() actionChange = new EventEmitter<ActionType>();

  readonly actions: { key: ActionType; label: string }[] = [
    { key: 'comparison', label: 'Comparison' },
    { key: 'conversion', label: 'Conversion' },
    { key: 'arithmetic', label: 'Arithmetic' }
  ];
}
