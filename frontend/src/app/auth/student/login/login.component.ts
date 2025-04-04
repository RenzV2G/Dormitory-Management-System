import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';
import { detectIncognito } from 'detect-incognito';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginStudentComponent implements OnInit {

  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isIncognito: boolean = false;


  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.detectIncognitoMode();
  }
  
  login() {
    if (this.isIncognito) {
      this.errorMessage = 'Access denied. Please do not use incognito mode for admin login.';
      alert(this.errorMessage);
      return;
    }
    
    const credentials = { email: this.email, password: this.password };

    this.authService.loginStudent(credentials).subscribe(
      (response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);

          localStorage.setItem('isFirstLogin', 'true');

          this.authService.getStudentDetails(response.token).subscribe(
            (studentDetails) => {
              localStorage.setItem('user', JSON.stringify(studentDetails));
              this.router.navigate(['/student-forms']);
            },
            (error) => {
              console.error('Error fetching student details:', error);
              this.errorMessage = 'Unable to fetch student details';
            }
          );
        }
      },
      (error) => {
        console.error("Login Error:", error);
        if (error.error?.message === "Your email is not verified. Please check your email.") {
          // Show SweetAlert2 modal for unverified account
          this.showResendVerificationModal();
        } else {
          this.errorMessage = error.error?.error || "Login Failed";
        }
      }
    );
  }

  showResendVerificationModal() {
    Swal.fire({
      icon: 'warning',
      title: 'Email Not Verified',
      text: 'Your email is not verified. Would you like to resend the verification email?',
      showCancelButton: true,
      confirmButtonText: 'Resend',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.resendVerificationEmail();
      }
    });
  }

  resendVerificationEmail() {
    // Show loading modal
    Swal.fire({
      title: 'Sending Verification Email...',
      text: 'Please wait while we resend the verification email.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(); // Show loading spinner
      }
    });

    this.authService.resendVerificationEmail(this.email).subscribe(
      (response) => {
        // Close loading modal and show success message
        Swal.close();
        Swal.fire('Success', 'Verification email resent. Please check your inbox.', 'success');
      },
      (error) => {
        // Close loading modal and show error message
        Swal.close();
        Swal.fire('Error', error.error?.message || 'Failed to resend verification email.', 'error');
      }
    );
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


  goBack() {
    this.router.navigate(['/home']);
  }
}