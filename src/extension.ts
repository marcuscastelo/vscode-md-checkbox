import * as vscode from 'vscode';

async function cycleCheckboxes(direction: 1 | -1, useSpecialStages: boolean = false): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const line = editor.document.lineAt(editor.selection.active.line);
  const config = vscode.workspace.getConfiguration('md-checkbox');
  const mainStages = config.get('stages', ['[ ]', '[x]']) as string[];
  const specialStages = config.get('specialStages', ['[/]', '[?]']) as string[];
  
  // Define qual set de estágios usar e qual é o "oposto"
  const primaryStages = useSpecialStages ? specialStages : mainStages;
  const secondaryStages = useSpecialStages ? mainStages : specialStages;
  
  let newText = line.text;
  let foundMatch = false;

  const checkboxes: {index: number, stage: string, stageIndex: number, isFromSecondary: boolean}[] = [];
  
  // Procura por estágios primários (do set atual)
  for (let i = 0; i < primaryStages.length; i++) {
    let searchIndex = 0;
    while (true) {
      const index = newText.indexOf(primaryStages[i], searchIndex);
      if (index === -1) { break; }
      checkboxes.push({index, stage: primaryStages[i], stageIndex: i, isFromSecondary: false});
      searchIndex = index + primaryStages[i].length;
    }
  }

  // Procura por estágios secundários (do set oposto) - marca como -1 para indicar mudança de set
  for (const secondaryStage of secondaryStages) {
    let searchIndex = 0;
    while (true) {
      const index = newText.indexOf(secondaryStage, searchIndex);
      if (index === -1) { break; }
      checkboxes.push({index, stage: secondaryStage, stageIndex: -1, isFromSecondary: true});
      searchIndex = index + secondaryStage.length;
    }
  }

  checkboxes.sort((a, b) => a.index - b.index);

  if (checkboxes.length > 0) {
    if (direction === 1) {
      // Ciclar para frente
      const allAtLastStage = checkboxes.every(cb => cb.stageIndex === primaryStages.length - 1);
      
      if (allAtLastStage) {
        // Zera todos para o primeiro estágio do set atual
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          newText = newText.substring(0, cb.index) + primaryStages[0] + newText.substring(cb.index + cb.stage.length);
        }
        foundMatch = true;
      } else {
        // Avança o primeiro que pode avançar
        for (const cb of checkboxes) {
          if (cb.stageIndex < primaryStages.length - 1) {
            const nextStage = cb.isFromSecondary ? primaryStages[0] : primaryStages[cb.stageIndex + 1];
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
        // Coloca todos no último estágio do set atual
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          newText = newText.substring(0, cb.index) + primaryStages[primaryStages.length - 1] + newText.substring(cb.index + cb.stage.length);
        }
        foundMatch = true;
      } else {
        // Retrocede o último que pode retroceder (da direita para esquerda)
        for (let i = checkboxes.length - 1; i >= 0; i--) {
          const cb = checkboxes[i];
          if (cb.stageIndex > 0 || cb.isFromSecondary) {
            const prevStage = cb.isFromSecondary ? primaryStages[0] : primaryStages[cb.stageIndex - 1];
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
  const cycleNext = vscode.commands.registerCommand('md-checkbox.cycleNext', () => cycleCheckboxes(1, false));
  const cyclePrev = vscode.commands.registerCommand('md-checkbox.cyclePrev', () => cycleCheckboxes(-1, false));
  const cycleSpecialNext = vscode.commands.registerCommand('md-checkbox.cycleSpecialNext', () => cycleCheckboxes(1, true));
  const cycleSpecialPrev = vscode.commands.registerCommand('md-checkbox.cycleSpecialPrev', () => cycleCheckboxes(-1, true));

  context.subscriptions.push(cycleNext, cyclePrev, cycleSpecialNext, cycleSpecialPrev);
}

export function deactivate() {}
