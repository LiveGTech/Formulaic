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
        "margin-top": "0.2rem",
        "margin-bottom": "0.2rem",
        "padding": "0.5rem",
        "background-color": "var(--secondaryBackground)",
        "color": "var(--secondaryText)",
        "border-radius": "0.5rem",
        "outline": "none"
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
    var editor = c.Container({
        styleSets: [EDITOR_STYLES],
        attributes: {
            "contenteditable": "true"
        }
    }) ();

    inter.insertAtom = function(atom) {
        var selection = document.getSelection();

        if (selection.rangeCount == 0) {
            return;
        }

        var range = selection.getRangeAt(0);
        var generatedAtom = atom.generator();

        range.deleteContents();
        range.insertNode(generatedAtom.get());
    };

    inter.getExpression = function() {
        var copy = editor.copy();

        copy.find(".formulaic_nonSyntax").remove();

        return copy.getText();
    };

    editor.on("keydown", function(event) {
        if ((event.key == "ArrowLeft" && event.shiftKey) || event.key == "Backspace") {
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
                    return;
                }

                range.setStartBefore(atomBefore);

                selection.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);

                event.preventDefault();

                if (event.key == "Backspace") {
                    selection.deleteFromDocument();
                }
            }
        }

        if (event.key == "ArrowRight" && event.shiftKey) {
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
                    return;
                }

                range.setEndAfter(atomAfter);

                selection.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);

                event.preventDefault();
            }
        }
    });

    editor.on("input", function(event) {
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
        var context = {};

        props.format.atoms.forEach(function(atom) {
            if (atom.shorthandMatch == null || matchedAtom != null) {
                return;
            }

            if (atom.shorthandMatch instanceof RegExp) {
                var match = previousText.match(atom.shorthandMatch);

                if (!match) {
                    return;
                }

                context.match = match;

                matchedText = match[1] || match[0];
            } else {
                if (!previousText.endsWith(atom.shorthandMatch)) {
                    return;
                }

                matchedText = atom.shorthandMatch;
            }

            matchedAtom = atom;
        });

        if (matchedText == null) {
            return;
        }

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

        event.preventDefault();
    });

    editor.setText("1+1");

    return editor;
});

export var FormulaicAtom = astronaut.component("FormulaicAtom", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props.classes || []), "formulaic_atom"],
        attributes: {
            ...(props.attributes || {}),
            "contenteditable": "false"
        },
        styleSets: [...(props.styleSets || []), ATOM_STYLES]
    }) (...children);
});

export var FormulaicAtomSlot = astronaut.component("FormulaicAtomSlot", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props.classes || []), "formulaic_atomSlot"],
        attributes: {
            ...(props.attributes || {}),
            "contenteditable": "true",
        },
        styleSets: [...(props.styleSets || []), SLOT_STYLES]
    }) (...children);
});

export var FormulaicAtomSyntax = astronaut.component("FormulaicAtomSyntax", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        styles: {
            ...(props.styles || {}),
            "display": "none",
        }
    }) (...children);
});

export var FormulaicAtomNonSyntax = astronaut.component("FormulaicAtomNonSyntax", function(props, children) {
    return c.TextFragment({
        ...(props || {}),
        classes: [...(props.classes || []), "formulaic_nonSyntax"]
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