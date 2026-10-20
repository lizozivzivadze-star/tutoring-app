"use client";

import { useEffect } from "react";

// 1) ქვემოთ 50px ("?" ღილაკისთვის) ემატება მხოლოდ მაშინ,
//    როცა გვერდი ეკრანზე მაღალია, ანუ ისედაც სქროლდება.
// 2) როცა გვერდი ეკრანში ეტევა, შეხებით სქროლი/"რეზინის" ეფექტი იბლოკება.
export default function BottomSpace() {
  useEffect(() => {
    const body = document.body;

    function update() {
      body.style.paddingBottom = "0px";
      const overflows =
        document.documentElement.scrollHeight > window.innerHeight + 1;
      body.style.paddingBottom = overflows ? "50px" : "0px";
    }

    // შიგნით სქროლირებადი ელემენტი (სია, ფანჯარა, ველი, ჰორიზონტალური ზოლი)
    function canScrollInside(el: Element | null) {
      while (el && el !== document.body && el !== document.documentElement) {
        const s = getComputedStyle(el);
        if (
          (s.overflowY === "auto" || s.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          return true;
        }
        if (
          (s.overflowX === "auto" || s.overflowX === "scroll") &&
          el.scrollWidth > el.clientWidth
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return; // ორი თითით zoom-ს ნუ ვუშლით
      const fits =
        document.documentElement.scrollHeight <= window.innerHeight + 1;
      if (!fits) return;
      if (canScrollInside(e.target as Element)) return;
      e.preventDefault();
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(body);
    window.addEventListener("resize", update);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("touchmove", onTouchMove);
      body.style.paddingBottom = "";
    };
  }, []);

  return null;
}