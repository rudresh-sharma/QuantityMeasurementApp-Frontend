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
  @Input() allowNegativeValues = false;
  @Input() hideValueField = false;
  @Input() stackValueAndUnit = false;
  @Input() valuePlaceholder = 'Enter value';
  @Input() unitPlaceholder = 'Select unit';
  @Output() valueChange = new EventEmitter<number>();
  @Output() unitChange = new EventEmitter<string>();
  showNegativeValueError = false;

  emitValue(value: string | number): void {
    if (value === '') {
      this.showNegativeValueError = false;
      this.valueChange.emit(NaN);
      return;
    }

    const numericValue = Number(value);

    if (!this.allowNegativeValues && numericValue < 0) {
      this.showNegativeValueError = true;
      this.valueChange.emit(NaN);
      return;
    }

    this.showNegativeValueError = false;
    this.valueChange.emit(numericValue);
  }
}
