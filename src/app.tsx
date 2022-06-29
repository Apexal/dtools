import * as pdfLib from "pdfjs-dist";
import { TypedArray } from "pdfjs-dist/types/src/display/api";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import Progress from "./progress";

pdfLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

type PDF = {
  name: string;
  pageCount: number;
  uploadProgress: number;
  pages: ConvertedPage[];
};

type ConvertedPage = {
  pageNumber: number;
  objectURL: string | null;
  error: Error | null;
};

export function App() {
  // Refs
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // State
  const [pdf, setPDF] = useState<PDF | null>(null);

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

        const file = ev.currentTarget.files[0];

        // Ensure it is a PDF
        if (file.type && !file.type.endsWith("pdf")) {
          alert("File is not a PDF.");
          return;
        }

        setPDF({
          name: file.name.substring(0, file.name.lastIndexOf(".")),
          uploadProgress: 0,
          pageCount: 0,
          pages: [],
        });

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

          setPDF((prevPDF) => ({ ...prevPDF!, pageCount: doc.numPages }));

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

            const convertedPage: ConvertedPage = {
              pageNumber: pageNum,
              objectURL: null,
              error: null,
            };

            await page.render(renderContext).promise;
            const pngBlob = await new Promise((resolve: BlobCallback) =>
              canvas.current!.toBlob(resolve, "image/png")
            );

            if (!pngBlob) {
              continue;
            }

            convertedPage.objectURL = URL.createObjectURL(pngBlob);

            setPDF((prevPDF) => ({
              ...prevPDF!,
              pages: [...prevPDF!.pages, convertedPage],
            }));
          }
        });

        // Update progress of client upload
        reader.onprogress = (data) => {
          if (data.lengthComputable) {
            const dec = data.loaded / data.total;

            setPDF((prevPDF) => ({
              ...prevPDF!,
              uploadProgress: data.loaded / data.total,
            }));
          }
        };
        reader.readAsArrayBuffer(file);
      },
      [canvas, setPDF]
    );

  // Reset all state
  const restart = useCallback(() => {
    setPDF(null);
  }, []);

  const progressValue = pdf
    ? pdf?.uploadProgress * 25 + (pdf?.pages.length / pdf?.pageCount) * 75
    : 0;

  return (
    <main class="relative text-center flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <div class="relative container  bg-white px-6 pt-10 pb-7 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <div className="mx-auto max-w-md">
          <h1 class="text-3xl font-bold mb-5">PDF → PNGs</h1>

          <Progress
            pdfName={pdf?.name}
            value={progressValue}
            max={100}
            onClick={() => {
              if (pdf !== null) return;
              fileInput.current?.click();
            }}
          />

          <input
            ref={fileInput}
            class="hidden"
            type="file"
            name="pdf-upload"
            id="pdf-upload"
            accept=".pdf"
            onChange={handlePDFUpload}
          />

          <canvas class="hidden" ref={canvas}></canvas>
          {pdf && pdf.pages.length > 0 && (
            <div class="my-5">
              <p class="mb-2 text-gray-500">Click on a page to download it.</p>
              <div class="grid grid-cols-3 gap-4">
                {pdf.pages.map((convertedPage) => (
                  <a
                    key={convertedPage.pageNumber}
                    class="text-center text-gray-700"
                    href={convertedPage.objectURL}
                    download={`${pdf?.name}-page-${convertedPage.pageNumber}.png`}
                  >
                    <div
                      class="w-full h-24 bg-center bg-cover border-2 rounded-lg border-gray-700"
                      style={{
                        backgroundImage: `url(${convertedPage.objectURL})`,
                      }}
                    />
                    Page {convertedPage.pageNumber}
                  </a>
                ))}
              </div>
            </div>
          )}
          {pdf && pdf.pages.length === pdf.pageCount && (
            <button className="text-blue-400 underline" onClick={restart}>
              Reset
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
