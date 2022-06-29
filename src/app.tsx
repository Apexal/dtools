import * as pdfLib from "pdfjs-dist";
import { TypedArray } from "pdfjs-dist/types/src/display/api";
import { useCallback, useRef, useState } from "preact/hooks";

pdfLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

export function App() {
  // Refs
  const canvas = useRef<OffscreenCanvas>(new OffscreenCanvas(100, 100));
  const fileInput = useRef<HTMLInputElement>(null);

  // State
  const [pdfName, setPDFName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [pageObjectUrls, setPageObjectUrls] = useState<string[]>([]);

  // Event handlers
  const handlePDFUpload: JSX.GenericEventHandler<HTMLInputElement> =
    useCallback(
      (ev) => {
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
        if (file.type && file.type.endsWith("pdf")) {
          alert("File is not a PDF.");
          return;
        }

        setPDFName(file.name.substring(0, file.name.lastIndexOf(".")));

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

          // Iterate through pages and render them to canvas to obtain image blob
          for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum);

            const canvasContext = canvas.current.getContext("2d")!;
            const viewport = page.getViewport({ scale: 3 });
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

            // Store image blob object URL
            newPageObjectUrls.push(URL.createObjectURL(pngBlob));
          }

          setPageObjectUrls(newPageObjectUrls);
        });

        // Update progress of client upload
        reader.onprogress = (data) => {
          if (data.lengthComputable) {
            const dec = data.loaded / data.total;

            setUploadProgress(data.loaded / data.total);
          }
        };
        reader.readAsArrayBuffer(file);
      },
      [canvas, setPageObjectUrls]
    );

  // Reset all state
  const restart = useCallback(() => {
    setPDFName(null);
    setPageObjectUrls([]);
    setUploadProgress(0);
  }, []);

  return (
    <main class="relative text-center flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <div class="relative container  bg-white px-6 pt-10 pb-7 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <div className="mx-auto max-w-md">
          <h1 class="text-3xl font-bold mb-5">PDF → PNG</h1>

          <div
            class={`rounded-full h-10 relative max-w-xl overflow-hidden ${
              pdfName ? "" : "cursor-pointer"
            }`}
            onClick={() => {
              if (pdfName) return;
              fileInput.current?.click();
            }}
          >
            <div class="w-full h-full bg-gray-200 absolute"></div>
            <div
              className="h-full bg-green-500 absolute transition-all duration-1000"
              style={{ width: (uploadProgress * 100).toFixed(0) + "%" }}
            ></div>
            <div
              class={`w-full top-1/2 -translate-y-1/2 absolute ${
                pdfName ? "text-white" : "text-gray-500"
              }`}
            >
              {pdfName ?? "Select PDF to Start"}
            </div>
          </div>

          <input
            ref={fileInput}
            class="hidden"
            type="file"
            name="pdf-upload"
            id="pdf-upload"
            accept=".pdf"
            onChange={handlePDFUpload}
          />

          {pageObjectUrls.length > 0 && (
            <div class="my-5">
              <p class="mb-2 text-gray-500">
                Click on the pages below to download them as PNGs.
              </p>
              <div class="grid grid-cols-3 gap-4">
                {pageObjectUrls.map((url, index) => (
                  <a
                    class="text-center text-gray-700"
                    href={url}
                    download={`${pdfName}-page-${index + 1}.png`}
                  >
                    <div
                      class="w-full h-24 bg-center bg-cover border-2 rounded-lg border-gray-700"
                      style={{
                        backgroundImage: `url(${url})`,
                      }}
                    />
                    Page {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {pdfName && uploadProgress === 1 && (
            <button className="text-blue-400 underline" onClick={restart}>
              Restart
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
