import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private environmentUrl = environment.environmentUrl;
  
  private apiUrl = `${this.environmentUrl}/user`;
  private emailVerificationUrl = `${this.environmentUrl}`;

  constructor(private http: HttpClient) {}

  // Register student
  registerStudent(studentData: {
    Student_no: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    sex: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, studentData);
  }

  // Verify Email
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.emailVerificationUrl}/verify-email?token=${token}`);
  }

  // Resend verification email
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  // Login as a student
  loginStudent(credentials: { email: string; password: string}): Observable<any>{
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }
  
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  // Logout as a student
  logoutStudent(token: string): Observable<any>{
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers });
  }

  logout(): void {
    const token = localStorage.getItem('token'); 
    if (token) {
      this.logoutStudent(token).subscribe({
        next: (response) => {
          console.log('Logout successful:', response.message); 
          localStorage.removeItem('token'); 
          localStorage.removeItem('user'); 
          localStorage.removeItem('isFirstLogin');
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


  // ACCESS the Student user informations
  getStudentDetails(token: string): Observable<{ firstName: string, middleName: string, lastName: string, name: string; PK: string, email: string, Student_no: string, sex: string }> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ firstName: string, middleName: string, lastName: string, name: string; PK: string; email: string; Student_no: string, sex: string }>(`${this.apiUrl}/profile`, { headers });
  }

  


}
