import JSZip from "jszip";
import { saveAs } from "file-saver";

import * as pdfLib from "pdfjs-dist";
import { TypedArray } from "pdfjs-dist/types/src/display/api";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import Progress from "./progress";

pdfLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

type PDF = {
  name: string;
  pageCount: number;
  error: Error | null;
  uploadProgress: number;
  pages: ConvertedPage[];
};

type ConvertedPage = {
  pageNumber: number;
  blob: Blob | null;
  /** Local url to image (if success) */
  objectURL: string | null;
  /** Size in bytes of image blob */
  size: number;
  /** Possible error that occurred when converting */
  error: Error | null;
};

/** Formats a number of bytes into a human-readable label. */
function formatBytes(n: number) {
  const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let l = 0;
  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

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

        // Reset file input so we can select the same file again
        ev.currentTarget.value = "";

        // Ensure the selected file claims to be a PDF
        if (file.type && !file.type.endsWith("pdf")) {
          setPDF({
            name: file.name.substring(0, file.name.lastIndexOf(".")),
            uploadProgress: 0,
            pageCount: 0,
            pages: [],
            error: new Error("File is not a PDF! Please select a PDF."),
          });
          return;
        }

        setPDF({
          name: file.name.substring(0, file.name.lastIndexOf(".")),
          uploadProgress: 0,
          pageCount: 0,
          pages: [],
          error: null,
        });

        // Read file content
        const reader = new FileReader();
        reader.addEventListener("load", async (event) => {
          if (!canvas.current) {
            return;
          }

          // Attempt to load PDF document into pdf.js
          let doc: pdfLib.PDFDocumentProxy;
          try {
            doc = await pdfLib.getDocument(event.target!.result as TypedArray)
              .promise;
          } catch (error) {
            // Probably not valid PDF
            console.error(error);
            setPDF((prevPDF) => ({
              ...prevPDF!,
              error: new Error("Invalid PDF. Please try another."),
            }));
            return;
          }

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
              size: 0,
              blob: null,
              objectURL: null,
              error: null,
            };

            try {
              await page.render(renderContext).promise;
              const pngBlob = await new Promise((resolve: BlobCallback) =>
                canvas.current!.toBlob(resolve, "image/png")
              );
              if (!pngBlob) {
                throw new Error("Failed to convert to PNG.");
              }

              convertedPage.size = pngBlob.size;
              convertedPage.blob = pngBlob;
              convertedPage.objectURL = URL.createObjectURL(pngBlob);
            } catch (error) {
              console.error(error);
              convertedPage.error = error as Error;
            }

            setPDF((prevPDF) => ({
              ...prevPDF!,
              pages: [...prevPDF!.pages, convertedPage],
            }));
          }
        });

        // Update progress of client upload
        reader.onprogress = (data) => {
          if (data.lengthComputable) {
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

  /** Generates and prompts the user to download a ZIP file with all non-error page PNGs. */
  const downloadAll = useCallback(async () => {
    if (!pdf) return;

    const zip = new JSZip();

    for (const page of pdf.pages) {
      if (!page.error && page.blob) {
        zip.file(`${pdf.name}-page-${page.pageNumber}.png`, page.blob);
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, pdf.name + "-pages.zip");
  }, [pdf]);

  const progressValue = pdf
    ? pdf?.uploadProgress * 25 + (pdf?.pages.length / pdf?.pageCount) * 75
    : 0;

  return (
    <main class="relative text-center flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <div class="relative container  bg-white px-6 pt-10 pb-7 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <div className="mx-auto max-w-md">
          <h1 class="text-3xl font-bold mb-5">PDF → PNGs</h1>

          <Progress
            text={pdf?.name ?? "Select a PDF to Start"}
            errorMessage={pdf?.error?.message}
            value={progressValue}
            max={100}
            onClick={() => {
              if (pdf === null || pdf.error) {
                fileInput.current?.click();
              } else if (
                confirm("Reset? This will clear the pages you currently have.")
              ) {
                setPDF(null);
              }
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

          {/* Hidden canvas for rendering */}
          <canvas class="hidden" ref={canvas}></canvas>

          {pdf && pdf.pages.length > 0 && (
            <div class="my-5">
              {/* <p class="mb-5 text-gray-500">Click on a page to download it.</p> */}
              <div class="grid grid-cols-3 gap-4">
                {pdf.pages.map((convertedPage) => (
                  <a
                    key={convertedPage.pageNumber}
                    title={`Click to download page ${convertedPage.pageNumber} as a PNG`}
                    class="text-center text-gray-700"
                    href={convertedPage.objectURL ?? undefined}
                    download={
                      convertedPage.objectURL
                        ? `${pdf?.name}-page-${convertedPage.pageNumber}.png`
                        : false
                    }
                  >
                    <div
                      class="w-full h-24 bg-center bg-cover border-2 rounded-lg border-gray-700 relative"
                      style={{
                        backgroundImage: `url(${convertedPage.objectURL})`,
                      }}
                    >
                      {convertedPage.error ? (
                        <span className="text-xs absolute left-1 bottom-1 rounded bg-red-400 text-white px-1">
                          error converting
                        </span>
                      ) : (
                        <span className="text-xs absolute left-1 bottom-1 rounded bg-slate-600 text-white px-1 opacity-80">
                          {formatBytes(convertedPage.size)}
                        </span>
                      )}
                    </div>
                    Page {convertedPage.pageNumber}
                  </a>
                ))}
              </div>
            </div>
          )}
          {pdf && !pdf.error && pdf.pages.length === pdf.pageCount && (
            <>
              <button
                className="text-blue-400 hover:text-blue-300 underline mr-4"
                onClick={() => setPDF(null)}
                title={`Clear the current pages and start again.`}
              >
                Reset
              </button>
              <button
                className="text-blue-400 hover:text-blue-300 underline"
                onClick={downloadAll}
                title={`Download all ${pdf.pageCount} pages in a ZIP file.`}
              >
                Download All
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
