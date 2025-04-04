import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsServiceService {
  private environmentUrl = environment.environmentUrl;

  private apiUrl = `${this.environmentUrl}/admin/analytics`;
  private logsUrl = `${this.environmentUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(){
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  }

  getMonthlyYearlySubmission(): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/submissionsMnY`, this.getAuthHeaders());
  }

  getApprovalRejectionRate(year: number, month: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/rejecnapproveRate?year=${year}&month=${month}`,
      this.getAuthHeaders()
    );
  }

  getGenderBasedAnalytics(year: number, month: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/gender-based-analytics?year=${year}&month=${month}`,
      this.getAuthHeaders()
    );
  }

  getYearLevelCounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/year-level-count`, this.getAuthHeaders());
  }

  getPaymentMethodAnalytics(): Observable<any> {
    return this.http.get<{ paymentMethod: string; count: number}[]>(`${this.apiUrl}/payment-method-analytics`, this.getAuthHeaders());
  }

  getProvinceAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/province-analytics`, this.getAuthHeaders());
  }

  getAdminLogs(): Observable<any> {
    return this.http.get<any>(`${this.logsUrl}/activity-logs`, this.getAuthHeaders());
  }

  getAvailableMonthsAndYears(): Observable<{ year: number; month: number }[]> {
    return this.http.get<{ year: number; month: number }[]>(`${this.apiUrl}/available-months-years`, this.getAuthHeaders());
  }


}