// vim: set ts=4 sw=4:

import { XPath } from "../www/js/feedreader/parsers/xpath";

const parser = new DOMParser();
const doc = parser.parseFromString("<div><p><span>abc</span></p><p>def</p></div>", "application/xml");
const root = doc.firstChild;

test("xpath lookup", () => {
        let text = XPath.lookup(root, "/div/p/span")
        expect(text).toBe("abc");
});

test("xpath lookup fail", () => {
        let text = XPath.lookup(root, "/div/p/form");
        expect(text).toBe(undefined);
});

test("xpath foreach", () => {
        let count = 0;

        XPath.foreach(root, "//form", (node) => { count++ });
        expect(count).toBe(0);

        XPath.foreach(root, "//p", (node) => { count++ });
        expect(count).toBe(2);
});
