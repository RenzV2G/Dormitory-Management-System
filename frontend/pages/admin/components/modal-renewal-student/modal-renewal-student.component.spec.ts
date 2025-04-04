import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRenewalStudentComponent } from './modal-renewal-student.component';

describe('ModalRenewalStudentComponent', () => {
  let component: ModalRenewalStudentComponent;
  let fixture: ComponentFixture<ModalRenewalStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRenewalStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalRenewalStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
