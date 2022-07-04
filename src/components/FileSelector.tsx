import clsx from "clsx";
import { useRef, useState } from "preact/hooks";

type FileDropPropTypes = {
  fileTypes: string[];
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

export function FileSelectorDrop({
  fileTypes,
  multiple,
  onFiles,
}: FileDropPropTypes) {
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleDragOver: JSX.DragEventHandler<HTMLDivElement> = (ev) => {
    ev.preventDefault();
    setIsDraggingOver(true);

    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop: JSX.DragEventHandler<HTMLDivElement> = (ev) => {
    // Prevent browser opening file(s)
    ev.stopPropagation();
    ev.preventDefault();
    setIsDraggingOver(false);

    if (!ev.dataTransfer) {
      console.warn("Data transfer is null.");
      return;
    }

    const files = [];

    if (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === "file") {
          const file = ev.dataTransfer.items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        files.push(ev.dataTransfer.files[i]);
      }
    }

    onFiles(files.filter((file) => fileTypes.includes(file.type)));
  };

  const handleFileInputChange: JSX.GenericEventHandler<HTMLInputElement> = (
    ev
  ) => {
    const fileList = ev.currentTarget.files;
    if (!fileList) {
      return;
    }

    const files = [];
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        files.push(fileList[i]);
      }
    }

    ev.currentTarget.value = "";
    onFiles(files);
  };

  return (
    <div
      class={clsx(
        "file-drop w-full h-20 border-dashed border-4 my-3 flex items-center justify-center cursor-pointer",
        isDraggingOver
          ? "border-blue-600 text-blue-600 font-semibold"
          : "border-gray-400 text-gray-500"
      )}
      onDragOver={handleDragOver}
      onDragEnter={() => setIsDraggingOver(true)}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInput.current?.click()}
    >
      <input
        ref={fileInput}
        type="file"
        class="hidden"
        accept={fileTypes.join(", ")}
        multiple={multiple}
        onChange={handleFileInputChange}
      />
      {isDraggingOver
        ? "Drop files here to start"
        : "Click here OR drag files here to start"}
    </div>
  );
}
