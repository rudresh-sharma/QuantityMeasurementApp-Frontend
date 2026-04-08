import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-operator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.scss'
})
export class OperatorComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() selectedOperator: '+' | '-' | '*' | '/' = '+';
  @Output() operatorChange = new EventEmitter<'+' | '-' | '*' | '/'>();

  menuOpen = false;

  readonly operators: Array<{ value: '+' | '-' | '*' | '/'; symbol: string; label: string }> = [
    { value: '+', symbol: '+', label: 'Add' },
    { value: '-', symbol: '-', label: 'Subtract' },
    { value: '*', symbol: '×', label: 'Multiply' },
    { value: '/', symbol: '÷', label: 'Divide' }
  ];

  get selectedOption(): { value: '+' | '-' | '*' | '/'; symbol: string; label: string } {
    return this.operators.find((operator) => operator.value === this.selectedOperator) ?? this.operators[0];
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  chooseOperator(operator: '+' | '-' | '*' | '/'): void {
    this.operatorChange.emit(operator);
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen = false;
    }
  }
}
