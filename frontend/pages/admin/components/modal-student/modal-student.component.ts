import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { QueueServiceService } from '../../pages/Student-Management/queue-service.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment-timezone'; 
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-modal-student',
  templateUrl: './modal-student.component.html',
  styleUrl: './modal-student.component.scss'
})
export class ModalStudentComponent implements OnChanges{
  @Input() student: any;
  @Output() close = new EventEmitter<void>();

  scheduledDate: string = '';
  scheduledTime: string = '';
  deadlineDate: string = '';
  deadlineTime: string = '';
  checklistItems: any[] = [];

  isLoading = false;

  constructor(private toastr: ToastrService, private queueService: QueueServiceService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student) {
      // Handle Screening Schedule
      if (this.student.screeningSchedule) {
        const scheduledDateTime = moment.utc(this.student.screeningSchedule).tz('Asia/Manila');
        this.scheduledDate = scheduledDateTime.format('YYYY-MM-DD');
        this.scheduledTime = scheduledDateTime.format('HH:mm');
      } else {
        this.scheduledDate = '';
        this.scheduledTime = '';
      }

      // Handle Deadline
      if (this.student.deadline) {
        const deadlineDateTime = moment.utc(this.student.deadline).tz('Asia/Manila');
        this.deadlineDate = deadlineDateTime.format('YYYY-MM-DD');
        this.deadlineTime = deadlineDateTime.format('HH:mm');
      } else {
        this.deadlineDate = '';
        this.deadlineTime = '';
      }

      // Handle Checklist
      this.checklistItems = this.student.checklist?.length
        ? this.student.checklist
        : [
          { item: 'Medical Certificate', completed: false },
          { item: 'Chest x-ray', completed: false },
          { item: 'Hepa B test', completed: false },
          { item: 'Stool test', completed: false },
          { item: 'Urine test', completed: false },
          { item: 'Vaccine card', completed: false },
          { item: '1mnth advance', completed: false },
          { item: '1mnth deposit', completed: false },
          { item: 'Utility deposit', completed: false },
          { item: 'Mineral water', completed: false },
          ];
    }
  }

  downloadExcel() {
    // Prepare the student data with clear labels and grouped information
    const studentData = [
      ['Form ID', this.student._id],
      ['First Name', this.student.firstName],
      ['Middle Name', this.student.middleName],
      ['Last Name', this.student.lastName],
      ['Sex', this.student.personalInfo?.sex],
      ['Age', this.student.personalInfo?.age],
      ['Email', this.student.email],
      ['Student Number', this.student.studentNo],
      ['Course', this.student.personalInfo?.course],
      ['Year Level', this.student.personalInfo?.yearLevel],
      ['Date of Birth', this.student.personalInfo?.dateOfBirth],
      ['Religion', this.student.personalInfo?.religion],
      ['Nationality', this.student.personalInfo?.nationality],
      ['Civil Status', this.student.personalInfo?.civilStatus],
  
      // Home Address
      ['Home Address', `
        Country: ${this.student.personalInfo?.homeAddress?.country}
        City: ${this.student.personalInfo?.homeAddress?.city}
        Zip Code: ${this.student.personalInfo?.homeAddress?.zipCode}
        Province: ${this.student.personalInfo?.homeAddress?.province}
        House Number: ${this.student.personalInfo?.homeAddress?.houseNumber}
      `],
  
      ['Facebook Account', this.student.personalInfo?.facebookAcct],
      ['Tel. No.', this.student.personalInfo?.telNo],
  
      // Father Details (grouped with labels)
      ['Father', `
        Name: ${this.student.familyBackground?.fatherDetails?.name}
        Date of Birth: ${this.student.familyBackground?.fatherDetails?.dateOfBirth}
        Age: ${this.student.familyBackground?.fatherDetails?.age}
        Place of Birth: ${this.student.familyBackground?.fatherDetails?.placeOfBirth}
        Home Address: 
          Country: ${this.student.familyBackground?.fatherDetails?.homeAddress?.country}
          City: ${this.student.familyBackground?.fatherDetails?.homeAddress?.city}
          Zip Code: ${this.student.familyBackground?.fatherDetails?.homeAddress?.zipCode}
          Province: ${this.student.familyBackground?.fatherDetails?.homeAddress?.province}
          House Number: ${this.student.familyBackground?.fatherDetails?.homeAddress?.houseNumber}
        Tel. No.: ${this.student.familyBackground?.fatherDetails?.telNo}
        Religion: ${this.student.familyBackground?.fatherDetails?.religion}
        Nationality: ${this.student.familyBackground?.fatherDetails?.nationality}
        Occupation: ${this.student.familyBackground?.fatherDetails?.occupation}
        Name of Employer: ${this.student.familyBackground?.fatherDetails?.nameOfEmployer}
      `],
  
      // Mother Details (grouped with labels)
      ['Mother', `
        Name: ${this.student.familyBackground?.motherDetails?.name}
        Date of Birth: ${this.student.familyBackground?.motherDetails?.dateOfBirth}
        Age: ${this.student.familyBackground?.motherDetails?.age}
        Place of Birth: ${this.student.familyBackground?.motherDetails?.placeOfBirth}
        Home Address: 
          Country: ${this.student.familyBackground?.motherDetails?.homeAddress?.country}
          City: ${this.student.familyBackground?.motherDetails?.homeAddress?.city}
          Zip Code: ${this.student.familyBackground?.motherDetails?.homeAddress?.zipCode}
          Province: ${this.student.familyBackground?.motherDetails?.homeAddress?.province}
          House Number: ${this.student.familyBackground?.motherDetails?.homeAddress?.houseNumber}
        Tel. No.: ${this.student.familyBackground?.motherDetails?.telNo}
        Religion: ${this.student.familyBackground?.motherDetails?.religion}
        Nationality: ${this.student.familyBackground?.motherDetails?.nationality}
        Occupation: ${this.student.familyBackground?.motherDetails?.occupation}
        Name of Employer: ${this.student.familyBackground?.motherDetails?.nameOfEmployer}
      `],
  
      // Parent Status (grouped with labels)
      ['Parent Status', `
        Marital Status: ${this.student.familyBackground?.parentStatus?.maritalStatus}
        Parents Marriage: ${this.student.familyBackground?.parentStatus?.parentsMarriage}
        Guardian Name: ${this.student.familyBackground?.parentStatus?.guardianDetails?.name}
        Guardian Occupation: ${this.student.familyBackground?.parentStatus?.guardianDetails?.occupation}
        Guardian Relationship: ${this.student.familyBackground?.parentStatus?.guardianDetails?.relation}
        Language Spoken: ${this.student.familyBackground?.parentStatus?.languageSpoken}
        Number of Children: ${this.student.familyBackground?.parentStatus?.noOfChildren}
        Ordinal Position: ${this.student.familyBackground?.parentStatus?.ordinalPosition}
        Average Monthly Income: ${this.student.familyBackground?.parentStatus?.AverageMonthlyIncome}
      `],
  
      // Number of Siblings and Sibling Details (grouped with labels)
      ['Number of Siblings', this.student.familyBackground?.numberOfSiblings?.length],
      ['Siblings Details', this.student.familyBackground?.numberOfSiblings?.map((sibling: any) => `
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
        Weight: ${this.student.healthCondition?.weight}
        Height: ${this.student.healthCondition?.height}
        Glasses: ${this.student.healthCondition?.glasses ? 'Yes' : 'No'}
        Illnesses: ${this.student.healthCondition?.illnesses?.map((illness: any) => illness.name).join(", ")}
        Comments: ${this.student.healthCondition?.comments}
      `],
  
      // Other Details (grouped with labels)
      ['Hobbies', this.student.hobbies?.join(", ")],
      ['Talents/Skills', this.student.talentsSkills?.join(", ")],
      ['Leisure Time', this.student.leisureTime?.join(", ")],
  
      // Checklist (grouped with labels)
      ['Checklist', this.student.checklist?.map((item: any) => `${item.item}: ${item.completed ? 'Completed' : 'Incomplete'}`).join("\n")],
  
      // Scheduled Interview and Deadline (grouped with labels)
      ['Scheduled Interview Date', this.scheduledDate],
      ['Scheduled Interview Time', this.scheduledTime],
      ['Deadline Date', this.deadlineDate],
      ['Deadline Time', this.deadlineTime],
    ];
  
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(studentData); // Convert array of arrays to sheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Details');
  
    // Export to Excel
    XLSX.writeFile(wb, `${this.student.lastName}_student_details.xlsx`);
  }

  closeModal(): void {
    this.close.emit();
  }

  updateChecklist(item: string): void {
    this.queueService.updateChecklist(this.student._id, item).subscribe(
      (response) => {
       
        this.checklistItems = response.checklist;
        this.toastr.success(`${item} updated successfully.`, 'Success', {
          timeOut: 3000, 
          positionClass: 'toast-top-right', 
          progressBar: true 
        }); 
      },
      (error) => {
        console.error('Error updating checklist:', error);
        this.toastr.error('Failed to update the checklist. Please try again.'); // Error toast
      }
    );
  }
  
  scheduleInterview(): void {
    if (!this.scheduledDate || !this.scheduledTime || !this.deadlineDate || !this.deadlineTime) {
      this.toastr.warning('Please select both date and time for schedule and deadline.', 'Missing Fields');
      return;
    }

    this.isLoading = true;

    const scheduleString = `${this.scheduledDate}T${this.scheduledTime}:00`;
    const deadlineString = `${this.deadlineDate}T${this.deadlineTime}:00`;

    const scheduleManila = moment.tz(scheduleString, 'Asia/Manila').toDate();
    const deadlineManila = moment.tz(deadlineString, 'Asia/Manila').toDate();

    const isoSchedule = moment(scheduleManila).utc().toISOString();
    const isoDeadline = moment(deadlineManila).utc().toISOString();

    this.queueService.scheduleInterview(this.student._id, isoSchedule, isoDeadline).subscribe(
      (response) => {
        this.isLoading = false;
        if (response && response.scheduledDateTime && response.deadlineDateTime) {
          const updatedSchedule = moment.utc(response.scheduledDateTime).tz('Asia/Manila');
          const updatedDeadline = moment.utc(response.deadlineDateTime).tz('Asia/Manila');

          this.scheduledDate = updatedSchedule.format('YYYY-MM-DD');
          this.scheduledTime = updatedSchedule.format('HH:mm');

          this.deadlineDate = updatedDeadline.format('YYYY-MM-DD');
          this.deadlineTime = updatedDeadline.format('HH:mm');

          this.toastr.success(
            `Interview scheduled for ${this.scheduledDate} at ${this.scheduledTime}, Deadline set for ${this.deadlineDate} at ${this.deadlineTime}`,
            'Schedule Saved'
          );
        } else {
          console.error("Invalid response from server:", response);
          this.toastr.error("Failed to retrieve the updated schedule.", "Server Error");
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Error scheduling interview:', error);
        this.toastr.error('Failed to schedule the interview.', 'Error');
      }
    );
  }

  isChecklistComplete(): boolean {
    return this.checklistItems && this.checklistItems.length > 0
      ? this.checklistItems.every(item => item.completed)
      : false;
  }

  rejectStudent(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone. Do you want to reject this student?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reject!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing...',
          text: 'Please wait while we process the rejection.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading(); 
          }
        });
  
        this.queueService.rejectStudentForm(this.student._id).subscribe(
          (response) => {
            Swal.close(); 
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: 'The student has been rejected and notified via email.',
              confirmButtonColor: '#3085d6'
            }).then(() => {
              this.closeModal(); 
              location.reload(); 
            });
          },
          (error) => {
            console.error('Error rejecting student:', error);
            Swal.close(); 
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to reject the student. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        );
      }
    });
  }
  
  approveStudent(): void {
    this.queueService.checkIfAlreadyApproved(this.student.studentNo).subscribe(
      (response) => {
        if (response.message === 'Student is already approved.') {
          Swal.fire({
            icon: 'info',
            title: 'Already Approved',
            text: 'This student is already approved.',
            confirmButtonColor: '#3085d6'
          });
        } else {
          Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to approve this student?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, approve!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire({
                title: 'Approving Student...',
                text: 'Please wait while the student is being approved.',
                icon: 'info',
                allowOutsideClick: false, 
                didOpen: () => {
                  Swal.showLoading();
                }
              });
  
              this.queueService.approveStudent(this.student.studentNo).subscribe(
                (response) => {
                  Swal.close();
  
                  Swal.fire({
                    icon: 'success',
                    title: 'Approved!',
                    text: 'The student has been successfully approved.',
                    confirmButtonColor: '#3085d6'
                  }).then(() => {
                    this.closeModal();
                    location.reload(); 
                  });
                },
                (error) => {
                  Swal.close();
  
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to approve the student. Please try again.',
                    confirmButtonColor: '#3085d6'
                  });
                  console.error('Error approving student:', error);
                }
              );
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              Swal.fire({
                icon: 'info',
                title: 'Cancelled',
                text: 'The approval process has been cancelled.',
                confirmButtonColor: '#3085d6'
              });
            }
          });
        }
      },
      (error) => {
        console.error('Error checking student approval status:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to check approval status. Please try again.',
          confirmButtonColor: '#3085d6'
        });
      }
    );
  }
  


}
