export type MeasurementType = 'length' | 'weight' | 'temperature' | 'volume';
export type ActionType = 'comparison' | 'conversion' | 'arithmetic';

export interface Unit {
  label: string;
  shortLabel: string;
  type: MeasurementType;
}

export interface ConversionRequest {
  type: MeasurementType;
  action: ActionType;
  leftValue: number;
  leftUnit: string;
  rightValue?: number;
  rightUnit?: string;
  operator?: '+' | '-' | '*' | '/';
}

export interface HistoryRecord {
  id: number;
  type: MeasurementType;
  action: ActionType;
  expression: string;
  result: number;
  unit: string;
  createdAt: string;
}
