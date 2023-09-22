import * as core from "../../src/core.js";

core.register();

window.addEventListener("load", function() {
    document.querySelector("#input").addEventListener("keydown", function(event) {
        if (event.key == "Enter") {
            var expression = core.engine.Expression.parse(document.querySelector("#input").value);

            expression.evaluate().then(function(result) {
                document.querySelector("#output").textContent += `${document.querySelector("#input").value} = ${result?.toString() ?? result}\n`;
                document.querySelector("#input").value = "";
            });
        }
    });
});