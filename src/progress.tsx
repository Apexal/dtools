/** Pseudo progress bar element that displays text and has an animated progress value. */
export default function Progress(props: {
  text?: string;
  value: number;
  errorMessage?: string;
  max: number;
  onClick?: () => void;
}) {
  const percent =
    (((isNaN(props.value) ? 0 : props.value) / props.max) * 100).toFixed(0) +
    "%";

  const text = props.errorMessage ?? props.text;

  return (
    <div
      class={`rounded-full h-10 relative max-w-xl overflow-hidden ${
        props.onClick ? "cursor-pointer" : ""
      }`}
      onClick={props.onClick}
    >
      <div
        class={`w-full h-full ${
          props.errorMessage ? "bg-red-300" : "bg-gray-200"
        } absolute`}
      ></div>
      <div
        className="h-full absolute transition-all duration-1000 bg-green-500"
        style={{ width: percent }}
      ></div>
      <div
        class={`w-full top-1/2 -translate-y-1/2 absolute ${
          props.text ? "text-white" : "text-gray-500"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
