import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../admin-service.service';

@Component({
  selector: 'app-view-users',
  templateUrl: './view-users.component.html',
  styleUrl: './view-users.component.scss'
})
export class ViewUsersComponent implements OnInit {
  admins: any[] = []; 

  constructor(private adminService: AdminServiceService, private router: Router) {}

  ngOnInit(): void {
    this.loadAdmins(); 
  }

  loadAdmins(): void {
    this.adminService.getAllAdmins().subscribe({
      next: (data) => {
        this.admins = data.map((admin) => ({
          ...admin,
          isEditing: false, 
        }));
      },
      error: (err) => console.error('Failed to fetch admins:', err),
    });
  }

  onAddUser(): void {
    this.router.navigate(['/dashboard/add-new-user']);
  }

  onEditClick(admin: any): void {
    admin.isEditing = true; 
  }

  // Save the edited admin details
  onSaveAdmin(admin: any): void {
    this.adminService.updateAdmin(admin._id, admin).subscribe({
      next: (updatedAdmin) => {
        admin.isEditing = false; 
        Object.assign(admin, updatedAdmin); 
      },
      error: (err) => console.error('Failed to save admin:', err),
    });
  }

  // Delete an admin
  onDeleteAdmin(adminId: string): void {
    if (confirm('Are you sure you want to delete this admin?')) {
      this.adminService.deleteAdmin(adminId).subscribe({
        next: () => {
          console.log('Admin deleted successfully');
          this.loadAdmins(); 
        },
        error: (err) => console.error('Failed to delete admin:', err),
      });
    }
  }

}
