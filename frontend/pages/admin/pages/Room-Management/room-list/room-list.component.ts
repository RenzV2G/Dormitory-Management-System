import { Component, OnInit } from '@angular/core';
import { RoomsServiceService } from '../rooms-service.service';
@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss'
})
export class RoomListComponent implements OnInit {
  gender: string = 'Male';  // Default to 'Male'
  building: string = 'Plaza de Corazon'; // Automatically set to Plaza de Corazon for Male
  occupiedRooms: any[] = [];
  errorMessage: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5; // Number of rooms per page

  constructor(private roomService: RoomsServiceService) {}

  ngOnInit(): void {
    this.fetchOccupiedRooms(); // Fetch rooms as soon as the component is initialized
  }

  // Fetch the occupied rooms based on gender and building
  fetchOccupiedRooms() {
    this.roomService.getOccupiedRooms(this.gender, this.building).subscribe(
      (response) => {
        this.occupiedRooms = response.rooms;
        this.errorMessage = '';
      },
      (error) => {
        console.error('Error fetching occupied rooms', error);
        this.errorMessage = 'Error fetching occupied rooms';
      }
    );
  }

  // Change gender to Male and fetch rooms
  setGenderMale() {
    this.gender = 'Male';
    this.building = 'Plaza de Corazon'; // Automatically set to Plaza de Corazon for Male
    this.fetchOccupiedRooms();
  }

  // Change gender to Female and fetch rooms
  setGenderFemale() {
    this.gender = 'Female';
    this.building = 'St. Martha'; // Automatically set to St. Martha for Female
    this.fetchOccupiedRooms();
  }

  // Function to handle pagination (navigate to the next page)
  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  // Function to handle pagination (navigate to the previous page)
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Get rooms to display based on the current page
  getRoomsForCurrentPage() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.occupiedRooms.slice(start, end);
  }

  // Calculate total pages for pagination
  totalPages() {
    return Math.ceil(this.occupiedRooms.length / this.itemsPerPage);
  }
}
