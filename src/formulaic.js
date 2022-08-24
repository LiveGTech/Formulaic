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
    constructor(code, registerAsConcept = true) {
        this.code = code;

        if (registerAsConcept) {
            this.registerAsConcept();
        }
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

export const DIRECT_FUNCTION = new Function(null, (value) => Promise.resolve(value));

export var functions = [
    new Function("a", () => Promise.resolve("a")),
    new Function("b", () => Promise.resolve("b")),
    new Function("join", (a, b) => Promise.resolve(`${a} ${b}`))
];

export var concepts = [];

export var operators = [
    new Operator("+")
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

        // TODO: Operator transformation into functions to be implemented here

        console.log(instance.children);

        var finalChildren = [];
        var hadExpression = false;

        for (var i = 0; i < instance.children.length; i++) {
            var child = instance.children[i];

            if (child instanceof Token) {
                if (child.type == "separator") {
                    hadExpression = false;

                    continue;
                }

                throw new Error("Unresolved token conversion");
            }

            if (hadExpression) {
                throw new SyntaxError("Expected a separator");
            }

            finalChildren.push(child);

            hadExpression = true;
        }

        instance.children = finalChildren;

        return instance;
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