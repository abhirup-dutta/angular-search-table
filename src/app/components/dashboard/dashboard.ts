import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Employee } from '../../shared/model/employee';
import { EmployeeService } from '../../shared/service/employee-service';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  private employeeService = inject(EmployeeService);
  employees = signal<Employee[]>([]);
  isLoading = signal(true);
  isFetchError = signal(false);
  isNoMoreData = signal(false);

  readonly pageSize = 20;

  ngOnInit() {
    this.employeeService.getEmployees(this.pageSize, 0).subscribe({
      next: (data) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: (err) => this.isFetchError.set(true),
    });
  }

  loadNextPage() {
    this.isLoading.set(true);
    this.employeeService.getEmployees(this.pageSize, this.employees().length).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.isNoMoreData.set(true);
        }
        this.employees.set([...this.employees(), ...data]);
        this.isLoading.set(false);
      },
      error: (err) => this.isFetchError.set(true),
    });
  }
}
