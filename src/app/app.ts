import { Component} from '@angular/core';
import {EmployeeForm} from './components/employee-form/employee-form';

@Component({
  selector: 'app-root',
  imports: [EmployeeForm],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
