import { CheatSheetRenderer } from '../cheat-sheet-renderer.js';

export class CheatSheetView {
        constructor(el, path) {
                CheatSheetRenderer.load(el, path)
        }
}