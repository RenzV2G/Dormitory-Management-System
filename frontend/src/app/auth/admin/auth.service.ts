import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private environmentUrl = environment.environmentUrl;

  private adminLoginUrl = `${this.environmentUrl}/admin/login`;
  private adminLogoutUrl = `${this.environmentUrl}/admin/logout`;
  private adminDetailsUrl = `${this.environmentUrl}/admin/profile`;
  private adminValidateUrl = `${this.environmentUrl}/admin/validate-pin`;



  constructor(private http: HttpClient) {}

  // Login as an Admin
  loginAdmin(credentials: { email: string; password: string}): Observable<any> {
    return this.http.post(this.adminLoginUrl, credentials);
  }

  // AuthService
  validatePin(adminId: string, pin: string): Observable<any> {
    return this.http.post(this.adminValidateUrl, { adminId, pin }).pipe(
        catchError((error) => {
            // Handle HTTP errors
            if (error.status === 429) {
                throw { status: 429, error: { error: 'Too many PIN validation attempts. Please try again later.' } };
            } else {
                throw error;
            }
        })
    );
}

  // Logout as an Admin
  logoutAdmin(token: string): Observable<any>{
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(this.adminLogoutUrl, {}, { headers });
  }

  // CENTRALIZED METHOD: Be able to use it from dashboard for reusability and avoid duplication
  logout(): void {
    const token = localStorage.getItem('token'); 
    if (token) {
      this.logoutAdmin(token).subscribe({
        next: (response) => {
          console.log('Logout successful:', response.message); 
          localStorage.removeItem('token'); 
          localStorage.removeItem('admin'); 
        },
        error: (error) => {
          console.error(error.message); 
          alert('Error logging out. Please try again.');
        }
      });
    } else {
      console.warn('No token found. Please log in first.');
    }
  }


  // ACCESS the Admin information
  getAdminDetails(token: string): Observable<{ role: string, name: string; PK: string }> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ role: string, name: string; PK: string }>(this.adminDetailsUrl, { headers });
  }
  
}
