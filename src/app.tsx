import { Link, Route, Router, Switch } from "wouter";
import { CenterCard } from "./components/CenterCard";

import { PDFtoPNG } from "./pdftopng";

/** From deployed GitHub Pages, url. Needs to match with value in vite.config.ts */
const baseURL = "/pdf-to-png";

export function App() {
  return (
    <Router base={baseURL}>
      <header class="bg-gray-800 p-6 text-white opacity-90 fixed top-0 left-0 w-screen z-10">
        <nav class="container mx-auto flex space-x-8">
          <Link href="/pdf-to-png">
            <a>PDF → PNGs</a>
          </Link>
          <Link href="/resize-images">
            <a>Resize Images</a>
          </Link>
        </nav>
      </header>
      <main>
        <CenterCard>
          <Switch>
            <Route path="/pdf-to-png" component={PDFtoPNG} />
            <Route>
              <p class="font-semibold">Page not found.</p>
            </Route>
          </Switch>
        </CenterCard>
      </main>
    </Router>
    // </>
  );
}
