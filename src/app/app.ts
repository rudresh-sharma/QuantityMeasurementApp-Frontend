import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ActionTabsComponent } from './components/action-tabs/action-tabs.component';
import { HistoryComponent } from './components/history/history.component';
import { OperatorComponent } from './components/operator/operator.component';
import { ResultComponent } from './components/result/result.component';
import { TypeSelectorComponent } from './components/type-selector/type-selector.component';
import { UnitInputComponent } from './components/unit-input/unit-input.component';
import { ActionType, MeasurementType, Unit } from './models/unit.model';
import { AuthResponse, AuthService } from './services/auth.service';
import { ConversionService } from './services/conversion.service';
import { HistoryService } from './services/history.service';
import { MeasurementService } from './services/measurement.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    TypeSelectorComponent,
    ActionTabsComponent,
    UnitInputComponent,
    OperatorComponent,
    ResultComponent,
    HistoryComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly measurementService = inject(MeasurementService);
  private readonly conversionService = inject(ConversionService);
  private readonly historyService = inject(HistoryService);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, this.passwordStrengthValidator()]]
  });

  readonly signupForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.pattern(/.*[A-Za-z].*/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, this.passwordStrengthValidator()]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
  });

  readonly calculatorForm = this.fb.group({
    leftValue: [null as number | null, Validators.required],
    leftUnit: ['', Validators.required],
    rightValue: [null as number | null],
    rightUnit: [''],
    operator: ['+' as '+' | '-' | '*' | '/']
  });

  readonly units: Record<MeasurementType, Unit[]> = {
    length: [
      { label: 'Kilometer', shortLabel: 'km', type: 'length' },
      { label: 'Meter', shortLabel: 'm', type: 'length' },
      { label: 'Centimeter', shortLabel: 'cm', type: 'length' },
      { label: 'Millimeter', shortLabel: 'mm', type: 'length' },
      { label: 'Mile', shortLabel: 'mi', type: 'length' },
      { label: 'Yard', shortLabel: 'yd', type: 'length' },
      { label: 'Feet', shortLabel: 'ft', type: 'length' },
      { label: 'Inch', shortLabel: 'in', type: 'length' },
    ],
    weight: [
      { label: 'Milligram', shortLabel: 'mg', type: 'weight' },
      { label: 'Gram', shortLabel: 'g', type: 'weight' },
      { label: 'Kilogram', shortLabel: 'kg', type: 'weight' },
      { label: 'Pound', shortLabel: 'lb', type: 'weight' },
      { label: 'Ounce', shortLabel: 'oz', type: 'weight' },
      { label: 'Tonne', shortLabel: 't', type: 'weight' }
    ],
    temperature: [
      { label: 'Celsius', shortLabel: 'C', type: 'temperature' },
      { label: 'Fahrenheit', shortLabel: 'F', type: 'temperature' },
      { label: 'Kelvin', shortLabel: 'K', type: 'temperature' }
    ],
    volume: [
      { label: 'Liter', shortLabel: 'l', type: 'volume' },
      { label: 'Milliliter', shortLabel: 'ml', type: 'volume' },
      { label: 'Gallon', shortLabel: 'gal', type: 'volume' },
      { label: 'Quart', shortLabel: 'qt', type: 'volume' },
      { label: 'Pint', shortLabel: 'pt', type: 'volume' },
      { label: 'Cup', shortLabel: 'cup', type: 'volume' },
      { label: 'Fluid Ounce', shortLabel: 'fl oz', type: 'volume' },
      { label: 'Cubic Meter', shortLabel: 'm3', type: 'volume' }
    ]
  };

  resultValue: number | null = null;
  resultUnit = '';
  resultMessage = 'Choose type and action to begin';
  currentUserName = 'User';
  showLoginPassword = false;
  showSignupPassword = false;
  authErrorMessage = '';
  signupErrorMessage = '';
  loginErrorMessage = '';
  historyOpen = false;

  constructor() {
    this.signupForm.controls.email.valueChanges.subscribe(() => {
      this.clearEmailAlreadyRegisteredError();
    });
  }

  readonly viewModel$ = combineLatest({
    selectedType: this.measurementService.selectedType$,
    selectedAction: this.measurementService.selectedAction$,
    authenticated: this.measurementService.authenticated$,
    activeAuthTab: this.measurementService.activeAuthTab$,
    history: this.historyService.history$
  });

  ngOnInit(): void {
    this.restoreSession();
    this.handleOAuthCallback();
    this.initializeDefaultCalculatorState();
  }

  setAuthTab(tab: 'login' | 'signup'): void {
    this.measurementService.setAuthTab(tab);
    this.authErrorMessage = '';
    this.signupErrorMessage = '';
    this.loginErrorMessage = '';
  }

  login(): void {
    if (this.loginForm.valid) {
      this.authErrorMessage = '';
      this.loginErrorMessage = '';
      this.authService
        .login({
          email: this.loginForm.getRawValue().email || '',
          password: this.loginForm.getRawValue().password || ''
        })
        .subscribe({
          next: (response) => this.completeAuthentication(response),
          error: (error: Error) => {
            const message = this.formatAuthError(error.message);
            this.authErrorMessage = message;
            this.loginErrorMessage = message;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.loginErrorMessage = 'Please enter a valid email and password.';
      this.loginForm.markAllAsTouched();
    }
  }

  signup(): void {
    this.commitActiveField();

    if (this.signupForm.valid) {
      this.authErrorMessage = '';
      this.signupErrorMessage = '';
      this.authService
        .register({
          fullName: this.signupForm.getRawValue().fullName || '',
          email: this.signupForm.getRawValue().email || '',
          password: this.signupForm.getRawValue().password || '',
          mobileNumber: this.signupForm.getRawValue().mobileNumber || ''
        })
        .subscribe({
          next: (response) => this.completeAuthentication(response),
          error: (error: Error) => {
            const message = this.formatAuthError(error.message);
            this.authErrorMessage = message;
            if (this.isEmailAlreadyRegisteredMessage(error.message)) {
              const emailControl = this.signupForm.controls.email;
              emailControl.setErrors({
                ...(emailControl.errors ?? {}),
                alreadyRegistered: true
              });
              emailControl.markAsTouched();
              this.signupErrorMessage = '';
              this.signupForm.setErrors(null);
            } else {
              this.signupErrorMessage = message;
              this.signupForm.setErrors({ submit: message });
            }
            this.cdr.detectChanges();
          }
        });
    } else {
      this.authErrorMessage = this.signupFormMessage();
      this.signupErrorMessage = this.authErrorMessage;
      this.signupForm.setErrors({ submit: this.signupErrorMessage });
      this.signupForm.markAllAsTouched();
      this.cdr.detectChanges();
    }
  }

  logout(): void {
    this.authService.clearSession();
    this.measurementService.setAuthenticated(false);
    this.initializeDefaultCalculatorState();
    this.authErrorMessage = '';
    this.signupErrorMessage = '';
    this.loginErrorMessage = '';
    this.signupForm.setErrors(null);
    this.loginForm.setErrors(null);
  }

  signInWithGoogle(): void {
    window.location.href = this.authService.getGoogleAuthUrl();
  }

  setType(type: MeasurementType): void {
    this.measurementService.setType(type);
    this.calculatorForm.patchValue({ leftUnit: '', rightUnit: '' });
    this.updateIdleMessage(this.measurementService.selectedAction);
    this.triggerAutoComparison();
    this.triggerAutoConversion();
  }

  setAction(action: ActionType): void {
    this.measurementService.setAction(action);
    this.updateIdleMessage(action);
    this.triggerAutoComparison();
    this.triggerAutoConversion();
  }

  updateLeftValue(value: number): void {
    this.calculatorForm.patchValue({ leftValue: value });
    this.triggerAutoComparison();
    this.triggerAutoConversion();
    this.triggerAutoArithmetic();
  }

  updateRightValue(value: number): void {
    this.calculatorForm.patchValue({ rightValue: value });
    this.triggerAutoComparison();
    this.triggerAutoConversion();
    this.triggerAutoArithmetic();
  }

  updateLeftUnit(unit: string): void {
    this.calculatorForm.patchValue({ leftUnit: unit });
    this.triggerAutoComparison();
    this.triggerAutoConversion();
    this.triggerAutoArithmetic();
  }

  updateRightUnit(unit: string): void {
    this.calculatorForm.patchValue({ rightUnit: unit });
    this.triggerAutoComparison();
    this.triggerAutoConversion();
    this.triggerAutoArithmetic();
  }

  updateOperator(operator: '+' | '-' | '*' | '/'): void {
    this.calculatorForm.patchValue({ operator });
    this.triggerAutoArithmetic();
  }

  calculate(selectedType: MeasurementType, selectedAction: ActionType | null): void {
    if (!selectedAction) {
      this.resultMessage = 'Select an action before calculating';
      return;
    }

    const value = this.calculatorForm.getRawValue();
    const leftValue = Number(value.leftValue);
    const rightValue = Number(value.rightValue);

    this.conversionService
      .calculate({
        type: selectedType,
        action: selectedAction,
        leftValue,
        leftUnit: value.leftUnit || '',
        rightValue,
        rightUnit: value.rightUnit || '',
        operator: value.operator || '+'
      })
      .subscribe({
        next: (result) => {
          this.resultValue = result.value;
          this.resultUnit = result.unit;
          this.resultMessage = result.summary;
          this.historyService.add({
            type: selectedType,
            action: selectedAction,
            expression: result.summary,
            result: result.value,
            unit: result.unit
          });
        },
        error: (error: Error) => {
          this.resultValue = null;
          this.resultUnit = '';
          this.resultMessage = error.message || 'Calculation failed';
        }
      });
  }

  currentUnits(type: MeasurementType | null): Unit[] {
    return type ? this.units[type] : [];
  }

  showControlError(control: AbstractControl | null | undefined): boolean {
    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty);
  }

  emailErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control || !this.showControlError(control)) {
      return '';
    }

    if (control.hasError('alreadyRegistered')) {
      return 'Email already registered.';
    }

    if (control.hasError('required')) {
      return 'Email is required';
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  passwordErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control || !this.showControlError(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Password is required';
    }

    if (control.hasError('passwordStrength')) {
      return 'Password must contain uppercase, lowercase, number, special character, and at least 8 characters';
    }

    return '';
  }

  mobileNumberErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control || !this.showControlError(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Mobile number is required';
    }

    if (control.hasError('pattern')) {
      return 'Mobile number must be exactly 10 digits';
    }

    return '';
  }

  fullNameErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control || !this.showControlError(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Full name is required';
    }

    if (control.hasError('pattern')) {
      return 'Full name must contain at least one alphabet';
    }

    return '';
  }

  focusNextField(event: Event, nextField?: HTMLInputElement | null): void {
    event.preventDefault();
    nextField?.focus();
  }

  togglePasswordVisibility(field: 'login' | 'signup'): void {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
      return;
    }

    this.showSignupPassword = !this.showSignupPassword;
  }

  openHistory(): void {
    this.historyOpen = true;
  }

  closeHistory(): void {
    this.historyOpen = false;
  }

  clearHistory(): void {
    this.historyService.clear();
  }

  private completeAuthentication(response: AuthResponse): void {
    this.authService.persistSession(response);
    this.measurementService.setAuthenticated(true);
    this.currentUserName = this.resolveDisplayName(response.user.fullName, response.user.email);
    this.initializeDefaultCalculatorState();
    this.authErrorMessage = '';
    this.signupErrorMessage = '';
    this.loginErrorMessage = '';
    this.signupForm.setErrors(null);
    this.loginForm.setErrors(null);
  }

  private restoreSession(): void {
    const session = this.authService.readSession();
    if (session?.token) {
      this.measurementService.setAuthenticated(true);
      this.currentUserName = this.resolveDisplayName(session.user.fullName, session.user.email);
    }
  }

  private handleOAuthCallback(): void {
    const currentUrl = new URL(window.location.href);

    if (currentUrl.pathname !== environment.googleSuccessPath) {
      return;
    }

    const token = currentUrl.searchParams.get('token');
    const email = currentUrl.searchParams.get('email');
    const name = currentUrl.searchParams.get('name');
    if (!token || !email) {
      this.authErrorMessage = 'Google sign-in failed. Please try again.';
      window.history.replaceState({}, '', '/');
      return;
    }

    const fullName = name || email.split('@')[0];
    this.completeAuthentication({
      token,
      tokenType: 'Bearer',
      expiresInSeconds: 10800,
      user: {
        id: 0,
        fullName,
        email,
        mobileNumber: '',
        role: 'USER',
        authProvider: 'GOOGLE'
      }
    });
    window.history.replaceState({}, '', '/');
  }

  private passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');

      if (!value) {
        return null;
      }

      const isValid =
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /\d/.test(value) &&
        /[^A-Za-z0-9]/.test(value) &&
        value.length >= 8;

      return isValid ? null : { passwordStrength: true };
    };
  }

  private formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatAuthError(message: string): string {
    if (
      message.includes('Email already exists') ||
      message.includes('User already exists with email') ||
      message.toLowerCase().includes('already exists')
    ) {
      return 'An account with this email already exists. Please login instead.';
    }

    if (message.includes('Invalid email or password')) {
      return 'Invalid email or password.';
    }

    if (message.toLowerCase().includes('google sign-in') || message.toLowerCase().includes('continue with google')) {
      return 'This account uses Google Sign-In. Please continue with Google.';
    }

    if (message.includes('Validation Error')) {
      return 'Please check your signup details and try again.';
    }

    return message;
  }

  private isEmailAlreadyRegisteredMessage(message: string): boolean {
    return (
      message.includes('Email already exists') ||
      message.includes('User already exists with email') ||
      message.toLowerCase().includes('already exists')
    );
  }

  private signupFormMessage(): string {
    if (this.signupForm.controls.fullName.invalid) {
      return 'Please enter your full name.';
    }

    if (this.signupForm.controls.email.invalid) {
      return 'Please enter a valid email address.';
    }

    if (this.signupForm.controls.password.invalid) {
      return 'Password must contain uppercase, lowercase, number, special character, and at least 8 characters.';
    }

    if (this.signupForm.controls.mobileNumber.invalid) {
      return 'Mobile number must be exactly 10 digits.';
    }

    return 'Please correct the highlighted fields.';
  }

  private commitActiveField(): void {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    this.signupForm.updateValueAndValidity();
    this.loginForm.updateValueAndValidity();
  }

  private clearEmailAlreadyRegisteredError(): void {
    const emailControl = this.signupForm.controls.email;

    if (!emailControl.hasError('alreadyRegistered')) {
      return;
    }

    const errors = { ...(emailControl.errors ?? {}) };
    delete errors['alreadyRegistered'];
    emailControl.setErrors(Object.keys(errors).length ? errors : null);
  }

  private initializeDefaultCalculatorState(): void {
    this.measurementService.setType(null);
    this.measurementService.setAction(null);
    this.calculatorForm.patchValue({
      leftValue: null,
      leftUnit: '',
      rightValue: null,
      rightUnit: '',
      operator: '+'
    });
    this.updateIdleMessage(null);
  }

  private triggerAutoConversion(): void {
    if (this.measurementService.selectedAction !== 'conversion' || !this.measurementService.selectedType) {
      return;
    }

    const { leftValue, leftUnit, rightUnit } = this.calculatorForm.getRawValue();
    const numericLeftValue = Number(leftValue);

    if (leftValue === null || leftValue === undefined || Number.isNaN(numericLeftValue) || !leftUnit || !rightUnit) {
      this.updateIdleMessage('conversion');
      return;
    }

    this.calculate(this.measurementService.selectedType, 'conversion');
  }

  private triggerAutoComparison(): void {
    if (this.measurementService.selectedAction !== 'comparison' || !this.measurementService.selectedType) {
      return;
    }

    const { leftValue, rightValue, leftUnit, rightUnit } = this.calculatorForm.getRawValue();
    const numericLeftValue = Number(leftValue);
    const numericRightValue = Number(rightValue);

    if (
      leftValue === null ||
      rightValue === null ||
      leftValue === undefined ||
      rightValue === undefined ||
      Number.isNaN(numericLeftValue) ||
      Number.isNaN(numericRightValue) ||
      !leftUnit ||
      !rightUnit
    ) {
      this.updateIdleMessage('comparison');
      return;
    }

    this.calculate(this.measurementService.selectedType, 'comparison');
  }

  private updateIdleMessage(action: ActionType | null): void {
    if (!action) {
      this.resultMessage = 'Choose type and action to begin';
      this.resultValue = null;
      this.resultUnit = '';
      return;
    }

    if (action === 'conversion') {
      this.resultMessage = 'Select units and enter values to begin';
      this.resultValue = null;
      this.resultUnit = '';
      return;
    }

    if (action === 'arithmetic') {
      this.resultMessage = 'Select units and enter values to begin';
      this.resultValue = null;
      this.resultUnit = '';
      return;
    }

    const selectedType = this.measurementService.selectedType;
    this.resultMessage = selectedType
      ? `${this.formatLabel(action)} ready for ${this.formatLabel(selectedType)}`
      : 'Choose type and action to begin';
    this.resultValue = null;
    this.resultUnit = '';
  }

  private triggerAutoArithmetic(): void {
    if (this.measurementService.selectedAction !== 'arithmetic' || !this.measurementService.selectedType) {
      return;
    }

    const { leftValue, rightValue, leftUnit, rightUnit, operator } = this.calculatorForm.getRawValue();
    const numericLeftValue = Number(leftValue);
    const numericRightValue = Number(rightValue);

    if (
      leftValue === null ||
      rightValue === null ||
      leftValue === undefined ||
      rightValue === undefined ||
      Number.isNaN(numericLeftValue) ||
      Number.isNaN(numericRightValue) ||
      !leftUnit ||
      !rightUnit ||
      !operator
    ) {
      this.updateIdleMessage('arithmetic');
      return;
    }

    this.calculate(this.measurementService.selectedType, 'arithmetic');
  }

  private resolveDisplayName(fullName: string | null | undefined, email: string | null | undefined): string {
    const normalizedFullName = this.normalizeDisplayNamePart(String(fullName ?? '').trim());
    if (normalizedFullName) {
      return normalizedFullName;
    }

    const emailPrefix = String(email ?? '').split('@')[0]?.trim() ?? '';
    const normalizedEmailName = this.normalizeDisplayNamePart(emailPrefix);
    if (normalizedEmailName) {
      return normalizedEmailName;
    }

    return 'User';
  }

  private normalizeDisplayNamePart(value: string): string {
    const normalized = value
      .replace(/[0-9]+/g, ' ')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return 'User';
    }

    return normalized
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
