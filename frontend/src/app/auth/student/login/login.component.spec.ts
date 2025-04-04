import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginStudentComponent } from './login.component';

describe('LoginStudentComponent', () => {
  let component: LoginStudentComponent;
  let fixture: ComponentFixture<LoginStudentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoginStudentComponent]
    });
    fixture = TestBed.createComponent(LoginStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
