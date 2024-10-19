/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

import * as formulaic from "./formulaic.js";

export var engine = new formulaic.Engine();

export class ComplexNumberType {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    static add(a, b) {
        return new this(a.real + b.real, a.imag + b.imag);
    }

    static subtract(a, b) {
        return new this(a.real - b.real, a.imag - b.imag);
    }

    static multiply(a, b) {
        // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
        return new this(
            (a.real * b.real) - (a.imag * b.imag),
            (a.real * b.imag) + (a.imag * b.real)
        );
    }

    static divide(a, b) {
        // (a + bi) / (c + di) = ((ac + bd) / (c^2 + d^2)) + ((bc - ad) / (c^2 + d^2))i
        return new this(
            ((a.real * b.real) + (a.imag * b.imag)) / ((b.real ** 2) + (b.imag ** 2)),
            ((a.imag * b.real) - (a.real * b.imag)) / ((b.real ** 2) + (b.imag ** 2))
        );
    }

    // @source reference https://github.com/infusion/Complex.js/blob/master/complex.js
    // @licence mit https://raw.githubusercontent.com/infusion/Complex.js/master/LICENSE
    static exponent(value, power) {
        if (power.real == 0 && power.imag == 0) {
            return new this(1);
        }

        if (power.imag == 0) {
            if (value.real > 0 && value.imag == 0) {
                return new this(Math.pow(value.real, power.real));
            }

            if (value.real == 0) {
                switch (((power.real % 4) + 4) % 4) {
                    case 0:
                        return new this(Math.pow(value.imag, power.real), 0);

                    case 1:
                        return new this(0, Math.pow(value.imag, power.real));

                    case 2:
                        return new this(-Math.pow(value.imag, power.real), 0);

                    case 3:
                        return new this(0, -Math.pow(value.imag, power.real));
                }
            }
        }

        if (value.real == 0 && value.imag == 0 && power.real > 0 && power.imag >= 0) {
            return new this(0);
        }

        var arg = Math.atan2(value.imag, value.real);
        var loh = Math.log(Math.hypot(value.real, value.imag));
        var coef = Math.exp((power.real * loh) - (power.imag * arg));
        var trig = (power.imag * loh) + (power.real * arg);

        return new this(
            coef * Math.cos(trig),
            coef * Math.sin(trig)
        );
    }

    roundDecimals(realDecimals = 0, imagDecimals = 0) {
        return new this.constructor(
            Math.round(this.real * realDecimals) / realDecimals,
            Math.round(this.imag * imagDecimals) / imagDecimals
        );
    }

    roundPrecision(realPrecision = 15, imagPrecision = 15) {
        return new this.constructor(
            Number(this.real.toPrecision(realPrecision)),
            Number(this.imag.toPrecision(imagPrecision))
        );
    }

    toString() {
        var output = this.roundPrecision();

        if (output.imag != 0) {
            var imag = output.imag;

            if (output.real != 0) {
                if (output.imag < 0) {
                    imag *= -1;

                    if (imag == 1) {
                        imag = "";
                    }

                    return `${output.real} - ${imag}i`;
                }
  
                if (imag == 1) {
                    imag = "";
                }

                return `${output.real} + ${output.imag}i`;
            }

            if (imag == 1) {
                imag = "";
            } else if (imag == -1) {
                imag = "-";
            }
    
            return `${output.imag}i`;
        }

        return `${output.real}`;
    }
}

export class NumberLiteral extends engine.ExpressionLiteral {
    static parse(code) {
        var value = "";
        var exponent = "";
        var inExponent = false;
        var negativeExponent = false;
        var isImaginary = false;

        for (var i = 0; i < code.length; i++) {
            if (code[i] == "e" || code[i] == "E") {
                inExponent = true;
            } else if (code[i] == "i" || code[i] == "I") {
                isImaginary = true;
            } else if (code[i] == "-") {
                negativeExponent = true;
            } else if (inExponent) {
                if (code[i] == "+") {
                    continue;
                }

                exponent += code[i];
            } else {
                value += code[i];
            }
        }

        var numericValue = (Number(value) || 0) * Math.pow(10, (negativeExponent ? -1 : 1) * (Number(exponent) || 0));

        if (isImaginary) {
            return new this(new ComplexNumberType(0, numericValue));
        }

        return new this(new ComplexNumberType(numericValue));
    }
}

export class HexadecimalIntegerLiteral extends NumberLiteral {
    static parse(code) {
        return new this(new ComplexNumberType(parseInt(code.substring(2), 16)));
    }
}

export class BinaryIntegerLiteral extends NumberLiteral {
    static parse(code) {
        return new this(new ComplexNumberType(parseInt(code.substring(2), 2)));
    }
}

export class OctalIntegerLiteral extends NumberLiteral {
    static parse(code) {
        return new this(new ComplexNumberType(parseInt(code.substring(2), 8)));
    }
}

var multiplyOperator = new engine.FunctionBinding("multiply", (a, b) => Promise.resolve(ComplexNumberType.multiply(a, b)));
var divideOperator = new engine.FunctionBinding("divide", (a, b) => Promise.resolve(ComplexNumberType.divide(a, b)));
var implicitMultiplyOperator;

engine.registerOperator(new engine.BinaryOperator({
    "+": new engine.FunctionBinding("add", (a, b) => Promise.resolve(ComplexNumberType.add(a, b))),
    "-": new engine.FunctionBinding("subtract", (a, b) => Promise.resolve(ComplexNumberType.subtract(a, b)))
}));

engine.registerOperator(new engine.BinaryOperator({
    "*": multiplyOperator,
    "×": multiplyOperator,
    "/": divideOperator,
    "÷": divideOperator
}));

engine.registerOperator(new engine.UnaryOperator({
    "+": engine.DIRECT_FUNCTION
}));

engine.registerOperator(new engine.UnaryOperator({
    "-": new engine.FunctionBinding("negate", (value) => Promise.resolve(ComplexNumberType.subtract(new ComplexNumberType(0), value)))
}));

engine.registerOperator(implicitMultiplyOperator = new engine.BinaryOperator({
    "*": new engine.FunctionBinding("multiply", (a, b) => Promise.resolve(ComplexNumberType.multiply(a, b)))
}));

engine.registerOperator(new engine.BinaryOperator({
    "^": new engine.FunctionBinding("exponent", (a, b) => Promise.resolve(ComplexNumberType.exponent(a, b)))
}, false));

engine.setImplicitOperator(implicitMultiplyOperator);

engine.registerConcept(new (class extends engine.Concept {
    match(code) {
        var match;

        if (match = code.match(/^(0(?:x|X)[0-9a-fA-F]+)/)) {
            return new engine.LiteralToken(HexadecimalIntegerLiteral, match[1]);
        }

        if (match = code.match(/^(0(?:b|B)[01]+)/)) {
            return new engine.LiteralToken(BinaryIntegerLiteral, match[1]);
        }

        if (match = code.match(/^(0(?:o|O)[0-7]+)/)) {
            return new engine.LiteralToken(OctalIntegerLiteral, match[1]);
        }

        if (match = code.match(/^((?:[0-9]+\.?[0-9]*|[0-9]*\.?[0-9]+)(?:[eE][+-]?[0-9]+)?i?)/)) {
            return new engine.LiteralToken(NumberLiteral, match[1]);
        }

        return null;
    }
})());

engine.registerFunction(new engine.FunctionBinding("sqrt", function(value) {
    if (value < 0) {
        return Promise.resolve(new ComplexNumberType(0, Math.sqrt(Math.abs(value))));
    }

    return Promise.resolve(new ComplexNumberType(Math.sqrt(value)));
}));