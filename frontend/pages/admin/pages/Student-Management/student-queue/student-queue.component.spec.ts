import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentQueueComponent } from './student-queue.component';

describe('StudentQueueComponent', () => {
  let component: StudentQueueComponent;
  let fixture: ComponentFixture<StudentQueueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentQueueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
