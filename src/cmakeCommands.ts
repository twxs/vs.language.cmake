import * as vscode from "vscode";
import * as cmake from "./cmake";

// Return the url for the online help based on the cmake executable binary used
async function cmake_help_url() {
    let base_url = "https://cmake.org/cmake/help";
    let version = await cmake.cmake_version();
    if (version.length > 0) {
        if (version >= "3.0") {
            let re = /(\d+.\d+).\d+/;
            version = version.replace(re, "$1/");
        } else {
            let older_versions = [
                "2.8.12", "2.8.11", "2.8.10", "2.8.9", "2.8.8", "2.8.7", "2.8.6", "2.8.5", "2.8.4", "2.8.3", "2.8.2", "2.8.1", "2.8.0", "2.6"
            ];
            if (older_versions.indexOf(version) === -1) {
                version = "latest/";
            } else {
                version = version + "/cmake.html";
            }
        }
    } else {
        version = "latest/";
    }
    return base_url + "/v" + version;
}


async function cmake_online_help(search: string) {
    let url = await cmake_help_url();
    let v2x = url.endsWith("html"); // cmake < 3.0 
    const results = await Promise.all([
        cmake.cmCommandsSuggestionsExact(search),
        cmake.cmVariablesSuggestionsExact(search),
        cmake.cmModulesSuggestionsExact(search),
        cmake.cmPropertiesSuggestionsExact(search),
    ]);

    const opener = require("opener");

    const suggestions = Array.prototype.concat.apply([], results);

    if (suggestions.length === 0) {
        search = search.replace(/[<>]/g, "");
        if (v2x || search.length === 0) {
            opener(url);
        } else {
            opener(url + "search.html?q=" + search + "&check_keywords=yes&area=default");
        }
    } else {
        let suggestion = suggestions[0];
        let type = cmake.cmakeTypeFromvscodeKind(suggestion.kind);
        if (type === "property") {
            if (v2x) {
                opener(url);
            } else {
                // TODO : needs to filter properties per scope to detect the right URL
                opener(url + "search.html?q=" + search + "&check_keywords=yes&area=default");
            }
        } else {
            if (type === "function") {
                type = "command";
            }
            search = search.replace(/[<>]/g, "");
            if (v2x) {
                opener(url + "#" + type + ":" + search);
            } else {
                opener(url + type + "/" + search + ".html");
            }
        }
    }
}


function CMakeOnelineHelp() {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No open text editor
    }
    const selection = editor.selection;
    const document = editor.document;
    const position = selection.start;
    const wordAtPosition = document.getWordRangeAtPosition(position);

    let currentWord = "";

    if (wordAtPosition && wordAtPosition.start.character < position.character) {
        const word = document.getText(wordAtPosition);
        currentWord = word;
    }

    vscode.window.showInputBox({ prompt: "Search on Cmake online documentation", placeHolder: currentWord }).then(function (result) {
        if (typeof result !== "undefined") { // Escape
            if (result.length === 0) { // 
                result = currentWord;
            }
            if (result !== "") {
                cmake_online_help(result);
            }
        }
    });
}
