import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RoomsServiceService } from '../rooms-service.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-room-allocation',
  templateUrl: './room-allocation.component.html',
  styleUrl: './room-allocation.component.scss'
})
export class RoomAllocationComponent implements OnInit{
  students: any[] = [];
  selectedStudent: any = null;

  availableRooms: any[] = [];
  availableBedLetters: string[] = [];

  selectedRoom: string = '';
  selectedBedLetter: string = '';

  gender: string = '';
  building: string = '';
  cachedRooms: { [key: string]: any[] } = {}; 
  assignedStudents: any[] = [];
  totalPages: number = 0;
  currentPage: number = 1;

  filteredAssignedStudents: any[] = [];
  searchTerm: string = '';

  isLoading: boolean = false;
  constructor(private roomService: RoomsServiceService, private toastr: ToastrService) {}

  ngOnInit() {
    this.loadUnassignedStudents();
    this.loadAssignedStudents(this.currentPage);
  }

  loadUnassignedStudents() {
    this.roomService.getUnassignedStudents().subscribe((data) => {
      this.students = data.students;
    });
  }

  loadAssignedStudents(page: number): void {
    this.roomService.getStudentsWithRooms(page, 6).subscribe((data) => {
      this.assignedStudents = data.students;
      this.filteredAssignedStudents = [...this.assignedStudents]; // Initialize the filtered list
      this.totalPages = data.totalPages;
      this.currentPage = data.currentPage;
    });
  }

  onSearchChange(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredAssignedStudents = this.assignedStudents.filter(student => 
      student.name.toLowerCase().includes(searchTermLower) ||
      student.roomDetails.toLowerCase().includes(searchTermLower) ||
      student.building.toLowerCase().includes(searchTermLower)
    );
  }

  onStudentSelect(event: Event): void {
    const selectedStudentId = (event.target as HTMLSelectElement).value;

    if (!selectedStudentId) {
      this.resetForm();
      return;
    }

    // Find the selected student from the list
    const selectedStudent = this.students.find(student => student._id === selectedStudentId);

    if (selectedStudent) {
      this.selectedStudent = selectedStudent;
      this.building = selectedStudent.personalInfo.sex === 'Male' ? 'Plaza de Corazon' : 'St. Martha';

      if (this.cachedRooms[selectedStudent.personalInfo.sex]) {
        this.availableRooms = this.cachedRooms[selectedStudent.personalInfo.sex];
      } else {
        this.getAvailableRooms(selectedStudent.personalInfo.sex);
      }
    }
  }

  getAvailableRooms(sex: string): void {
    this.roomService.getAvailableRooms(sex).subscribe({
      next: (response) => {
        this.availableRooms = response.rooms;
        this.cachedRooms[sex] = response.rooms; // Cache rooms based on gender
      },
      error: (error) => {
        console.error('Error fetching available rooms:', error);
      }
    });
  }

  onRoomSelect(event: Event): void {
    const selectedRoomNumber = (event.target as HTMLSelectElement).value;
    this.selectedRoom = selectedRoomNumber;

    // Find the selected room and determine the available bed letters
    const selectedRoom = this.availableRooms.find(room => room.roomNumber === selectedRoomNumber);
    if (selectedRoom && selectedRoom.availableBeds) {
      this.availableBedLetters = selectedRoom.availableBeds;
    }
  }

  onBedSelect(event: Event): void {
    this.selectedBedLetter = (event.target as HTMLSelectElement).value;
  }

  onRoomAssign(): void {
    if (this.selectedStudent && this.selectedRoom && this.selectedBedLetter) {
      this.isLoading = true;
  
      this.roomService.assignRoom(this.selectedStudent.studentNo, this.selectedRoom, this.selectedBedLetter).subscribe(
        (response) => {
          this.toastr.success('Room assigned successfully!', 'Success');
    
          setTimeout(() => {
            this.resetForm();
            this.loadUnassignedStudents();
            this.loadAssignedStudents(this.currentPage);
            window.location.reload();
          }, 1000);
        },
        (error) => {
          this.toastr.error('Error assigning room', 'Error');
        },
        () => {
          this.isLoading = false;
        }
      );
    } else {
      this.toastr.warning('Please select a student, room, and bed letter.', 'Warning');
    }
  }

  onRemoveRoomAssignment(student: any): void {
    if (!student) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Student information is missing.',
      });
      return;
    }
  
    const studentId = student._id; 
  
    if (!studentId) {
      console.error('Student UUID is undefined. Check backend response and mapping.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid student data. Unable to remove room assignment.',
      });
      return;
    }
  
    Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to remove ${student.name} from their assigned room?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading spinner
        Swal.fire({
          title: 'Processing...',
          text: 'Removing room assignment, please wait.',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
  
        this.roomService.removeRoomAssignment(studentId).subscribe({
          next: (response) => {
            console.log('Remove assignment response:', response); 
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: `${student.name}'s room assignment has been removed.`,
            }).then(() => {
              window.location.reload(); 
            });
          },
          error: (error) => {
            console.error('Error removing room assignment:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to remove room assignment.',
            });
          },
        });
      }
    });
  }
  
  resetForm() {
    this.selectedStudent = null;
    this.selectedRoom = '';
    this.selectedBedLetter = '';
    this.availableRooms = [];
    this.availableBedLetters = [];
    this.building = ''; // Reset the building information
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAssignedStudents(this.currentPage);
    }
  }
}
