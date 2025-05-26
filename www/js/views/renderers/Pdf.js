import * as pdfjsLib from '../../vendor/pdf.mjs'
import * as pdfjsViewer from '../../vendor/pdf_viewer/pdf_viewer.mjs'

export class PdfRenderer {
	static async load(e, d) {
		e.innerHTML = `
			<div id="viewerContainer">
				<div id="viewer" class="pdfViewer"></div>
			</div>
		`;

		const container = e.querySelector('#viewerContainer');
		container.style = 'position: absolute; width: 100%; height: 100%; overflow: auto;';

		// the following code is derived from https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.mjs
		pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.mjs';

		const DEFAULT_URL = d.baseUrl + '/' + d.baseName;
		const ENABLE_XFA = true;
		const SEARCH_FOR = "";
		const SANDBOX_BUNDLE_SRC = new URL(
			"../../vendor/pdf.sandbox.mjs",
			window.location
		);

		const eventBus = new pdfjsViewer.EventBus();

		// (Optionally) enable hyperlinks within PDF files.
		const pdfLinkService = new pdfjsViewer.PDFLinkService({
			eventBus,
		});

		// (Optionally) enable find controller.
		const pdfFindController = new pdfjsViewer.PDFFindController({
			eventBus,
			linkService: pdfLinkService,
		});

		// (Optionally) enable scripting support.
		const pdfScriptingManager = new pdfjsViewer.PDFScriptingManager({
			eventBus,
			sandboxBundleSrc: SANDBOX_BUNDLE_SRC,
		});

		const pdfViewer = new pdfjsViewer.PDFViewer({
			container,
			eventBus,
			linkService: pdfLinkService,
			findController: pdfFindController,
			scriptingManager: pdfScriptingManager,
		});
		pdfLinkService.setViewer(pdfViewer);
		pdfScriptingManager.setViewer(pdfViewer);

		eventBus.on("pagesinit", function () {
			// We can use pdfViewer now, e.g. let's change default scale.
			pdfViewer.currentScaleValue = "page-width";

			// We can try searching for things.
			if (SEARCH_FOR) {
				eventBus.dispatch("find", { type: "", query: SEARCH_FOR });
			}
		});

		// Loading document.
		const loadingTask = pdfjsLib.getDocument({
			url: DEFAULT_URL,
			enableXfa: ENABLE_XFA,
		});

		const pdfDocument = await loadingTask.promise;
		// Document loaded, specifying document for the viewer and
		// the (optional) linkService.
		pdfViewer.setDocument(pdfDocument);

		pdfLinkService.setDocument(pdfDocument, null);
	}
}