export type StudentRecord = {
  id: string;
  name: string | null;
  surname: string | null;
  contact: string | null;
  email: string;
  accessCode: string;
  order: number;
  groupId: string | null;
};

export type GroupRecord = {
  id: string;
  name: string;
  order: number;
  students: StudentRecord[];
};
