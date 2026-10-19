"use client";

import { useEffect } from "react";

// ქვემოთ 50px ("?" ღილაკისთვის) ემატება მხოლოდ მაშინ,
// როცა გვერდი ეკრანზე მაღალია, ანუ ისედაც სქროლდება.
export default function BottomSpace() {
  useEffect(() => {
    const body = document.body;

    function update() {
      body.style.paddingBottom = "0px";
      const overflows =
        document.documentElement.scrollHeight > window.innerHeight + 1;
      body.style.paddingBottom = overflows ? "50px" : "0px";
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(body);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      body.style.paddingBottom = "";
    };
  }, []);

  return null;
}