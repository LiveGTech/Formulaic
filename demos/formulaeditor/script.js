import * as $g from "https://opensource.liveg.tech/Adapt-UI/src/adaptui.js";
import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";

import * as maths from "../../src/maths.js";
import * as richMaths from "../../richeditor/richmaths.js";

astronaut.unpack();

$g.waitForLoad().then(function() {
    var editor = richMaths.format.createRichEditor();

    var linearExpression = CodeBlock({
        styles: {
            "margin": "0"
        }
    }) ();

    var calculateButton = Button() ("Calculate");
    var insertFractionButton = Button("secondary") ("Insert fraction");
    var insertSquareButton = Button("secondary") ("Insert square");
    var resultReadout = Paragraph() ();

    editor.on("input keyup", function() {
        linearExpression.setText(editor.inter.getExpression());
    });

    calculateButton.on("click", function() {
        var expression = maths.engine.Expression.parse(editor.inter.getExpression());

        expression.evaluate().then(function(result) {
            resultReadout.setText(result);
        }).catch(function() {
            resultReadout.setText("Error");
        });
    });

    insertFractionButton.on("click", function(event) {
        editor.inter.insertText("over");

        event.preventDefault();
    });

    insertSquareButton.on("click", function(event) {
        editor.inter.insertText("^2");

        event.preventDefault();
    });

    astronaut.render(
        Section (
            Heading() ("Formulaic Formula Editor Demo"),
            editor,
            Accordion (
                Text("Linear expression"),
                linearExpression
            ),
            ButtonRow (
                calculateButton,
                insertFractionButton,
                insertSquareButton
            ),
            resultReadout
        )
    );
});