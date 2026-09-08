export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  company: {
    name: string;
  };
}
