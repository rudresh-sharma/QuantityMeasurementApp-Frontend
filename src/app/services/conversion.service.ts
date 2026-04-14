import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConversionRequest, MeasurementType } from '../models/unit.model';
import { AuthService } from './auth.service';

interface BackendQuantityDto {
  value: number;
  unit: string;
  measurementType: string;
}

interface BackendQuantityInputDto {
  thisQuantityDTO: BackendQuantityDto;
  thatQuantityDTO: BackendQuantityDto;
}

interface BackendQuantityMeasurementDto {
  thisValue: number;
  thisUnit: string;
  thisMeasurementType: string;
  thatValue: number;
  thatUnit: string;
  thatMeasurementType: string;
  operation: string;
  resultString: string;
  resultValue: number;
  resultUnit: string;
  resultMeasurementType: string;
  errorMessage: string;
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConversionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  calculate(request: ConversionRequest): Observable<{ value: number; unit: string; summary: string }> {
    const operation = this.resolveOperation(request);

    if (!operation) {
      return throwError(() => new Error('Multiply is not supported by the backend API yet.'));
    }

    const body = this.toBackendRequest(request);
    const token = this.authService.getAccessToken();
    const options = token
      ? {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`
          })
        }
      : {};

    return this.http
      .post<BackendQuantityMeasurementDto>(`${environment.apiBaseUrl}/api/v1/quantities/${operation}`, body, options)
      .pipe(
        map((response) => ({
          value: response.resultValue,
          unit: this.fromBackendUnit(response.resultUnit || body.thatQuantityDTO.unit),
          summary: this.buildSummary(request, response)
        }))
      );
  }

  private resolveOperation(request: ConversionRequest): string | null {
    if (request.action === 'comparison') {
      return 'compare';
    }

    if (request.action === 'conversion') {
      return 'convert';
    }

    const operatorMap: Record<NonNullable<ConversionRequest['operator']>, string | null> = {
      '+': 'add',
      '-': 'subtract',
      '*': null,
      '/': 'divide'
    };

    return operatorMap[request.operator ?? '+'];
  }

  private toBackendRequest(request: ConversionRequest): BackendQuantityInputDto {
    const measurementType = this.toBackendMeasurementType(request.type);
    const leftUnit = this.toBackendUnit(request.leftUnit);
    const rightUnit = this.toBackendUnit(request.rightUnit || request.leftUnit);

    return {
      thisQuantityDTO: {
        value: request.leftValue,
        unit: leftUnit,
        measurementType
      },
      thatQuantityDTO: {
        value: request.action === 'conversion' ? request.leftValue : request.rightValue ?? 0,
        unit: rightUnit,
        measurementType
      }
    };
  }

  private buildSummary(request: ConversionRequest, response: BackendQuantityMeasurementDto): string {
    if (response.error) {
      return response.errorMessage || 'Calculation failed';
    }

    if (request.action === 'arithmetic') {
      if (response.resultString?.trim()) {
        return response.resultString.trim();
      }

      const leftUnit = this.toDisplayUnitLabel(request.leftUnit);
      const rightUnit = this.toDisplayUnitLabel(request.rightUnit || request.leftUnit);
      const resultUnit = this.toDisplayUnitLabel(this.fromBackendUnit(response.resultUnit || request.leftUnit));
      const operator = request.operator ?? '+';

      return `${request.leftValue} ${leftUnit} ${operator} ${request.rightValue ?? 0} ${rightUnit} = ${response.resultValue} ${resultUnit}`;
    }

    if (request.action === 'comparison') {
      const leftUnit = this.fromBackendUnit(response.thisUnit);
      const rightUnit = this.fromBackendUnit(response.thatUnit);
      const comparison = this.getComparisonSymbol(
        request.type,
        response.thisValue,
        leftUnit,
        response.thatValue,
        rightUnit
      );

      return `${response.thisValue} ${this.toComparisonUnitLabel(leftUnit, response.thisValue)} ${comparison} ${response.thatValue} ${this.toComparisonUnitLabel(rightUnit, response.thatValue)}`;
    }

    if (request.action === 'conversion') {
      const sourceUnit = this.toDisplayUnitLabel(request.leftUnit);
      const targetUnit = this.toDisplayUnitLabel(this.fromBackendUnit(response.resultUnit || request.rightUnit || ''));
      return `${request.leftValue} ${sourceUnit} = ${response.resultValue} ${targetUnit}`;
    }

    return 'Calculation completed';
  }

  private toBackendMeasurementType(type: MeasurementType): string {
    const measurementMap: Record<MeasurementType, string> = {
      length: 'LengthUnit',
      weight: 'WeightUnit',
      temperature: 'TemperatureUnit',
      volume: 'VolumeUnit'
    };

    return measurementMap[type];
  }

  private toBackendUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      km: 'KILOMETER',
      m: 'METER',
      cm: 'CENTIMETER',
      mm: 'MILLIMETER',
      mi: 'MILE',
      yd: 'YARD',
      ft: 'FOOT',
      in: 'INCH',
      mg: 'MILLIGRAM',
      g: 'GRAM',
      kg: 'KILOGRAM',
      lb: 'POUND',
      oz: 'OUNCE',
      t: 'TONNE',
      C: 'CELSIUS',
      F: 'FAHRENHEIT',
      K: 'KELVIN',
      l: 'LITRE',
      ml: 'MILLILITRE',
      gal: 'GALLON',
      qt: 'QUART',
      pt: 'PINT',
      cup: 'CUP',
      'fl oz': 'FLUID_OUNCE',
      m3: 'CUBIC_METER'
    };

    return unitMap[unit] ?? unit;
  }

  private fromBackendUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      KILOMETER: 'km',
      METER: 'm',
      CENTIMETER: 'cm',
      MILLIMETER: 'mm',
      MILE: 'mi',
      YARD: 'yd',
      FOOT: 'ft',
      INCH: 'in',
      MILLIGRAM: 'mg',
      GRAM: 'g',
      KILOGRAM: 'kg',
      POUND: 'lb',
      OUNCE: 'oz',
      TONNE: 't',
      CELSIUS: 'C',
      FAHRENHEIT: 'F',
      KELVIN: 'K',
      LITRE: 'l',
      MILLILITRE: 'ml',
      GALLON: 'gal',
      QUART: 'qt',
      PINT: 'pt',
      CUP: 'cup',
      FLUID_OUNCE: 'fl oz',
      CUBIC_METER: 'm3'
    };

    return unitMap[unit] ?? unit;
  }

  private toDisplayUnitLabel(unit: string): string {
    const unitMap: Record<string, string> = {
      km: 'Kilometer',
      m: 'Meter',
      cm: 'Centimeter',
      mm: 'Millimeter',
      mi: 'Mile',
      ft: 'Feet',
      in: 'Inch',
      yd: 'Yard',
      mg: 'Milligram',
      g: 'Gram',
      kg: 'Kilogram',
      lb: 'Pound',
      oz: 'Ounce',
      t: 'Tonne',
      C: 'Celsius',
      F: 'Fahrenheit',
      K: 'Kelvin',
      l: 'Liter',
      ml: 'Milliliter',
      gal: 'Gallon',
      qt: 'Quart',
      pt: 'Pint',
      cup: 'Cup',
      'fl oz': 'Fluid Ounce',
      m3: 'Cubic Meter'
    };

    return unitMap[unit] ?? unit;
  }

  private toComparisonUnitLabel(unit: string, value: number): string {
    const singularMap: Record<string, string> = {
      km: 'Kilometer',
      m: 'Meter',
      cm: 'Centimeter',
      mm: 'Millimeter',
      mi: 'Mile',
      ft: 'Foot',
      in: 'Inch',
      yd: 'Yard',
      mg: 'Milligram',
      g: 'Gram',
      kg: 'Kilogram',
      lb: 'Pound',
      oz: 'Ounce',
      t: 'Tonne',
      C: 'Celsius',
      F: 'Fahrenheit',
      K: 'Kelvin',
      l: 'Liter',
      ml: 'Milliliter',
      gal: 'Gallon',
      qt: 'Quart',
      pt: 'Pint',
      cup: 'Cup',
      'fl oz': 'Fluid Ounce',
      m3: 'Cubic Meter'
    };

    const pluralMap: Record<string, string> = {
      km: 'Kilometers',
      m: 'Meters',
      cm: 'Centimeters',
      mm: 'Millimeters',
      mi: 'Miles',
      ft: 'Feet',
      in: 'Inches',
      yd: 'Yards',
      mg: 'Milligrams',
      g: 'Grams',
      kg: 'Kilograms',
      lb: 'Pounds',
      oz: 'Ounces',
      t: 'Tonnes',
      C: 'Celsius',
      F: 'Fahrenheit',
      K: 'Kelvin',
      l: 'Liters',
      ml: 'Milliliters',
      gal: 'Gallons',
      qt: 'Quarts',
      pt: 'Pints',
      cup: 'Cups',
      'fl oz': 'Fluid Ounces',
      m3: 'Cubic Meters'
    };

    return Math.abs(value) === 1 ? (singularMap[unit] ?? unit) : (pluralMap[unit] ?? unit);
  }

  private getComparisonSymbol(
    type: MeasurementType,
    leftValue: number,
    leftUnit: string,
    rightValue: number,
    rightUnit: string
  ): '<' | '>' | '=' {
    const leftComparable = this.toComparableValue(type, leftValue, leftUnit);
    const rightComparable = this.toComparableValue(type, rightValue, rightUnit);
    const epsilon = 1e-9;

    if (Math.abs(leftComparable - rightComparable) < epsilon) {
      return '=';
    }

    return leftComparable > rightComparable ? '>' : '<';
  }

  private toComparableValue(type: MeasurementType, value: number, unit: string): number {
    const linearFactors: Partial<Record<MeasurementType, Record<string, number>>> = {
      length: { mm: 1, cm: 10, in: 25.4, ft: 304.8, yd: 914.4, m: 1000, km: 1000000, mi: 1609344 },
      weight: { mg: 1, g: 1000, kg: 1000000, lb: 453592.37, oz: 28349.5, t: 1000000000 },
      volume: { ml: 1, l: 1000, gal: 3785.411784, qt: 946.353, pt: 473.176, cup: 236.588, 'fl oz': 29.5735, m3: 1000000 }
    };

    if (type === 'temperature') {
      if (unit === 'C') {
        return value;
      }

      if (unit === 'F') {
        return ((value - 32) * 5) / 9;
      }

      if (unit === 'K') {
        return value - 273.15;
      }
    }

    const factor = linearFactors[type]?.[unit];
    return factor ? value * factor : value;
  }
}
