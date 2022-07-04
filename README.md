# PDF → PNGs

> Convert a PDF into a series of PNG images all within the browser for free.

Simple static page using Preact and PDF.js to convert PDFs into PNG files all within the user's browser. Files are not sent to a remote server. No server is necessary.

## Deployment

The site is automatically deployed to [apexal.github.io/dtools](https://apexal.github.io/dtools) on each push to master via a [GitHub Action](https://github.com/Apexal/dtools/actions).

## Planned Features

- [x] Upload PDFs
- [x] Convert each page in PDF to PNG
- [x] Display page PNG sizes
- [x] Download all PNGs in ZIP
- [ ] Choose quality level
- [ ] Set maximum PNG dimensions
- [ ] Option to cut pages into chunks

## Developing

`npm install`

`npm run dev`
