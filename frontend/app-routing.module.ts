import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Student Pages ===
import { RegisterComponent } from './auth/student/register/register.component';
import { LoginStudentComponent } from './auth/student/login/login.component';
import { FormsPageComponent } from './pages/student/forms-page/forms-page.component';
import { VerifyEmailComponent } from './auth/student/verify-email/verify-email.component';
import { ResetPasswordComponent } from './auth/student/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './auth/student/forgot-password/forgot-password.component';

// Admin Pages ===
import { LoginAdminComponent } from './auth/admin/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';

import { DashboardHomeComponent } from './pages/admin/pages/dashboard-home/dashboard-home.component';

import { StudentAdmissionComponent } from './pages/admin/pages/Student-Management/student-admission/student-admission.component';
import { StudentQueueComponent } from './pages/admin/pages/Student-Management/student-queue/student-queue.component';
import { StudentListComponent } from './pages/admin/pages/Student-Management/student-list/student-list.component';

import { RoomAllocationComponent } from './pages/admin/pages/Room-Management/room-allocation/room-allocation.component';
import { RoomListComponent } from './pages/admin/pages/Room-Management/room-list/room-list.component';

import { AddPaymentComponent } from './pages/admin/pages/Student-Payment/add-payment/add-payment.component';
import { ViewPaymentComponent } from './pages/admin/pages/Student-Payment/view-payment/view-payment.component';
// import { SummaryBillsComponent } from './pages/admin/pages/Student-Payment/summary-bills/summary-bills.component';

import { AddNewUserComponent } from './pages/admin/pages/User-Management/add-new-user/add-new-user.component';
import { ViewUsersComponent } from './pages/admin/pages/User-Management/view-users/view-users.component';



// PUBLIC pages ===
import { HomeComponent } from './home/home.component';


const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent
  },

  // #=== STUDENT PAGES ===#
  {
    path: 'student-register',
    component: RegisterComponent
  },
  {
    path: 'student-login',
    component: LoginStudentComponent
  },
  {
    path: 'student-forms',
    component: FormsPageComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },

  // #=== ADMIN PAGES ===#
  {
    path: 'admin-login',
    component: LoginAdminComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard-home', pathMatch: 'full'},
      { path: 'dashboard-home', component: DashboardHomeComponent},
      { path: 'student-admission', component: StudentAdmissionComponent},
      { path: 'student-queue', component: StudentQueueComponent },
      { path: 'student-list', component: StudentListComponent},
      { path: 'room-allocation', component: RoomAllocationComponent},
      { path: 'room-list', component: RoomListComponent},
      { path: 'add-new-payment', component: AddPaymentComponent},
      { path: 'view-payment-list', component: ViewPaymentComponent},
      // { path: 'summary-bills', component: SummaryBillsComponent},
      { path: 'add-new-user', component: AddNewUserComponent},
      { path: 'view-user-list', component: ViewUsersComponent},
    ]
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
