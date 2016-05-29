import * as vscode from "vscode";


class CMakeDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
        return [ new vscode.TextEdit(new vscode.Range(0, 0, 11, 0), "hello\n")];
       // return null;
    }
}