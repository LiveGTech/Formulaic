/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

const AUI_URL_PREFIX = self.FORMULAIC_AUI_URL_PREFIX || "https://opensource.liveg.tech/Adapt-UI";

var $g = await import(`${AUI_URL_PREFIX}/src/adaptui.js`);
var astronaut = await import(`${AUI_URL_PREFIX}/astronaut/astronaut.js`);

const c = astronaut.components;

const EDITOR_STYLES = new astronaut.StyleGroup([
    new astronaut.StyleSet({
        "outline": "none",
        "caret-color": "transparent"
    })
]);

const INPUT_EDITOR_STYLES = new astronaut.StyleGroup([
    new astronaut.StyleSet({
        "margin-top": "0.2rem",
        "margin-bottom": "0.2rem",
        "padding": "0.5rem",
        "background-color": "var(--secondaryBackground)",
        "color": "var(--secondaryText)",
        "border-radius": "0.5rem"
    })
]);

const INLINE_EDITOR_STYLES = new astronaut.StyleGroup([
    new astronaut.StyleSet({
        "display": "inline-block"
    })
]);

const ATOM_STYLES = new astronaut.StyleGroup([
    new astronaut.StyleSet({
        "display": "inline-block",
        "user-select": "text"
    }),
    new astronaut.StyleSet({
        "user-select": "text"
    }, undefined, "*")
]);

const SLOT_STYLES = new astronaut.StyleGroup([
    new astronaut.StyleSet({
        "display": "inline-block",
        "outline": "none"
    }),
    new astronaut.StyleSet({
        "min-width": "0.5em",
        "background-color": "rgba(0, 0, 0, 0.2)",
        "border-radius": "0.2rem"
    }, ":empty"),
    new astronaut.MediaQueryStyleSet("prefers-color-scheme: dark", {
        "background-color": "rgba(255, 255, 255, 0.2)"
    }, ":empty")
]);

export var FormulaicRichEditor = astronaut.component("FormulaicRichEditor", function(props, children, inter) {
    var editorContainer = c.Container({
        styles: {
            "position": "relative"
        }
    }) ();

    var editor = c.Container({
        ...(props || {}),
        styleSets: [...(props?.styleSets || []), EDITOR_STYLES, ...(!props.inline ? [INPUT_EDITOR_STYLES] : [INLINE_EDITOR_STYLES])],
        attributes: {
            ...(props.attributes || {}),
            "contenteditable": "plaintext-only"
        }
    }) (...children);

    var caret = c.Container({
        styles: {
            "position": "absolute",
            "width": "1px"
        }
    }) ();

    caret.hide();

    editorContainer.add(editor, caret);

    var caretSelectStartAt = null;

    function expandAtomSelectionTowardsStart(thenDelete = false) {
        var selection = document.getSelection();
        var range = selection.getRangeAt(0);

        if (
            (range.startOffset == 0 || (selection.anchorNode.nodeType != Node.TEXT_NODE && range.collapsed)) &&
            selection.anchorNode == range.endContainer && selection.anchorOffset == range.endOffset
        ) {
            var atomBefore = range.startContainer.previousElementSibling;

            if (selection.anchorNode.nodeType != Node.TEXT_NODE && range.collapsed) {
                atomBefore = selection.anchorNode.querySelector(".formulaic_atom:last-child");
            }

            if (!atomBefore || !editor.get().contains(atomBefore)) {
                return false;
            }

            range.setStartBefore(atomBefore);

            selection.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);

            if (thenDelete) {
                selection.deleteFromDocument();
            }

            return true;
        }

        return false;
    };

    function expandAtomSelectionTowardsEnd(thenDelete = false) {
        var selection = document.getSelection();
        var range = selection.getRangeAt(0);

        if (
            (range.endOffset == range.endContainer.textContent.length || (selection.anchorNode.nodeType != Node.TEXT_NODE && range.collapsed)) &&
            selection.anchorNode == range.startContainer && selection.anchorOffset == range.startOffset
        ) {
            var atomAfter = range.endContainer.nextElementSibling;

            if (selection.anchorNode.nodeType != Node.TEXT_NODE && range.collapsed) {
                atomAfter = selection.anchorNode.querySelector(".formulaic_atom:first-child");
            }

            if (!atomAfter) {
                return false;
            }

            range.setEndAfter(atomAfter);

            selection.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);

            if (thenDelete) {
                selection.deleteFromDocument();
            }

            return true;
        }

        return false;
    }

    function applyAtoms() {
        var selection = document.getSelection();

        if (selection.rangeCount == 0) {
            return;
        }

        var range = selection.getRangeAt(0).cloneRange();

        range.collapse(true);
        range.setStart(range.startContainer, 0);

        var previousText = range.toString();
        var matchedAtom = null;
        var matchedText = null;
        var context = {editor};

        props.format.atoms.forEach(function(atom) {
            if (atom.shorthandMatch == null || matchedAtom != null) {
                return false;
            }

            if (atom.shorthandMatch instanceof RegExp) {
                var match = previousText.match(atom.shorthandMatch);

                if (!match) {
                    return false;
                }

                context.match = match;

                matchedText = match[1] || match[0];
            } else {
                if (!previousText.endsWith(atom.shorthandMatch)) {
                    return false;
                }

                matchedText = atom.shorthandMatch;
            }

            matchedAtom = atom;
        });

        if (matchedText == null) {
            return false;
        }

        context.parent = $g.sel(range.endContainer.parentElement);

        var matchStart = range.endContainer.textContent.lastIndexOf(matchedText);
        var matchEnd = matchStart + matchedText.length;
        var elementToInsert = matchedAtom.generator(context);

        range.setStart(range.endContainer, matchStart);
        range.setEnd(range.endContainer, matchEnd);

        range.deleteContents();
        range.insertNode(elementToInsert.get());

        var vacantSlots = elementToInsert.find(".formulaic_atomSlot:empty");

        if (vacantSlots.items().length > 0) {
            range.setStart(vacantSlots.first().get(), 0);
            range.collapse(true);
        } else {
            range.setStartAfter(elementToInsert.get());
            range.setEndAfter(elementToInsert.get());
        }

        selection.removeAllRanges();
        selection.addRange(range);

        return true;
    }

    inter.getEditorArea = function() {
        return editor;
    };

    inter.insertAtom = function(atom, context) {
        var selection = document.getSelection();

        if (selection.rangeCount == 0) {
            return;
        }

        var range = selection.getRangeAt(0);
        var generatedAtom = atom.generator(context);

        range.deleteContents();
        range.insertNode(generatedAtom.get());
    };

    inter.clear = function() {
        editor.clear();
    };

    inter.insertText = function(text) {
        editor.focus();

        document.execCommand("insertText", false, text);

        applyAtoms();
    };

    inter.getExpression = function(options = {}) {
        var copy = editor.copy();

        copy.find(".formulaic_separator").setText(`${options.separator || ","} `);
        copy.find(".formulaic_nonSyntax").remove();

        return copy.getText();
    };

    inter.deleteTowardsStart = function() {
        if (!expandAtomSelectionTowardsStart(true)) {
            document.execCommand("delete");
        }
    };

    inter.deleteTowardsEnd = function() {
        if (!expandAtomSelectionTowardsEnd(true)) {
            document.execCommand("forwardDelete");
        }
    };

    editor.on("keydown", function(event) {
        if ((event.key == "ArrowLeft" && event.shiftKey) || event.key == "Backspace") {
            if (expandAtomSelectionTowardsStart(event.key == "Backspace")) {
                event.preventDefault();
            }
        }

        if ((event.key == "ArrowRight" && event.shiftKey) || event.key == "Delete") {
            if (expandAtomSelectionTowardsEnd(event.key == "Delete")) {
                event.preventDefault();
            }
        }

        caretSelectStartAt = Date.now();
    });

    editor.on("input", function(event) {
        if (applyAtoms()) {
            event.preventDefault();
        }
    });

    requestAnimationFrame(function updateCaret() {
        requestAnimationFrame(updateCaret);

        if (document.activeElement != editor.get() && !editor.get().contains(document.activeElement)) {
            caret.hide();

            caretSelectStartAt = null;

            return;
        }

        var selection = document.getSelection();
        var range = selection.getRangeAt(0);

        if (!range || !selection.isCollapsed) {
            caret.hide();

            return;
        }

        if (editor.getText() == "") {
            caret.hide();
            editor.setStyle("caret-color", "unset");

            return;
        } else {
            editor.setStyle("caret-color", "transparent");
        }

        if (caretSelectStartAt == null) {
            caretSelectStartAt = Date.now();
        }

        var rangeBoundingBox = range.getBoundingClientRect();
        var parentBoundingBox = editorContainer.get().getBoundingClientRect();

        if (range.startContainer != editor.get() && range.startContainer.childNodes.length == 0 && range.startContainer.nodeType == Node.ELEMENT_NODE) {
            rangeBoundingBox = range.startContainer.getBoundingClientRect();
        }

        var caretTop = rangeBoundingBox.top - parentBoundingBox.top;
        var caretLeft = rangeBoundingBox.left - parentBoundingBox.left;

        if (range.startContainer.nodeType == Node.ELEMENT_NODE && range.startOffset > 0) {
            var lastChild = range.endContainer.lastChild;

            if (lastChild.nodeType == Node.TEXT_NODE && lastChild.textContent == "") {
                lastChild = lastChild.previousSibling;
            }

            while (range.comparePoint(lastChild, 0) != -1) {
                lastChild = lastChild.previousSibling;
            }

            if (lastChild.nodeType == Node.ELEMENT_NODE) {
                rangeBoundingBox = range.endContainer.querySelector(":scope > *:last-child").getBoundingClientRect();
                caretLeft = rangeBoundingBox.left + rangeBoundingBox.width - parentBoundingBox.left;
            } else {
                range.setStart(lastChild, lastChild.textContent.length);
                range.setEnd(lastChild, lastChild.textContent.length);

                caretLeft = rangeBoundingBox.left - parentBoundingBox.left;
            }

            caretTop = rangeBoundingBox.top - parentBoundingBox.top;
        }

        if (range.startOffset == 0 && range.startContainer.previousSibling?.nodeType == Node.TEXT_NODE && range.startContainer.previousSibling.textContent == "") {
            rangeBoundingBox = range.startContainer.previousElementSibling.getBoundingClientRect();

            caretTop = rangeBoundingBox.top - parentBoundingBox.top;
            caretLeft = rangeBoundingBox.left + rangeBoundingBox.width - parentBoundingBox.left;
        }

        caret.setStyle("top", `${caretTop}px`);
        caret.setStyle("left", `${caretLeft}px`);
        caret.setStyle("height", `${rangeBoundingBox.height}px`);
        caret.setStyle("background-color", getComputedStyle(editor.get()).color);

        if ((Date.now() - caretSelectStartAt) % 1000 < 500) {
            caret.show();
        } else {
            caret.hide();
        }
    });

    return editorContainer;
});

export var FormulaicAtom = astronaut.component("FormulaicAtom", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props?.classes || []), "formulaic_atom"],
        attributes: {
            ...(props.attributes || {}),
            "contenteditable": "false"
        },
        styleSets: [...(props?.styleSets || []), ATOM_STYLES]
    }) (...children);
});

export var FormulaicAtomSlot = astronaut.component("FormulaicAtomSlot", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props?.classes || []), "formulaic_atomSlot"],
        attributes: {
            ...(props.attributes || {}),
            "contenteditable": "plaintext-only",
        },
        styleSets: [...(props?.styleSets || []), SLOT_STYLES]
    }) (...children);
});

export var FormulaicAtomSyntax = astronaut.component("FormulaicAtomSyntax", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        styles: {
            ...(props?.styles || {}),
            "display": "none",
        }
    }) (...children);
});

export var FormulaicAtomSeparator = astronaut.component("FormulaicAtomSeparator", function(props, children) {
    return FormulaicAtomSyntax({
        ...(props || {}),
        classes: [...(props?.classes || []), "formulaic_separator"]
    }) (", ");
});

export var FormulaicAtomNonSyntax = astronaut.component("FormulaicAtomNonSyntax", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props?.classes || []), "formulaic_nonSyntax"]
    }) (...children);
});

export class Format {
    adaptUi = $g;
    astronaut = astronaut;

    Atom = class {
        constructor(generator, shorthandMatch = null) {
            this.generator = generator;
            this.shorthandMatch = shorthandMatch;
        }
    };

    atoms = [];

    createRichEditor(props = {}) {
        props.format = this;

        return FormulaicRichEditor(props) ();
    }

    registerAtom(atom) {
        this.atoms.push(atom);
    }
}