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
    var atom = richEditor.FormulaicAtom({
        classes: [...(props?.classes || []), props.isClosing ? "formulaic_closingBracket" : "formulaic_openingBracket"]
    }) (
        richEditor.FormulaicAtomNonSyntax() (props.isClosing ? ")" : "("),
        ...(props.excludeSyntax ? [] : [richEditor.FormulaicAtomSyntax() (props.isClosing ? " ) " : " ( ")])
    );

    var mainAtom = props.mainAtom || atom;

    function updateHeight() {
        var normalHeight = atom.get().clientHeight;

        var sibling = props.isClosing ? mainAtom.get().previousSibling : mainAtom.get().nextSibling;
        var desiredHeight = normalHeight;
        var bracketDepth = 0;

        while (true) {
            if (sibling == null) {
                break;
            }

            if (sibling.nodeType == Node.ELEMENT_NODE) {
                var otherBracketClass = props.isClosing ? "formulaic_openingBracket" : "formulaic_closingBracket";

                if (sibling.matches(`.${otherBracketClass}, .formulaic_atom:has(> .${otherBracketClass})`)) {
                    bracketDepth--;

                    if (bracketDepth < 0) {
                        break;
                    }
                }

                var ownBracketClass = props.isClosing ? "formulaic_closingBracket" : "formulaic_openingBracket";

                if (sibling.matches(`.${ownBracketClass}, .formulaic_atom:has(> .${ownBracketClass})`)) {
                    bracketDepth++;
                }

                var rect = sibling.getBoundingClientRect();

                if (rect.height > desiredHeight) {
                    desiredHeight = rect.height;
                }
            }

            sibling = props.isClosing ? sibling.previousSibling : sibling.nextSibling;
        }

        if (desiredHeight)
        atom.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
    }

    requestAnimationFrame(function update() {
        if (mainAtom.get().parentNode != null) {
            updateHeight();
        }

        requestAnimationFrame(update);
    });

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
        baseSlot,
        richEditor.FormulaicAtomSyntax() ("^("),
        c.ElementNode("sup", {
            // TODO: This style for superscripts and subscripts should really be in Adapt UI
            styles: {
                "transform": "translateY(-50%)",
                "font-size": "0.6em"
            }
        }) (exponentSlot),
        richEditor.FormulaicAtomSyntax() (")")
    );
});

var SquareRootAtom = astronaut.component("SquareRootAtom", function(props, children) {
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

var RootAtom = astronaut.component("RootAtom", function(props, children) {
    var indexSlot = richEditor.FormulaicAtomSlot() ();
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
        richEditor.FormulaicAtomSyntax() (" root("),
        c.ElementNode("sup", {
            // TODO: This style for superscripts and subscripts should really be in Adapt UI
            styles: {
                "transform": "translateY(-50%)",
                "font-size": "0.6em"
            }
        }) (indexSlot),
        rootSymbol,
        richEditor.FormulaicAtomSeparator() (),
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
    var openingBracket = BracketAtom({mainAtom: atom, isClosing: false, excludeSyntax: true}) ();
    var closingBracket = BracketAtom({mainAtom: atom, isClosing: true, excludeSyntax: true}) ();

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

var SumAtom = astronaut.component("SumAtom", function(props, children) {
    var variableSlot = richEditor.FormulaicAtomSlot() ();
    var startSlot = richEditor.FormulaicAtomSlot() ();

    var endSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "end",
            "font-size": "0.6em"
        }
    }) ();

    var expressionSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "expression"
        }
    }) ();

    if (props.variable) {
        variableSlot.setText(props.variable);
    }

    if (props.start) {
        startSlot.setText(props.start);
    }

    if (props.end) {
        endSlot.setText(props.end);
    }

    if (props.expression) {
        expressionSlot.setText(props.expression);
    }

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-grid",
            "grid-template-areas": [
                "end .",
                "sum expression",
                "start ."
            ].map(JSON.stringify).join(" "),
            "justify-items": "center",
            "align-items": "center",
            "vertical-align": "middle"
        }
    }) (
        richEditor.FormulaicAtomSyntax() (" sum("),
        richEditor.FormulaicAtomNonSyntax({
            styles: {
                "grid-area": "sum",
                "font-size": "1.5em"
            }
        }) ("Σ"),
        c.Container({
            styles: {
                "grid-area": "start",
                "font-size": "0.6em"
            }
        }) (
            variableSlot,
            richEditor.FormulaicAtomNonSyntax() ("="),
            richEditor.FormulaicAtomSeparator() (),
            startSlot,
        ),
        richEditor.FormulaicAtomSeparator() (),
        endSlot,
        richEditor.FormulaicAtomSeparator() (),
        expressionSlot,
        richEditor.FormulaicAtomSyntax() (")")
    );

    return atom;
});

var ProductAtom = astronaut.component("ProductAtom", function(props, children) {
    var variableSlot = richEditor.FormulaicAtomSlot() ();
    var startSlot = richEditor.FormulaicAtomSlot() ();

    var endSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "end",
            "font-size": "0.6em"
        }
    }) ();

    var expressionSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "expression"
        }
    }) ();

    if (props.variable) {
        variableSlot.setText(props.variable);
    }

    if (props.start) {
        startSlot.setText(props.start);
    }

    if (props.end) {
        endSlot.setText(props.end);
    }

    if (props.expression) {
        expressionSlot.setText(props.expression);
    }

    var atom = richEditor.FormulaicAtom({
        styles: {
            "display": "inline-grid",
            "grid-template-areas": [
                "end .",
                "sum expression",
                "start ."
            ].map(JSON.stringify).join(" "),
            "justify-items": "center",
            "align-items": "center",
            "vertical-align": "middle"
        }
    }) (
        richEditor.FormulaicAtomSyntax() (" product("),
        richEditor.FormulaicAtomNonSyntax({
            styles: {
                "grid-area": "sum",
                "font-size": "1.5em"
            }
        }) ("Π"),
        c.Container({
            styles: {
                "grid-area": "start",
                "font-size": "0.6em"
            }
        }) (
            variableSlot,
            richEditor.FormulaicAtomNonSyntax() ("="),
            richEditor.FormulaicAtomSeparator() (),
            startSlot,
        ),
        richEditor.FormulaicAtomSeparator() (),
        endSlot,
        richEditor.FormulaicAtomSeparator() (),
        expressionSlot,
        richEditor.FormulaicAtomSyntax() (")")
    );

    return atom;
});

var DerivativeAtom = astronaut.component("DerivativeAtom", function(props, children) {
    var expressionSlot = c.FormulaicAtomSlot() ();
    var variableSlot = c.FormulaicAtomSlot() ();
    var valueSlot = c.FormulaicAtomSlot() ();
    var openingBracket = BracketAtom({mainAtom: atom, isClosing: false, excludeSyntax: true}) ();
    var closingBracket = BracketAtom({mainAtom: atom, isClosing: true, excludeSyntax: true}) ();
    var variablePreview = c.FormulaicAtomNonSyntax() ("?");

    if (props.expression) {
        expressionSlot.setText(props.expression);
    }

    if (props.variable) {
        variableSlot.setText(props.variable);
        variablePreview.setText(props.variable);
    }

    if (props.value) {
        valueSlot.setText(props.value);
    }

    var atom = richEditor.FormulaicAtom() (
        c.Container({
            styles: {
                "display": "inline-flex",
                "flex-direction": "column",
                "text-align": "center",
                "vertical-align": "middle",
                "margin-left": "0.1em",
                "margin-right": "0.1em"
            }
        }) (
            c.FormulaicAtomNonSyntax() ("d"),
            c.TextFragment({
                styles: {
                    "height": "0",
                    "border-top": "0.1em solid var(--secondaryText)",
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "text-indent": "100%"
                }
            }) (),
            c.TextFragment (
                c.FormulaicAtomNonSyntax() ("d"),
                variablePreview
            )
        ),
        openingBracket,
        richEditor.FormulaicAtomSyntax() (" deriv("),
        expressionSlot,
        closingBracket,
        c.FormulaicAtomSeparator() (),
        c.Container({
            styles: {
                "display": "inline",
                "margin-inline-start": "0.25em",
                "padding-top": "0.5em",
                "padding-inline-start": "0.25em",
                "border-inline-start": "0.1em solid var(--secondaryText)",
                "vertical-align": "bottom"
            }
        }) (
            variableSlot,
            richEditor.FormulaicAtomNonSyntax() ("="),
            c.FormulaicAtomSeparator() (),
            valueSlot
        ),
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = openingBracket.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        [openingBracket, closingBracket].forEach(function(bar) {
            bar.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
        });
    }).observe(atom.get());

    variableSlot.on("input", function() {
        variablePreview.setText(variableSlot.getText().trim() || "?");
    });

    return atom;
});

var SecondDerivativeAtom = astronaut.component("SecondDerivativeAtom", function(props, children) {
    var expressionSlot = c.FormulaicAtomSlot() ();
    var variableSlot = c.FormulaicAtomSlot() ();
    var valueSlot = c.FormulaicAtomSlot() ();
    var openingBracket = BracketAtom({mainAtom: atom, isClosing: false, excludeSyntax: true}) ();
    var closingBracket = BracketAtom({mainAtom: atom, isClosing: true, excludeSyntax: true}) ();
    var variablePreview = c.FormulaicAtomNonSyntax() ("?");

    if (props.expression) {
        expressionSlot.setText(props.expression);
    }

    if (props.variable) {
        variableSlot.setText(props.variable);
        variablePreview.setText(props.variable);
    }

    if (props.value) {
        valueSlot.setText(props.value);
    }

    var atom = richEditor.FormulaicAtom() (
        c.Container({
            styles: {
                "display": "inline-flex",
                "flex-direction": "column",
                "text-align": "center",
                "vertical-align": "middle",
                "margin-left": "0.1em",
                "margin-right": "0.1em"
            }
        }) (
            c.TextFragment (
                c.FormulaicAtomNonSyntax() ("d"),
                c.ElementNode("sup", {
                    // TODO: This style for superscripts and subscripts should really be in Adapt UI
                    styles: {
                        "transform": "translateY(-50%)",
                        "font-size": "0.6em"
                    }
                }) (c.FormulaicAtomNonSyntax() ("2"))
            ),
            c.TextFragment({
                styles: {
                    "height": "0",
                    "border-top": "0.1em solid var(--secondaryText)",
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "text-indent": "100%"
                }
            }) (),
            c.TextFragment (
                c.FormulaicAtomNonSyntax() ("d"),
                variablePreview,
                c.ElementNode("sup", {
                    // TODO: This style for superscripts and subscripts should really be in Adapt UI
                    styles: {
                        "transform": "translateY(-50%)",
                        "font-size": "0.6em"
                    }
                }) (c.FormulaicAtomNonSyntax() ("2"))
            ),
        ),
        openingBracket,
        richEditor.FormulaicAtomSyntax() (" secderiv("),
        expressionSlot,
        closingBracket,
        c.FormulaicAtomSeparator() (),
        c.Container({
            styles: {
                "display": "inline",
                "margin-inline-start": "0.25em",
                "padding-top": "0.5em",
                "padding-inline-start": "0.25em",
                "border-inline-start": "0.1em solid var(--secondaryText)",
                "vertical-align": "bottom"
            }
        }) (
            variableSlot,
            richEditor.FormulaicAtomNonSyntax() ("="),
            c.FormulaicAtomSeparator() (),
            valueSlot
        ),
        richEditor.FormulaicAtomSyntax() (")")
    );

    new ResizeObserver(function() {
        var normalHeight = openingBracket.get().clientHeight;
        var desiredHeight = atom.get().clientHeight + 2;

        [openingBracket, closingBracket].forEach(function(bar) {
            bar.setStyle("transform", `scaleY(${desiredHeight / normalHeight})`);
        });
    }).observe(atom.get());

    variableSlot.on("input", function() {
        variablePreview.setText(variableSlot.getText().trim() || "?");
    });

    return atom;
});

var IntegralAtom = astronaut.component("IntegralAtom", function(props, children) {
    var startSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "start",
            "font-size": "0.6em"
        }
    }) ();

    var endSlot = richEditor.FormulaicAtomSlot({
        styles: {
            "grid-area": "end",
            "font-size": "0.6em"
        }
    }) ();

    var expressionSlot = richEditor.FormulaicAtomSlot() ();

    var variableSlot = richEditor.FormulaicAtomSlot() ();

    if (props.start) {
        startSlot.setText(props.start);
    }

    if (props.end) {
        endSlot.setText(props.end);
    }

    if (props.expression) {
        expressionSlot.setText(props.expression);
    }

    if (props.variable) {
        variableSlot.setText(props.variable);
    }

    var atom = richEditor.FormulaicAtom (
        richEditor.FormulaicAtomSyntax() (" integ("),
        richEditor.FormulaicAtomNonSyntax({
            styles: {
                "font-size": "1.5em",
                "vertical-align": "middle",
                "margin-inline": "-0.25rem",
            }
        }) ("∫"),
        c.Container({
            styles: {
                "display": "inline-flex",
                "flex-direction": "column-reverse",
                "gap": "0.75rem",
                "margin-inline-end": "0.25rem",
                "vertical-align": "middle"
            }
        }) (
            startSlot,
            richEditor.FormulaicAtomSeparator() (),
            endSlot
        ),
        richEditor.FormulaicAtomSeparator() (),
        expressionSlot,
        richEditor.FormulaicAtomNonSyntax() (" d"),
        richEditor.FormulaicAtomSeparator() (),
        variableSlot,
        richEditor.FormulaicAtomSyntax() (")"),
        richEditor.FormulaicAtomNonSyntax({
            styles: {
                "display": "inline-block",
                "width": "0.25rem"
            }
        }) ()
    );

    return atom;
});

var ReplacementText = astronaut.component("ReplacementText", function(props, children) {
    return TextFragment({
        ...props,
        classes: [...(props?.classes || []), "formulaic_text"]
    }) (...children);
});

export var atoms = {
    multiplyOperator: new format.Atom(function(context) {
        return ReplacementText() ("×");
    }, "*"),
    divideOperator: new format.Atom(function(context) {
        return ReplacementText() ("÷");
    }, "/"),
    bracket: new format.Atom(function(context) {
        return BracketAtom({isClosing: context.match[0] == ")"}) ();
    }, /[()]$/),
    fraction: new format.Atom(function(context) {
        return FractionAtom({numerator: context.match[2]}) ();
    }, /(([^+\-*/×÷=]*)over)$/),
    power: new format.Atom(function(context) {
        return PowerAtom({base: context.match[2], exponent: context.match[3]}) ();
    }, /(([^+\-*/×÷=]*)\^(-?\d+)?)$/),
    sqrt: new format.Atom(function(context) {
        return SquareRootAtom() ();
    }, "sqrt"),
    root: new format.Atom(function(context) {
        return RootAtom() ();
    }, "root"),
    abs: new format.Atom(function(context) {
        return AbsAtom() ();
    }, "abs"),
    logab: new format.Atom(function(context) {
        return LogabAtom() ();
    }, "logab"),
    log2: new format.Atom(function(context) {
        return LogabAtom({a: 2}) ();
    }, "log2"),
    sum: new format.Atom(function(context) {
        return SumAtom({variable: context.props.defaultVariable}) ();
    }, "sum"),
    product: new format.Atom(function(context) {
        return ProductAtom({variable: context.props.defaultVariable}) ();
    }, "product"),
    secderiv: new format.Atom(function(context) {
        return SecondDerivativeAtom({variable: context.props.defaultVariable}) ();
    }, "secderiv"),
    deriv: new format.Atom(function(context) {
        return DerivativeAtom({variable: context.props.defaultVariable}) ();
    }, "deriv"),
    integ: new format.Atom(function(context) {
        return IntegralAtom({variable: context.props.defaultVariable}) ();
    }, "integ"),
    pi: new format.Atom(function(context) {
        return ReplacementText() ("π");
    }, "pi")
};

[
    "arg",
    "ln", "log",
    "asin", "acos", "atan",
    "asinh", "acosh", "atanh",
    "sin", "cos", "tan",
    "sinh", "cosh", "tanh"
].forEach(function(functionName) {
    format.registerAtom(new format.Atom(function(context) {
        var atom = richEditor.FormulaicAtom() ();

        atom.add(
            Text(functionName),
            BracketAtom({mainAtom: atom, isClosing: false}) ()
        );

        return atom;
    }, functionName + "("));
});

Object.values(atoms).forEach(function(atom) {
    format.registerAtom(atom);
});