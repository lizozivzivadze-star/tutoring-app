export type TestTemplate = "type1" | "type2" | "type3";

export type TestSummary = {
  id: string;
  type: TestTemplate;
  order: number;
  title: string;
  published: boolean;
};

export type ThemeRecord = {
  id: string;
  name: string;
  order: number;
  tests: TestSummary[];
};

export type OptionDraft = {
  id?: string; // present once saved
  clientId: string; // stable key for React before it's saved
  text: string;
  isCorrect: boolean;
};

export type QuestionDraft = {
  id?: string;
  clientId: string;
  prompt: string;
  options: OptionDraft[];
};

export type TestDetail = {
  id: string;
  themeId: string;
  type: TestTemplate;
  title: string;
  instruction: string | null;
  published: boolean;
  locked: boolean;
  questions: {
    id: string;
    prompt: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[];
};

export const TYPES: TestTemplate[] = ["type1", "type2", "type3"];
export const TYPE_LABELS: Record<TestTemplate, string> = {
  type1: "type 1",
  type2: "type 2",
  type3: "type 3",
};
