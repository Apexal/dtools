/** Pseudo progress bar element that displays text and has an animated progress value. */
export default function Progress(props: {
  pdfName: string | null;
  value: number;
  max: number;
  onClick: () => void;
}) {
  const percent =
    (((isNaN(props.value) ? 0 : props.value) / props.max) * 100).toFixed(0) +
    "%";

  return (
    <div
      class={`rounded-full h-10 relative max-w-xl overflow-hidden ${
        props.pdfName ? "" : "cursor-pointer"
      }`}
      onClick={props.onClick}
    >
      <div class="w-full h-full bg-gray-200 absolute"></div>
      <div
        className="h-full bg-green-500 absolute transition-all duration-1000"
        style={{ width: percent }}
      ></div>
      <div
        class={`w-full top-1/2 -translate-y-1/2 absolute ${
          props.pdfName ? "text-white" : "text-gray-500"
        }`}
      >
        {props.pdfName ?? "Select PDF to Start"}
      </div>
    </div>
  );
}
