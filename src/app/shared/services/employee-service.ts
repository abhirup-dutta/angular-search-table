import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private baseUrl = 'https://dummyjson.com';

  getEmployees(limit: number, skip: number): Observable<Employee[]> {
    return this.http.get<{ users: Employee[] }>(`${this.baseUrl}/users?limit=${limit}&skip=${skip}`).pipe(
      delay(1000),
      map(response => response.users)
    );
  }

  searchEmployees(query: string, limit: number, skip: number): Observable<Employee[]> {
    if (!query) {
      return of([]);
    }
    // Backend doesn't allow spaces in query or multiple words
    let fetchQuery = query.split(' ')[0];
    return this.http.get<{ users: Employee[] }>(`${this.baseUrl}/users/search?q=${fetchQuery}&limit=${limit}&skip=${skip}`).pipe(
      // Test delay to ensure the application handles this properly
      delay(500),
      map(response => response.users)
    );
  }
}
