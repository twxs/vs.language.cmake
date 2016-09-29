import * as vscode from "vscode";
let pegCMake = require("peg-cmake");

function traversAST(ast, matcher) {
    ast.forEach((element) => {
        if (matcher[element.type])
            matcher[element.type](element);
    });
}

export class CMakeDefinitionProvider implements vscode.DefinitionProvider {

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Definition {
        try {
            let wordAtPosition = document.getWordRangeAtPosition(position);
            let identidier = document.getText(wordAtPosition);
            const txt = document.getText();
            const ast = pegCMake.parse(txt);

            function FunctionsVisitor() {
                this.identifier = identidier;
                this.definitions = [];
                this._func = (elt) => {
                    if (elt.identifier.value === this.identifier) {
                        this.definitions.push(elt);
                    }
                }
                this.macro = this._func;
                this.function = this._func;
                this.command_invocation = (elt) => {
                    if ((elt.identifier === "set")
                        && (elt.arguments.length > 0)
                        && (elt.arguments[0].value === this.identifier)
                    ) {
                        this.definitions.push(elt);
                    }else  if ((elt.identifier === "list")
                        && (elt.arguments.length > 1)
                        && (elt.arguments[0].value === "APPEND")
                        && (elt.arguments[1].value === this.identifier)
                    ) {
                        this.definitions.push(elt);
                    }
                };
                this.if = (elt) => {
                    traversAST(elt.body, this);
                    if (elt["elseif"])
                        elt.elseif.forEach((e) => { traversAST(elt.body, this); });
                    if (elt.else) traversAST(elt.else.body, this);
                }
            };
            let matcher = new FunctionsVisitor();
            ast.forEach((element) => {
                if (matcher[element.type])
                    matcher[element.type](element);
            });
            if (matcher.definitions) {
                return matcher.definitions.map((elt) => {
                    return new vscode.Location(document.uri,
                    new vscode.Position(elt.location.start.line - 1, elt.location.start.offset));
                });
            }

        } catch (e) {
            console.log("error");
        }
        return null;
    }
};