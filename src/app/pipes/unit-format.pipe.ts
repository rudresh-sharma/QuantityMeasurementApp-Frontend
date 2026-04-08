import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unitFormat',
  standalone: true
})
export class UnitFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, unit: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '--';
    }

    return `${value} ${unit ?? ''}`.trim();
  }
}
