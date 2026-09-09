import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Employee } from '../../shared/models/employee';
import { EmployeeService } from '../../shared/services/employee-service';
import { IntersectionObserverDirective } from '../../shared/directives/intersection-observer-directive';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [IntersectionObserverDirective, ReactiveFormsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private employeeService = inject(EmployeeService);
  employees = signal<Employee[]>([]);
  isLoading = signal(false);
  isFetchError = signal(false);
  isNoMoreData = signal(false);

  readonly pageSize = 20;

  searchControl = new FormControl('', { nonNullable: true });

  searchQuery = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
  );

  searchResource = rxResource({
    params: () => ({ query: this.searchQuery() }),
    stream: ({ params }) => this.employeeService.searchEmployees(params?.query ?? ''),
  });

  ngOnInit() {
    this.loadNextPage();
  }

  loadNextPage() {
    if (this.isLoading()) {
      return;
    }
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
