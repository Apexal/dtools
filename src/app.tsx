import * as pdfLib from "pdfjs-dist";
import { TypedArray } from "pdfjs-dist/types/src/display/api";
import { useCallback, useRef, useState } from "preact/hooks";

pdfLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export function App() {
  const canvas = useRef<OffscreenCanvas>(new OffscreenCanvas(100, 100));
  const [pageObjectUrls, setPageObjectUrls] = useState<string[]>([]);

  const handlePDFUpload: JSX.GenericEventHandler<HTMLInputElement> =
    useCallback((ev) => {
      // Cancel if no files are uploaded OR canvas is not loaded
      if (
        !ev.currentTarget.files ||
        ev.currentTarget.files.length < 1 ||
        !canvas.current
      ) {
        return;
      }

      const newPageObjectUrls: string[] = [];

      const file = ev.currentTarget.files[0];

      // Ensure it is a PDF
      if (file.type && file.type !== "image/pdf") {
        console.log("File is not a PDF.", file.type, file);
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        if (!canvas.current) {
          return;
        }

        const loadingTask = pdfLib.getDocument(
          event.target!.result as TypedArray
        );

        // Load PDF document into pdf.js
        const doc = await loadingTask.promise;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);

          const canvasContext = canvas.current.getContext("2d")!;
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.current.height = viewport.height;
          canvas.current.width = viewport.width;

          var renderContext = {
            canvasContext,
            viewport,
          };

          await page.render(renderContext).promise;

          const pngBlob = await canvas.current.convertToBlob({
            type: "image/png",
          });
          newPageObjectUrls.push(URL.createObjectURL(pngBlob));
        }

        setPageObjectUrls(newPageObjectUrls);
      });
      reader.readAsArrayBuffer(file);
    }, []);

  return (
    <main>
      <h1 class="text-3xl font-bold underline">PDF 2 PNG</h1>
      <input
        type="file"
        name="pdf-upload"
        id="pdf-upload"
        accept=".pdf"
        onChange={handlePDFUpload}
      />

      {pageObjectUrls.map((url, index) => (
        <a key={index} href={url} download={`page-${index + 1}.png`}>
          <button>Download Page {index + 1}</button>
        </a>
      ))}
    </main>
  );
}
