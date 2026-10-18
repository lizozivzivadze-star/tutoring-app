import Image from "next/image";

export default function LogoLink() {
  return (
    <a href="/" aria-label="Tvinion" className="shrink-0">
      <Image
        src="/tvinion-logo.png"
        alt="Tvinion"
        width={900}
        height={224}
        className="w-32 h-auto"
      />
    </a>
  );
}