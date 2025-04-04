import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {
  private environmentUrl = environment.environmentUrl;
  
  private apiUrl = `${this.environmentUrl}/admin`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  }

  registerAdmin(adminData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, adminData);
  }

  getAllAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAdmins`, this.getAuthHeaders());
  }

  getAdminById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getAdmin/${id}`, this.getAuthHeaders());
  }

  deleteAdmin(adminId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${adminId}`, this.getAuthHeaders());
  }

  updateAdmin(id: string, adminData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/edit/${id}`, adminData, this.getAuthHeaders());
  }


}
