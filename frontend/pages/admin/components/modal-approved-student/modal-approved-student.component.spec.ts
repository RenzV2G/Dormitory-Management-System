import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalApprovedStudentComponent } from './modal-approved-student.component';

describe('ModalApprovedStudentComponent', () => {
  let component: ModalApprovedStudentComponent;
  let fixture: ComponentFixture<ModalApprovedStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalApprovedStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalApprovedStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
