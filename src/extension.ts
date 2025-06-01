import * as vscode from 'vscode';

async function cycleCheckboxes(direction: 1 | -1): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const line = editor.document.lineAt(editor.selection.active.line);
  const stages = vscode.workspace.getConfiguration('md-checkbox').get('stages', ['[ ]', '[x]']) as string[];
  
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
    if (direction === 1) {
      // Ciclar para frente
      const allAtLastStage = checkboxes.every(cb => cb.stageIndex === stages.length - 1);
      
      if (allAtLastStage) {
        // Zera todos para o primeiro estágio
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          newText = newText.substring(0, cb.index) + stages[0] + newText.substring(cb.index + cb.stage.length);
        }
        foundMatch = true;
      } else {
        // Avança o primeiro que não está no último estágio
        for (const cb of checkboxes) {
          if (cb.stageIndex < stages.length - 1) {
            const nextStage = stages[cb.stageIndex + 1];
            newText = newText.substring(0, cb.index) + nextStage + newText.substring(cb.index + cb.stage.length);
            foundMatch = true;
            break;
          }
        }
      }
    } else {
      // Ciclar para trás
      const allAtFirstStage = checkboxes.every(cb => cb.stageIndex === 0);
      
      if (allAtFirstStage) {
        // Coloca todos no último estágio
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          newText = newText.substring(0, cb.index) + stages[stages.length - 1] + newText.substring(cb.index + cb.stage.length);
        }
        foundMatch = true;
      } else {
        // Retrocede o último que não está no primeiro estágio (da direita para esquerda)
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          if (cb.stageIndex > 0) {
            const prevStage = stages[cb.stageIndex - 1];
            newText = newText.substring(0, cb.index) + prevStage + newText.substring(cb.index + cb.stage.length);
            foundMatch = true;
            break;
          }
        }
      }
    }
  }

  if (foundMatch) {
    await editor.edit(editBuilder => {
      editBuilder.replace(line.range, newText);
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  const cycleNext = vscode.commands.registerCommand('md-checkbox.cycleNext', () => cycleCheckboxes(1));
  const cyclePrev = vscode.commands.registerCommand('md-checkbox.cyclePrev', () => cycleCheckboxes(-1));

  context.subscriptions.push(cycleNext, cyclePrev);
}

export function deactivate() {}
