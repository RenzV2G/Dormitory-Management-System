import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { detectIncognito } from 'detect-incognito';

@Component({
  selector: 'admin-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginAdminComponent implements OnInit {
  email: string = '';
  password: string = '';
  pin: string = '';
  errorMessage: string = '';
  isIncognito: boolean = false;
  showPinInput: boolean = false; 
  adminId: string = '';

  constructor(private authService: AuthService, private router: Router){}

  ngOnInit(): void {
    this.detectIncognitoMode();
  }

  detectIncognitoMode(): void {
    detectIncognito().then((result) => {
      this.isIncognito = result.isPrivate;
      if (this.isIncognito) {
        this.errorMessage = 'Please do not use incognito mode for admin login.';
        alert(this.errorMessage);
      }
    });
  }

  login(): void {
    if (this.isIncognito) {
        this.errorMessage = 'Access denied. Please do not use incognito mode for admin login.';
        alert(this.errorMessage);
        return;
    }

    if (!this.showPinInput) {
        // Step 1: Validate email and password
        const credentials = { email: this.email, password: this.password };

        this.authService.loginAdmin(credentials).subscribe(
            (response) => {
                if (response && response.adminId) {
                    this.adminId = response.adminId;
                    this.showPinInput = true;
                }
            },
            (error) => {
                if (error.status === 429) {
                    // Handle rate limit error
                    this.errorMessage = error.error?.error || 'Too many login attempts. Please try again later.';
                } else {
                    // Handle other errors
                    this.errorMessage = error.error?.error || 'Login Failed';
                }
                alert(this.errorMessage);
            }
        );
    } else {
        // Step 2: Validate PIN
        this.authService.validatePin(this.adminId, this.pin).subscribe(
            (response) => {
                if (response && response.token) {
                    localStorage.setItem('token', response.token);

                    this.authService.getAdminDetails(response.token).subscribe(
                        (adminDetails) => {
                            localStorage.setItem('admin', JSON.stringify(adminDetails));

                            // Check Role
                            if (adminDetails.role === "Admin" || adminDetails.role === "Custodian") {
                                alert('Logged in successfully');
                                this.router.navigate(['/dashboard']);
                            } else {
                                alert('Unauthorized access. You do not have the required role.');
                                this.authService.logout();
                                this.router.navigate(['/admin-login']);
                            }
                        },
                        (error) => {
                            console.error('Error fetching admin details:', error);
                            this.errorMessage = 'Unable to fetch admin details';
                        }
                    );
                }
            },
            (error) => {
                if (error.status === 429) {
                    // Handle rate limit error
                    this.errorMessage = error.error?.error || 'Too many PIN validation attempts. Please try again later.';
                } else {
                    // Handle other errors
                    this.errorMessage = error.error?.error || 'Invalid PIN';
                }
                alert(this.errorMessage);

                // Handle "Too many failed attempts" error
                if (this.errorMessage.includes("Too many failed attempts")) {
                    this.showPinInput = false; // Hide PIN input
                    this.adminId = ''; // Reset admin ID
                }
            }
        );
    }
}

  goBack() {
    this.router.navigate(['/home']); 
  }
}
