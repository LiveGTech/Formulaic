/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

import * as formulaic from "./formulaic.js";

var exports = {};

function yieldThread() {
    return new Promise(function(resolve, reject) {
        requestAnimationFrame(resolve);
    });
}

export function createEngine(options = {}) {
    var engine = new formulaic.Engine();

    class ComplexNumberType {
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

        static sqrt(value) {
            if (value.imag != 0) {
                return this.exponent(value, new this(1 / 2));
            }
        
            if (value.real < 0) {
                return Promise.resolve(new this(0, Math.sqrt(Math.abs(value.real))));
            }
        
            return new this(Math.sqrt(value.real));
        }

        static root(index, value) {
            if (index == 2) {
                return this.sqrt(value);
            }

            return this.exponent(value, this.divide(
                new this(1),
                index
            ));
        }

        static factorial(value) {
            if (value.imag != 0) {
                return Promise.resolve(NaN);
            }

            var n = Math.round(value.real);

            if (n <= 0 || n > 170) {
                return Promise.resolve(new this(Infinity));
            }

            var result = 1;
            var iterations = 0;

            for (; n > 0; n--) {
                result *= n;
                iterations++;
            }

            return Promise.resolve(new this(result));
        }

        static abs(value) {
            return new this(Math.sqrt((value.real ** 2) + (value.imag ** 2)));
        }

        static arg(value) {
            return new this(Math.atan2(value.imag, value.real));
        }

        static ln(value) {
            return new this(
                Math.log(this.abs(value).real),
                this.arg(value).real
            );
        }

        static log(value) {
            return this.divide(
                this.ln(value),
                this.ln(new this(10))
            );
        }

        static logab(a, b) {
            return this.divide(
                this.ln(b),
                this.ln(a)
            );
        }

        static sin(value) {
            return new this(
                Math.sin(value.real) * Math.cosh(value.imag),
                Math.cos(value.real) * Math.sinh(value.imag)
            );
        }

        static cos(value) {
            return new this(
                Math.cos(value.real) * Math.cosh(value.imag),
                -1 * Math.sin(value.real) * Math.sinh(value.imag)
            );
        }

        static tan(value) {
            var numerator = new this(Math.tan(value.real), Math.tanh(value.imag));
            var denominatorPart = new this(0, Math.tan(value.real) * Math.tanh(value.imag));

            return this.divide(
                numerator,
                this.subtract(new this(1), denominatorPart)
            );
        }

        static sinh(value) {
            return new this(
                Math.sinh(value.real) * Math.cos(value.imag),
                Math.cosh(value.real) * Math.sin(value.imag)
            );
        }

        static cosh(value) {
            return new this(
                Math.cosh(value.real) * Math.cos(value.imag),
                Math.sinh(value.real) * Math.sin(value.imag)
            );
        }

        static tanh(value) {
            var numerator = new this(Math.tanh(value.real), Math.tan(value.imag));
            var denominatorPart = new this(0, Math.tanh(value.real) * Math.tan(value.imag));

            return this.divide(
                numerator,
                this.add(new this(1), denominatorPart)
            );
        }

        static asin(value) {
            // asin(z) = (1 / i) * ln(zi + sqrt(1 - (z ** 2)))

            return this.multiply(
                this.divide(new this(1), new this(0, 1)),
                this.ln(this.add(
                    this.multiply(value, new this(0, 1)),
                    this.sqrt(this.subtract(
                        new this(1),
                        this.exponent(value, new this(2))
                    ))
                ))
            );
        }

        static acos(value) {
            // acos(z) = (1 / i) * ln(z + sqrt((z ** 2) - 1))

            return this.multiply(
                this.divide(new this(1), new this(0, 1)),
                this.ln(this.add(
                    value,
                    this.sqrt(this.subtract(
                        this.exponent(value, new this(2)),
                        new this(1)
                    ))
                ))
            );
        }

        static atan(value) {
            // atan(z) = (1 / 2i) * ln((i - z) / (i + z))

            return this.multiply(
                this.divide(new this(1), new this(0, 2)),
                this.ln(this.divide(
                    this.subtract(new this(0, 1), value),
                    this.add(new this(0, 1), value)
                ))
            );
        }

        static asinh(value) {
            // asinh(z) = ln(z + sqrt(1 + (z ** 2)))

            return this.ln(this.add(
                value,
                this.sqrt(this.add(
                    new this(1),
                    this.exponent(value, new this(2))
                ))
            ));
        }

        static acosh(value) {
            // acosh(z) = ln(z + (sqrt(z + 1) * sqrt(z - 1)))

            return this.ln(this.add(
                value,
                this.multiply(
                    this.sqrt(this.add(value, new this(1))),
                    this.sqrt(this.subtract(value, new this(1)))
                )
            ));
        }

        static atanh(value) {
            // atanh(z) = (1 / 2) * (ln(1 + z) - ln(1 - z))

            return this.multiply(
                new this(1 / 2),
                this.subtract(
                    this.ln(this.add(new this(1), value)),
                    this.ln(this.subtract(new this(1), value))
                )
            );
        }

        static async sum(variable$, start$, end$, expression$) {
            var variableTokens = variable$.tokens;

            if (!variableTokens || !Object.keys(engine.variables).includes(variableTokens[0])) {
                throw new ReferenceError("Invalid subject variable");
            }

            var variableName = variableTokens[0];
            var oldVariableValue = engine.variables[variableName];

            var start = await start$.evaluate();
            var end = await end$.evaluate();
            var sum = new this(0);
            var iterations = 0;

            if (start.imag != 0 || end.imag != 0) {
                return NaN;
            }

            for (var i = start.real; i <= end.real; i++) {
                engine.variables[variableName] = new this(i);

                sum = this.add(sum, await expression$.evaluate());
                iterations++;

                if (iterations % 1000 == 999) {
                    await yieldThread();
                }
            }

            engine.variables[variableName] = oldVariableValue;

            return sum;
        }

        static async product(variable$, start$, end$, expression$) {
            var variableTokens = variable$.tokens;

            if (!variableTokens || !Object.keys(engine.variables).includes(variableTokens[0])) {
                throw new ReferenceError("Invalid subject variable");
            }

            var variableName = variableTokens[0];
            var oldVariableValue = engine.variables[variableName];

            var start = await start$.evaluate();
            var end = await end$.evaluate();
            var product = new this(1);
            var iterations = 0;

            if (start.imag != 0 || end.imag != 0) {
                return NaN;
            }

            for (var i = start.real; i <= end.real; i++) {
                engine.variables[variableName] = new this(i);

                product = this.multiply(product, await expression$.evaluate());
                iterations++;

                if (iterations % 1000 == 999) {
                    await yieldThread();
                }
            }

            engine.variables[variableName] = oldVariableValue;

            return product;
        }

        static async deriv(expression$, variable$, value$) {
            var variableTokens = variable$.tokens;

            if (!variableTokens || !Object.keys(engine.variables).includes(variableTokens[0])) {
                throw new ReferenceError("Invalid subject variable");
            }

            var variableName = variableTokens[0];
            var oldVariableValue = engine.variables[variableName];

            var value = await value$.evaluate();
            var step = new this(10 ** Math.floor(Math.log10(value.real) - 1));

            engine.variables[variableName] = this.add(value, step);

            var result1 = await expression$.evaluate();

            engine.variables[variableName] = this.subtract(value, step);

            var result2 = await expression$.evaluate();

            var derivative = this.divide(
                this.subtract(result1, result2),
                this.multiply(step, new this(2))
            );

            engine.variables[variableName] = oldVariableValue;

            return derivative;
        }

        static async secderiv(expression$, variable$, value$) {
            var variableTokens = variable$.tokens;

            if (!variableTokens || !Object.keys(engine.variables).includes(variableTokens[0])) {
                throw new ReferenceError("Invalid subject variable");
            }

            var variableName = variableTokens[0];
            var oldVariableValue = engine.variables[variableName];

            var value = await value$.evaluate();
            var step = new this(10 ** Math.floor(Math.log10(value.real) - 1));

            engine.variables[variableName] = this.add(value, step);

            var result1 = await expression$.evaluate();

            engine.variables[variableName] = value;

            var result2 = await expression$.evaluate();

            engine.variables[variableName] = this.subtract(value, step);

            var result3 = await expression$.evaluate();

            var derivative = this.divide(
                this.add(this.subtract(result1, this.multiply(result2, new this(2))), result3),
                this.exponent(step, new this(2))
            );

            engine.variables[variableName] = oldVariableValue;

            return derivative;
        }

        static async integ(start$, end$, expression$, variable$) {
            var variableTokens = variable$.tokens;

            if (!variableTokens || !Object.keys(engine.variables).includes(variableTokens[0])) {
                throw new ReferenceError("Invalid subject variable");
            }

            var variableName = variableTokens[0];
            var oldVariableValue = engine.variables[variableName];

            var start = await start$.evaluate();
            var end = await end$.evaluate();
            var step = this.divide(this.subtract(end, start), new this(engine.integrationSubdivisions));
            var integral = new this(0);

            for (var i = 0; i < engine.integrationSubdivisions; i++) {
                engine.variables[variableName] = this.add(start, this.multiply(step, new this(i)));

                var partIntegral = await expression$.evaluate();

                if (i > 0 && i < engine.integrationSubdivisions - 1) {
                    partIntegral = this.multiply(partIntegral, new this(2));
                }

                integral = this.add(integral, partIntegral);

                if (i % 1000 == 999) {
                    await yieldThread();
                }
            }

            integral = this.multiply(integral, this.divide(step, new this(2)));

            engine.variables[variableName] = oldVariableValue;

            return integral;
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

                    return `${output.real} + ${imag}i`;
                }

                if (imag == 1) {
                    imag = "";
                } else if (imag == -1) {
                    imag = "-";
                }
        
                return `${imag}i`;
            }

            return `${output.real}`;
        }
    }

    exports.ComplexNumberType = ComplexNumberType;

    class NumberLiteral extends engine.ExpressionLiteral {
        static parse(code) {
            var value = "";
            var exponent = "";
            var inExponent = false;
            var negativeExponent = false;
            var isImaginary = false;

            if (code == "i" || code == "I") {
                return new this(new ComplexNumberType(0, 1));
            }

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

            var numericValue = (Number(value.replace(",", ".")) || 0) * Math.pow(10, (negativeExponent ? -1 : 1) * (Number(exponent) || 0));

            if (isImaginary) {
                return new this(new ComplexNumberType(0, numericValue));
            }

            return new this(new ComplexNumberType(numericValue));
        }
    }

    exports.NumberLiteral = NumberLiteral;

    class HexadecimalIntegerLiteral extends NumberLiteral {
        static parse(code) {
            return new this(new ComplexNumberType(parseInt(code.substring(2), 16)));
        }
    }

    exports.HexadecimalIntegerLiteral = HexadecimalIntegerLiteral;

    class BinaryIntegerLiteral extends NumberLiteral {
        static parse(code) {
            return new this(new ComplexNumberType(parseInt(code.substring(2), 2)));
        }
    }

    exports.BinaryIntegerLiteral = BinaryIntegerLiteral;

    class OctalIntegerLiteral extends NumberLiteral {
        static parse(code) {
            return new this(new ComplexNumberType(parseInt(code.substring(2), 8)));
        }
    }

    exports.OctalIntegerLiteral = OctalIntegerLiteral;

    var multiplyOperator = new engine.FunctionBinding("multiply", (a, b) => Promise.resolve(ComplexNumberType.multiply(a, b)));
    var divideOperator = new engine.FunctionBinding("divide", (a, b) => Promise.resolve(ComplexNumberType.divide(a, b)));
    var implicitMultiplyOperator;

    engine.registerOperator(new engine.BinaryOperator({
        "=": new engine.FunctionBinding("assign", (a, b) => Promise.resolve(engine.variables[a] = b))
    }));

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

    engine.registerOperator(new engine.UnaryOperator({
        "!": new engine.FunctionBinding("factorial", (value) => Promise.resolve(ComplexNumberType.factorial(value)))
    }, false));

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

            if (
                // We allow dots even if decimal point is comma in case locale prefers to use (or accidentally uses) dot
                (engine.decimalPointIsComma && (match = code.match(/^((?:[0-9]+[,.]?[0-9]*|[0-9]*[,.]?[0-9]+)(?:[eE][+-]?[0-9]+)?i?)/))) ||
                (!engine.decimalPointIsComma && (match = code.match(/^((?:[0-9]+\.?[0-9]*|[0-9]*\.?[0-9]+)(?:[eE][+-]?[0-9]+)?i?)/)))
            ) {
                return new engine.LiteralToken(NumberLiteral, match[1]);
            }

            if (match = code.match(/^([iI])\b/)) {
                return new engine.LiteralToken(NumberLiteral, match[1]);
            }

            for (var constantName of Object.keys(engine.constants)) {
                if (code.startsWith(constantName)) {
                    return new engine.VariableToken(constantName, constantName, () => Promise.resolve(engine.constants[constantName]), false);
                }
            }

            for (var variableName of Object.keys(engine.variables)) {
                if (code.startsWith(variableName)) {
                    return new engine.VariableToken(variableName, variableName, () => Promise.resolve(engine.variables[variableName]));
                }
            }

            return null;
        }
    })());

    function registerComplexNumberMethod(functionName, evaluateArgs = true) {
        engine.registerFunction(new engine.FunctionBinding(functionName, function() {
            return ComplexNumberType[functionName](...arguments);
        }, evaluateArgs));
    }

    [
        "sqrt", "root", "abs", "arg",
        "ln", "log", "logab",
        "sin", "cos", "tan",
        "sinh", "cosh", "tanh",
        "asin", "acos", "atan",
        "asinh", "acosh", "atanh"
    ].forEach(function(name) {
        registerComplexNumberMethod(name);
    });

    ["sum", "product", "deriv", "secderiv", "integ"].forEach(function(name) {
        registerComplexNumberMethod(name, false);
    });

    engine.decimalPointIsComma = false;

    engine.constants = options.constants || {
        "pi": new ComplexNumberType(Math.PI),
        "e": new ComplexNumberType(Math.E)
    };

    engine.constants["π"] = engine.constants["pi"];

    engine.variables = options.variables || {};

    engine.integrationSubdivisions = 10e3;

    return engine;
}

export var engine = createEngine();

export var {
    ComplexNumberType,
    NumberLiteral,
    HexadecimalIntegerLiteral,
    BinaryIntegerLiteral,
    OctalIntegerLiteral
} = exports;