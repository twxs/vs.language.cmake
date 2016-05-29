import * as vscode from "vscode";
import * as cmake from "./cmake";


export class CMakeCompletionItemProvider implements vscode.CompletionItemProvider {
    public triggerCharacters: string[];
    public excludeTokens: string[] = ["string", "comment", "numeric"];


    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {
        let wordAtPosition = document.getWordRangeAtPosition(position);
        let currentWord = "";
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            const word = document.getText(wordAtPosition);
            currentWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        return new Promise(function (resolve, reject) {
            Promise.all([
                cmake.cmCommandsSuggestions(currentWord),
                cmake.cmVariablesSuggestions(currentWord),
                cmake.cmPropertiesSuggestions(currentWord),
                cmake.cmModulesSuggestions(currentWord)
            ]).then(function (results) {
                const suggestions = Array.prototype.concat.apply([], results);
                resolve(suggestions);
            }).catch(err => { reject(err); });
        });
    }

    public resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): Thenable<vscode.CompletionItem> {
        let promises = cmake.cmake_help_all();
        let type = cmake.cmakeTypeFromvscodeKind(item.kind);
        return promises[type](item.label).then(function (result: string) {
            item.documentation = result.split("\n")[3];
            return item;
        });
    }
}
