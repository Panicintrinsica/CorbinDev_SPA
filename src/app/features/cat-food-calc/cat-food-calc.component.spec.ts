import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatFoodCalcComponent } from './cat-food-calc.component';

describe('CatFoodCalcComponent', () => {
  let component: CatFoodCalcComponent;
  let fixture: ComponentFixture<CatFoodCalcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatFoodCalcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatFoodCalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
