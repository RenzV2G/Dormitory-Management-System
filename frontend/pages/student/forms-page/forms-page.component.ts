import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { StudentServiceService } from '../student-service.service';
import { AuthService } from 'src/app/auth/student/auth.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forms-page',
  templateUrl: './forms-page.component.html',
  styleUrl: './forms-page.component.scss'
})
export class FormsPageComponent implements OnInit, OnDestroy {
  studentForm!: FormGroup;
  firstName: string = '';
  middleName: string = '';
  lastName: string = '';
  name: string = '';
  email: string = '';
  studentNo: string = '';
  sex: string = '';

  isApproved: boolean = false; 
  isSubmitted: boolean = false;
  formSubmissionLocked: boolean = false;
  isLoggedIn: boolean = false;
  isRenewalStarted: boolean = false;
  isRenewalSubmitted: boolean = false;

  hobbiesList: string[] = ['Singing', 'Dancing', 'Reading', 'Traveling', 'Cooking'];
  talentSkillsList: string[] = ['Painting', 'Coding', 'Writing', 'Photography', 'Public Speaking'];
  leisureTimeList: string[] = ['Watching Movies', 'Gaming', 'Sports', 'Music', 'Shopping'];

  selectedHobbies: string[] = [];
  selectedTalentSkills: string[] = [];
  selectedLeisureTimes: string[] = [];
  

  message: string = '';
  success: boolean = false;

  showModal: boolean = false; // Add this line
  selectedStudentInfo: any = null;

  imageError: string = ''; 
  previewUrl: string | null = null;

  private destroy$ = new Subject<void>();


  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private studentService: StudentServiceService,
    private toastr: ToastrService
  ) {
    this.studentForm = this.fb.group({
      profilePicture: [''],
      course: ['', Validators.required],
      yearLevel: ['', Validators.required],
      // sex: ['', Validators.required],
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

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
  
    if (!this.isLoggedIn) {
      Swal.fire({
        title: 'Not Logged In',
        text: 'You are not logged in or your token is invalid.',
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Logout',

      }).then(() => {
        this.logout(); 
      });
      return; 
    }
  
    this.studentService.getUserDetails().subscribe(
      (user) => {
        this.firstName = user.firstName;
        this.middleName = user.middleName;
        this.lastName = user.lastName;
        this.name = user.name;
        this.email = user.email;
        this.studentNo = user.Student_no;
        this.sex = user.sex;
  
        const isFirstLogin = localStorage.getItem('isFirstLogin');
        if (isFirstLogin === 'true') {
          this.toastr.success(`Hello, ${this.name}. You have logged in successfully!`, 'Welcome', {
            timeOut: 6000,
            positionClass: 'toast-top-right',
          });
  
          // Clear the flag after showing the notification
          localStorage.removeItem('isFirstLogin');
        }
  

        this.fetchCooldown();
      },
      (error) => {
        console.error('Error fetching user details:', error);
        Swal.fire('Error', 'Failed to fetch user details', 'error');
      }
    );
  }

  private fetchCooldown(): void {
    this.studentService.checkCooldown(this.studentNo).subscribe(
      (response) => {
        if (response.cooldown) {
          Swal.fire({
            title: 'Cooldown Active',
            text: `You can only submit a new form after ${response.hoursRemaining} hour/s.`,
            icon: 'warning',
            confirmButtonText: 'Okay',
          }).then(() => {
            this.logout();
          });
        } else {
          this.fetchStatus();
          this.checkRenewalSession();
          this.checkRenewalStatus();
        }
      },
      (error) => {
        console.error('Error checking cooldown status:', error);
        Swal.fire('Error', 'Failed to check cooldown status', 'error');
      }
    );
  }
  
  private fetchStatus(): void {
    this.studentService.checkApprovalStatus(this.studentNo).subscribe(
      (response) => {
        this.isApproved = response.isApproved;
        if (this.isApproved) {
          this.isSubmitted = false; 
          return;
        }
  
        this.studentService.checkSubmission(this.studentNo).subscribe(
          (status) => {
            this.isSubmitted = status.submitted;
            if (this.isSubmitted) {
              return; 
            }
  
            this.studentService.getFormSubmissionLockStatus().subscribe(
              (response) => {
                this.formSubmissionLocked = response.lockedGenders.includes(this.sex);

  
                if (this.formSubmissionLocked) {
                  Swal.fire({
                    title: 'Forms are Full',
                    text: `Form submission for ${this.sex} is Full. You cannot submit forms at the moment.`,
                    icon: 'warning',
                    confirmButtonText: 'Okay',
                  }).then(() => {
                    this.logout();
                  });
                }
              },
              (error) => {
                console.error('Error fetching lock status', error);
              }
            );
          },
          (error) => {
            Swal.fire('Error', 'Failed to check submission status', 'error');
          }
        );
      },
      (error) => {
        console.error('Error fetching approval status:', error);
        Swal.fire('Error', 'Failed to check approval status', 'error');
      }
    );
  }

  checkRenewalSession() {
    this.studentService.checkRenewalSession().subscribe(
      (response: any) => {
        this.isRenewalStarted = response.renewalStarted;
      },
      (error) => {
        console.error('Error fetching renewal session status:', error);
      }
    );
  }

  private checkRenewalStatus(): void {
    this.studentService.checkRenewalStatus(this.studentNo).subscribe(
      (response) => {
        this.isRenewalSubmitted = response.onGoingRenewal;
      },
      (error) => {
        console.error('Error checking renewal status:', error);
        Swal.fire('Error', 'Failed to check renewal status', 'error');
      }
    );
  }

  openStudentInfoModal() {
    if (!this.studentNo) {
      Swal.fire('Error', 'Student number not found.', 'error');
      return;
    }
  
    this.studentService.getStudentInfo(this.studentNo).subscribe(
      (response) => {
        if (response) {
          this.selectedStudentInfo = response;
          this.showModal = true;
        } else {
          Swal.fire('Error', 'No student information found.', 'error');
        }
      },
      (error) => {
        console.error('Error fetching student info:', error);
        Swal.fire('Error', 'Failed to fetch student information', 'error');
      }
    );
  }

  // Add a method to close the modal
  closeModal() {
    this.showModal = false;
    this.selectedStudentInfo = null;
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

  onFileChange(event: any) {
    const file = event.target.files[0];
  
    if (!file) {
      this.previewUrl = null;
      this.imageError = '';
      return;
    }
  
    const allowedTypes = ['image/png', 'image/jpeg'];
  
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Only PNG and JPEG files are allowed.';
      this.previewUrl = null;
      this.studentForm.get('profilePicture')?.setValue('');
      return;
    }
  
    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      this.imageError = 'File size should not exceed 5MB.';
      this.previewUrl = null;
      this.studentForm.get('profilePicture')?.setValue('');
      return;
    }
  
    this.imageError = '';
  
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  
    this.studentForm.get('profilePicture')?.setValue(file);
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

   // Create FormData object
   const formData = new FormData();

   // Append the profile picture file
   const profilePicture = this.studentForm.get('profilePicture')?.value ?? null;
   if (profilePicture) {
     formData.append('profilePicture', profilePicture);
   }

   // Append other form fields
   const formValues = {
     ...this.studentForm.value,
     firstName: this.firstName,
     middleName: this.middleName,
     lastName: this.lastName,
     name: this.name,
     email: this.email,
     studentNo: this.studentNo,
     sex: this.sex,
     numberOfSiblings: this.siblings.length > 0 ? this.siblings.value : [],
     illnesses: this.illnesses.length > 0 ? this.illnesses.value : [],
     hobbies: this.selectedHobbies,
     talentsSkills: this.selectedTalentSkills,
     leisureTime: this.selectedLeisureTimes,
   };

   // Append form values as JSON
   formData.append('formData', JSON.stringify(formValues));

          this.studentService.submitForm(formData)
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

  logout() {
    localStorage.removeItem('isFirstLogin');
    this.authService.logout();
    this.router.navigate(['/student-login']);
  }

  onCancel() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once cancelled, you will need to submit a new application after 12 hours if required.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, Keep it'
    }).then((result) => {
      if (result.isConfirmed) {  
        Swal.fire({
          title: 'Cancelling...',
          text: 'Please wait while we process your request.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.studentService.cancelForm().pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            Swal.fire({
              title: 'Cancelled',
              text: 'Your form has been successfully cancelled.',
              icon: 'success',
              confirmButtonText: 'Okay'
            }).then(() => {
              window.location.reload();
            });
          },
          (error) => {
            Swal.fire('Error', error.error.message || 'Failed to cancel form', 'error');
          }
        );
      }
    });
}

  onCancelRenewal() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once cancelled, you will need to submit a new application after 24 hours if required.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, Keep it'
    }).then((result) => {
      if (result.isConfirmed) {  
        Swal.fire({
          title: 'Cancelling...',
          text: 'Please wait while we process your request.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
  
        this.studentService.cancelRenewal().pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            Swal.fire({
              title: 'Cancelled',
              text: 'Your renewal has been successfully cancelled.',
              icon: 'success',
              confirmButtonText: 'Okay'
            }).then(() => {
              window.location.reload();
            });
          },
          (error) => {
            Swal.fire('Error', error.error.message || 'Failed to cancel form', 'error');
          }
        );
      }
    });
  }
  

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }

  isBackToTopVisible: boolean = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isBackToTopVisible = window.scrollY > 200;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onRenewal() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to proceed with the renewal? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Proceed!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.studentService.renewApplication().pipe(takeUntil(this.destroy$)).subscribe(
          (response) => {
            Swal.fire({
              title: 'Renewal Processed',
              text: 'Your renewal has been successfully processed.',
              icon: 'success',
              confirmButtonText: 'Okay'
            }).then(() => {
              window.location.reload();
            });
          },
          (error) => {
            Swal.fire('Error', error.error.message || 'Renewal failed', 'error');
          }
        );
      } else {
        Swal.fire('Action Cancelled', 'You canceled the renewal process.', 'info');
      }
    });
  }
}
