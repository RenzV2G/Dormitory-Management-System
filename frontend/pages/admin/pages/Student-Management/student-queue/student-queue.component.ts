import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { QueueServiceService } from '../queue-service.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-student-queue',
  templateUrl: './student-queue.component.html',
  styleUrl: './student-queue.component.scss'
})
export class StudentQueueComponent implements OnInit{
  maleApplicants: any[] = [];
  femaleApplicants: any[] = [];
  renewalMaleApplicants: any[] = [];
  renewalFemaleApplicants: any[] = [];
  selectedGender: string = 'MaleQueue';
  selectedStudent: any = null;
  selectedStudentRenewal: any = null;


  pendingCount: number = 0;
  approvedCount: number = 0;
  renewalCount: number = 0;

  lockedGenders: string[] = [];

  deadline: string = '';
  message: string = '';

  currentPage: number = 1;
  renewalCurrentPage: number = 1;
  totalPages: number = 1;
  renewalTotalPages: number = 1;

  constructor(private queueService: QueueServiceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadQueue('MaleQueue', this.currentPage);
    this.loadQueue('FemaleQueue', this.currentPage);
    this.loadRenewalQueue('MaleQueue', this.renewalCurrentPage);
    this.loadRenewalQueue('FemaleQueue', this.renewalCurrentPage);
    this.loadApprovedStudents();
    this.loadRenewalStudents();
    this.loadTotalPendingQueue();

    this.queueService.getFormSubmissionLockStatus().subscribe(
      (response) => {
        this.lockedGenders = response.lockedGenders || [];
      },
      (error) => {
        console.error('Error fetching lock status', error);
      }
    );
  }

  toggleFormSubmissionLock(gender: string) {
    const action = this.lockedGenders.includes(gender) ? 'unlock' : 'lock';
    
    this.queueService.toggleSubmissionLock(gender, action).subscribe(
      (response) => {
        this.lockedGenders = response.lockedGenders;
      },
      (error) => {
        console.error('Error toggling form submission lock', error);
      }
    );
  }

  switchQueue(gender: string): void {
    this.selectedGender = gender;
    this.loadQueue(gender, this.currentPage);
    this.loadRenewalQueue(gender, this.renewalCurrentPage);
  }

  loadApprovedStudents(): void {
    this.queueService.getApprovedStudents().subscribe(
      (response) => {
        this.approvedCount = response.students.length; 
        this.cdr.detectChanges(); 
      },
      (error) => {
        console.error('Error loading approved students:', error);
      }
    );
  }

  loadRenewalStudents(): void {
    this.queueService.getRenewalStudents().subscribe(
      (response) => {
        this.renewalCount = response.students.length; 
        this.cdr.detectChanges(); 
      },
      (error) => {
        console.error('Error loading approved students:', error);
      }
    );
  }


  loadQueue(queueType: string, page: number): void {
    this.queueService.getStudentQueue(queueType, page).subscribe(
      (response) => {
        if (queueType === 'MaleQueue') {
          this.maleApplicants = response.students;
          this.totalPages = response.totalPages;
        } else if (queueType === 'FemaleQueue') {
          this.femaleApplicants = response.students;
          this.totalPages = response.totalPages;
        }
      }
    );
  }

  loadRenewalQueue(queueType: string, page: number): void {
    this.queueService.getRenewalQueue(queueType, page).subscribe(
      (response) => {
        if (queueType === 'MaleQueue') {
          this.renewalMaleApplicants = response.students;
          this.renewalTotalPages = response.totalPages;
        } else if (queueType === 'FemaleQueue') {
          this.renewalFemaleApplicants = response.students;
          this.renewalTotalPages = response.totalPages;
        }
      },
      (error) => {
        console.error('Error loading renewal queue:', error);
      }
    );
  }

  loadTotalPendingQueue(): void {
    this.queueService.getAllPending().subscribe(
      (response) => {
        this.pendingCount = response.totalPending;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching pending queue count:', error);
      }
    )
  }

  openModal(student: any): void {
    this.queueService.getStudentById(student._id).subscribe(
      (response) => {
        console.log('Fetched Student Details:', response);
        this.selectedStudent = response;
      },
      (error) => {
        console.error('Error fetching student details:', error);
      }
    );
  }

  openModalRenewal(student: any): void {
    this.queueService.getRenewalStudentByID(student._id).subscribe(
      (response) => {
        console.log('Fetched Student Details:', response);
        this.selectedStudentRenewal = response;
      },
      (error) => {
        console.error('Error fetching student details:', error);
      }
    )
  }
  
  
  closeModal(): void {
    this.selectedStudent = null;
    this.selectedStudentRenewal = null;
    this.reloadQueues();
  }
  
  reloadQueues(): void {
    this.loadQueue('MaleQueue', this.currentPage);
    this.loadQueue('FemaleQueue', this.currentPage);
    this.loadRenewalQueue('MaleQueue', this.renewalCurrentPage);
    this.loadRenewalQueue('FemaleQueue', this.renewalCurrentPage);
  }

  onSetDeadline(event: Event): void {
    event.preventDefault();
  
    if (!this.deadline) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Deadline',
        text: 'Please select a valid deadline.',
      });
      return;
    }
  
    Swal.fire({
      title: 'Setting Renewal Deadline...',
      text: 'Please wait while we update the deadline.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    this.queueService.setRenewalDeadline(this.deadline).subscribe(
      (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Deadline Set!',
          text: response.message,
        }).then(() => {
          location.reload(); 
        });
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: 'Failed to set the deadline. Please try again.',
        });
        console.error(error);
      }
    );
  }

  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadQueue(this.selectedGender, this.currentPage);
    }
  }

  goToRenewalPage(page: number): void {
    if (page > 0 && page <= this.renewalTotalPages) {
      this.renewalCurrentPage = page;
      this.loadRenewalQueue(this.selectedGender, this.renewalCurrentPage);
    }
  }
}
