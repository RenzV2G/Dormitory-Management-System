import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomsServiceService {
  private environmentUrl = environment.environmentUrl;

  private apiUrl = `${this.environmentUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  }

  getUnassignedStudents(): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/unassigned-students`, this.getAuthHeaders());
  }

  getAvailableRooms(sex: string): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/available-rooms?sex=${sex}`, this.getAuthHeaders());
  }

  assignRoom(studentNo: string, roomNumber: string, bedLetter: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-room`, {
      studentNo,
      roomNumber,
      bedLetter,
    }, this.getAuthHeaders());
  }

  getStudentsWithRooms(page: number, limit: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/students-assigned-rooms?page=${page}&limit=${limit}`, this.getAuthHeaders());
  }

  removeRoomAssignment(_id: string): Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/remove-student-room/${_id}`, this.getAuthHeaders());
  }

  getOccupiedRooms(sex: string, building: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/occupied-rooms?sex=${sex}&building=${building}`, this.getAuthHeaders());
  }


}
