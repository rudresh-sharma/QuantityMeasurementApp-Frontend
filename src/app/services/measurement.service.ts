import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActionType, MeasurementType } from '../models/unit.model';

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private readonly selectedTypeSubject = new BehaviorSubject<MeasurementType | null>(null);
  private readonly selectedActionSubject = new BehaviorSubject<ActionType | null>(null);
  private readonly authenticatedSubject = new BehaviorSubject(false);
  private readonly activeAuthTabSubject = new BehaviorSubject<'login' | 'signup'>('login');

  readonly selectedType$ = this.selectedTypeSubject.asObservable();
  readonly selectedAction$ = this.selectedActionSubject.asObservable();
  readonly authenticated$ = this.authenticatedSubject.asObservable();
  readonly activeAuthTab$ = this.activeAuthTabSubject.asObservable();

  get selectedType(): MeasurementType | null {
    return this.selectedTypeSubject.value;
  }

  get selectedAction(): ActionType | null {
    return this.selectedActionSubject.value;
  }

  setType(type: MeasurementType | null): void {
    this.selectedTypeSubject.next(type);
  }

  setAction(action: ActionType | null): void {
    this.selectedActionSubject.next(action);
  }

  setAuthenticated(isAuthenticated: boolean): void {
    this.authenticatedSubject.next(isAuthenticated);
  }

  setAuthTab(tab: 'login' | 'signup'): void {
    this.activeAuthTabSubject.next(tab);
  }
}
