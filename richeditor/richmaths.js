/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

import * as richEditor from "./richeditor.js";

export var format = new richEditor.Format();

var $g = format.adaptUi;
var astronaut = format.astronaut;

const c = astronaut.components;

var FractionAtom = astronaut.component("FractionAtom", function(props, children) {
    var numeratorSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "text-align": "center"
        }
    }) ();

    if (props.numerator) {
        numeratorSlot.setText(props.numerator);
    }

    return richEditor.FormulaicAtom({
        styles: {
            "display": "inline-flex",
            "flex-direction": "column",
            "vertical-align": "middle"
        }
    }) (
        richEditor.FormulaicAtomSyntax() ("(("),
        numeratorSlot,
        richEditor.FormulaicAtomSyntax() (")/("),
        c.TextFragment({
            styles: {
                "height": "0",
                "border-top": "1px solid var(--secondaryText)",
                "overflow": "hidden",
                "white-space": "nowrap",
                "text-indent": "100%"
            }
        }) (),
        richEditor.FormulaicAtomSlot({
            styles: {
                "text-align": "center"
            }
        }) (),
        richEditor.FormulaicAtomSyntax() ("))")
    );
});

var RootAtom = astronaut.component("RootAtom", function(props, children) {
    var argSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "border-top": "1px solid var(--secondaryText)"
        }
    }) ();

    var rootSymbol = richEditor.FormulaicAtomNonSyntax() ("√");

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-flex",
            "vertical-align": "middle",
            "align-items": "center"
        }
    }) (
        rootSymbol,
        richEditor.FormulaicAtomSyntax() (" sqrt("),
        argSlot,
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = rootSymbol.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        rootSymbol.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
    }).observe(atom.get());

    return atom;
});

format.registerAtom(new format.Atom(function(context) {
    return FractionAtom({numerator: context.match[2]}) ();
}, /(([^+]*)\/)$/));

format.registerAtom(new format.Atom(function(context) {
    return RootAtom() ();
}, "sqrt"));