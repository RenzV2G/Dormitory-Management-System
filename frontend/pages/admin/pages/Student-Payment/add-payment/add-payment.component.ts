import { Component, OnInit, HostListener } from '@angular/core';
import { PaymentServiceService } from '../payment-service.service';
import { ToastrService } from 'ngx-toastr'; // Import ToastrService
import { NgxSpinnerService } from "ngx-spinner";
@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.scss'
})
export class AddPaymentComponent implements OnInit{
  students: any[] = [];
  filteredStudents: any[] = [];
  selectedStudentNo: string = '';
  selectedStudentName: string = '';
  transactionNo: string = '';
  paymentDate: string = '';
  amount: number = 0;
  paymentMethod: string = 'Cash'; 
  remarks: string = '';
  searchQuery: string = '';
  dropdownOpen: boolean = false; 

  constructor(
    private studentService: PaymentServiceService,
    private toastr: ToastrService 
  ) {}

  ngOnInit(): void {
    this.fetchStudents(); 
  }

  fetchStudents(): void {
    this.toastr.info('Fetching students...', 'Loading', {
      closeButton: true,
      disableTimeOut: true,
      progressBar: true,
    });
  
    this.studentService.getAllStudents().subscribe(
      (response) => {
        console.log('Students fetched:', response); // Debugging
        if (response.students && response.students.length > 0) {
          this.students = response.students;
          this.filteredStudents = [...this.students];
          this.toastr.clear();
        } else {
          this.toastr.clear();
          this.toastr.info('No current students found.', 'Information', {
            timeOut: 3000,
          });
        }
      },
      (error) => {
        console.error('Error fetching students:', error); // Debugging
        this.toastr.clear();
        this.toastr.error('Error fetching students', 'Error');
      }
    );
  }
  
  

  filterStudents(): void {
    if (!this.searchQuery) {
      this.filteredStudents = [...this.students];
    } else {
      this.filteredStudents = this.students.filter(student =>
        student.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        student.studentNo.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  selectStudent(student: any): void {
    this.selectedStudentNo = student.studentNo;
    this.selectedStudentName = student.name;
    this.searchQuery = student.name; 
    this.filteredStudents = []; 
    this.dropdownOpen = false; 
  }

  toggleDropdown(): void {
    if (!this.dropdownOpen && this.searchQuery) {
      this.dropdownOpen = true; 
    }
  }

  onFocus(): void {
    this.dropdownOpen = true; 
    this.filteredStudents = [...this.students]; 
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInside = event.target instanceof HTMLElement && event.target.closest('.autocomplete-container');
    if (!clickedInside) {
      this.dropdownOpen = false; 
    }
  }

  addPayment(): void {
    const paymentData = {
      name: this.selectedStudentName,
      studentNo: this.selectedStudentNo,
      transactionNo: this.transactionNo,
      paymentDate: this.paymentDate,
      amount: this.amount,
      paymentBy: this.paymentMethod,
      remarks: this.remarks
    };

    const toastrRef = this.toastr.info('Processing payment...', 'Please wait', {
      closeButton: true,
      disableTimeOut: true, 
      progressBar: true 
    });

    this.studentService.addPayment(paymentData).subscribe(
      (response) => {
        this.toastr.clear();
        
        this.toastr.success(`Payment successfully added for ${this.selectedStudentName}`, 'Success', {
          timeOut: 3000 
        });

        this.clearForm(); 
      },
      (error) => {
        this.toastr.clear();
        
        this.toastr.error('Error adding payment. Please try again.', 'Error', {
          timeOut: 3000 
        });

        console.error('Error adding payment', error);
      }
    );
  }

  clearForm(): void {
    this.selectedStudentNo = '';
    this.selectedStudentName = '';
    this.transactionNo = '';
    this.paymentDate = '';
    this.amount = 0;
    this.paymentMethod = 'Cash';
    this.remarks = '';
    this.searchQuery = '';
    this.filteredStudents = []; 
  }

}
