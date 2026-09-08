import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, map, Observable } from 'rxjs';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private baseUrl = 'https://dummyjson.com';

  getEmployees(limit: number, skip: number): Observable<Employee[]> {
    return this.http.get<{ users: Employee[] }>(`${this.baseUrl}/users?limit=${limit}&skip=${skip}`).pipe(
      delay(2000),
      map(response => response.users)
    );
  }
}
