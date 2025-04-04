import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/admin/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  adminRole: string = '';

  activeMenu: string | null = null;

  constructor(private router: Router, private authService: AuthService){}

  ngOnInit() {
    const token = localStorage.getItem('token'); 

    if (token) {
      this.authService.getAdminDetails(token).subscribe(
        adminDetails => {
          this.adminRole = adminDetails.role;  
        },
        error => {
          console.error('Error fetching admin profile', error);
        }
      );
    }
  }

  toggleMenu(menu: string) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  isMenuExpanded(menu: string): boolean {
    return this.activeMenu === menu;
  }

  closeAllMenus() {
    this.activeMenu = null;
  }


}
