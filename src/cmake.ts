"use strict";

import * as path from "path";
import * as fs from "fs";
import * as proc from "child_process";
import * as os from "os";
import * as vscode from "vscode";

// import * as vscode from "vscode";

interface CMakeHelpFunc {
    (source: string): Promise<string>;
}


export async function cmake(args: Array<string>): Promise<string> {
    return new Promise<string>(function (resolve, reject) {

        let cmd = proc.spawn("cmake", args.map(arg => { return arg.replace(/\r/gm, ""); }));
        let stdout: string = "";
        cmd.stdout.on("data", function (data) {
            const txt: string = data.toString("utf8");
            stdout += txt.replace(/\r/gm, "");
        });
        cmd.on("error", function (error) {
            reject();
        });
        cmd.on("exit", function (code) {
            resolve(stdout);
        });
    });
}


export async function cmake_help_list(kind: string): Promise<string> {
    return await cmake(["--help-" + kind + "-list"]);
}
export async function cmake_help_command_list(): Promise<string> {
    return await cmake_help_list("command");
}
export async function cmake_help_variable_list(): Promise<string> {
    return await cmake_help_list("variable");
}
export async function cmake_help_property_list(): Promise<string> {
    return await cmake_help_list("property");
}
export async function cmake_help_module_list(): Promise<string> {
    return await cmake_help_list("module");
}

export async function cmake_help(kind: string, name: string): Promise<string> {
    try {
        const result = await cmake_help_list(kind);
        if (result.indexOf(name) > -1) {
            return await cmake(["--help-" + kind, name]);
        } else {
            throw ("not found");
        }
    } catch (e) {
        throw ("not found");
    }
}

export async function cmake_help_command(name: string): Promise<string> {
    return await cmake_help("command", name);
}
export async function cmake_help_variable(name: string): Promise<string> {
    return await cmake_help("variable", name);
}
export async function cmake_help_module(name: string): Promise<string> {
    return await cmake_help("module", name);
}
export async function cmake_help_property(name: string): Promise<string> {
    return await cmake_help("property", name);
}

export function cmake_help_all(): {
    "function": CMakeHelpFunc,
    "module": CMakeHelpFunc,
    "variable": CMakeHelpFunc,
    "property": CMakeHelpFunc
} {
    let promises = {
        "function": (name: string) => {
            return this.cmake_help_command(name);
        },
        "module": (name: string) => {
            return this.cmake_help_module(name);
        },
        "variable": (name: string) => {
            return this.cmake_help_variable(name);
        }
        ,
        "property": (name: string) => {
            return this.cmake_help_property(name);
        }
    };
    return promises;
}

function _extractVersion(output: string): string {
    let re = /cmake\s+version\s+(\d+.\d+.\d+)/;
    if (re.test(output)) {
        let result = re.exec(output);
        return result[1];
    }
    return "";
}

export async function cmake_version(): Promise<string> {
    let cmd_output = await this.cmake(["--version"]);
    let version = this._extractVersion(cmd_output);
    return version;
}

export function vscodeKindFromCMakeCodeClass(kind: string): vscode.CompletionItemKind {
    switch (kind) {
        case "function":
            return vscode.CompletionItemKind.Function;
        case "variable":
            return vscode.CompletionItemKind.Variable;
        case "module":
            return vscode.CompletionItemKind.Module;
    }
    return vscode.CompletionItemKind.Property; // TODO@EG additional mappings needed?
}

export function cmakeTypeFromvscodeKind(kind: vscode.CompletionItemKind): string {
    switch (kind) {
        case vscode.CompletionItemKind.Function:
            return "function";
        case vscode.CompletionItemKind.Variable:
            return "variable";
        case vscode.CompletionItemKind.Module:
            return "module";
    }
    return "property";
}


export async function suggestionsHelper(cmake_cmd: Promise<string>, currentWord: string, type: string, insertText, matchPredicate): Promise<vscode.CompletionItem[]> {
    const stdout = await cmake_cmd;
    let suggestions = [];
    let commands = stdout.split("\n").filter(function (v) { return matchPredicate(v, currentWord); });
    if (commands.length > 0) {
        suggestions = commands.map(function (command_name) {
            const item = new vscode.CompletionItem(command_name);
            item.kind = vscodeKindFromCMakeCodeClass(type);
            if (insertText == null || insertText === "") {
                item.insertText = command_name;
            } else {
                item.insertText = insertText(command_name);
            }
            return item;
        });
    }
    return suggestions;
}

/// strings Helpers
function strContains(word, pattern) {
    return word.indexOf(pattern) > -1;
}

function strEquals(word, pattern) {
    return word === pattern;
}


function cmModuleInsertText(module: string) {
    if (module.indexOf("Find") === 0) {
        return "find_package(" + module.replace("Find", "") + "{{ REQUIRED}})";
    } else {
        return "include(" + module + ")";
    }
}

function cmFunctionInsertText(func: string) {
    let scoped_func = ["if", "function", "while", "macro", "foreach"];
    let is_scoped = scoped_func.reduceRight(function (prev, name, idx, array) { return prev || func === name; }, false);
    if (is_scoped)
        return func + "({{}})\n  \nend" + func + "()\n";
    else
        return func + "({{}})";
}
function cmVariableInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, "{{$1}}");
}
function cmPropetryInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, "{{$1}}");
}

export async function cmCommandsSuggestions(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_command_list();
    return suggestionsHelper(cmd, currentWord, "function", cmFunctionInsertText, strContains);
}

export async function cmVariablesSuggestions(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_variable_list();
    return suggestionsHelper(cmd, currentWord, "variable", cmVariableInsertText, strContains);
}


export async function cmPropertiesSuggestions(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_property_list();
    return suggestionsHelper(cmd, currentWord, "property", cmPropetryInsertText, strContains);
}

export async function cmModulesSuggestions(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_module_list();
    return suggestionsHelper(cmd, currentWord, "module", cmModuleInsertText, strContains);
}


export async function cmCommandsSuggestionsExact(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_command_list();
    return suggestionsHelper(cmd, currentWord, "function", cmFunctionInsertText, strEquals);
}

export async function cmVariablesSuggestionsExact(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_variable_list();
    return suggestionsHelper(cmd, currentWord, "variable", cmVariableInsertText, strEquals);
}


export async function cmPropertiesSuggestionsExact(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_property_list();
    return suggestionsHelper(cmd, currentWord, "property", cmPropetryInsertText, strEquals);
}

export async function cmModulesSuggestionsExact(currentWord: string): Promise<vscode.CompletionItem[]> {
    let cmd = cmake_help_module_list();
    return suggestionsHelper(cmd, currentWord, "module", cmModuleInsertText, strEquals);
}