import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/admin/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  admin: any;
  isCollapsed = true;

  constructor(private router: Router, private authService: AuthService){
    const adminData = localStorage.getItem('admin');
    this.admin = adminData ? JSON.parse(adminData) : null;

    if(!this.admin || this.admin.role !== "Admin" && this.admin.role !== "Custodian"){
      alert('Unauthorized access. Redirecting ro login page.');
      this.router.navigate(['/admin-login']);
    }

  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin-login'])
  }
  
}
