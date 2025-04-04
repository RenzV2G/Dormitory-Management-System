import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { first, Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class StudentServiceService {
  private environmentUrl = environment.environmentUrl;

  private apiUrl = `${this.environmentUrl}/user`;
  private statusUrl = `${this.environmentUrl}/form-submission-status`;
  private countUrl = `${this.environmentUrl}/available-slots`;
  private contactUrl = `${this.environmentUrl}/contact`;


  constructor(private http: HttpClient){}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Submit forms
  submitForm(formData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}/submit`, formData, { headers });
  }

  // Get the user information (name, email, student_no)
  getUserDetails(): Observable<{ firstName: string; middleName: string; lastName: string; name: string; email: string; Student_no: string; sex: string }> {
    const headers = this.getHeaders();
    return this.http.get<{ firstName: string; middleName: string; lastName: string; name: string; email: string; Student_no: string; sex: string; }>(`${this.apiUrl}/profile`, { headers });
  }

  checkCooldown(studentNo: string): Observable<{ cooldown: boolean, hoursRemaining?: number }> {
    const headers = this.getHeaders();
    return this.http.get<{ cooldown: boolean, hoursRemaining?: number }>(
      `${this.apiUrl}/check-cooldown/${studentNo}`, { headers } )
  }

  // Check if the student submitted
  checkSubmission(studentNo: string): Observable<{ submitted: boolean }> {
    const headers = this.getHeaders();
    return this.http.get<{ submitted: boolean }>(`${this.apiUrl}/check-submission/${studentNo}`, { headers });
  }

  //Check if approved already
  checkApprovalStatus(studentNo: string): Observable<{ isApproved: boolean }> {
    const headers = this.getHeaders();
    return this.http.get<{ isApproved: boolean }>(`${this.apiUrl}/check-approval/${studentNo}`, { headers });
  }

  // Check if renewal is Pending already
  checkRenewalStatus(studentNo: string): Observable<any>{
    const headers = this.getHeaders();
    return this.http.get<{ onGoingRenewal: boolean }>(`${this.apiUrl}/check-renewal/${studentNo}`, { headers })
  }

  // CancelForm
  cancelForm(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/cancel-form`, { headers });
  }

  //Check form submission lock status
  getFormSubmissionLockStatus(): Observable<any> {
    return this.http.get<any>(`${this.statusUrl}`);
  }

  // Get available slots
  getAvailableSlots(): Observable<any> {
    return this.http.get<any>(`${this.countUrl}`);
  }

  // Renew Application
  checkRenewalSession(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<{ renewalStarted: boolean }>(`${this.apiUrl}/renewal-status`, { headers });
  }

  checkIfStudentIsInRenewal(): Observable<any>{
    const headers = this.getHeaders();
    return this.http.get<{ isInRenewal: boolean }>(`${this.apiUrl}/check-ifrenewal`, { headers });
  }

  renewApplication(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}/renewal/renew-student`, {}, { headers });
  }

  cancelRenewal(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/cancel-renewal`, { headers });
  }

  contactCustodian(formData: any): Observable<any> {
    return this.http.post<any>(`${this.contactUrl}`, formData);
  }

  getStudentInfo(studentNo: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<{status: string, data: any}>(`${this.apiUrl}/student-info/${studentNo}`, { headers });
  }

  updateStudentInfo(updatedDetails: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/update-info`, updatedDetails, { headers });
  }

  updateStudentProfile(formData: FormData): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/update-info`, formData, { headers });
  }


}
