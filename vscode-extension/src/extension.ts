import * as vscode from "vscode";
import { diagnosticsFor } from "./diagnostics";
import { scanDocument } from "./scanner";

export function activate(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection("deploysense");
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.text = "DeploySense: idle";
  status.show();

  const run = (document = vscode.window.activeTextEditor?.document) => {
    if (!document) return;
    const result = scanDocument(document);
    if (!result) return;
    collection.set(document.uri, diagnosticsFor(result));
    status.text = `DeploySense: ${result.score}/100`;
    status.tooltip = `${result.summary.total} issue(s) found`;
  };

  context.subscriptions.push(collection, status);
  context.subscriptions.push(vscode.commands.registerCommand("deploysense.scanCurrentFile", () => run()));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => run(document)));
}

export function deactivate() {}
