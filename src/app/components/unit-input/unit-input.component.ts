import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Unit } from '../../models/unit.model';

@Component({
  selector: 'app-unit-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unit-input.component.html',
  styleUrl: './unit-input.component.scss'
})
export class UnitInputComponent {
  @Input() label = '';
  @Input() value: number | null = null;
  @Input() selectedUnit = '';
  @Input() units: Unit[] = [];
  @Input() hideValueField = false;
  @Input() stackValueAndUnit = false;
  @Input() valuePlaceholder = 'Enter value';
  @Input() unitPlaceholder = 'Select unit';
  @Output() valueChange = new EventEmitter<number>();
  @Output() unitChange = new EventEmitter<string>();

  emitValue(value: string | number): void {
    if (value === '') {
      this.valueChange.emit(NaN);
      return;
    }

    this.valueChange.emit(Number(value));
  }
}
