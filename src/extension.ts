"use strict";

import * as vscode from "vscode";
import * as proc from "child_process";
import * as fs from "fs";
import * as path from "path";

import * as cmake_hover from "./cmakeHoverProvider";
import * as cmake_complete from "./cmakeCompletionItemProvider";

class DefProvider implements vscode.DefinitionProvider {
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Definition {
        return new vscode.Location(document.uri, new vscode.Position(0, 0));
    }
};

class CMakeDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
        
        return [ new vscode.TextEdit(new vscode.Range(0, 0, 11, 0), "hello\n")];
       // return null;
    }

}

export function activate(context: vscode.ExtensionContext) {
        const CMAKE_MODE: vscode.DocumentFilter = { language: "cmake", scheme: "file" };


        vscode.languages.registerHoverProvider(CMAKE_MODE, new cmake_hover.CMakeExtraInfoSupport());
        vscode.languages.registerCompletionItemProvider("cmake", new cmake_complete.CMakeCompletionItemProvider());
        vscode.languages.registerDefinitionProvider(CMAKE_MODE, new DefProvider);
        vscode.languages.registerDocumentFormattingEditProvider(CMAKE_MODE, new CMakeDocumentFormattingEditProvider());

        vscode.languages.setLanguageConfiguration(CMAKE_MODE.language, {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}""]*$
            increaseIndentPattern: /^.*\{[^}""]*$/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\"\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: "#"
        },
        brackets: [
            ["{", "}"],
            ["(", ")"],
        ],

        __electricCharacterSupport: {
            brackets: [
                { tokenType: "delimiter.curly.ts", open: "{", close: "}", isElectric: true },
                { tokenType: "delimiter.square.ts", open: "[", close: "]", isElectric: true },
                { tokenType: "delimiter.paren.ts", open: "(", close: ")", isElectric: true }
            ]
        },

        __characterPairSupport: {
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "(", close: ")" },
                { open: "\"", close: "\"", notIn: ["string"] },
            ]
        }
    });
    // const cmake = new cmake_mod.CMakeTools();

    // function register(name, fn) {
    //     fn = fn.bind(cmake);
    //     return vscode.commands.registerCommand(name, _ => fn());
    // }

    // for (const key of [
    //     "configure",
    //     "build",
    //     "cleanConfigure",
    //     "jumpToCacheFile",
    //     "clean",
    //     "cleanRebuild",
    //     "buildWithTarget",
    //     "setDefaultTarget",
    //     "setBuildType",
    //     "ctest",
    //     "quickStart",
    //     "stop",
    // ]) {
    //     context.subscriptions.push(register("cmake." + key, cmake[key]));
    // }
}

// this method is called when your extension is deactivated
export function deactivate() {
}