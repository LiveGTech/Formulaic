/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

export class Engine {
    separator = ",";
    assignmentOperator = "=";

    FunctionBinding = class {
        constructor(name, callback) {
            this.name = name;
            this.callback = callback;
        }
    };

    Concept = class {
        match(code, tokens) {
            return null;
        }
    };

    Operator = ((engineScope) => class {
        constructor(codeBindings = {}, registerAsConcept = true) {
            this.codeBindings = codeBindings;

            if (registerAsConcept) {
                this.registerAsConcept();
            }
        }

        isTargetToken(item) {
            return item.owner == this;
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
                    if (this.isTargetToken(reducedChildren[i])) {
                        var reduction = this.transform(reducedChildren);

                        if (reduction == null) {
                            continue;
                        }

                        reducedChildren = reduction;
                        reductionNeeded = true;

                        break;
                    }
                }
            }

            return reducedChildren;
        }

        registerAsConcept() {
            var thisScope = this;

            engineScope.concepts.push(new (class extends engineScope.Concept {
                match(code, tokens) {
                    for (var i = 0; i < Object.keys(thisScope.codeBindings).length; i++) {
                        var operatorCode = Object.keys(thisScope.codeBindings)[i];

                        if (code.startsWith(operatorCode)) {
                            return new engineScope.Token("operator", operatorCode, thisScope);
                        }
                    }

                    return null;
                }
            })());
        }
    })(this);

    UnaryOperator = ((engineScope) => class extends this.Operator {
        constructor(codeBindings = {}, prefix = true, registerAsConcept = true) {
            super(codeBindings, registerAsConcept);

            this.prefix = prefix;
        }

        transform(children) {
            var arg = [];
            var operatorToken = null;

            if ((this.prefix && !this.isTargetToken(children[0])) || (!this.prefix && this.isTargetToken(hildren[children.length - 1]))) {
                return null;
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i];

                if (this.isTargetToken(child)) {
                    operatorToken = child;

                    continue;
                }

                arg.push(child);
            }

            var expression = new engineScope.ExpressionNode(arg, this.codeBindings[operatorToken.code]);

            expression.reduceChildren();

            return [expression];
        }
    })(this);

    BinaryOperator = ((engineScope) => class extends this.Operator {
        constructor(codeBindings = {}, leftAssociative = true, registerAsConcept = true) {
            super(codeBindings, registerAsConcept);

            this.leftAssociative = leftAssociative;
        }

        transform(children) {
            var args = [[], []];
            var reachedOperator = false;
            var operatorToken = null;

            for (
                var i = this.leftAssociative ? children.length - 1 : 0;
                this.leftAssociative ? i >= 0 : i < children.length;
                this.leftAssociative ? i-- : i++
            ) {
                var child = children[i];

                if (!reachedOperator && this.isTargetToken(child)) {
                    reachedOperator = true;
                    operatorToken = child;

                    continue;
                }

                if (this.leftAssociative) {
                    if (!reachedOperator) {
                        args[1].unshift(child);
                    } else {
                        args[0].unshift(child);
                    }
                } else {
                    if (!reachedOperator) {
                        args[0].push(child);
                    } else {
                        args[1].push(child);
                    }
                }
            }

            if (args[0].length == 0 || args[1].length == 0) {
                return null;
            }

            var expression = new engineScope.ExpressionNode([
                ...args[0],
                new engineScope.Token("separator", engineScope.separator),
                ...args[1]
            ], this.codeBindings[operatorToken.code]);

            expression.reduceChildren();

            return [expression];
        }

        registerAsConcept() {
            var thisScope = this;

            engineScope.concepts.push(new (class extends engineScope.Concept {
                match(code, tokens) {
                    for (var i = 0; i < Object.keys(thisScope.codeBindings).length; i++) {
                        var operatorCode = Object.keys(thisScope.codeBindings)[i];

                        if (code.startsWith(operatorCode) && tokens.length > 0 && !["operator", "call", "open"].includes(tokens[tokens.length - 1].type)) {
                            return new engineScope.Token("operator", operatorCode, thisScope);
                        }
                    }

                    return null;
                }
            })());
        }
    })(this);

    DIRECT_FUNCTION = new this.FunctionBinding(null, (value) => Promise.resolve(value));

    functions = [];
    concepts = [];
    operators = [];
    implicitOperatorToken = null;
    unknownFunctionHandler = null;

    Entity = class {
        evaluate() {
            return Promise.reject("Base class not implemented");
        }
    };

    ExpressionLiteral = class extends this.Entity {
        constructor(value) {
            super();

            this.value = value;
        }

        static parse(code) {
            return new this(null);
        }

        evaluate() {
            return Promise.resolve(this.value);
        }

        reduceChildren() {}
    };

    ExpressionNode = ((engineScope) => class extends this.Entity {
        constructor(children = [], referenceFunction = engineScope.DIRECT_FUNCTION) {
            super();

            this.children = children;
            this.referenceFunction = referenceFunction;
        }

        static parseTokens(tokens, referenceFunction = engineScope.DIRECT_FUNCTION) {
            var instance = new this([], referenceFunction);

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
                            var matchedFunction = engineScope.functions.find((currentFunction) => currentFunction.name == functionName);

                            if (!matchedFunction) {
                                if (engineScope.unknownFunctionHandler != null) {
                                    matchedFunction = engineScope.unknownFunctionHandler(functionName);
                                } else {
                                    throw new ReferenceError(`Unknown function: ${functionName}`);
                                }
                            }

                            instance.children.push(engineScope.ExpressionNode.parseTokens(innerTokens, matchedFunction));
                        } else {
                            instance.children.push(engineScope.ExpressionNode.parseTokens(innerTokens));
                        }

                        continue;

                    case "close":
                        throw new SyntaxError("Expected an opening bracket or function call");

                    case "literal":
                        instance.children.push(token.literalClass.parse(token.code));
                        continue;

                    case "variable":
                        var isAssignment = false;

                        if (tokens[i + 1]?.type == "operator" && tokens[i + 1]?.code == engineScope.assignmentOperator) {
                            isAssignment = true;

                            if (!token.canSet) {
                                throw new TypeError("Variable is a constant (cannot set value)");
                            }
                        }

                        instance.children.push(engineScope.ExpressionNode.parseTokens([token.variableId], isAssignment ? token.idGetterReferenceFunction : token.getterReferenceFunction));
                        continue;

                    case "separator":
                    case "operator":
                        instance.children.push(token);
                        continue;
                }
            }

            instance.insertImplicitOperatorTokens();
            instance.reduceChildren();

            return instance;
        }

        insertImplicitOperatorTokens() {
            if (engineScope.implicitOperatorToken == null) {
                return;
            }

            var newChildren = [];

            this.children.forEach(function(child) {
                if (newChildren.length > 0 && child instanceof engineScope.Entity && newChildren[newChildren.length - 1] instanceof engineScope.Entity) {
                    newChildren.push(engineScope.implicitOperatorToken);
                }

                newChildren.push(child);
            });

            this.children = newChildren;
        }

        reduceChildren() {
            var argumentChildren = [[]];

            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];

                if (child instanceof engineScope.Token && child.type == "separator") {
                    argumentChildren.push([]);

                    continue;
                }

                argumentChildren[argumentChildren.length - 1].push(child);
            }

            for (var i = 0; i < engineScope.operators.length; i++) {
                for (var j = 0; j < argumentChildren.length; j++) {
                    argumentChildren[j] = engineScope.operators[i].reduce(argumentChildren[j]);
                }
            }

            this.children = argumentChildren.flat();
        }

        evaluate() {
            var thisScope = this;

            return Promise.all(this.children.map((child) => child.evaluate())).then(function(values) {
                return thisScope.referenceFunction.callback(...values);
            });
        }
    })(this);

    Token = class {
        constructor(type, code, owner = null) {
            this.type = type;
            this.code = code;
            this.owner = owner;
        }
    };

    LiteralToken = class extends this.Token {
        constructor(literalClass, code) {
            super("literal", code);

            this.literalClass = literalClass;
        }
    };

    VariableToken = ((engineScope) => class extends this.Token {
        constructor(variableId, code, getter, canSet = true) {
            super("variable", code);

            this.variableId = variableId;
            this.getter = getter;
            this.canSet = canSet;

            this.idGetter = () => Promise.resolve(this.variableId);
        }

        get getterReferenceFunction() {
            return new engineScope.FunctionBinding(null, this.getter);
        }

        get idGetterReferenceFunction() {
            return new engineScope.FunctionBinding(null, this.idGetter);
        }
    })(this);

    Expression = ((engineScope) => class {
        constructor(rootNode = new engineScope.ExpressionNode()) {
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
                tokens.push(new engineScope.Token(type, tokenToAdd));
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

                for (var i = 0; i < engineScope.concepts.length; i++) {
                    var match = engineScope.concepts[i].match(code, tokens);

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

                if (matchesToken(engineScope.separator)) {
                    addToken("separator");
                    continue;
                }

                if (matchesToken(engineScope.separator)) {
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

            return new this(engineScope.ExpressionNode.parseTokens(tokens));
        }

        evaluate() {
            return this.rootNode.evaluate();
        }
    })(this);

    static merge(engines) {
        var newEngine = new Engine();

        engines.forEach(function(engine) {
            newEngine.functions.push(...engine.functions);
            newEngine.concepts.push(...engine.concepts);
            newEngine.operators.push(...engine.operators);

            newEngine.implicitOperatorToken ||= engine.implicitOperatorToken;
            newEngine.unknownFunctionHandler ||= engine.unknownFunctionHandler;
        });

        return newEngine;
    }

    registerFunction(functionBinding) {
        this.functions.push(functionBinding);
    }

    registerConcept(concept) {
        this.concepts.push(concept);
    }

    registerOperator(operator) {
        this.operators.push(operator);
    }

    setImplicitOperator(operator, code = Object.keys(operator.codeBindings)[0]) {
        this.implicitOperatorToken = new this.Token("operator", code, operator);
    }

    setUnknownFunctionHandler(handler) {
        this.unknownFunctionHandler = handler;
    }
}