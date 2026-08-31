import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

interface PetFoodInputs {
  cats: number;
  targetWeight: number;
  kcalPerKg: number;
  wetUnitsPerCase: number;
  wetCostPerCase: number;
  wetFoodWeight: number;
  wetFoodEnergy: number;
  dryFoodWeight: number;
  dryFoodEnergy: number;
  wetMix: number;
  wetFeedings: number;
  dryFeedings: number;
  dryCostPerUnit: number;
}

interface CalculationResults {
  energyReq: number;
  wetFoodEnergyPerGram: number;
  dryFoodEnergyPerGram: number;
  wetMixWeight: number;
  dryReqWeight: number;
  wetPerDay: number;
  dryPerDay: number;
  cansPerDay: number;
  wetCostPerMonth: number;
  dryCostPerMonth: number;
  totalCost: number;
  wetPortionSize: number;
  dryPortionSize: number;
  actualWetKcal: number;
  actualDryKcal: number;
  totalActualKcal: number;
  energyDifference: number;
  isValid: boolean;
  validationMessage: string;
}

@Component({
  selector: 'app-cat-food-calc',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cat-food-calc.component.html',
  styleUrls: ['./cat-food-calc.component.scss'],
})
export class CatFoodCalcComponent {
  calculatorForm: FormGroup;

  // Signal for form values
  formValues = signal<PetFoodInputs>({
    cats: 2,
    targetWeight: 3.6,
    kcalPerKg: 45,
    wetUnitsPerCase: 24,
    wetCostPerCase: 32.0,
    wetFoodWeight: 156,
    wetFoodEnergy: 170,
    dryFoodWeight: 4500,
    dryFoodEnergy: 16875,
    dryCostPerUnit: 32.0,
    wetMix: 0.5,
    wetFeedings: 2,
    dryFeedings: 1,
  });

  // Computed signal for wet mix percentage
  wetMixPercentage = computed(
    () => `${(this.formValues().wetMix * 100).toFixed(0)}%`,
  );

  // Computed signal for calculation results
  results = computed(() => this.calculatePetFood(this.formValues()));

  constructor(
    private fb: FormBuilder,
    private meta: Meta,
    private title: Title,
  ) {
    this.title.setTitle('Corbin.dev | Cat Food Calculator');
    this.meta.addTags([
      {
        name: 'description',
        content: 'A Meal Planning Utility for Cats!',
      },
    ]);
    this.calculatorForm = this.createForm();
    this.setupFormSubscription();
  }

  private createForm(): FormGroup {
    const initialValues = this.formValues();
    return this.fb.group({
      cats: [initialValues.cats, [Validators.required, Validators.min(1)]],
      targetWeight: [
        initialValues.targetWeight,
        [Validators.required, Validators.min(0.1)],
      ],
      kcalPerKg: [
        initialValues.kcalPerKg,
        [Validators.required, Validators.min(1)],
      ],
      wetUnitsPerCase: [
        initialValues.wetUnitsPerCase,
        [Validators.required, Validators.min(1)],
      ],
      wetCostPerCase: [
        initialValues.wetCostPerCase,
        [Validators.required, Validators.min(0.01)],
      ],
      wetFoodWeight: [
        initialValues.wetFoodWeight,
        [Validators.required, Validators.min(1)],
      ],
      wetFoodEnergy: [
        initialValues.wetFoodEnergy,
        [Validators.required, Validators.min(1)],
      ],
      dryFoodWeight: [
        initialValues.dryFoodWeight,
        [Validators.required, Validators.min(1)],
      ],
      dryFoodEnergy: [
        initialValues.dryFoodEnergy,
        [Validators.required, Validators.min(1)],
      ],
      dryCostPerUnit: [
        initialValues.dryCostPerUnit,
        [Validators.required, Validators.min(0.01)],
      ],
      wetMix: [
        initialValues.wetMix,
        [Validators.required, Validators.min(0), Validators.max(1)],
      ],
      wetFeedings: [
        initialValues.wetFeedings,
        [Validators.required, Validators.min(0)],
      ],
      dryFeedings: [
        initialValues.dryFeedings,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  private setupFormSubscription(): void {
    this.calculatorForm.valueChanges.subscribe((values) => {
      if (this.calculatorForm.valid) {
        this.formValues.set(values as PetFoodInputs);
      }
    });
  }

  private calculatePetFood(inputs: PetFoodInputs): CalculationResults {
    const {
      cats,
      targetWeight,
      kcalPerKg,
      wetUnitsPerCase,
      wetCostPerCase,
      wetFoodWeight,
      wetFoodEnergy,
      dryFoodWeight,
      dryFoodEnergy,
      dryCostPerUnit,
      wetMix,
      wetFeedings,
      dryFeedings,
    } = inputs;

    const energyReq = targetWeight * kcalPerKg;

    const wetFoodEnergyPerGram = wetFoodEnergy / wetFoodWeight;
    const dryFoodEnergyPerGram = dryFoodEnergy / dryFoodWeight;

    const wetMixWeight = wetFoodWeight * wetMix;
    const wetMixEnergy = wetMixWeight * wetFoodEnergyPerGram;
    const remainingEnergyBudget = energyReq - wetMixEnergy;

    const dryReqWeight = remainingEnergyBudget / dryFoodEnergyPerGram;

    // Daily amounts
    const wetPerDay = wetMixWeight * cats;
    const dryPerDay = dryReqWeight * cats;

    const cansPerDay = wetPerDay / wetFoodWeight;

    // Meal plan calculations - per cat portions
    const wetPortionSize = wetFeedings > 0 ? wetMixWeight / wetFeedings : 0;
    const dryPortionSize =
      dryFeedings > 0 ? Math.max(0, dryReqWeight) / dryFeedings : 0;

    // Calculate actual kcal from meal plan
    const actualWetKcal = wetPortionSize * wetFeedings * wetFoodEnergyPerGram;
    const actualDryKcal = dryPortionSize * dryFeedings * dryFoodEnergyPerGram;
    const totalActualKcal = actualWetKcal + actualDryKcal;
    const energyDifference = totalActualKcal - energyReq;

    // Enhanced validation logic
    let isValid = true;
    let validationMessage = '';

    const energyTolerance = energyReq * 0.05; // 5% tolerance

    if (wetFeedings === 0 && dryFeedings === 0) {
      isValid = false;
      validationMessage =
        '⚠️ No feedings planned - set at least one feeding type';
    } else if (dryReqWeight < 0) {
      isValid = false;
      validationMessage =
        '⚠️ Wet food provides too much energy - reduce mix or dry food energy density';
    } else if (wetFeedings === 0 && wetMix > 0) {
      isValid = false;
      validationMessage =
        '⚠️ Plan calls for wet food but 0 wet feedings - increase wet feedings or reduce mix';
    } else if (dryFeedings === 0 && dryReqWeight > 0) {
      isValid = false;
      validationMessage =
        '⚠️ Plan calls for dry food but 0 dry feedings - increase dry feedings or increase mix';
    } else if (Math.abs(energyDifference) > energyTolerance) {
      isValid = false;
      if (energyDifference > 0) {
        validationMessage = `⚠️ Meal plan provides too much energy (+${energyDifference.toFixed(1)} kcal, ${((energyDifference / energyReq) * 100).toFixed(1)}% over target)`;
      } else {
        validationMessage = `⚠️ Meal plan provides insufficient energy (${energyDifference.toFixed(1)} kcal, ${((Math.abs(energyDifference) / energyReq) * 100).toFixed(1)}% under target)`;
      }
    }

    // Cost calculations - convert to cents for precision
    const wetCostPerCaseCents = wetCostPerCase * 100;
    const wetCostPerUnit = wetCostPerCaseCents / wetUnitsPerCase;
    const dryCostPerUnitCents = dryCostPerUnit * 100;

    const dryDaysPerUnit = dryPerDay > 0 ? dryFoodWeight / dryPerDay : 0;

    const wetCostPerMonth = (wetCostPerUnit * cansPerDay * 30.416) / 100;
    const dryCostPerMonth =
      dryDaysPerUnit > 0
        ? ((dryCostPerUnitCents / dryDaysPerUnit) * 30.416) / 100
        : 0;

    const totalCost = wetCostPerMonth + dryCostPerMonth;

    return {
      energyReq,
      wetFoodEnergyPerGram,
      dryFoodEnergyPerGram,
      wetMixWeight,
      dryReqWeight,
      wetPerDay,
      dryPerDay,
      cansPerDay,
      wetCostPerMonth,
      dryCostPerMonth,
      totalCost,
      wetPortionSize,
      dryPortionSize,
      actualWetKcal,
      actualDryKcal,
      totalActualKcal,
      energyDifference,
      isValid,
      validationMessage,
    };
  }

  getEnergyDifferenceClass(difference: number): string {
    if (difference > 0) return 'energy-over';
    if (difference < 0) return 'energy-under';
    return 'energy-exact';
  }
}
