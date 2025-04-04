import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { StudentServiceService } from '../pages/student/student-service.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { detectIncognito } from 'detect-incognito';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  @ViewChild('chatbotBody') chatbotBody!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  menuOpen: boolean = false;
  isNavbarOpen = false;

  isIncognito: boolean = false;
  errorMessage: string = '';


  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  showHelpArrow: boolean = false;

  formSubmissionLocked: boolean = false;

  maleAvailableSlots: number = 0;
  femaleAvailableSlots: number = 0;
  maxMaleApproved: number = 0;
  maxFemaleApproved: number = 0;
  bookingStatus: string = "Booking is open";

  loading: boolean = true;

  isChatbotVisible: boolean = false;
  isContactFormVisible: boolean = false;
  isBackToTopVisible: boolean = false;
  
  showFaqButtons: boolean = true;
  isSearchActive: boolean = false;
  searchQuery: string = "";
  filteredFaqs: any[] = [];
  displayedFaqs: any[] = [];

  contactForm: FormGroup;
  isSubmitting: boolean = false;

  faqs: any[] = [
    { question: 'How or what is the dormitory application process?', answer: [
      'Step 1: Register and Login to your account',
      'Step 2: Fill out the forms required',
      'Step 3: An email will be sent to your email, wait for your approval and next instructions provided in the email',
      'Step 4: Once approved, we will allocate your room and finalize the payment.'
    ] },


    { question: 'What are the available slots for male students?', answer: '' },
    { question: 'What are the available slots for female students?', answer: '' },

    { question: 'Can I renew my stay for the next semester?', answer: [
      'Yes, since the semsetral dates are different the custodians will set the renewal deadline.',
      'This is only if you are an approved student.',
      'You will be notified if the renewal has started, if failed to press the renewal during the renewal month your data would be deleted'
    ] },


    { question: 'How do I contact the dormitory staff?', answer: 'You can fill out the contact form and we will get back to you shortly.' },
    { question: 'What is the fee structure for dormitory?', answer: 'The fee structure is as follows...' },
    { question: 'Is there a curfew for students?', answer: 'Yes, the curfew is 10 PM.' },
  ];


  
  chatHistory: { text: string; type: 'user' | 'bot' }[] = [];

  constructor(private router: Router, private studentService: StudentServiceService, private fb: FormBuilder, private eRef: ElementRef){
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      contactnumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], 
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {

    this.detectIncognitoMode();

    setTimeout(() => {
      this.showHelpArrow = true;

      setTimeout(() => {
        this.showHelpArrow = false;
      }, 10000); 
    }, 5000); 

    this.shuffleFaqs();  // Call this to shuffle FAQs at first
    this.studentService.getFormSubmissionLockStatus().subscribe(
      (response) => {
        this.formSubmissionLocked = response.formSubmissionLocked;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching lock status', error);
        this.loading = false;
      }
    );
  
    this.studentService.getAvailableSlots().subscribe(
      (response: any) => {
        this.maleAvailableSlots = response.maleAvailableSlots;
        this.femaleAvailableSlots = response.femaleAvailableSlots;
        this.maxMaleApproved = response.maxMaleApproved;
        this.maxFemaleApproved = response.maxFemaleApproved;
        this.bookingStatus = response.message;
        this.loading = false;

        this.updateFaqSlots();
      },
      (error) => {
        console.error('Error fetching available slots', error);
        this.loading = false;
      }
    );
  }

  detectIncognitoMode(): void {
    detectIncognito().then((result) => {
      this.isIncognito = result.isPrivate;
      if (this.isIncognito) {
        this.errorMessage = 'Please do not use incognito mode for admin login.';
        alert(this.errorMessage);
      }
    });
  }

  updateFaqSlots(): void {
    this.faqs[1].answer = `Currently, there are ${this.maleAvailableSlots} male slots available out of ${this.maxMaleApproved}.`;
    this.faqs[2].answer = `Currently, there are ${this.femaleAvailableSlots} female slots available out of ${this.maxFemaleApproved}.`;
  }
  
  
  scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.menuOpen = false; 
    }
  }

  scrollToSectionWithOffset(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 100,  
        behavior: 'smooth',            
      });
      this.menuOpen = false; 
    }
  }

  scrollToSectionWithOffset2(sectionId: string, offset: number = 200) {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop + offset, // Moves 200px lower than the section's top
        behavior: 'smooth', 
      });
      this.menuOpen = false; // Close menu if needed
    }
  }
  

  scrollToSectionAndTop() {
    this.scrollToSection('section1');
    this.scrollToTop();
  }

  closenav(){
    this.menuOpen = false;
  }
  navigateToStudentLogin(): void {
    this.router.navigate(['student-login']);
  }
  

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isBackToTopVisible = window.scrollY > 200;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  toggleChatbot(): void {
    this.isChatbotVisible = !this.isChatbotVisible;
    this.showHelpArrow = false;
  }

  toggleContactForm(): void {
    this.isContactFormVisible = !this.isContactFormVisible;
  }

  selectAnswer(faq: any): void {
    this.showFaqButtons = false;
    this.isSearchActive = false;  
    this.searchQuery = "";        
    
    this.chatHistory.push({ text: faq.question, type: 'user' });
    
    setTimeout(() => {
      if (Array.isArray(faq.answer)) {
        faq.answer.forEach((step: string, index: number) => {
          setTimeout(() => {
            this.chatHistory.push({ text: step, type: 'bot' });
            this.scrollToBottom();
          }, index * 1000); 
        });
      } else {
        this.chatHistory.push({ text: faq.answer, type: 'bot' });
        this.scrollToBottom();
      }
      
      setTimeout(() => {
        this.showFaqButtons = true;
        this.scrollToBottom();
      }, Array.isArray(faq.answer) ? faq.answer.length * 1000 : 500); 
    }, 500);
  }
  

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatbotBody) {
        this.chatbotBody.nativeElement.scrollTop = this.chatbotBody.nativeElement.scrollHeight;
      }
    }, 100);
  }
  
  showSearchBar(): void {
    this.isSearchActive = true;
    this.showFaqButtons = false;
    this.filteredFaqs = [...this.faqs]; 
  }

  filterFAQs(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredFaqs = this.faqs.filter(faq =>
      faq.question.toLowerCase().includes(query)
    );
    this.displayedFaqs = this.filteredFaqs.slice(0, 3); 
  }

  shuffleFaqs(): void {
    const shuffledFaqs = [...this.faqs].sort(() => Math.random() - 0.5); 
    this.displayedFaqs = shuffledFaqs.slice(0, 3); 
  }

  showRandomQuestions(): void {
    this.shuffleFaqs(); 
  }

  onSubmitContactForm(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched(); 
      return;
    }

    this.isSubmitting = true;  

    const formData = this.contactForm.value;

    console.log('Submitting form:', formData);

    this.studentService.contactCustodian(formData).subscribe({
      next: (response) => {
        console.log('Message sent successfully!', response);
        alert(response.message || 'Message sent successfully!');
        this.contactForm.reset();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert(error.error?.message || 'Failed to send message.');
      },
      complete: () => {
        this.isSubmitting = false;  
      }
    });
  }

  
}
