import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDropComponent } from './price-drop.component';

describe('PriceDropComponent', () => {
  let component: PriceDropComponent;
  let fixture: ComponentFixture<PriceDropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PriceDropComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceDropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
