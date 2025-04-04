import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { AnalyticsServiceService } from '../analytics/analytics-service.service';
import { QueueServiceService } from '../Student-Management/queue-service.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit{
  logs: any[] = [];

  monthlyChart: any; 
  genderChart: any; 
  pieChart: any;
  yearLevelPieChart: any; 
  paymentMethodChart: any;

  submissionsData: any[] = [];
  approvalRate: string = '0.00';
  rejectionRate: string = '0.00';

  approvalRejectionRateData: any = null;

  chartTitle: string = '';
  chartTitleRate: string = '';


  genderBasedData: any = {
    male: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
    female: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 }
  };

  public monthNames: string[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  yearLevelData: any[] = [];
  yearLevelLabels: string[] = [];
  yearLevelCounts: number[] = [];

  paymentMethodData: any[] = []; 
  paymentMethodLabels: string[] = [];
  paymentMethodCounts: number[] = [];

  provinceData: any[] = []; 
  topProvinces: any[] = [];
  maxSubmissionCount: number = 0;

  approvedCount: number = 0;
  totalAvailableRooms: number = 0;

  availableMonths: number[] = [];
  availableYears: number[] = [];
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

 constructor(private analyticsService: AnalyticsServiceService, private queueService: QueueServiceService, private cdr: ChangeDetectorRef){}


 ngOnInit(): void {
  this.fetchAvailableYears();
  this.fetchAvailableMonths(this.selectedYear);
  this.updateAnalytics();
  this.fetchMonthlyYearlyData();
  this.fetchApprovalRejectionRate(this.selectedYear, this.selectedMonth); 
  this.fetchGenderBasedAnalytics(this.selectedYear, this.selectedMonth);  
  this.fetchYearLevelCounts();
  this.fetchPaymentMethodAnalytics();
  this.fetchTopProvinces();
  this.loadApprovedStudents();
  this.loadAvailableRooms();

  this.analyticsService.getAdminLogs().subscribe({
    next: (data) => {
      this.logs = data;
    },
    error: (error) => {
      console.error('Error fetching logs:', error);
    }
  });
}

fetchAvailableYears(): void {
  const currentYear = new Date().getFullYear();
  this.analyticsService.getAvailableMonthsAndYears().subscribe(
    (data: { year: number, month: number }[]) => {
      this.availableYears = Array.from(
        new Set(data.map(entry => entry.year)) 
      ).filter(year => {
        return data.some(entry => entry.year === year);
      });

      if (!this.availableYears.includes(currentYear)) {
        this.selectedYear = this.availableYears.length > 0 ? this.availableYears[0] : currentYear;
      }
    },
    (error) => {
      console.error('Error fetching available years:', error);
    }
  );
}

fetchAvailableMonths(year: number): void {
  if (this.availableMonths.length > 0 && this.selectedYear === year) {
    return;
  }
  this.analyticsService.getAvailableMonthsAndYears().subscribe(
    (data: { year: number, month: number }[]) => {
      this.availableMonths = data
        .filter(entry => entry.year === year) 
        .map(entry => entry.month);

      if (!this.availableMonths.includes(this.selectedMonth)) {
        this.selectedMonth = this.availableMonths.length > 0 ? this.availableMonths[0] : 1;
      }
    },
    (error) => {
      console.error('Error fetching available months:', error);
    }
  );
}

onYearChange(): void {
  if (this.availableMonths.length === 0 || this.selectedYear !== this.selectedYear) {
    this.fetchAvailableMonths(this.selectedYear);
  }
  this.updateAnalytics();
}

onMonthChange(): void {
  this.updateAnalytics(); 
}


private updateAnalytics(): void {
  this.fetchApprovalRejectionRate(this.selectedYear, this.selectedMonth);
  this.fetchGenderBasedAnalytics(this.selectedYear, this.selectedMonth);
}


loadApprovedStudents(): void {
  this.queueService.getApprovedStudents().subscribe(
    (response) => {
      this.approvedCount = response.students.length; 
      this.cdr.detectChanges(); 
    },
    (error) => {
      console.error('Error loading approved students:', error);
    }
  );
}

loadAvailableRooms(): void {
  this.queueService.getAvailableRoomCounts().subscribe(
    (data) => {
      this.totalAvailableRooms = data.totalAvailableRooms;
    },
    (error) => {
      console.error('Erro fetching available rooms:', error);
    }
  )
}

getActivityIcon(action: string): string {
  const iconMap: { [key: string]: string } = {
    'Approved Student': 'approve.svg',
    'Rejected Student': 'delete.svg',
    'Update Student': 'update.svg',
    'Assigned room to student': 'allocate.svg',
    'Removed student room': 're-allocate.svg',
    'Remove Student': 'delete.svg',
    'Added Payment': 'add.svg',
    'Renewal Approved student': 'approve.svg',
    'Rejected Renewal Student': 'delete.svg',
    'Admission Form Submitted': 'add.svg',
    'Set screening schedule': 'interview.svg',
    'Renewal Deadline Set': 'renewal.svg', 
    'Form Submission Locked for Male': 'lock.svg',
    'Form Submission Locked for Female': 'lock.svg',
    'Form Submission Unlocked for Male': 'unlock.svg',
    'Form Submission Unlocked for Female': 'unlock.svg',
  };
  return `/assets/images/activity/${iconMap[action]}`; 
}


// Fetch and create the monthly/yearly submissions chart
private fetchMonthlyYearlyData() {
  this.analyticsService.getMonthlyYearlySubmission().subscribe(
    (data) => {
      this.submissionsData = data || [];
      this.createMonthlyYearlySubmission();
    },
    (error) => {
      console.error('Error fetching monthly/yearly submissions:', error);
      this.submissionsData = [];
    }
  );
}

// Fetch and create the approval/rejection rate chart
private fetchApprovalRejectionRate(year: number, month: number) {
  this.analyticsService.getApprovalRejectionRate(year, month).subscribe(
    (data) => {
      this.approvalRejectionRateData = { year, month, data };  
      this.approvalRate = data?.approvedPercentage || '0.00';
      this.rejectionRate = data?.rejectedPercentage || '0.00';

      this.chartTitleRate = `Approval and Rejection Rates for ${this.monthNames[month - 1]} ${year}`;
      this.createRejectApprovalRateChart();
    },
    (error) => {
      console.error('Error fetching approval/rejection rates:', error);
    }
  );
}



// Fetch and create the gender-based submissions chart
private fetchGenderBasedAnalytics(year: number, month: number) {
  this.analyticsService.getGenderBasedAnalytics(year, month).subscribe(
    (data) => {
      this.genderBasedData = data?.genderBased || {
        male: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
        female: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
      };

      this.chartTitle = `Gender-Based Submissions, Approval, and Rejection Rates for ${this.monthNames[month - 1]} ${year}`;
      this.createGenderBarChart();
    },
    (error) => {
      console.error('Error fetching gender-based analytics:', error);
    }
  );
}


// Fetch and create the year-level pie chart
private fetchYearLevelCounts() {
  this.analyticsService.getYearLevelCounts().subscribe(
    (response) => {

      if (response && response.length > 0) {
        this.yearLevelData = response; 

        this.yearLevelCounts = this.yearLevelData.map((item) => item.count);
        this.yearLevelLabels = this.yearLevelData.map((item) => item.yearLevel);


        if (this.yearLevelCounts.length > 0) {
          this.createYearLevelPieChart();
        } else {
          console.warn('Year level counts are empty or missing.');
        }
      } else {
        console.error('Response does not have the expected structure or is empty.', response);
      }
    },
    (error) => {
      console.error('Error fetching year level counts:', error);
    }
  );
}


private fetchPaymentMethodAnalytics() {
  this.analyticsService.getPaymentMethodAnalytics().subscribe(
    (response: { paymentMethod: string; count: number }[]) => {
      if (response && response.length > 0) {
        const paymentCategories: { [key: string]: number } = {
          'Cash': 0,
          'Online': 0,
          'Bank Transfer': 0
        };

        // Group payments by category using bracket notation
        response.forEach((item: { paymentMethod: string; count: number }) => {
          if (paymentCategories[item.paymentMethod] !== undefined) {
            paymentCategories[item.paymentMethod] += item.count;
          }
        });

        // Assign data for chart
        this.paymentMethodLabels = Object.keys(paymentCategories);
        this.paymentMethodCounts = Object.values(paymentCategories);

        if (this.paymentMethodCounts.length > 0) {
          this.createPaymentMethodChart();
        } else {
          console.warn('Payment method counts are empty or missing.');
        }
      } else {
        console.error('Response does not have the expected structure or is empty.', response);
      }
    },
    (error) => {
      console.error('Error fetching payment method analytics:', error);
    }
  );
}



private fetchTopProvinces() {
  this.analyticsService.getProvinceAnalytics().subscribe(
    (data) => {
      if (data && Array.isArray(data)) {
        // Sort provinces by count in descending order and select the top 5
        this.provinceData = data.sort((a, b) => b.count - a.count).slice(0, 5);
        this.topProvinces = this.provinceData;
      }
    },
    (error) => {
      console.error('Error fetching province data:', error);
    }
  );
}

 // Method to create the bar chart (Monthly Submissions)
 createMonthlyYearlySubmission() {
  const months = this.submissionsData
    .filter(item => item.submissionCount > 0) 
    .map(item => `${this.monthNames[item.month - 1]}-${item.year}`);
  
  const submissionCounts = this.submissionsData
    .filter(item => item.submissionCount > 0)
    .map(item => item.submissionCount);

  this.monthlyChart = new Chart('analyticsForMonthNYear', {
    type: 'bar',
    data: {
      labels: months, 
      datasets: [{
        label: 'Monthly Submissions',
        data: submissionCounts,
        backgroundColor: '#660018',
        borderRadius: 5,
        barThickness: 100
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { size: 16, family: 'Oswald' }, color: 'black' } },
        tooltip: {
          backgroundColor: 'white',
          titleFont: { size: 16, weight: 500 },
          bodyFont: { size: 14 },
          bodyColor: 'black',
          titleColor: 'black',
          borderWidth: 2,
          borderColor: '#660018'
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: 'black',
          font: { size: 14, family: 'Oswald' },
          formatter: (value) => `${value}`
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 16, family: 'Oswald' },
            color: '#555'
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            font: { size: 16, family: 'Oswald' },
            color: '#555',
            stepSize: 10
          },
          grid: { color: 'rgba(200, 200, 200, 0.5)' },
          beginAtZero: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}



// Method to create the pie chart (Approval/Rejection Rates)
createRejectApprovalRateChart() {
  if (this.pieChart) {
    this.pieChart.destroy();
  }

  const approvalPercentage = parseFloat(this.approvalRate);
  const rejectionPercentage = parseFloat(this.rejectionRate);

  this.pieChart = new Chart('approvalRejectionChart', {
    type: 'pie',
    data: {
      labels: ['Approved', 'Rejected'],
      datasets: [
        {
          data: [approvalPercentage, rejectionPercentage],
          backgroundColor: ['#3B7E56', '#660018'],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 16,
              family: 'Oswald'
            },
            color: 'black'
          }
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => {
              return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`;
            }
          },
          titleFont: { size: 16, weight: 500 },
          bodyFont: { size: 14 },
          borderWidth: 2,
          borderColor: '#660018'
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: 'black',
          font: { size: 14, family: 'Oswald' },
          formatter: (value) => `${value.toFixed(2)}%`
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}



// Method to create the bar chart (Gender-Based Submissions)
createGenderBarChart() {
  if (this.genderChart) {
    this.genderChart.destroy();
  }

  const maleData = this.genderBasedData?.male || { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 };
  const femaleData = this.genderBasedData?.female || { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 };

  const genders = ['Male', 'Female'];
  const totalSubmissions = [maleData.totalSubmissions, femaleData.totalSubmissions];
  const approvedCounts = [maleData.approvedCount, femaleData.approvedCount];
  const rejectedCounts = [maleData.rejectedCount, femaleData.rejectedCount];

  this.genderChart = new Chart('genderSubmissionsChart', {
    type: 'bar',
    data: {
      labels: genders,
      datasets: [
        {
          label: 'Total Submissions',
          data: totalSubmissions,
          backgroundColor: '#FDBE00',
          borderRadius: 5
        },
        {
          label: 'Approved Submissions',
          data: approvedCounts,
          backgroundColor: '#3B7E56',
          borderRadius: 5
        },
        {
          label: 'Rejected Submissions',
          data: rejectedCounts,
          backgroundColor: '#660018',
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            font: { size: 14, family: 'Source Sans 3' },
            color: 'black'
          }
        },
        tooltip: {
          titleFont: { size: 16, weight: 500 },
          bodyFont: { size: 14 },
          borderWidth: 2,
          borderColor: '#660018'
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 16, family: 'Oswald' }, color: '#555' },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 16, family: 'Oswald' }, color: '#555', stepSize: 5 },
          grid: { color: 'rgba(200, 200, 200, 0.5)' },
          beginAtZero: true,
          max: Math.max(...totalSubmissions, ...approvedCounts, ...rejectedCounts) + 1
        }
      }
    }
  });
}



// New method for year-level pie chart
createYearLevelPieChart() {
  this.yearLevelPieChart = new Chart('yearLevelChart', {
    type: 'pie',
    data: {
      labels: this.yearLevelLabels, 
      datasets: [{
        data: this.yearLevelCounts, 
        backgroundColor: [
           '#660018', '#3B7E56', '#FDBE00', '#E49428', '#7954C3', '#59AD42'
        ],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 16, 
              family: 'Oswald' 
            },
            color: 'black' 
          }
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => {
              return `${tooltipItem.label}: ${tooltipItem.raw} students`;
            },
          },
          backgroundColor: 'white', 
          titleFont: {
            size: 16,
            weight: 500
          },
          bodyFont: {
            size: 14
          },
          bodyColor: 'black',
          titleColor: 'black',
          borderWidth: 2,
          borderColor: '#660018' 
        },
      },
    },
  });
}

createPaymentMethodChart() {
  this.paymentMethodChart = new Chart('paymentMethodChart', {
    type: 'bar', 
    data: {
      labels: this.paymentMethodLabels, // Payment methods as labels (e.g., Cash, Online, Bank Transfer)
      datasets: [
        {
          data: this.paymentMethodCounts, // Counts for each payment method
          backgroundColor: ['#660018', '#3B7E56', '#FDBE00'], 
          borderRadius: 5,
          barThickness: 100 
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false, // Hide legend since labels are on X-axis
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => {
              const method = this.paymentMethodLabels[tooltipItem.dataIndex]; // Get method label (Cash, Online, etc.)
              const count = tooltipItem.raw; // Get count
              const percentage = (
                (count / this.paymentMethodCounts.reduce((a, b) => a + b, 0)) *
                100
              ).toFixed(2);
              return `${method}: ${count} (${percentage}%)`; // Display method name + count + percentage
            }
          },
          backgroundColor: 'white',
          titleFont: { size: 16, weight: 500 },
          bodyFont: { size: 14 },
          bodyColor: 'black',
          titleColor: 'black',
          borderWidth: 2,
          borderColor: '#660018'
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: 'black',
          font: { size: 14, family: 'Oswald' },
          formatter: (_value, context) => this.paymentMethodLabels[context.dataIndex], // Use payment method as label
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 16, family: 'Oswald' }, color: '#555' },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 16, family: 'Oswald' }, color: '#555', stepSize: 5 },
          grid: { color: 'rgba(200, 200, 200, 0.5)' },
          beginAtZero: true
        }
      }
    }
  });
}

}
