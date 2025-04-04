import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentInfoModalComponent } from './student-info-modal.component';

describe('StudentInfoModalComponent', () => {
  let component: StudentInfoModalComponent;
  let fixture: ComponentFixture<StudentInfoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentInfoModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentInfoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
