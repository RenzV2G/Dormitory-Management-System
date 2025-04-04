import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminServiceService } from '../admin-service.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-add-new-user',
  templateUrl: './add-new-user.component.html',
  styleUrl: './add-new-user.component.scss'
})
export class AddNewUserComponent {
  adminForm: FormGroup;
  passwordsDoNotMatch = false;
  pinDoNotMatch = false;

  constructor(private fb: FormBuilder, private adminService: AdminServiceService) {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNum: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      pin: ['', [Validators.required, Validators.minLength(6)]],
      confirmPin: ['', Validators.required],
    });

    // Listen to password and confirm password changes
    this.adminForm.get('password')?.valueChanges.subscribe(() => this.checkPasswords());
    this.adminForm.get('confirmPassword')?.valueChanges.subscribe(() => this.checkPasswords());

    this.adminForm.get('pin')?.valueChanges.subscribe(() => this.checkPins());
    this.adminForm.get('confirmPin')?.valueChanges.subscribe(() => this.checkPins());
  }

  checkPasswords() {
    const password = this.adminForm.get('password')?.value;
    const confirmPassword = this.adminForm.get('confirmPassword')?.value;
    this.passwordsDoNotMatch = password !== confirmPassword;
  }

  checkPins() {
    const pin = this.adminForm.get('pin')?.value;
    const confirmPin = this.adminForm.get('confirmPin')?.value;
    this.pinDoNotMatch = pin !== confirmPin;
  }

  onRegisterAdmin() {
    if (this.adminForm.invalid || this.passwordsDoNotMatch || this.pinDoNotMatch) {
      return;
    }
  
    try {
      const formData = { ...this.adminForm.value };
      delete formData.confirmPassword;
      delete formData.confirmPin;
  
      Swal.fire({
        title: 'Are you sure?',
        text: 'Please confirm your details before submitting.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Register',
        cancelButtonText: 'No, Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          this.adminService.registerAdmin(formData).subscribe({
            next: () => {
              Swal.fire('Success!', 'Admin registered successfully.', 'success').then(() => {
                window.location.reload();  
              });
            },
            error: (error) => Swal.fire('Error!', 'Registration failed. Please try again.', 'error'),
          });
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }
  
  

}
