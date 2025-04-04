import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  token!: string;
  isVerifying: boolean = true;

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
        Swal.fire('Error', 'Invalid verification link.', 'error');
        this.router.navigate(['/student-login']);
        return;
    }

    this.authService.verifyEmail(this.token).subscribe(
        (response) => {
            Swal.fire('Success', 'Email verified successfully! You can now log in.', 'success');
            this.router.navigate(['/student-login']);
        },
        (error) => {
            if (error.error.message === "Verification token has expired. Please request a new one.") {
                Swal.fire('Error', 'The verification link has expired. Please request a new one.', 'error');
            } else {
                Swal.fire('Error', error.error.message || 'Email verification failed.', 'error');
            }
            this.router.navigate(['/student-login']);
        }
    );
}

}
