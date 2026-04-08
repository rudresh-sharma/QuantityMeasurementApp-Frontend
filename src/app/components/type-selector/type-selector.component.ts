import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MeasurementType } from '../../models/unit.model';

interface SelectorCard {
  type: MeasurementType;
  label: string;
  accent: string;
  icon: 'length' | 'weight' | 'temperature' | 'volume';
}

@Component({
  selector: 'app-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './type-selector.component.html',
  styleUrl: './type-selector.component.scss'
})
export class TypeSelectorComponent {
  @Input() selectedType: MeasurementType | null = null;
  @Output() typeChange = new EventEmitter<MeasurementType>();

  readonly cards: SelectorCard[] = [
    { type: 'length', label: 'Length', accent: '#4761d8', icon: 'length' },
    { type: 'weight', label: 'Weight', accent: '#6c84e8', icon: 'weight' },
    { type: 'temperature', label: 'Temperature', accent: '#ff6f72', icon: 'temperature' },
    { type: 'volume', label: 'Volume', accent: '#6f44f3', icon: 'volume' }
  ];
}
