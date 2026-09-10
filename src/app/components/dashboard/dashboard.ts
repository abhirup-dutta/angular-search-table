import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Employee } from '../../shared/models/employee';
import { EmployeeService } from '../../shared/services/employee-service';
import { IntersectionObserverDirective } from '../../shared/directives/intersection-observer-directive';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [IntersectionObserverDirective, ReactiveFormsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private employeeService = inject(EmployeeService);

  readonly PAGE_SIZE = 20;
  readonly DEBOUNCE_DELAY = 300;

  searchControl = new FormControl('', { nonNullable: true });
  private loadMorePages$ = new Subject<void>();

  employees = signal<Employee[]>([]);
  isLoading = signal(false);
  isFetchError = signal(false);
  isNoMoreData = signal(false);
  showDropdown = signal(true);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        tap(() => this.showDropdown.set(true)),
        debounceTime(this.DEBOUNCE_DELAY),
        distinctUntilChanged(),
        // Set the initial query value to '' so the component fetches data immediately on startup.
        startWith(this.searchControl.value),
        /**
         * When the search term changes:
         * 1. Unsubscribes from and aborts any active/in-flight HTTP requests from the previous searchQuery.
         * 2. Resets UI signals for the fresh search context.
         * 3. Switches to a brand new `loadMorePages$` pagination sub-stream scoped to the new searchQuery.
         */
        switchMap((searchQuery) => {
          // Reset UI signals when a new searchQuery is initiated
          this.employees.set([]);
          this.isNoMoreData.set(false);
          this.isFetchError.set(false);

          /**
           * This is for pagination coordination for a specific search searchQuery.
           */
          return this.loadMorePages$.pipe(
            /**
             *  Instantly emits an initial trigger (`undefined`) into the pipeline.
             *  so that Page 0 is fetched immediately upon component
             *  startup or upon switching search queries, without waiting for a scroll event.
             */
            startWith(void 0),

            /**
             *   If the user rapidly scrolls or triggers multiple intersection events
             *   while an API call is currently in flight, `exhaustMap` ignores all subsequent scroll
             *   triggers until the current request completely finishes. This prevents duplicate page offsets
             *   and duplicate row appends.
             */
            exhaustMap((_, pageIndex) => {
              this.isLoading.set(true);
              this.isFetchError.set(false);

              const offset = pageIndex * this.PAGE_SIZE;

              /**
               * Endpoint Selection:
               * - If `searchQuery` is non-empty, we call the endpoint for search.
               * - If `searchQuery` is empty, we call the endpoint for a simple get.
               */
              const fetchEndPoint$ = searchQuery
                ? this.employeeService.searchEmployees(searchQuery, this.PAGE_SIZE, offset)
                : this.employeeService.getEmployees(this.PAGE_SIZE, offset);

              /**
               * Handles operations for a single page request.
               */
              return fetchEndPoint$.pipe(
                /**
                 * Performs synchronous side effects without altering the stream values.
                 */
                tap({
                  next: (data) => {
                    /**
                     * If initial/reset page, then reset employees with new data,
                     * otherwise append new records to existing employees.
                     */
                    this.employees.update((current) =>
                      pageIndex === 0 ? data : [...current, ...data],
                    );
                    /**
                     * If the items returned are fewer than `pageSize`, then we can infer
                     * that this is the last page and no more pages need to be fetched.
                     */
                    this.isNoMoreData.set(data.length < this.PAGE_SIZE);
                  },
                  error: () => {
                    this.isFetchError.set(true);
                  },
                }),

                /**
                 * Prevents the entire Observable chain from termination due to an uncaught error.
                 * This ensures the user can still search or retry scrolling after a failure.
                 */
                catchError(() => of(null)),

                /**
                 * Whenever the inner Observable completes, errors, or is cancelled,
                 * this guarantees `isLoading` is reliably reset to `false` under all conditions.
                 */
                finalize(() => {
                  this.isLoading.set(false);
                }),
              ); // end of fetch end point pipe
            }), // end of exhaustMap() for pagination control
          ); // end of this.loadMorePages$.pipe
        }), // end of switchMap() for queries
        // Automatically unsubscribes from the entire stream when the component is destroyed.
        takeUntilDestroyed(),
      ) // end of main stream pipe
      .subscribe(); // trigger the observable
  }

  // Used by template IntersectionObserver when the user scrolls to the bottom of the page.
  loadNextPage() {
    if (!this.isLoading() && !this.isNoMoreData()) {
      this.loadMorePages$.next();
    }
  }

  onEnter() {
    this.showDropdown.set(false);
  }

  selectEmployee(employee: Employee | string) {
    const value =
      typeof employee === 'string'
        ? employee
        : `${employee.firstName} ${employee.lastName}`;
    this.searchControl.setValue(value);
    this.showDropdown.set(false);
  }
}
