/*
    Formulaic
 
    Copyright (C) LiveG. All Rights Reserved.
 
    https://liveg.tech
    Licensed by the LiveG Open-Source Licence, which can be found at LICENCE.md.
*/

export var syntax = {
    openBracket: "(",
    closeBracket: ")"
};

export class Function {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}

export const DIRECT_FUNCTION = new Function(null, (value) => Promise.resolve(value));

export class ExpressionNode {
    constructor() {
        this.children = [];
        this.referenceFunction = DIRECT_FUNCTION;
    }

    evaluate() {
        this.referenceFunction(...this.children.map((child) => child.evaluate()));
    }
}

export class Expression {
    constructor() {
        this.rootNode = new ExpressionNode();
    }

    static parse(code) {
        // TODO: Implement parsing

        return new this();
    }

    evaluate() {
        // TODO: Implement evaluation

        return Promise.resolve("Testing!");
    }
}