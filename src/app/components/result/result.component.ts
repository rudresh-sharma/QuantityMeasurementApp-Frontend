import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss'
})
export class ResultComponent {
  @Input() value: number | null = null;
  @Input() unit = '';
  @Input() message = 'Choose type and action to begin';
  @Input() compact = false;
}
