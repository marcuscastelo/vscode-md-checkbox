import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const replaceCheckbox = vscode.commands.registerCommand('checkboxReplacer.replaceNext', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const line = editor.document.lineAt(editor.selection.active.line);
    const stages = vscode.workspace.getConfiguration('checkboxReplacer').get('stages', ['[ ]', '[x]']) as string[];
    
    let newText = line.text;
    let foundMatch = false;

    const checkboxes: {index: number, stage: string, stageIndex: number}[] = [];
    
    for (let i = 0; i < stages.length; i++) {
      let searchIndex = 0;
      while (true) {
        const index = newText.indexOf(stages[i], searchIndex);
        if (index === -1) { break; }
        checkboxes.push({index, stage: stages[i], stageIndex: i});
        searchIndex = index + stages[i].length;
      }
    }

    checkboxes.sort((a, b) => a.index - b.index);

    if (checkboxes.length > 0) {
      const allAtLastStage = checkboxes.every(cb => cb.stageIndex === stages.length - 1);
      
      if (allAtLastStage) {
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          newText = newText.substring(0, cb.index) + stages[0] + newText.substring(cb.index + cb.stage.length);
        }
        foundMatch = true;
      } else {
        for (const cb of checkboxes) {
          if (cb.stageIndex < stages.length - 1) {
            const nextStage = stages[cb.stageIndex + 1];
            newText = newText.substring(0, cb.index) + nextStage + newText.substring(cb.index + cb.stage.length);
            foundMatch = true;
            break;
          }
        }
      }
    }

    if (foundMatch) {
      await editor.edit(editBuilder => {
        editBuilder.replace(line.range, newText);
      });
    }
  });

  context.subscriptions.push(replaceCheckbox);
}

export function deactivate() {}
