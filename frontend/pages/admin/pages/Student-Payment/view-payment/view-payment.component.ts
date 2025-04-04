import { Component, OnInit, HostListener} from '@angular/core';
import { PaymentServiceService } from '../payment-service.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-view-payment',
  templateUrl: './view-payment.component.html',
  styleUrl: './view-payment.component.scss'
})
export class ViewPaymentComponent implements OnInit {
  students: any[] = []; // All students fetched from the backend
  filteredStudents: any[] = []; // Students filtered based on search query
  payments: any[] = []; // Payments for the selected student
  selectedStudentNo: string = '';
  selectedStudentName: string = '';
  searchQuery: string = '';
  dropdownOpen: boolean = false;
  totalPayment: number = 0; // Total amount of payments

  currentPage: number = 1; // Track the current page
  totalPages: number = 1; // Track the total pages
  pageSize: number = 5; // Number of payments per page

  

  constructor(
    private paymentService: PaymentServiceService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  exportToExcel(): void {
    if (this.payments.length === 0) {
      this.toastr.warning('No payments to export.', 'Warning');
      return;
    }
  
    // Prepare the data for export (you can modify the data format as needed)
    const data = this.payments.map(payment => ({
      TransactionNo: payment.transactionNo,
      Name: payment.name,
      StudentNo: payment.studentNo,
      PaymentDate: payment.paymentDate,
      Amount: payment.amount,
      PaymentMethod: payment.paymentBy,
      Remarks: payment.remarks
    }));
  
    // Calculate the total payment amount
    const totalPaymentAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
    // Add the total payment amount as a new row at the bottom
    data.push({
      TransactionNo: 'Total',
      Name: '',
      StudentNo: '',
      PaymentDate: '',
      Amount: totalPaymentAmount,
      PaymentMethod: '',
      Remarks: ''
    });
  
    // Create a worksheet from the data
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
  
    // Create a workbook and append the worksheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
  
    // Export the workbook to an Excel file
    XLSX.writeFile(wb, `${this.selectedStudentName}_Payments.xlsx`);
  }
  
  fetchStudents(): void {
    this.toastr.info('Fetching students...', 'Loading', {
      closeButton: true,
      disableTimeOut: true,
      progressBar: true,
    });

    this.paymentService.getAllStudents().subscribe(
      (response) => {
        this.students = response.students;
        this.filteredStudents = [...this.students];
        this.toastr.clear();
      },
      (error) => {
        console.error('Error fetching students:', error);
        this.toastr.clear();
        this.toastr.error('Failed to fetch students.', 'Error');
      }
    );
  }

  fetchPayments(studentNo: string): void {
    this.toastr.info('Fetching payments...', 'Loading', {
      closeButton: true,
      disableTimeOut: true,
      progressBar: true,
    });
  
    this.paymentService.getPayments(studentNo, this.currentPage, this.pageSize).subscribe(
      (response) => {
        this.payments = response.payments;
        this.totalPages = response.totalPages; // Get total pages
        this.totalPayment = response.totalAmount; // Use overall total from the backend
        this.toastr.clear();
      },
      (error) => {
        console.error('Error fetching payments:', error);
        this.toastr.clear();
        this.toastr.error('Failed to fetch payments.', 'Error');
      }
    );
  }
  

  calculateTotalPayment(): void {
    this.totalPayment = this.payments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchPayments(this.selectedStudentNo); // Fetch payments for the previous page
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchPayments(this.selectedStudentNo); // Fetch payments for the next page
    }
  }

  selectStudent(student: any): void {
    this.selectedStudentNo = student.studentNo;
    this.selectedStudentName = student.name;
    this.searchQuery = student.name; // Set input value to the selected student's name
    this.filteredStudents = []; // Hide suggestions
    this.dropdownOpen = false; // Close the dropdown

    // Fetch payments for the selected student on the first page
    this.fetchPayments(student.studentNo);
  }

  filterStudents(): void {
    if (!this.searchQuery) {
      this.filteredStudents = [...this.students];
      this.payments = []; // Clear payments when search query is empty
      this.selectedStudentNo = ''; // Clear selected student number
      this.selectedStudentName = ''; // Clear selected student name
      this.totalPayment = 0; // Reset total payment
    } else {
      this.filteredStudents = this.students.filter((student) =>
        student.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        student.studentNo.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  toggleDropdown(): void {
    if (!this.dropdownOpen && this.searchQuery) {
      this.dropdownOpen = true; // Open dropdown if searchQuery is not empty
    }
  }

  onFocus(): void {
    this.dropdownOpen = true;
    this.filteredStudents = [...this.students]; // Show all students on focus
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInside =
      event.target instanceof HTMLElement &&
      event.target.closest('.autocomplete-container');
    if (!clickedInside) {
      this.dropdownOpen = false; // Close dropdown when clicking outside
    }
  }
}
