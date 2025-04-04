import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/admin/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  admin: any;

  constructor(private router: Router, private authService: AuthService){
    const adminData = localStorage.getItem('admin');
    this.admin = adminData ? JSON.parse(adminData) : null;

    if(!this.admin || this.admin.role !== "Admin" && this.admin.role !== "Custodian"){
      this.router.navigate(['/admin-login']);
    }

  }

}
