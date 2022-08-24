/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

export class Function {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}

export class Concept {
    match(code) {
        return null;
    }
}

export class Operator {
    constructor(code, referenceFunction = DIRECT_FUNCTION, registerAsConcept = true) {
        this.code = code;
        this.referenceFunction = referenceFunction;

        if (registerAsConcept) {
            this.registerAsConcept();
        }
    }

    transform(children) {
        return children;
    }

    reduce(children) {
        var reducedChildren = [...children];
        var reductionNeeded = true;

        while (reductionNeeded) {
            reductionNeeded = false;

            for (var i = 0; i < reducedChildren.length; i++) {
                var child = reducedChildren[i];

                if (child instanceof Token && child.type == "operator" && child.code == this.code) {
                    reducedChildren = this.transform(reducedChildren);
                    reductionNeeded = true;

                    break;
                }
            }
        }

        return reducedChildren;
    }

    registerAsConcept() {
        var thisScope = this;

        concepts.push(new (class extends Concept {
            match(code) {
                if (code.startsWith(thisScope.code)) {
                    return new Token("operator", thisScope.code);
                }

                return null;
            }
        })());
    }
}

export class BinaryOperator extends Operator {
    transform(children) {
        var args = [[], []];
        var reachedOperator = false;

        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            if (!reachedOperator && child instanceof Token && child.type == "operator" && child.code == this.code) {
                reachedOperator = true;

                continue;
            }

            if (!reachedOperator) {
                args[0].push(child);
            } else {
                args[1].push(child);
            }
        }

        var expression = new ExpressionNode([
            ...args[0],
            new Token("separator", ","),
            ...args[1]
        ], this.referenceFunction);

        expression.reduceChildren();

        return [expression];
    }
}

export const DIRECT_FUNCTION = new Function(null, (value) => Promise.resolve(value));

export var functions = [
    new Function("a", () => Promise.resolve(3)),
    new Function("b", () => Promise.resolve(5)),
    new Function("add", (a, b) => Promise.resolve(a + b))
];

export var concepts = [];

export var operators = [
    new BinaryOperator("+", new Function("add", (a, b) => Promise.resolve(a + b))),
    new BinaryOperator("*", new Function("multiply", (a, b) => Promise.resolve(a * b)))
];

export class ExpressionLiteral {
    constructor(value) {
        this.value = value;
    }

    static parse(code) {
        return new this(null);
    }

    evaluate() {
        return Promise.resolve(this.value);
    }
}

export class ExpressionNode {
    constructor(children = [], referenceFunction = DIRECT_FUNCTION) {
        this.children = children;
        this.referenceFunction = referenceFunction;
    }

    static parseTokens(tokens, referenceFunction = DIRECT_FUNCTION) {
        // TODO: Implement full token parsing

        var instance = new this([], referenceFunction);

        console.log(tokens);

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            switch (token.type) {
                case "call":
                    var functionName = tokens[i].code.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)[1];

                    // Continue onto open bracket parsing

                case "open":
                    var innerTokens = [];
                    var bracketLevel = 0;

                    i++;

                    while (true) {
                        if (i >= tokens.length) {
                            throw new SyntaxError("Expected a closing bracket");
                        }

                        if (tokens[i].type == "close" && bracketLevel == 0) {
                            break;
                        }

                        if (tokens[i].type == "close") {
                            bracketLevel--;
                        }

                        if (["open", "call"].includes(tokens[i].type)) {
                            bracketLevel++;
                        }

                        innerTokens.push(tokens[i++]);
                    }

                    if (token.type == "call") {
                        instance.children.push(ExpressionNode.parseTokens(innerTokens, functions.find((currentFunction) => currentFunction.name == functionName)));
                    } else {
                        instance.children.push(ExpressionNode.parseTokens(innerTokens));
                    }

                    continue;

                case "close":
                    throw new SyntaxError("Expected an opening bracket or function call");

                case "separator":
                case "operator":
                    instance.children.push(token);
                    continue;
            }
        }

        instance.reduceChildren();

        console.log(instance.children);

        return instance;
    }

    reduceChildren() {
        var argumentChildren = [[]];

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];

            if (child instanceof Token && child.type == "separator") {
                argumentChildren.push([]);

                continue;
            }

            argumentChildren[argumentChildren.length - 1].push(child);
        }

        for (var i = 0; i < operators.length; i++) {
            for (var j = 0; j < argumentChildren.length; j++) {
                argumentChildren[j] = operators[i].reduce(argumentChildren[j]);
            }
        }

        this.children = argumentChildren.flat();
    }

    evaluate() {
        var thisScope = this;

        return Promise.all(this.children.map((child) => child.evaluate())).then(function(values) {            
            return thisScope.referenceFunction.callback(...values);
        })
    }
}

export class Token {
    constructor(type, code) {
        this.type = type;
        this.code = code;
    }
}

export class Expression {
    constructor(rootNode = new ExpressionNode()) {
        this.rootNode = rootNode;
    }

    static parse(code) {
        code += "\n"; // To ensure that matching with newline at end works for last line

        var tokens = [];
        var tokenToAdd = "";

        function matchesToken(token, contextAfter = ".*") {
            var matches = code.match(new RegExp(`^(?:${token})`, "sm"));

            if (matches && code.substring(matches[0].length).match(new RegExp(`^(?:${contextAfter})`, "s"))) {
                tokenToAdd = matches[0];
                code = code.substring(matches[0].length);

                return true;
            }

            return false;
        }

        function addToken(type) {
            tokens.push(new Token(type, tokenToAdd));
        }

        parseLoop:
        while (code.length > 0) {
            if (matchesToken("\\/\\/.*?$")) {
                // Comment match
                continue;
            }

            if (matchesToken("\\/\\*.*?\\*\\/")) {
                // Comment match
                continue;
            }

            for (var i = 0; i < concepts.length; i++) {
                var match = concepts[i].match(code);

                if (match == null) {
                    continue;
                }

                if (!code.startsWith(match.code)) {
                    throw new Error("Concept does not return subset of code");
                }

                tokens.push(match);

                code = code.substring(match.code.length);

                continue parseLoop;
            }

            if (matchesToken("[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(")) {
                addToken("call");
                continue;
            }

            if (matchesToken(",")) {
                addToken("separator");
                continue;
            }

            if (matchesToken("\\(")) {
                addToken("open");
                continue;
            }

            if (matchesToken("\\)")) {
                addToken("close");
                continue;
            }

            if (matchesToken("\\s+")) {
                // Whitespace match
                continue;
            }

            throw new SyntaxError(`Unexpected token: ${code[0]}`);
        }

        return new this(ExpressionNode.parseTokens(tokens));
    }

    evaluate() {
        return this.rootNode.evaluate();
    }
}