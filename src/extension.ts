"use strict";

import * as vscode from "vscode";
import * as proc from "child_process";
import * as fs from "fs";
import * as path from "path";

import {CMakeExtraInfoSupport} from "./cmakeHoverProvider";
import {CMakeCompletionItemProvider} from "./cmakeCompletionItemProvider";
import {CMakeDocumentFormattingEditProvider} from "./cmakeDocumentFormattingEditProvider";
import {CMakeDefinitionProvider}  from "./cmakeDefinitionProvider";
import {CMakeRenameProvider} from "./cmakeRenameProvider";
import {CMakeReferenceProvider} from "./cmakeReferenceProvider";
import {CMakeCodeLensProvider} from "./cmakeCMakeCodeLensProvider";


export function activate(context: vscode.ExtensionContext) {
        const CMAKE_MODE: vscode.DocumentFilter = { language: "cmake", scheme: "file" };

        context.subscriptions.push(vscode.languages.registerHoverProvider(CMAKE_MODE, new CMakeExtraInfoSupport()));
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider("cmake", new CMakeCompletionItemProvider()));
        context.subscriptions.push(vscode.languages.registerDefinitionProvider(CMAKE_MODE, new CMakeDefinitionProvider()));

        let cmakeConfig = vscode.workspace.getConfiguration("cmake");

        if (cmakeConfig.get<boolean>("experimental.enableFormattingEditProvider", false))
            context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(CMAKE_MODE, new CMakeDocumentFormattingEditProvider()));
        if (cmakeConfig.get<boolean>("experimental.enableRenameProvider", false))
            context.subscriptions.push(vscode.languages.registerRenameProvider(CMAKE_MODE, new CMakeRenameProvider()));
        if (cmakeConfig.get<boolean>("experimental.enableReferenceProvider", false))
            context.subscriptions.push(vscode.languages.registerReferenceProvider(CMAKE_MODE, new CMakeReferenceProvider()));
        if (cmakeConfig.get<boolean>("experimental.enableCodeLensProvider", false))
            context.subscriptions.push(vscode.languages.registerCodeLensProvider(CMAKE_MODE, new CMakeCodeLensProvider()));

        vscode.languages.setLanguageConfiguration(CMAKE_MODE.language, {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}""]*$
            increaseIndentPattern: /^.*\{[^}""]*$/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\"\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: "#",
            blockComment: ["#[[", "]]"],
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