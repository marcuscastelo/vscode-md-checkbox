import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const replaceCheckbox = vscode.commands.registerCommand('checkboxReplacer.replaceNext', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const line = editor.document.lineAt(editor.selection.active.line);
    const stages = vscode.workspace.getConfiguration('checkboxReplacer').get('stages', ['[ ]', '[x]']) as string[];

    for (let i = 0; i < stages.length; i++) {
      if (line.text.includes(stages[i])) {
        const nextStage = stages[(i + 1) % stages.length];
        await editor.edit(editBuilder => {
          editBuilder.replace(line.range, line.text.replace(stages[i], nextStage));
        });
        break;
      }
    }
  });

  context.subscriptions.push(replaceCheckbox);
}

export function deactivate() {}
