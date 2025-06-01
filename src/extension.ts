// checkbox-replacer/src/extension.ts

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const replaceCheckbox = vscode.commands.registerCommand('checkboxReplacer.replaceNext', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {return;}

    const document = editor.document;
    const position = editor.selection.active;
    const line = document.lineAt(position.line);
    const text = line.text;

    let replacedText = text;

	const stages: string[] = vscode.workspace.getConfiguration('checkboxReplacer').get('stages', ['[ ]', '[x]']);

	for (let i = 0; i < stages.length; i++) {
		const currentStage = stages[i];
		const nextStage = stages[(i + 1) % stages.length];
		if (text.includes(`${currentStage}`)) {
			replacedText = text.replace(`${currentStage}`, `${nextStage}`);
			break; // Stop after the first match
		}
	}

    if (replacedText !== text) {
      await editor.edit(editBuilder => {
        editBuilder.replace(line.range, replacedText);
      });
    }
  });

  context.subscriptions.push(replaceCheckbox);
}

export function deactivate() {}
