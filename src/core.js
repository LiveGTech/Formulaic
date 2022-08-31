/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

import * as formulaic from "./formulaic.js";

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
        return new ComplexNumberType(
            (a.real * b.real) - (a.imag * b.imag),
            (a.real * b.imag) + (a.imag * b.real)
        );
    }

    static divide(a, b) {
        // (a + bi) / (c + di) = ((ac + bd) / (c^2 + d^2)) + ((bc - ad) / (c^2 + d^2))i
        return new ComplexNumberType(
            ((a.real * b.real) + (a.imag * b.imag)) / ((b.real ** 2) + (b.imag ** 2)),
            ((a.imag * b.real) - (a.real * b.imag)) / ((b.real ** 2) + (b.imag ** 2))
        );
    }

    toString() {
        if (this.imag != 0) {
            if (this.real != 0) {
                if (this.imag < 0) {
                    return `${this.real} - ${Math.abs(this.imag)}i`;
                }
    
                return `${this.real} + ${this.imag}i`;
            }
    
            return `${this.imag}i`;
        }

        return `${this.real}`;
    }
}

export class NumberLiteral extends formulaic.ExpressionLiteral {
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
                if (code[i] == "+") {continue;}

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

export function register() {
    formulaic.registerOperator(new formulaic.BinaryOperator({
        "+": new formulaic.FunctionBinding("add", (a, b) => Promise.resolve(ComplexNumberType.add(a, b))),
        "-": new formulaic.FunctionBinding("subtract", (a, b) => Promise.resolve(ComplexNumberType.subtract(a, b)))
    }));

    formulaic.registerOperator(new formulaic.BinaryOperator({
        "*": new formulaic.FunctionBinding("multiply", (a, b) => Promise.resolve(ComplexNumberType.multiply(a, b))),
        "/": new formulaic.FunctionBinding("divide", (a, b) => Promise.resolve(ComplexNumberType.divide(a, b)))
    }));
    
    formulaic.registerConcept(new (class extends formulaic.Concept {
        match(code) {
            var match;

            if (match = code.match(/^(0(?:x|X)[0-9a-fA-F]+)/)) {
                return new formulaic.LiteralToken(HexadecimalIntegerLiteral, match[1]);
            }

            if (match = code.match(/^(0(?:b|B)[01]+)/)) {
                return new formulaic.LiteralToken(BinaryIntegerLiteral, match[1]);
            }

            if (match = code.match(/^(0(?:o|O)[0-7]+)/)) {
                return new formulaic.LiteralToken(OctalIntegerLiteral, match[1]);
            }
    
            if (match = code.match(/^((?:[0-9]+\.?[0-9]*|[0-9]*\.?[0-9]+)(?:[eE][+-]?[0-9]+)?i?)/)) {
                return new formulaic.LiteralToken(NumberLiteral, match[1]);
            }
    
            return null;
        }
    })());
    
    formulaic.registerFunction(new formulaic.FunctionBinding("sqrt", function(value) {
        if (value < 0) {
            return Promise.resolve(new ComplexNumberType(0, Math.sqrt(Math.abs(value))));
        }

        return Promise.resolve(new ComplexNumberType(Math.sqrt(value)));
    }));
}