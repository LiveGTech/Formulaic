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

var BracketAtom = astronaut.component("BracketAtom", function(props, children) {
    var atom = richEditor.FormulaicAtom() (
        richEditor.FormulaicAtomNonSyntax() (props.isClosing ? ")" : "("),
        richEditor.FormulaicAtomSyntax() (props.isClosing ? " ) " : " ( ")
    );

    new ResizeObserver(function() {
        var normalHeight = atom.get().clientHeight;
        var desiredHeight = props.parent.get().clientHeight;
        var containerComputedStyles = getComputedStyle(props.parent.get());

        desiredHeight -= parseFloat(containerComputedStyles.paddingTop || 0);
        desiredHeight -= parseFloat(containerComputedStyles.paddingBottom || 0);

        atom.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
    }).observe(props.parent.get());

    return atom;
});

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
            "vertical-align": "middle",
            "margin-left": "0.1em",
            "margin-right": "0.1em"
        }
    }) (
        richEditor.FormulaicAtomSyntax() ("(("),
        numeratorSlot,
        richEditor.FormulaicAtomSyntax() (")/("),
        c.TextFragment({
            styles: {
                "height": "0",
                "border-top": "0.1em solid var(--secondaryText)",
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

var PowerAtom = astronaut.component("PowerAtom", function(props, children) {
    var baseSlot = richEditor.FormulaicAtomSlot() ();

    if (props.base) {
        baseSlot.setText(props.base);
    }

    return richEditor.FormulaicAtom() (
        richEditor.FormulaicAtomSyntax() ("(("),
        baseSlot,
        richEditor.FormulaicAtomSyntax() (")^("),
        c.ElementNode("sup", {
            // TODO: This style for superscripts and subscripts should really be in Adapt UI
            styles: {
                "font-size": "0.6em"
            }
        }) (            
            richEditor.FormulaicAtomSlot() (),
        ),
        richEditor.FormulaicAtomSyntax() ("))")
    );
});

var RootAtom = astronaut.component("RootAtom", function(props, children) {
    var argSlot = richEditor.FormulaicAtomSlot() ();
    var rootSymbol = richEditor.FormulaicAtomNonSyntax() ("√");

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-flex",
            "vertical-align": "middle",
            "align-items": "center",
            "margin-top": "0.1em",
            "margin-bottom": "0.3em"
        }
    }) (
        rootSymbol,
        richEditor.FormulaicAtomSyntax() (" sqrt("),
        c.TextFragment({
            styles: {
                "border-top": "0.1em solid var(--secondaryText)",
                "margin-inline-end": "0.1em",
                "padding-inline-end": "0.1em"
            }
        }) (
            argSlot,
        ),
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = rootSymbol.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        rootSymbol.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
    }).observe(atom.get());

    return atom;
});

export var atoms = {
    multiplyOperator: new format.Atom(function(context) {
        return Text("×");
    }, "*"),
    divideOperator: new format.Atom(function(context) {
        return Text("÷");
    }, "/"),
    bracket: new format.Atom(function(context) {
        return BracketAtom({parent: context.parent, isClosing: context.match[0] == ")"}) ();
    }, /[()]$/),
    fraction: new format.Atom(function(context) {
        return FractionAtom({numerator: context.match[2]}) ();
    }, /(([^+\-*/×÷]*)over)$/),
    power: new format.Atom(function(context) {
        return PowerAtom({base: context.match[2]}) ();
    }, /(([^+\-*/×÷]*)\^)$/),
    squareRoot: new format.Atom(function(context) {
        return RootAtom() ();
    }, "sqrt")
};

Object.values(atoms).forEach(function(atom) {
    format.registerAtom(atom);
});