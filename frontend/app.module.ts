import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


// Student pages ====
import { LoginStudentComponent } from './auth/student/login/login.component';
import { FormsPageComponent } from './pages/student/forms-page/forms-page.component';
import { RegisterComponent } from './auth/student/register/register.component';
import { StudentInfoModalComponent } from './pages/student/forms-page/component/student-info-modal/student-info-modal.component';
import { VerifyEmailComponent } from './auth/student/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './auth/student/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/student/reset-password/reset-password.component';


// Admin pages ====
import { LoginAdminComponent } from './auth/admin/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { SidebarComponent } from './pages/admin/components/sidebar/sidebar.component';
import { HeaderComponent } from './pages/admin/components/header/header.component';
import { ModalStudentComponent } from './pages/admin/components/modal-student/modal-student.component';
import { ModalApprovedStudentComponent } from './pages/admin/components/modal-approved-student/modal-approved-student.component';
import { ModalRenewalStudentComponent } from './pages/admin/components/modal-renewal-student/modal-renewal-student.component';

import { DashboardHomeComponent } from './pages/admin/pages/dashboard-home/dashboard-home.component';
import { AnalyticsComponent } from './pages/admin/pages/analytics/analytics.component';


// Student Management Tab
import { StudentAdmissionComponent } from './pages/admin/pages/Student-Management/student-admission/student-admission.component';
import { StudentQueueComponent } from './pages/admin/pages/Student-Management/student-queue/student-queue.component';
import { StudentListComponent } from './pages/admin/pages/Student-Management/student-list/student-list.component';

// Room Management Tab
import { RoomAllocationComponent } from './pages/admin/pages/Room-Management/room-allocation/room-allocation.component';
import { RoomListComponent } from './pages/admin/pages/Room-Management/room-list/room-list.component';

// Student Paymenr Tab
import { AddPaymentComponent } from './pages/admin/pages/Student-Payment/add-payment/add-payment.component';
import { ViewPaymentComponent } from './pages/admin/pages/Student-Payment/view-payment/view-payment.component';
import { SummaryBillsComponent } from './pages/admin/pages/Student-Payment/summary-bills/summary-bills.component';

// User Management Tab
import { AddNewUserComponent } from './pages/admin/pages/User-Management/add-new-user/add-new-user.component';
import { ViewUsersComponent } from './pages/admin/pages/User-Management/view-users/view-users.component';


// Other pages ===
import { HomeComponent } from './home/home.component';



// Angular Imports 
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  declarations: [
    AppComponent,
    LoginStudentComponent,
    RegisterComponent,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    LoginAdminComponent,
    HomeComponent,
    DashboardComponent,
    FormsPageComponent,
    StudentInfoModalComponent,
    SidebarComponent,
    HeaderComponent,
    ModalStudentComponent,
    ModalApprovedStudentComponent,
    ModalRenewalStudentComponent,
    DashboardHomeComponent,
    AnalyticsComponent,
    StudentAdmissionComponent,
    StudentQueueComponent,
    StudentListComponent,
    RoomAllocationComponent,
    RoomListComponent,
    AddPaymentComponent,
    ViewPaymentComponent,
    SummaryBillsComponent,
    AddNewUserComponent,
    ViewUsersComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
    BrowserAnimationsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
