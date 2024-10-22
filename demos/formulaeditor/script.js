import * as $g from "https://opensource.liveg.tech/Adapt-UI/src/adaptui.js";
import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";

import * as maths from "../../src/maths.js";
import * as richMaths from "../../richeditor/richmaths.js";

astronaut.unpack();

$g.waitForLoad().then(function() {
    var editor = richMaths.format.createRichEditor();

    maths.engine.variables = {
        x: new maths.ComplexNumberType(0),
        y: new maths.ComplexNumberType(0)
    };

    var linearExpression = CodeBlock({
        styles: {
            "margin": "0"
        }
    }) ();

    var calculateButton = Button() ("Calculate");
    var insertFractionButton = Button("secondary") ("Insert fraction");
    var insertSquareButton = Button("secondary") ("Insert square");
    var insertLnButton = Button("secondary") ("Insert ln");
    var decimalPointIsCommaInput = CheckboxInput() ();
    var resultReadout = Paragraph() ();

    function updateLinearExpression() {
        linearExpression.setText(editor.inter.getExpression({separator: maths.engine.separator}));
    }

    editor.on("input keyup", updateLinearExpression);

    decimalPointIsCommaInput.on("change", function() {
        maths.engine.decimalPointIsComma = decimalPointIsCommaInput.getValue();
        maths.engine.separator = decimalPointIsCommaInput.getValue() ? ";" : ",";

        updateLinearExpression();
    });

    calculateButton.on("click", function() {
        var expression = maths.engine.Expression.parse(editor.inter.getExpression({separator: maths.engine.separator}));

        expression.evaluate().then(function(result) {
            resultReadout.setText(result);
        }).catch(function(error) {
            console.warn(error);

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

    insertLnButton.on("click", function(event) {
        editor.inter.insertText("ln(");

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
            Label (
                decimalPointIsCommaInput,
                Text("Decimal point is comma")
            ),
            ButtonRow (
                calculateButton,
                insertFractionButton,
                insertSquareButton,
                insertLnButton
            ),
            resultReadout
        )
    );
});