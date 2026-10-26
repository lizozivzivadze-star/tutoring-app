// გადაადგილების ხატულა (⠿-ის მაგივრად): SVG, ამიტომ ყველა ეკრანზე ერთნაირად
// მკვეთრია და ფონტზე არ არის დამოკიდებული. ზომა: 20×20, როგორც სხვა ხატულები.
export default function DragHandleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      {[6.5, 13.5].map((x) =>
        [4.5, 10, 15.5].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" />
        ))
      )}
    </svg>
  );
}
