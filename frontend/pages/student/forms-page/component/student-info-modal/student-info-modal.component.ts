import { ChangeDetectorRef, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { StudentServiceService } from '../../../student-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-info-modal',
  templateUrl: './student-info-modal.component.html',
  styleUrl: './student-info-modal.component.scss'
})
export class StudentInfoModalComponent implements OnInit{
  @Input() studentInfo: any; 
  @Input() isRenewalSubmitted: boolean = false;
  @Output() close = new EventEmitter<void>();

  studentNo: string = '';

  activeTab: string = 'family';

  isEditMode: boolean = false;
  editedDetails: any = {};


  isRenewalStarted: boolean = false;
  isUnderRenewal: boolean = false;

  isSaving: boolean = false;
  

  constructor(private studentService: StudentServiceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.checkIfStudentIsInRenewal();
    this.checkRenewalSession();
  }

  checkIfStudentIsInRenewal() {
    if (!this.studentInfo) return;
  
    this.studentService.checkIfStudentIsInRenewal().subscribe(
      (response: any) => {
        this.isUnderRenewal = response.isInRenewal;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error checking student renewal status:', error);
      }
    );
  }

  checkRenewalSession() {
    this.studentService.checkRenewalSession().subscribe(
      (response: any) => {
        this.isRenewalStarted = response.renewalStarted;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching renewal session status:', error);
      }
    );
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 6 * 1024 * 1024; 

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          title: 'Invalid File Type',
          text: 'Please upload a JPG, JPEG, or PNG file.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        event.target.value = ''; 
        return;
      }

      if (file.size > maxSize) {
        Swal.fire({
          title: 'File Too Large',
          text: 'File must not exceed 6MB.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        event.target.value = ''; 
        return;
      }

      if (!this.editedDetails.personalInfo) {
        this.editedDetails.personalInfo = {};
      }
      this.editedDetails.personalInfo.profilePicture = file;
    }
  }
  

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.editedDetails = { ...this.studentInfo };
    }
  }
  
  saveChanges(): void {
    if (!this.isEditMode) return;

    this.isSaving = true;
  
    const formData = new FormData();
    if (this.editedDetails.personalInfo?.profilePicture) {
      formData.append('profilePicture', this.editedDetails.personalInfo.profilePicture);
    }
  
    formData.append('data', JSON.stringify({ personalInfo: this.editedDetails.personalInfo, ...this.editedDetails }));
  
    this.studentService.updateStudentInfo(formData).subscribe(
      (response) => {
        Swal.fire({
          title: 'Success!',
          text: 'Student details updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.studentInfo = { ...this.editedDetails };
          this.toggleEditMode();
        });
      },
      (error) => {
        console.error('Error updating student:', error);
        Swal.fire({
          title: 'Error!',
          text: 'There was an error updating the student.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    ).add(() => {
      this.isSaving = false; 
    });
  }
  
  cancelEdit(): void {
    this.isEditMode = false;
    this.editedDetails = {};
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onClose(): void {
    this.close.emit(); 
  }

}
