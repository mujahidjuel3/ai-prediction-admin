export interface Department {
  id: string;
  name: string;
  code: string;
  headTeacherId: string;
}

export interface DepartmentInput {
  name: string;
  code: string;
  headTeacherId: string;
}
