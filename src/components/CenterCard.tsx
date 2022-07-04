import { ComponentChildren } from "preact";

export function CenterCard({ children }: { children: ComponentChildren }) {
  return (
    <div class="relative text-center flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <div class="relative container  bg-white px-6 pt-10 pb-7 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <div class="mx-auto max-w-md">{children}</div>
      </div>
    </div>
  );
}
