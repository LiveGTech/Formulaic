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

export const DIRECT_FUNCTION = new Function(null, (value) => Promise.resolve(value));

export var functions = [
    new Function("a", () => Promise.resolve("a")),
    new Function("b", () => Promise.resolve("b")),
    new Function("join", (a, b) => Promise.resolve(`${a} ${b}`))
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
        // We should first parse entities (so that cases where entity splits into multiple tokens can be resolved), then everything else

        var instance = new this([], referenceFunction);

        console.log(tokens);

        for (var i = 0; i < tokens.length; i++) {
            var type = tokens[i].type;

            switch (type) {
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

                    if (type == "call") {
                        instance.children.push(ExpressionNode.parseTokens(innerTokens, functions.find((currentFunction) => currentFunction.name == functionName)));
                    } else {
                        instance.children.push(ExpressionNode.parseTokens(innerTokens));
                    }

                    continue;

                    case "close":
                        throw new SyntaxError("Expected an opening bracket or function call");

                case "separator":
                    // Mainly just syntactic sugar for now; though this will be important for operator precedence evaluation when we implement them
                    continue;
            }
        }

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
        var inEntity = false;
        var entityToAdd = "";

        function checkEntity() {
            if (inEntity) {
                tokens.push(new Token("entity", entityToAdd));
            }

            inEntity = false;
        }

        function matchesToken(token, contextAfter = ".*") {
            var matches = code.match(new RegExp(`^(?:${token})`, "sm"));

            if (matches && code.substring(matches[0].length).match(new RegExp(`^(?:${contextAfter})`, "s"))) {
                checkEntity();

                tokenToAdd = matches[0];
                code = code.substring(matches[0].length);

                return true;
            }

            return false;
        }

        function addToken(type) {
            tokens.push(new Token(type, tokenToAdd));
        }

        while (code.length > 0) {
            if (matchesToken("\\/\\/.*?$")) {
                // Comment match
                continue;
            }

            if (matchesToken("\\/\\*.*?\\*\\/")) {
                // Comment match
                continue;
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

            inEntity = true;
            entityToAdd += code[0];
            code = code.substring(1);
        }

        checkEntity();

        return new this(ExpressionNode.parseTokens(tokens));
    }

    evaluate() {
        return this.rootNode.evaluate();
    }
}