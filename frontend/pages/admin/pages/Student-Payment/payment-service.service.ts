import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentServiceService {
  private environmentUrl = environment.environmentUrl;

  private apiUrl = `${this.environmentUrl}/admin/payments`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  }

  getAllStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-all-students`, this.getAuthHeaders());
  }

  addPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-payment`, paymentData, this.getAuthHeaders());
  }

  getPayments(studentNo: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${this.apiUrl}/${studentNo}`, { headers: this.getAuthHeaders().headers, params });
  }





  
  




}
