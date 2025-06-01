import * as vscode from 'vscode';

interface Checkbox {
  index: number;
  stage: string;
  stageIndex: number;
  isFromSecondarySet: boolean;
}

function getConfiguration() {
  const config = vscode.workspace.getConfiguration('md-checkbox');
  return {
    mainStages: config.get('stages', ['[ ]', '[x]']) as string[],
    specialStages: config.get('specialStages', ['[/]', '[?]']) as string[]
  };
}

function findCheckboxes(text: string, primaryStages: string[], secondaryStages: string[]): Checkbox[] {
  const checkboxes: Checkbox[] = [];
  
  // Find primary stage checkboxes
  primaryStages.forEach((stage, stageIndex) => {
    let searchIndex = 0;
    while (true) {
      const index = text.indexOf(stage, searchIndex);
      if (index === -1) { break; }
      
      checkboxes.push({ index, stage, stageIndex, isFromSecondarySet: false });
      searchIndex = index + stage.length;
    }
  });

  // Find secondary stage checkboxes
  secondaryStages.forEach(stage => {
    let searchIndex = 0;
    while (true) {
      const index = text.indexOf(stage, searchIndex);
      if (index === -1) { break; }
      
      checkboxes.push({ index, stage, stageIndex: -1, isFromSecondarySet: true });
      searchIndex = index + stage.length;
    }
  });

  return checkboxes.sort((a, b) => a.index - b.index);
}

function cycleForward(checkboxes: Checkbox[], primaryStages: string[], text: string): string {
  const allAtLastStage = checkboxes.every(cb => cb.stageIndex === primaryStages.length - 1);
  
  if (allAtLastStage) {
    // Reset all to first stage
    return replaceAllCheckboxes(checkboxes, primaryStages[0], text);
  }
  
  // Advance first checkbox that can advance
  for (const cb of checkboxes) {
    if (cb.stageIndex < primaryStages.length - 1) {
      const nextStage = cb.isFromSecondarySet ? primaryStages[0] : primaryStages[cb.stageIndex + 1];
      return replaceCheckbox(cb, nextStage, text);
    }
  }
  
  return text;
}

function cycleBackward(checkboxes: Checkbox[], primaryStages: string[], text: string): string {
  const allAtFirstStage = checkboxes.every(cb => cb.stageIndex === 0);
  
  if (allAtFirstStage) {
    // Set all to last stage
    return replaceAllCheckboxes(checkboxes, primaryStages[primaryStages.length - 1], text);
  }
  
  // Retreat last checkbox that can retreat (right to left)
  for (let i = checkboxes.length - 1; i >= 0; i--) {
    const cb = checkboxes[i];
    if (cb.stageIndex > 0 || cb.isFromSecondarySet) {
      const prevStage = cb.isFromSecondarySet ? primaryStages[0] : primaryStages[cb.stageIndex - 1];
      return replaceCheckbox(cb, prevStage, text);
    }
  }
  
  return text;
}

function replaceCheckbox(checkbox: Checkbox, newStage: string, text: string): string {
  return text.substring(0, checkbox.index) + 
         newStage + 
         text.substring(checkbox.index + checkbox.stage.length);
}

function replaceAllCheckboxes(checkboxes: Checkbox[], newStage: string, text: string): string {
  let result = text;
  // Replace from right to left to maintain indices
  for (let i = checkboxes.length - 1; i >= 0; i--) {
    result = replaceCheckbox(checkboxes[i], newStage, result);
  }
  return result;
}

async function cycleCheckboxes(direction: 'forward' | 'backward', useSpecialStages: boolean = false): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const line = editor.document.lineAt(editor.selection.active.line);
  const { mainStages, specialStages } = getConfiguration();
  
  const primaryStages = useSpecialStages ? specialStages : mainStages;
  const secondaryStages = useSpecialStages ? mainStages : specialStages;
  
  const checkboxes = findCheckboxes(line.text, primaryStages, secondaryStages);
  if (checkboxes.length === 0) { return; }

  const newText = direction === 'forward'
    ? cycleForward(checkboxes, primaryStages, line.text)
    : cycleBackward(checkboxes, primaryStages, line.text);

  if (newText !== line.text) {
    await editor.edit(editBuilder => {
      editBuilder.replace(line.range, newText);
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  const commands = [
    vscode.commands.registerCommand('md-checkbox.cycleNext', () => cycleCheckboxes('forward', false)),
    vscode.commands.registerCommand('md-checkbox.cyclePrev', () => cycleCheckboxes('backward', false)),
    vscode.commands.registerCommand('md-checkbox.cycleSpecialNext', () => cycleCheckboxes('forward', true)),
    vscode.commands.registerCommand('md-checkbox.cycleSpecialPrev', () => cycleCheckboxes('backward', true))
  ];

  context.subscriptions.push(...commands);
}

export function deactivate() {}
