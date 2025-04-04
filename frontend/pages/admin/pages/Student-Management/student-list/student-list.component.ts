import { Component, OnInit } from '@angular/core';
import { QueueServiceService } from '../queue-service.service';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})
export class StudentListComponent {
  approvedStudents: any[] = [];
  filteredStudents: any[] = [];
  searchQuery: string = '';
  activeGenderFilter: string | null = null;

  selectedStudent: any = null;
  showModal: boolean = false;

  constructor(private queueService: QueueServiceService){}



  ngOnInit(): void {
    this.loadApprovedStudents();
  }

  loadApprovedStudents(gender: string | null = null): void {
    this.queueService.getAllStudents(gender).subscribe(
      (response) => {
        this.approvedStudents = response.students;
        this.filteredStudents = [...this.approvedStudents]; // Initialize with all students
      },
      (error) => {
        console.error('Error fetching approved students:', error);
      }
    );
  }

  toggleGenderFilter(gender: string): void {
    if (this.activeGenderFilter === gender) {
      this.clearGenderFilter();
    } else {
      this.activeGenderFilter = gender;
      this.loadApprovedStudents(gender); 
    }
  }

  clearGenderFilter(): void {
    this.activeGenderFilter = null;
    this.loadApprovedStudents(); 
  }

  filterStudents(): void {
    if (!this.searchQuery.trim()) {
      this.filteredStudents = [...this.approvedStudents]; // If search is empty, show all students
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredStudents = this.approvedStudents.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.roomAssigned?.building.toLowerCase().includes(query) ||
        student.roomAssigned?.roomNumber.toLowerCase().includes(query) ||
        student.studentNo.toLowerCase().includes(query) // Add more fields if needed
      );
    }
  }

  openModal(studentId: string): void {
    this.queueService.viewStudentById(studentId).subscribe(
      (data) => {
        this.selectedStudent = data;
        this.showModal = true;
      },
      (error) => {
        console.error('Error fetching student details:', error);
      }
    );
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStudent = null;
  }


}
