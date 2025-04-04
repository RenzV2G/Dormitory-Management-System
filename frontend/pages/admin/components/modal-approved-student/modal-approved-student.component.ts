import { Component, EventEmitter, Input, Output, ChangeDetectorRef  } from '@angular/core';
import * as XLSX from 'xlsx';
import { QueueServiceService } from '../../pages/Student-Management/queue-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-approved-student',
  templateUrl: './modal-approved-student.component.html',
  styleUrl: './modal-approved-student.component.scss'
})
export class ModalApprovedStudentComponent {
  @Input() studentDetails: any; // The student data to display
  @Output() close = new EventEmitter<void>(); // Event to close the modal

  activeTab: string = 'family';

  isEditMode: boolean = false;
  editedDetails: any = {};

  constructor(private approvedStudentService: QueueServiceService, private cd: ChangeDetectorRef) {}

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onClose(): void {
    this.close.emit(); // Notify parent to close the modal
  }

  downloadExcel() {
    // Prepare the student data with clear labels and grouped information
    const studentData = [
      ['Form ID', this.studentDetails._id],
      ['First Name', this.studentDetails.firstName],
      ['Middle Name', this.studentDetails.middleName],
      ['Last Name', this.studentDetails.lastName],
      ['Sex', this.studentDetails.personalInfo?.sex],
      ['Age', this.studentDetails.personalInfo?.age],
      ['Email', this.studentDetails.email],
      ['Student Number', this.studentDetails.studentNo],
      ['Course', this.studentDetails.personalInfo?.course],
      ['Year Level', this.studentDetails.personalInfo?.yearLevel],
      ['Date of Birth', this.studentDetails.personalInfo?.dateOfBirth],
      ['Religion', this.studentDetails.personalInfo?.religion],
      ['Nationality', this.studentDetails.personalInfo?.nationality],
      ['Civil Status', this.studentDetails.personalInfo?.civilStatus],
  
      // Home Address
      ['Home Address', `
        Country: ${this.studentDetails.personalInfo?.homeAddress?.country}
        City: ${this.studentDetails.personalInfo?.homeAddress?.city}
        Zip Code: ${this.studentDetails.personalInfo?.homeAddress?.zipCode}
        Province: ${this.studentDetails.personalInfo?.homeAddress?.province}
        House Number: ${this.studentDetails.personalInfo?.homeAddress?.houseNumber}
      `],
  
      ['Facebook Account', this.studentDetails.personalInfo?.facebookAcct],
      ['Tel. No.', this.studentDetails.personalInfo?.telNo],
  
      // Father Details (grouped with labels)
      ['Father', `
        Name: ${this.studentDetails.familyBackground?.fatherDetails?.name}
        Date of Birth: ${this.studentDetails.familyBackground?.fatherDetails?.dateOfBirth}
        Age: ${this.studentDetails.familyBackground?.fatherDetails?.age}
        Place of Birth: ${this.studentDetails.familyBackground?.fatherDetails?.placeOfBirth}
        Home Address: 
          Country: ${this.studentDetails.familyBackground?.fatherDetails?.homeAddress?.country}
          City: ${this.studentDetails.familyBackground?.fatherDetails?.homeAddress?.city}
          Zip Code: ${this.studentDetails.familyBackground?.fatherDetails?.homeAddress?.zipCode}
          Province: ${this.studentDetails.familyBackground?.fatherDetails?.homeAddress?.province}
          House Number: ${this.studentDetails.familyBackground?.fatherDetails?.homeAddress?.houseNumber}
        Tel. No.: ${this.studentDetails.familyBackground?.fatherDetails?.telNo}
        Religion: ${this.studentDetails.familyBackground?.fatherDetails?.religion}
        Nationality: ${this.studentDetails.familyBackground?.fatherDetails?.nationality}
        Occupation: ${this.studentDetails.familyBackground?.fatherDetails?.occupation}
        Name of Employer: ${this.studentDetails.familyBackground?.fatherDetails?.nameOfEmployer}
      `],
  
      // Mother Details (grouped with labels)
      ['Mother', `
        Name: ${this.studentDetails.familyBackground?.motherDetails?.name}
        Date of Birth: ${this.studentDetails.familyBackground?.motherDetails?.dateOfBirth}
        Age: ${this.studentDetails.familyBackground?.motherDetails?.age}
        Place of Birth: ${this.studentDetails.familyBackground?.motherDetails?.placeOfBirth}
        Home Address: 
          Country: ${this.studentDetails.familyBackground?.motherDetails?.homeAddress?.country}
          City: ${this.studentDetails.familyBackground?.motherDetails?.homeAddress?.city}
          Zip Code: ${this.studentDetails.familyBackground?.motherDetails?.homeAddress?.zipCode}
          Province: ${this.studentDetails.familyBackground?.motherDetails?.homeAddress?.province}
          House Number: ${this.studentDetails.familyBackground?.motherDetails?.homeAddress?.houseNumber}
        Tel. No.: ${this.studentDetails.familyBackground?.motherDetails?.telNo}
        Religion: ${this.studentDetails.familyBackground?.motherDetails?.religion}
        Nationality: ${this.studentDetails.familyBackground?.motherDetails?.nationality}
        Occupation: ${this.studentDetails.familyBackground?.motherDetails?.occupation}
        Name of Employer: ${this.studentDetails.familyBackground?.motherDetails?.nameOfEmployer}
      `],
  
      // Parent Status (grouped with labels)
      ['Parent Status', `
        Marital Status: ${this.studentDetails.familyBackground?.parentStatus?.maritalStatus}
        Parents Marriage: ${this.studentDetails.familyBackground?.parentStatus?.parentsMarriage}
        Guardian Name: ${this.studentDetails.familyBackground?.parentStatus?.guardianDetails?.name}
        Guardian Occupation: ${this.studentDetails.familyBackground?.parentStatus?.guardianDetails?.occupation}
        Guardian Relationship: ${this.studentDetails.familyBackground?.parentStatus?.guardianDetails?.relation}
        Language Spoken: ${this.studentDetails.familyBackground?.parentStatus?.languageSpoken}
        Number of Children: ${this.studentDetails.familyBackground?.parentStatus?.noOfChildren}
        Ordinal Position: ${this.studentDetails.familyBackground?.parentStatus?.ordinalPosition}
        Average Monthly Income: ${this.studentDetails.familyBackground?.parentStatus?.AverageMonthlyIncome}
      `],
  
      // Number of Siblings and Sibling Details (grouped with labels)
      ['Number of Siblings', this.studentDetails.familyBackground?.numberOfSiblings?.length],
      ['Siblings Details', this.studentDetails.familyBackground?.numberOfSiblings?.map((sibling: any) => `
        Name: ${sibling.name}, 
        Classification: ${sibling.classification}, 
        Sex: ${sibling.sex}, 
        Age: ${sibling.age}, 
        Civil Status: ${sibling.civilStatus}, 
        School/Occupation: ${sibling.schoolOccupation}, 
        Grade/Company: ${sibling.gradeCompany}
      `).join("\n")],
  
      // Health Info (grouped with labels)
      ['Health Info', `
        Weight: ${this.studentDetails.healthCondition?.weight}
        Height: ${this.studentDetails.healthCondition?.height}
        Glasses: ${this.studentDetails.healthCondition?.glasses ? 'Yes' : 'No'}
        Illnesses: ${this.studentDetails.healthCondition?.illnesses?.map((illness: any) => illness.name).join(", ")}
        Comments: ${this.studentDetails.healthCondition?.comments}
      `],
  
      // Other Details (grouped with labels)
      ['Hobbies', this.studentDetails.hobbies?.join(", ")],
      ['Talents/Skills', this.studentDetails.talentsSkills?.join(", ")],
      ['Leisure Time', this.studentDetails.leisureTime?.join(", ")],
  
    ];
  
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(studentData); // Convert array of arrays to sheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Details');
  
    // Export to Excel
    XLSX.writeFile(wb, `${this.studentDetails.lastName}_student_details.xlsx`);
  }

  onRemoveStudent(): void {
    const studentId = this.studentDetails._id; // Get the student's ID
  
    // Show SweetAlert2 confirmation with Yes/No buttons
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently remove the student from the approved list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal-popup-warning',
        title: 'swal-title-warning', 
        confirmButton: 'swal-confirm-button-warning', 
        cancelButton: 'swal-cancel-button-warning' 
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading spinner while the deletion is in progress
        Swal.fire({
          title: 'Removing student...',
          text: 'Please wait while we process the removal.',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          customClass: {
            popup: 'swal-popup-info', 
            title: 'swal-title-info',    
          },
          didOpen: () => {
            Swal.showLoading(); 
          }
        });
  
        // Call the service to remove the student
        this.approvedStudentService.removeStudent(studentId).subscribe(
          (response) => {
            Swal.fire({
              title: 'Success!',
              text: 'Student removed successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'swal-popup-success', 
                title: 'swal-title-success', 
                confirmButton: 'swal-confirm-button-success'
              }
            }).then(() => {
              // Reload the page after successful removal
              window.location.reload();  
            });
          },
          (error) => {
            console.error('Error removing student:', error);
            Swal.fire({
              title: 'Error!',
              text: 'There was an error removing the student.',
              icon: 'error',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'swal-popup-error', 
                title: 'swal-title-error', 
                confirmButton: 'swal-confirm-button-error'
              }
            });
          }
        );
      }
    });
  }
  
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.editedDetails = { ...this.studentDetails };
    }
  }

  saveChanges(): void {
    const studentId = this.studentDetails._id;
    this.approvedStudentService.updateStudent(studentId, this.editedDetails).subscribe(
      (response) => {
        console.log('Update response:', response); 
        Swal.fire({
          title: 'Success!',
          text: 'Student details updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'swal-popup-success',
            title: 'swal-title-success', 
            confirmButton: 'swal-confirm-button-success'
          }
        }).then(() => {
          this.studentDetails = { ...this.editedDetails }; 
          this.toggleEditMode(); 
        });
      },
      (error) => {
        console.error('Error updating student:', error);
        Swal.fire({
          title: 'Error!',
          text: 'There was an error updating the student.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'swal-popup-error', 
            title: 'swal-title-error', 
            confirmButton: 'swal-confirm-button-error' 
          }
        });
      }
    );
  }
  


  cancelEdit(): void {
    this.isEditMode = false;
    this.editedDetails = {}; 
  }
  

}
