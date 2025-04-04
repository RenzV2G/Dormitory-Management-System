import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false; // Loading state
  cooldown: number = 0; // Cooldown counter
  private cooldownSubscription: Subscription | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onForgotPassword() {
    if (this.cooldown > 0) {
      this.message = `Please wait ${this.cooldown} seconds before requesting another reset link.`;
      return;
    }

    this.isLoading = true; // Start loading
    this.message = ''; // Clear previous messages

    this.authService.forgotPassword(this.email).subscribe(
      (response) => {
        this.message = response.message;
        this.isSuccess = true;
        this.startCooldown(); // Start the cooldown timer
      },
      (error) => {
        this.message = error.error.message || 'Failed to send reset link.';
        this.isSuccess = false;
      }
    ).add(() => {
      this.isLoading = false; // Stop loading
    });
  }

  startCooldown() {
    this.cooldown = 60; // Set cooldown to 60 seconds
    this.cooldownSubscription = interval(1000).subscribe(() => {
      if (this.cooldown > 0) {
        this.cooldown--; // Decrement the cooldown counter
      } else {
        this.cooldownSubscription?.unsubscribe(); // Stop the timer
      }
    });
  }

  goBack() {
    this.router.navigate(['/student-login']);
  }

  ngOnDestroy() {
    // Clean up the subscription to avoid memory leaks
    this.cooldownSubscription?.unsubscribe();
  }
}
