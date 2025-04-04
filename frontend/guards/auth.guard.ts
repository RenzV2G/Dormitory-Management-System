import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/admin/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  if (token && admin?.role && (admin.role === 'Admin' || admin.role === 'Custodian')){
    return true;
  } else {
    alert('Unauthorized access. please log in.');
    router.navigate(['/admin-login'], {queryParams: {returnUrl: state.url} });
    return false;
  }

};
