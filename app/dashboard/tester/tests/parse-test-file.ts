import type { QuestionDraft } from "./types";

// ტექსტი "(სწორია)" პასუხის ბოლოში: ეს მონიშნავს სწორ პასუხს და ატვირთვისას იშლება
const CORRECT_MARK = /\s*\(\s*სწორია\s*\)\s*$/;

export type ParsedTest = { title: string; questions: QuestionDraft[] };

export type ParseResult =
  | { ok: true; test: ParsedTest }
  | { ok: false; errors: string[] };

export function parseTestText(raw: string): ParseResult {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  let i = 0;
  while (i < lines.length && lines[i] === "") i++;
  if (i >= lines.length) return { ok: false, errors: ["ფაილი ცარიელია"] };

  // პირველი სტრიქონი = ტესტის სათაური
  const title = lines[i++];

  // დანარჩენი: ცარიელი სტრიქონით გამოყოფილი ბლოკები (შეკითხვა + პასუხები)
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (; i < lines.length; i++) {
    if (lines[i] === "") {
      if (cur.length) {
        blocks.push(cur);
        cur = [];
      }
    } else {
      cur.push(lines[i]);
    }
  }
  if (cur.length) blocks.push(cur);

  if (blocks.length === 0) {
    return { ok: false, errors: ["ფაილში შეკითხვები ვერ მოიძებნა"] };
  }

  const errors: string[] = [];
  const questions: QuestionDraft[] = [];

  blocks.forEach((block, idx) => {
    const n = idx + 1;
    const prompt = block[0];
    const optionLines = block.slice(1);
    const label = `შეკითხვა ${n} („${prompt.slice(0, 30)}${prompt.length > 30 ? "…" : ""}“)`;

    if (optionLines.length < 2) {
      errors.push(`${label}: მინიმუმ 2 პასუხი სჭირდება`);
      return;
    }
    if (optionLines.length > 4) {
      errors.push(
        `${label}: ${optionLines.length} პასუხია, მაქსიმუმ 4 შეიძლება (თუ პასუხებს შორის ცარიელი სტრიქონი გაქვს, ამოიღე)`
      );
      return;
    }

    const options = optionLines.map((line) => ({
      clientId: crypto.randomUUID(),
      text: line.replace(CORRECT_MARK, "").trim(),
      isCorrect: CORRECT_MARK.test(line),
    }));

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      errors.push(`${label}: სწორი პასუხი არ არის მონიშნული „(სწორია)“-თი`);
      return;
    }
    if (correctCount > 1) {
      errors.push(`${label}: ${correctCount} პასუხი აქვს მონიშნული სწორად, უნდა იყოს მხოლოდ ერთი`);
      return;
    }

    questions.push({ clientId: crypto.randomUUID(), prompt, options });
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, test: { title, questions } };
}