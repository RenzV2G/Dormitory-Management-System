import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  token: string = '';
  message: string = '';
  isSuccess: boolean = false;
  passwordMismatch: boolean = false; // Track password mismatch
  isLoading: boolean = false; // Loading state
  resetForm: FormGroup; // Form group for validation
  countdown: number = 0; // Countdown timer
  private countdownSubscription: Subscription | null = null; // Subscription for the countdown timer

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    // Initialize the form group
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    // Listen for changes in the form controls
    this.resetForm.valueChanges.subscribe(() => {
      this.onPasswordChange();
    });
  }

  onPasswordChange() {
    const newPassword = this.resetForm.get('newPassword')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;

    // Check if passwords match
    this.passwordMismatch = newPassword !== confirmPassword;
  }

  onResetPassword() {
    if (this.passwordMismatch) {
        this.message = 'Passwords do not match.';
        this.isSuccess = false;
        return;
    }

    if (this.resetForm.invalid) {
        this.message = 'Please fill in all fields correctly.';
        this.isSuccess = false;
        return;
    }

    this.isLoading = true; // Start loading

    const newPassword = this.resetForm.get('newPassword')?.value;

    this.authService.resetPassword(this.token, newPassword).subscribe(
        (response) => {
            this.message = response.message;
            this.isSuccess = true;
            this.startCountdown(); // Start the countdown timer
        },
        (error) => {
            this.message = error.error.message || 'Failed to reset password.';
            this.isSuccess = false;
        }
    ).add(() => {
        this.isLoading = false; // Stop loading
    });
}

  startCountdown() {
    this.countdown = 3; // Set countdown to 3 seconds
    this.countdownSubscription = interval(1000).subscribe(() => {
      if (this.countdown > 0) {
        this.countdown--; // Decrement the countdown
      } else {
        this.countdownSubscription?.unsubscribe(); // Stop the timer
        this.router.navigate(['/student-login']); // Redirect to login page
      }
    });
  }

  goBack() {
    this.router.navigate(['/student-login']);
  }

  ngOnDestroy() {
    // Clean up the subscription to avoid memory leaks
    this.countdownSubscription?.unsubscribe();
  }
}