const GAP = 5; // px

/**
 * ბლოკის გახსნის შემდეგ ეკრანზე ისე ათავსებს, რომ ხელით სქროლი არ დასჭირდეს:
 *  - ბლოკი ეტევა ეკრანზე → ქვედა ხაზი ეკრანის ბოლოდან 5px-ით ზემოთ
 *  - ბლოკი ეკრანზე მაღალია → ზედა ხაზი ეკრანის თავიდან 5px-ით ქვემოთ
 * მომხმარებლის შეხებისას ან ~3 წამის შემდეგ ავტომატური გასწორება ჩერდება.
 * აბრუნებს გასაჩერებელ ფუნქციას.
 */
export function revealOnOpen(el: HTMLElement): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const events = ["touchstart", "wheel", "keydown", "mousedown"] as const;

  function run() {
    if (!active) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;

    if (r.top >= GAP && r.bottom <= vh - GAP) return; // უკვე მთლიანად ჩანს

    const delta =
      r.height <= vh - 2 * GAP
        ? r.bottom - (vh - GAP) // ქვედა ხაზი → ეკრანის ბოლოდან 5px ზემოთ
        : r.top - GAP; // ზედა ხაზი → ეკრანის თავიდან 5px ქვემოთ

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