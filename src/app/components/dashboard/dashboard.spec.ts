import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { EmployeeService } from '../../shared/services/employee-service';
import { of } from 'rxjs';
import { Employee } from '../../shared/models/employee';
import { By } from '@angular/platform-browser';

describe('Dashboard Component Autocomplete', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockEmployeeService: any;

  const mockEmployees: Employee[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      age: 30,
      company: { name: 'Acme Corp' },
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      age: 28,
      company: { name: 'Tech Solutions' },
    },
  ];

  beforeEach(async () => {
    (globalThis as any).IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };

    mockEmployeeService = {
      getEmployees: vi.fn().mockReturnValue(of([])),
      searchEmployees: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should not display autocomplete dropdown when searchControl is empty', () => {
    component.searchControl.setValue('');
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.css('.autocomplete-dropdown'));
    expect(dropdown).toBeNull();
  });

  it('should display suggestion items inside search-box-container when searchControl has value and employees are present', () => {
    component.searchControl.setValue('Jo');
    component.employees.set(mockEmployees);
    component.isLoading.set(false);
    component.isFetchError.set(false);
    fixture.detectChanges();

    const searchBoxContainer = fixture.debugElement.query(By.css('.search-box-container'));
    expect(searchBoxContainer).toBeTruthy();

    const dropdown = searchBoxContainer.query(By.css('.autocomplete-dropdown'));
    expect(dropdown).toBeTruthy();

    const items = dropdown.queryAll(By.css('.suggestion-item'));
    expect(items.length).toBe(2);
    expect(items[0].nativeElement.textContent.trim()).toBe('John Doe');
    expect(items[1].nativeElement.textContent.trim()).toBe('Jane Smith');
  });

  it('should update searchControl value when a suggestion is clicked', () => {
    component.searchControl.setValue('Jo');
    component.employees.set(mockEmployees);
    component.isLoading.set(false);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.suggestion-item'));
    items[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.searchControl.value).toBe('John Doe');
  });

  it('should not display dropdown or "No results found" when searchControl has value and employees list is empty', () => {
    component.searchControl.setValue('Unknown');
    component.employees.set([]);
    component.isLoading.set(false);
    component.isFetchError.set(false);
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.css('.autocomplete-dropdown'));
    expect(dropdown).toBeNull();
  });

  it('should hide autocomplete dropdown when Enter is pressed in the search input', () => {
    component.searchControl.setValue('Jo');
    component.employees.set(mockEmployees);
    component.isLoading.set(false);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.autocomplete-dropdown'))).toBeTruthy();

    const input = fixture.debugElement.query(By.css('#search-box'));
    input.triggerEventHandler('keydown.enter', {});
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.autocomplete-dropdown'))).toBeNull();
  });

  it('should hide autocomplete dropdown when a suggestion is selected', () => {
    component.searchControl.setValue('Jo');
    component.employees.set(mockEmployees);
    component.isLoading.set(false);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.suggestion-item'));
    items[0].nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.autocomplete-dropdown'))).toBeNull();
  });

  it('should display error message when isFetchError is true', () => {
    component.searchControl.setValue('Test');
    component.employees.set([]);
    component.isLoading.set(false);
    component.isFetchError.set(true);
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.css('.autocomplete-dropdown'));
    expect(dropdown).toBeTruthy();
    expect(dropdown.nativeElement.textContent).toContain('Error loading suggestions');
  });

  it('should display loading message when isLoading is true', () => {
    component.searchControl.setValue('Test');
    component.isLoading.set(true);
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.css('.autocomplete-dropdown'));
    expect(dropdown).toBeTruthy();
    expect(dropdown.nativeElement.textContent).toContain('Loading suggestions...');
  });
});
