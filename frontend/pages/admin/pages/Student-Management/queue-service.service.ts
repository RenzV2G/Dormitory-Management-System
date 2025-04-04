import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class QueueServiceService {
  private environmentUrl = environment.environmentUrl;

  private apiUrl = `${this.environmentUrl}/admin`;
  private statusUrl = `${this.environmentUrl}/form-submission-status`


  constructor(private http: HttpClient) { }

  private getAuthHeaders(){
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  }

  getStudentQueue(queueType: string, page: number): Observable<any> {
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const params = new HttpParams()
      .set('queueType', queueType)
      .set('page', page.toString());

    return this.http.get(`${this.apiUrl}/view-queue`, { headers, params });
  }

  getAllPending(): Observable<{totalPending: number}>{
    return this.http.get<{ totalPending: number}>(`${this.apiUrl}/get-queue`, this.getAuthHeaders())
  }

  getStudentById(_id: string): Observable<any>{
    return this.http.get(`${this.apiUrl}/view-student/${_id}`, this.getAuthHeaders());
  }

  updateChecklist(_id: string, item: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${_id}/checklist`, { item }, this.getAuthHeaders());
  }

  scheduleInterview(_id: string, scheduledDateTime: string, deadlineDateTime: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${_id}/schedule`, { scheduledDateTime, deadlineDateTime }, this.getAuthHeaders());
  }

  rejectStudentForm(_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reject/${_id}`, this.getAuthHeaders())
  }

  approveStudent(studentNo: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/approve/${studentNo}`, {}, this.getAuthHeaders())
  }

  checkIfAlreadyApproved(studentNo: string): Observable<any> {
    return this.http.get<boolean>(`${this.apiUrl}/check-approved/${studentNo}`, this.getAuthHeaders());
  }

  getApprovedStudents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/approved-students`, this.getAuthHeaders());
  }

  getAllStudents(gender: string | null = null): Observable<any> {
    const params = new HttpParams().set('gender', gender || '');
    return this.http.get<any>(`${this.apiUrl}/get-all-students`, { ...this.getAuthHeaders(), params })
  }

  getAvailableRoomCounts(): Observable<{ totalAvailableRooms: number}>{
    return this.http.get<{ totalAvailableRooms: number }>(`${this.apiUrl}/all-available-rooms`, this.getAuthHeaders());
  }

  viewStudentById(_id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/view-approved-student/${_id}`, this.getAuthHeaders());
  }

  toggleSubmissionLock(gender: string, action: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/toggle-forms-lock`, { gender, action }, this.getAuthHeaders());
  }

  getFormSubmissionLockStatus(): Observable<any> {
    return this.http.get<any>(`${this.statusUrl}`);
  }

  removeStudent(_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove-approved-student/${_id}`, this.getAuthHeaders());
  }

  updateStudent(_id: string, updatedDetails: any) {
    return this.http.put(`${this.apiUrl}/update-approved-student/${_id}`, updatedDetails, this.getAuthHeaders());
  }

  admissionForm(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admission-submit`, formData, this.getAuthHeaders());
  }

  // FOR RENEWAL ======
  setRenewalDeadline(deadline: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/renewal/set-deadline`, { deadline }, this.getAuthHeaders());
  }

  getRenewalQueue(queueType: string, page: number): Observable<any> {
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const params = new HttpParams()
      .set('queueType', queueType)
      .set('page', page.toString());

    return this.http.get(`${this.apiUrl}/view-renewal`, { headers, params });
  }

  getRenewalStudentByID(_id: string): Observable<any>{
    return this.http.get(`${this.apiUrl}/view-renewal/${_id}`, this.getAuthHeaders());
  }

  getRenewalStudents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/renewal-students`, this.getAuthHeaders());
  }

  updateRenewalChecklist(_id: string, item: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/checklist-renewal/${_id}`, { item }, this.getAuthHeaders());
  }

  scheduleRenewalInterview(_id: string, scheduledDateTime: string, deadlineDateTime: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/schedule-renewal/${_id}`, { scheduledDateTime, deadlineDateTime }, this.getAuthHeaders());
  }

  approveRenewalStudent(studentNo: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/approve-renewal/${studentNo}`, {}, this.getAuthHeaders())
  }

  rejectRenewalStudent(_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reject-renewal/${_id}`, this.getAuthHeaders())
  }

  





}
