import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { QueueServiceService } from '../queue-service.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

function emailValidator(control: any) {
  const regex = /^[a-zA-Z0-9._%+-]+@student\.hau\.edu\.ph$/;
  return regex.test(control.value) ? null : { invalidEmail: true };
}
@Component({
  selector: 'app-student-admission',
  templateUrl: './student-admission.component.html',
  styleUrl: './student-admission.component.scss'
})
export class StudentAdmissionComponent {
  studentForm!: FormGroup;

  hobbiesList: string[] = ['Singing', 'Dancing', 'Reading', 'Traveling', 'Cooking'];
  talentSkillsList: string[] = ['Painting', 'Coding', 'Writing', 'Photography', 'Public Speaking'];
  leisureTimeList: string[] = ['Watching Movies', 'Gaming', 'Sports', 'Music', 'Shopping'];

  selectedHobbies: string[] = [];
  selectedTalentSkills: string[] = [];
  selectedLeisureTimes: string[] = [];
  

  message: string = '';
  success: boolean = false;

  private destroy$ = new Subject<void>();

 constructor(
    private fb: FormBuilder,
    private studentService: QueueServiceService,
  ) {
    this.studentForm = this.fb.group({
      studentNo: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, emailValidator]],
      course: ['', Validators.required],
      yearLevel: ['', Validators.required],
      sex: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      placeOfBirth: ['', Validators.required],
      age: [''],
      religion: ['', Validators.required],
      nationality: ['', Validators.required],
      civilStatus: ['', Validators.required],
      homeAddress: this.fb.group({
        country: ['', Validators.required],
        city: ['', Validators.required],
        zipCode: ['', Validators.required],
        province: ['', Validators.required],
        houseNumber: ['', Validators.required]
      }),
      facebookAcct: ['', Validators.required],
      telNo: ['', Validators.required],
      fatherDetails: this.fb.group({
        name: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        age: [''],
        placeOfBirth: ['', Validators.required],
        homeAddress: this.fb.group({
          country: ['', Validators.required],
          city: ['', Validators.required],
          zipCode: ['', Validators.required],
          province: ['', Validators.required],
          houseNumber: ['', Validators.required]
        }),
        telNo: ['', Validators.required],
        religion: ['', Validators.required],
        nationality: ['', Validators.required],
        occupation: ['', Validators.required],
        nameOfEmployer: ['', Validators.required]
      }),
      motherDetails: this.fb.group({
        name: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        age: [''],
        placeOfBirth: ['', Validators.required],
        homeAddress: this.fb.group({
          country: ['', Validators.required],
          city: ['', Validators.required],
          zipCode: ['', Validators.required],
          province: ['', Validators.required],
          houseNumber: ['', Validators.required]
        }),
        telNo: ['', Validators.required],
        religion: ['', Validators.required],
        nationality: ['', Validators.required],
        occupation: ['', Validators.required],
        nameOfEmployer: ['', Validators.required]
      }),
      parentStatus: this.fb.group({
        maritalStatus: ['', Validators.required],
        parentsMarriage: [false, Validators.required],
        guardianDetails: this.fb.group({
          name: ['', Validators.required],
          occupation: ['', Validators.required],
          relation: ['', Validators.required]
        }),
        languageSpoken: ['', Validators.required],
        noOfChildren: ['0', [Validators.required, Validators.min(0)]],
        ordinalPosition: ['', Validators.required],
        AverageMonthlyIncome: ['', Validators.required]
      }),
      numberOfSiblings: this.fb.array([]),
      illnesses: this.fb.array([]),
      weight: ['', Validators.required],
      height: ['', Validators.required],
      glasses: [false, Validators.required],
      comments: ['', Validators.required],
      hobbies: [''],
      talentsSkills: [''],
      leisureTime: ['']
    });

    
    this.studentForm.get('dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge('dateOfBirth', 'age');
    });
  
    this.studentForm.get('fatherDetails.dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge('fatherDetails.dateOfBirth', 'fatherDetails.age');
    });
  
    this.studentForm.get('motherDetails.dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge('motherDetails.dateOfBirth', 'motherDetails.age');
    });
  }

  get homeAddressGroup() {
    return this.studentForm.get('homeAddress') as FormGroup;
  }

  get fatherDetailsGroup() {
    return this.studentForm.get('fatherDetails') as FormGroup;
  }

  get motherDetailsGroup() {
    return this.studentForm.get('motherDetails') as FormGroup;
  }

  get parentStatusGroup() {
    return this.studentForm.get('parentStatus') as FormGroup;
  }

  get guardianDetailsGroup() {
    return this.parentStatusGroup.get('guardianDetails') as FormGroup;
  }

  calculateAge(dobPath: string, agePath: string) {
    const dateOfBirth = this.studentForm.get(dobPath)?.value;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
  
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
  
      this.studentForm.get(agePath)?.setValue(age);
    }
  }

  validateNumberInput(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) { 
      event.preventDefault(); 
    }
  }

  onNoOfChildrenChange() {
    const noOfChildren = this.studentForm.get('parentStatus.noOfChildren')?.value;
    this.updateSiblings(noOfChildren);
  }
  
  private updateSiblings(count: number): void {
    const currentCount = this.siblings.length;

    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        this.addSibling();
      }
    } else if (count < currentCount) {
      for (let i = currentCount - 1; i >= count; i--) {
        this.removeSibling(i);
      }
    }
  }

  private createSiblingFormGroup(): FormGroup {
    return this.fb.group({
      name: ['' ],
      classification: ['' ],
      sex: ['' ],
      age: [''],
      civilStatus: ['' ],
      schoolOccupation: ['' ],
      gradeCompany: ['' ]
    });
  }

  // Siblings section
  get siblings(){
    return (this.studentForm.get('numberOfSiblings') as FormArray);
  }

  addSibling() {
    this.siblings.push(this.createSiblingFormGroup());
  }

  removeSibling(index: number) {
    this.siblings.removeAt(index);
  }

  // illnesses section
  get illnesses() {
    return (this.studentForm.get('illnesses') as FormArray);
  }

  addIllness() {
    this.illnesses.push(this.fb.group({
      name: [''],
      age: ['']
    }));
  }

  removeIllness(index: number) {
    this.illnesses.removeAt(index);
  }

  onHobbyChange(event: any, hobby: string): void {
    if (event.target.checked) {
      this.selectedHobbies.push(hobby);
    } else {
      const index = this.selectedHobbies.indexOf(hobby);
      if (index > -1) {
        this.selectedHobbies.splice(index, 1);
      }
    }
  }

  onTalentChange(event: any, talent: string): void {
    if (event.target.checked) {
      this.selectedTalentSkills.push(talent);
    } else {
      const index = this.selectedTalentSkills.indexOf(talent);
      if (index > -1) {
        this.selectedTalentSkills.splice(index, 1);
      }
    }
  }

  onLeisureChange(event: any, leisure: string): void {
    if (event.target.checked) {
      this.selectedLeisureTimes.push(leisure);
    } else {
      const index = this.selectedLeisureTimes.indexOf(leisure);
      if (index > -1) {
        this.selectedLeisureTimes.splice(index, 1);
      }
    }
  }

  onSubmit() {
      if(this.studentForm.valid){
        Swal.fire({
          title: 'APPLICATION CONFIRMATION',
          text: 'Are you sure about your inputted information?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Back'
        }).then((result) => {
          if(result.isConfirmed){
            Swal.fire({
              title: 'Submitting...',
              text: 'Please wait while we process your application.',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
  
            const formData = {
              ...this.studentForm.value,
              numberOfSiblings: this.siblings.length > 0 ? this.siblings.value : [],
              illnesses: this.illnesses.length > 0 ? this.siblings.value : [],
              hobbies: this.selectedHobbies,
              talentsSkills: this.selectedTalentSkills,
              leisureTime: this.selectedLeisureTimes
            };
  
            this.studentService.admissionForm(formData)
            .pipe(takeUntil(this.destroy$)).subscribe(
              (response) => {
                Swal.fire({
                  title: 'Success',
                  text: 'Form submitted successfully! Check your email for confirmation',
                  icon: 'success',
                  confirmButtonText: 'Okay'
                }).then(() => {
                  window.location.reload(); 
                });
              },
              (error) => {
                Swal.fire('Error', error.error.message || 'Submission failed', 'error');
              }
            );
          }
        });
      } else {
        Swal.fire('Error', 'Please fill in all required fields.', 'error');
      }
    }



}
