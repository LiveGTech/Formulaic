import * as formulaic from "../../src/formulaic.js";

window.addEventListener("load", function() {
    document.querySelector("#input").addEventListener("keydown", function(event) {
        if (event.key == "Enter") {
            var expression = formulaic.Expression.parse(document.querySelector("#input").value);

            expression.evaluate().then(function(result) {
                document.querySelector("#output").textContent += result.toString() + "\n";
                document.querySelector("#input").value = "";
            });
        }
    });
});