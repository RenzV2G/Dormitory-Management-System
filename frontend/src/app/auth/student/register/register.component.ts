import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

function emailValidator(control: any) {
  const regex = /^[a-zA-Z0-9._%+-]+@student\.hau\.edu\.ph$/;
  return regex.test(control.value) ? null : { invalidEmail: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;  
  passwordMismatch = false;
  isLoading = false; 

  constructor(private authService: AuthService, private router: Router, private fb: FormBuilder){
    this.registerForm = this.fb.group({
      Student_no: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      sex: ['', Validators.required],
      email: ['', [Validators.required, emailValidator]],  
      password: ['', [Validators.required, Validators.minLength(6)]],  
      confirmPassword: ['', Validators.required],
    });

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.onPasswordChange();
    });

    this.registerForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.onPasswordChange();
    });
  }

  onPasswordChange() {
    this.passwordMismatch =
      this.registerForm.get('password')?.value !== this.registerForm.get('confirmPassword')?.value;
  }

  onRegister() {
    if (this.passwordMismatch) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords do not match',
        text: 'Please ensure the password and confirm password fields are identical.',
      });
      return;
    }

    if (this.registerForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Form',
        text: 'Please fill in all fields correctly.',
      });
      return;
    }

    this.isLoading = true;

    const { confirmPassword, ...dataToSend } = this.registerForm.value;

    this.authService.registerStudent(dataToSend).subscribe(
      (response) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: `Student ${response.data.name} has been registered successfully! Please check your email to verify your account.`,
        });

        this.registerForm.reset();

        this.goBack();
      },
      (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.error.message || 'An error occurred during registration.',
        });
      }
    );
  }

  goBack() {
    this.router.navigate(['/student-login']); 
  }
}
