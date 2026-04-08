import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sigFigures',
  standalone: true
})
export class SigFiguresPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 6): string {
    if (value === null || value === undefined) {
      return '--';
    }

    return Number(value).toPrecision(digits).replace(/\.?0+$/, '');
  }
}
