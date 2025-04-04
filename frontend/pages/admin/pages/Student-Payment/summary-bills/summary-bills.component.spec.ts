import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryBillsComponent } from './summary-bills.component';

describe('SummaryBillsComponent', () => {
  let component: SummaryBillsComponent;
  let fixture: ComponentFixture<SummaryBillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryBillsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SummaryBillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
