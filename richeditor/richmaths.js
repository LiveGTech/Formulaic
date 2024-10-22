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
        var normalHeight = atom.get().getBoundingClientRect;
        var desiredHeight = props.parent.get().getBoundingClientRect;
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
    var exponentSlot = richEditor.FormulaicAtomSlot() ();

    if (props.base) {
        baseSlot.setText(props.base);
    }

    if (props.exponent) {
        exponentSlot.setText(props.exponent);
    }

    return richEditor.FormulaicAtom (
        richEditor.FormulaicAtomSyntax() ("(("),
        baseSlot,
        richEditor.FormulaicAtomSyntax() (")^("),
        c.ElementNode("sup", {
            // TODO: This style for superscripts and subscripts should really be in Adapt UI
            styles: {
                "transform": "translateY(-50%)",
                "font-size": "0.6em"
            }
        }) (exponentSlot),
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
        }) (argSlot),
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = rootSymbol.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        rootSymbol.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
    }).observe(atom.get());

    return atom;
});

var AbsAtom = astronaut.component("AbsAtom", function(props, children) {
    var argSlot = richEditor.FormulaicAtomSlot() ();
    var prefixBar = richEditor.FormulaicAtomNonSyntax() ("|");
    var suffixBar = richEditor.FormulaicAtomNonSyntax() ("|");

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-flex",
            "vertical-align": "middle",
            "align-items": "center"
        }
    }) (
        prefixBar,
        richEditor.FormulaicAtomSyntax() (" abs("),
        argSlot,
        richEditor.FormulaicAtomSyntax() (")"),
        suffixBar
    );

    new ResizeObserver(function() {
        var normalHeight = prefixBar.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 10;

        [prefixBar, suffixBar].forEach(function(bar) {
            bar.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
        });
    }).observe(atom.get());

    return atom;
});

var LogabAtom = astronaut.component("LogabAtom", function(props, children) {
    var aSlot = richEditor.FormulaicAtomSlot() ();
    var bSlot = richEditor.FormulaicAtomSlot() ();
    var openingBracket = richEditor.FormulaicAtomNonSyntax() ("(");
    var closingBracket = richEditor.FormulaicAtomNonSyntax() (")");

    if (props.a) {
        aSlot.setText(props.a);
    }

    if (props.b) {
        bSlot.setText(props.b);
    }

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-flex",
            "vertical-align": "middle",
            "align-items": "center"
        }
    }) (
        richEditor.FormulaicAtomNonSyntax() ("log"),
        richEditor.FormulaicAtomSyntax() (" logab("),
        c.ElementNode("sub", {
            // TODO: This style for superscripts and subscripts should really be in Adapt UI
            styles: {
                "transform": "translateY(50%)",
                "font-size": "0.6em"
            }
        }) (aSlot),
        openingBracket,
        richEditor.FormulaicAtomSeparator() (),
        bSlot,
        closingBracket,
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = openingBracket.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        [openingBracket, closingBracket].forEach(function(bar) {
            bar.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
        });
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
        return PowerAtom({base: context.match[2], exponent: context.match[3]}) ();
    }, /(([^+\-*/×÷]*)\^(-?\d+)?)$/),
    sqrt: new format.Atom(function(context) {
        return RootAtom() ();
    }, "sqrt"),
    abs: new format.Atom(function(context) {
        return AbsAtom() ();
    }, "abs"),
    logab: new format.Atom(function(context) {
        return LogabAtom() ();
    }, "logab"),
    log2: new format.Atom(function(context) {
        return LogabAtom({a: 2}) ();
    }, "log2"),
    divideOperator: new format.Atom(function(context) {
        return Text("π");
    }, "pi")
};

[
    "arg",
    "ln", "log",
    "sin", "cos", "tan",
    "sinh", "cosh", "tanh",
    "asin", "acos", "atan",
    "asinh", "acosh", "atanh"
].forEach(function(functionName) {
    format.registerAtom(new format.Atom(function(context) {
        return richEditor.FormulaicAtom() (
            Text(functionName),
            BracketAtom({parent: context.parent, isClosing: false}) ()
        );
    }, functionName + "("));
});

Object.values(atoms).forEach(function(atom) {
    format.registerAtom(atom);
});