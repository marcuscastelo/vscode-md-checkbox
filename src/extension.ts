import * as vscode from 'vscode';

/**
 * Direction for cycling through checkbox states
 */
type Direction = 'forward' | 'backward';

/**
 * Represents a checkbox found in text with its position and state information
 */
interface Checkbox {
  /** Zero-based index position in the text */
  index: number;
  /** Current checkbox stage string (e.g., '[ ]', '[x]') */
  stage: string;
  /** Index of the stage in the stages array, or SECONDARY_STAGE_INDEX for secondary set */
  stageIndex: number;
  /** Whether this checkbox belongs to the secondary (special) stage set */
  isFromSecondarySet: boolean;
}

/**
 * Configuration object containing checkbox stage definitions
 */
interface Configuration {
  /** Primary checkbox stages (e.g., ['[ ]', '[x]']) */
  mainStages: string[];
  /** Secondary/special checkbox stages (e.g., ['[/]', '[?]']) */
  specialStages: string[];
}

/**
 * Configuration constants
 */
const CONFIGURATION_SECTION = 'md-checkbox';
const DEFAULT_MAIN_STAGES: string[] = ['[ ]', '[x]'];
const DEFAULT_SPECIAL_STAGES: string[] = ['[/]', '[?]'];

/**
 * Special value to indicate a checkbox belongs to the secondary stage set
 */
const SECONDARY_STAGE_INDEX = -1;

/**
 * Minimum required stages for operation
 */
const MIN_STAGES_REQUIRED = 1;

/**
 * Extension constants
 */
const EXTENSION_NAME = 'Markdown Checkbox Extension';
const MARKDOWN_FILE_EXTENSIONS = ['.md', '.markdown'];
const MARKDOWN_LANGUAGE_ID = 'markdown';

/**
 * Utility function for consistent logging
 * @param message The message to log
 * @param level Log level (info, warn, error)
 */
function logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${EXTENSION_NAME}: ${message}`;
  
  switch (level) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Retrieves and validates the extension configuration settings
 * @returns Configuration object with main and special stages
 * @throws Error if configuration is invalid
 */
function getConfiguration(): Configuration {
  try {
    const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
    const mainStages = config.get('mainStages', DEFAULT_MAIN_STAGES) as string[];
    const specialStages = config.get('specialStages', DEFAULT_SPECIAL_STAGES) as string[];

    // Validate configuration
    if (!Array.isArray(mainStages) || mainStages.length < MIN_STAGES_REQUIRED) {
      throw new Error(`Invalid mainStages configuration: must be an array with at least ${MIN_STAGES_REQUIRED} stage(s)`);
    }

    if (!Array.isArray(specialStages) || specialStages.length < MIN_STAGES_REQUIRED) {
      throw new Error(`Invalid specialStages configuration: must be an array with at least ${MIN_STAGES_REQUIRED} stage(s)`);
    }

    // Validate that stages are non-empty strings
    const invalidMainStages = mainStages.filter(stage => typeof stage !== 'string' || stage.trim() === '');
    if (invalidMainStages.length > 0) {
      throw new Error('Invalid mainStages configuration: all stages must be non-empty strings');
    }

    const invalidSpecialStages = specialStages.filter(stage => typeof stage !== 'string' || stage.trim() === '');
    if (invalidSpecialStages.length > 0) {
      throw new Error('Invalid specialStages configuration: all stages must be non-empty strings');
    }

    return { mainStages, specialStages };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
    logMessage(`Configuration error: ${errorMessage}`, 'error');
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${errorMessage}`);
    // Return defaults on error
    return {
      mainStages: DEFAULT_MAIN_STAGES,
      specialStages: DEFAULT_SPECIAL_STAGES
    };
  }
}

/**
 * Finds all checkboxes in the given text and their positions
 * @param text The text to search in
 * @param primaryStages Array of primary stage strings
 * @param secondaryStages Array of secondary stage strings
 * @returns Sorted array of found checkboxes
 * @throws Error if input parameters are invalid
 */
function findCheckboxes(text: string, primaryStages: string[], secondaryStages: string[]): Checkbox[] {
  // Input validation
  if (typeof text !== 'string') {
    throw new Error('Text parameter must be a string');
  }
  
  if (!Array.isArray(primaryStages) || !Array.isArray(secondaryStages)) {
    throw new Error('Stage arrays must be valid arrays');
  }

  if (!text || (!primaryStages.length && !secondaryStages.length)) {
    return [];
  }

  const checkboxes: Checkbox[] = [];
  
  // Find primary stage checkboxes
  primaryStages.forEach((stage, stageIndex) => {
    if (!stage || typeof stage !== 'string') {
      return;
    }
    
    let searchIndex = 0;
    while (true) {
      const index = text.indexOf(stage, searchIndex);
      if (index === -1) {
        break;
      }
      
      checkboxes.push({ 
        index, 
        stage, 
        stageIndex, 
        isFromSecondarySet: false 
      });
      searchIndex = index + stage.length;
    }
  });

  // Find secondary stage checkboxes
  secondaryStages.forEach(stage => {
    if (!stage || typeof stage !== 'string') {
      return;
    }
    
    let searchIndex = 0;
    while (true) {
      const index = text.indexOf(stage, searchIndex);
      if (index === -1) {
        break;
      }
      
      checkboxes.push({ 
        index, 
        stage, 
        stageIndex: SECONDARY_STAGE_INDEX, 
        isFromSecondarySet: true 
      });
      searchIndex = index + stage.length;
    }
  });

  return checkboxes.sort((a, b) => a.index - b.index);
}

/**
 * Cycles checkboxes forward through their stages
 * @param checkboxes Array of checkboxes to cycle
 * @param primaryStages Array of primary stage strings
 * @param text Original text containing the checkboxes
 * @returns Modified text with cycled checkboxes
 * @throws Error if input parameters are invalid
 */
function cycleForward(checkboxes: Checkbox[], primaryStages: string[], text: string): string {
  if (!Array.isArray(checkboxes) || !Array.isArray(primaryStages) || typeof text !== 'string') {
    throw new Error('Invalid parameters for cycleForward');
  }

  if (checkboxes.length === 0 || primaryStages.length === 0) {
    return text;
  }

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

/**
 * Cycles checkboxes backward through their stages
 * @param checkboxes Array of checkboxes to cycle
 * @param primaryStages Array of primary stage strings
 * @param text Original text containing the checkboxes
 * @returns Modified text with cycled checkboxes
 * @throws Error if input parameters are invalid
 */
function cycleBackward(checkboxes: Checkbox[], primaryStages: string[], text: string): string {
  if (!Array.isArray(checkboxes) || !Array.isArray(primaryStages) || typeof text !== 'string') {
    throw new Error('Invalid parameters for cycleBackward');
  }

  if (checkboxes.length === 0 || primaryStages.length === 0) {
    return text;
  }

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

/**
 * Replaces a single checkbox with a new stage in the text
 * @param checkbox The checkbox to replace
 * @param newStage The new stage string to replace with
 * @param text The original text
 * @returns Modified text with the checkbox replaced
 * @throws Error if input parameters are invalid
 */
function replaceCheckbox(checkbox: Checkbox, newStage: string, text: string): string {
  if (!checkbox || typeof newStage !== 'string' || typeof text !== 'string') {
    throw new Error('Invalid parameters for replaceCheckbox');
  }

  if (checkbox.index < 0 || checkbox.index >= text.length) {
    throw new Error('Checkbox index is out of bounds');
  }

  return text.substring(0, checkbox.index) + 
         newStage + 
         text.substring(checkbox.index + checkbox.stage.length);
}

/**
 * Replaces all checkboxes with the same new stage in the text
 * @param checkboxes Array of checkboxes to replace
 * @param newStage The new stage string to replace all checkboxes with
 * @param text The original text
 * @returns Modified text with all checkboxes replaced
 * @throws Error if input parameters are invalid
 */
function replaceAllCheckboxes(checkboxes: Checkbox[], newStage: string, text: string): string {
  if (!Array.isArray(checkboxes) || typeof newStage !== 'string' || typeof text !== 'string') {
    throw new Error('Invalid parameters for replaceAllCheckboxes');
  }

  if (checkboxes.length === 0) {
    return text;
  }

  let result = text;
  // Replace from right to left to maintain indices
  for (let i = checkboxes.length - 1; i >= 0; i--) {
    result = replaceCheckbox(checkboxes[i], newStage, result);
  }
  return result;
}

/**
 * Checks if a file is a markdown file based on its extension
 * @param fileName The file name or path to check
 * @returns True if the file is a markdown file
 */
function isMarkdownFile(fileName: string): boolean {
  return MARKDOWN_FILE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
}

/**
 * Main function to cycle checkboxes in the current line
 * @param direction Direction to cycle ('forward' or 'backward')
 * @param useSpecialStages Whether to use special stages as primary
 * @returns Promise that resolves when the operation is complete
 */
async function cycleCheckboxes(direction: Direction, useSpecialStages: boolean = false): Promise<void> {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      logMessage('No active editor found', 'warn');
      return;
    }

    // Check if file is markdown language or has markdown extension
    const isMarkdownLanguage = editor.document.languageId === MARKDOWN_LANGUAGE_ID;
    const isMarkdownByExtension = !editor.document.isUntitled && isMarkdownFile(editor.document.fileName);
    
    if (!isMarkdownLanguage && !isMarkdownByExtension) {
      vscode.window.showWarningMessage(`${EXTENSION_NAME} only works with Markdown files. Please set language mode to Markdown or use .md/.markdown files.`);
      logMessage(`Attempted to use extension on non-markdown file: ${editor.document.fileName} (language: ${editor.document.languageId})`, 'warn');
      return;
    }

    const line = editor.document.lineAt(editor.selection.active.line);
    const { mainStages, specialStages } = getConfiguration();
    
    const primaryStages = useSpecialStages ? specialStages : mainStages;
    const secondaryStages = useSpecialStages ? mainStages : specialStages;
    
    logMessage(`Cycling ${direction} on line ${editor.selection.active.line + 1}, using ${useSpecialStages ? 'special' : 'main'} stages`);
    
    const checkboxes = findCheckboxes(line.text, primaryStages, secondaryStages);
    if (checkboxes.length === 0) {
      vscode.window.showInformationMessage('No checkboxes found on the current line');
      logMessage('No checkboxes found on current line');
      return;
    }

    logMessage(`Found ${checkboxes.length} checkbox(es) on current line`);

    const newText = direction === 'forward'
      ? cycleForward(checkboxes, primaryStages, line.text)
      : cycleBackward(checkboxes, primaryStages, line.text);

    if (newText !== line.text) {
      await editor.edit(editBuilder => {
        editBuilder.replace(line.range, newText);
      });
      logMessage(`Successfully cycled checkbox(es) ${direction}`);
    } else {
      logMessage('No changes made to text');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logMessage(`Operation failed: ${errorMessage}`, 'error');
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${errorMessage}`);
  }
}

/**
 * Activates the extension and registers all commands
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext): void {
  try {
    logMessage('Activating extension');

    // Validate configuration on startup
    getConfiguration();

    // Register all commands with error handling
    const commands = [
      {
        id: 'md-checkbox.cycleNext',
        handler: () => cycleCheckboxes('forward', false),
        description: 'Cycle forward through main checkbox stages'
      },
      {
        id: 'md-checkbox.cyclePrev', 
        handler: () => cycleCheckboxes('backward', false),
        description: 'Cycle backward through main checkbox stages'
      },
      {
        id: 'md-checkbox.cycleSpecialNext',
        handler: () => cycleCheckboxes('forward', true),
        description: 'Cycle forward through special checkbox stages'
      },
      {
        id: 'md-checkbox.cycleSpecialPrev',
        handler: () => cycleCheckboxes('backward', true),
        description: 'Cycle backward through special checkbox stages'
      }
    ];

    const disposables = commands.map(cmd => {
      logMessage(`Registering command: ${cmd.id} - ${cmd.description}`);
      return vscode.commands.registerCommand(cmd.id, cmd.handler);
    });

    // Add all disposables to the context
    context.subscriptions.push(...disposables);

    // Listen for configuration changes
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(CONFIGURATION_SECTION)) {
        logMessage('Configuration changed, revalidating...');
        try {
          getConfiguration(); // This will show errors if configuration is invalid
        } catch (error) {
          logMessage(`Configuration validation failed: ${error}`, 'error');
        }
      }
    });

    context.subscriptions.push(configChangeDisposable);

    logMessage('Extension activated successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown activation error';
    logMessage(`Activation failed: ${errorMessage}`, 'error');
    vscode.window.showErrorMessage(`Failed to activate ${EXTENSION_NAME}: ${errorMessage}`);
  }
}

/**
 * Deactivates the extension and cleans up resources
 */
export function deactivate(): void {
  logMessage('Deactivating extension');
  // VS Code automatically disposes of registered commands and subscriptions
  // No additional cleanup needed for this extension
}
