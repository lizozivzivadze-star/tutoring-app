const GAP = 5; // px
const TOP_GAP = 10; // px — ბლოკის დაშორება ეკრანის ზედა კიდიდან
const FIT_MARGIN = 30; // px — "ეტევა", თუ ეკრანზე ამდენით მაინც დაბალია

/**
 * ბლოკის გახსნის შემდეგ ეკრანზე ისე ათავსებს, რომ ხელით სქროლი არ დასჭირდეს.
 * mode:
 *  - "auto" (ნაგულისხმევი):
 *      ბლოკი ეტევა ეკრანზე → ქვედა ხაზი ეკრანის ბოლოდან 5px-ით ზემოთ;
 *      ბლოკი ეკრანზე მაღალია → ზედა ხაზი ეკრანის თავიდან 5px-ით ქვემოთ
 *  - "with-next": ბლოკი + მის ქვემოთ მომდევნო ბლოკი ეკრანზე 30px-ით
 *      დაბალია → ორივე გამოჩნდეს; სხვა შემთხვევაში ზედა ხაზი თავიდან 10px-ზე
 *  - "top": ზედა ხაზი ყოველთვის ეკრანის თავიდან 10px-ით ქვემოთ
 * მომხმარებლის შეხებისას ან ~3 წამის შემდეგ ავტომატური გასწორება ჩერდება.
 * აბრუნებს გასაჩერებელ ფუნქციას.
 */
export function revealOnOpen(
  el: HTMLElement,
  mode: "auto" | "with-next" | "top" = "auto"
): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const events = ["touchstart", "wheel", "keydown", "mousedown"] as const;

  function run() {
    if (!active) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    let delta: number;

    if (mode === "top") {
      delta = r.top - TOP_GAP; // ზედა ხაზი → ეკრანის თავიდან 10px ქვემოთ
    } else if (mode === "with-next") {
      const next = el.nextElementSibling as HTMLElement | null;
      const bottom = next ? next.getBoundingClientRect().bottom : r.bottom;
      if (bottom - r.top <= vh - FIT_MARGIN) {
        if (r.top >= GAP && bottom <= vh - GAP) return; // უკვე ორივე ჩანს
        delta = bottom - (vh - GAP); // მომდევნო ბლოკის ქვედა ხაზი → ბოლოდან 5px ზემოთ
      } else {
        delta = r.top - TOP_GAP; // ზედა ხაზი → ეკრანის თავიდან 10px ქვემოთ
      }
    } else {
      if (r.top >= GAP && r.bottom <= vh - GAP) return; // უკვე მთლიანად ჩანს
      delta =
        r.height <= vh - 2 * GAP
          ? r.bottom - (vh - GAP) // ქვედა ხაზი → ეკრანის ბოლოდან 5px ზემოთ
          : r.top - GAP; // ზედა ხაზი → ეკრანის თავიდან 5px ქვემოთ
    }

    if (Math.abs(delta) < 1) return;
    window.scrollBy({ top: delta, behavior: "smooth" });
  }

  function stop() {
    active = false;
    ro.disconnect();
    if (timer) clearTimeout(timer);
    events.forEach((ev) => window.removeEventListener(ev, stop));
  }

  const ro = new ResizeObserver(run); // მონაცემების ჩატვირთვისას სიმაღლე იცვლება
  ro.observe(el);
  events.forEach((ev) =>
    window.addEventListener(ev, stop, { passive: true })
  );
  timer = setTimeout(stop, 3000);

  requestAnimationFrame(() => requestAnimationFrame(run));
  return stop;
}