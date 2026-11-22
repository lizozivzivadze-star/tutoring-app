// .ru დომენის მეილით რეგისტრაცია ყოველთვის იბლოკება
// (ღია რეგისტრაციისას და მასწავლებლის/ტესტერის მიერ მოსწავლის დამატებისასაც).
export const RU_BLOCK_MESSAGE =
  "უკაცრავად, .ru დომენის მქონე E-mail-ით ვერ დარეგისტრირდებით. გთხოვთ გამოიყენოთ Gmail ან რომელიმე სხვა Email პროვაიდერი.";

export function isRuEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  return domain.endsWith(".ru");
}
