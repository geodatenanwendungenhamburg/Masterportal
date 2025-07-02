import { XMLParser } from "fast-xml-parser";

/**
 * Parses an XML string or XMLDocument to JSON using fast-xml-parser.
 * @param {string|XMLDocument} srcDom - XML string or XMLDocument
 * @param {boolean} [attributeValue=true] - (Not used with fast-xml-parser, kept for compatibility)
 * @returns {object} JSON representation
 */
export default function xml2json(srcDom, attributeValue = true) {
    let xmlString = srcDom;
    if (typeof srcDom !== "string") {
        // If srcDom is an XMLDocument or Node, convert it to string
        xmlString = new XMLSerializer().serializeToString(srcDom);
    }
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xmlString);
}


/**
 * Make sure we have Node.children and Element.children available.
 * Internet Explorer 11 Polyfill.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children}
 */
(function (constructor) {
    if (
        constructor
        && constructor.prototype
        && !constructor.prototype.hasOwnProperty.call("children")
    ) {
        Object.defineProperty(constructor.prototype, "children", {
            configurable: true,
            get: function () {
                const nodes = this.childNodes,
                    children = [];

                // iterate all childNodes
                nodes.forEach(function (node) {
                    // remember those that are Node.ELEMENT_NODE (1)
                    if (node.nodeType === 1) {
                        children.push(node);
                    }
                });
                return children;
            }
        });
    }
    // apply the fix to all HTMLElements (window.Element) and to SVG/XML (window.Node)
})(window.Node || window.Element);
