# Markdown Checkbox Extension Demo

This file demonstrates the functionality of the Markdown Checkbox extension.

## Basic Checkboxes (Main Cycle - Alt+Q / Alt+Shift+Q)

- [ ] Unchecked task
- [x] Completed task

## Special States (Special Cycle - Alt+W / Alt+Shift+W)

- [/] In progress task
- [?] Unclear/questioning task

## Multiple Checkboxes on Same Line

- [ ] First task [ ] Second task [ ] Third task

## Mixed Checkbox Types

- [ ] Standard unchecked
- [x] Standard checked  
- [/] Special in progress
- [?] Special unclear

## Test Instructions

1. Position your cursor on any line with checkboxes above
2. Press `Alt+Q` to cycle forward through main states
3. Press `Alt+Shift+Q` to cycle backward through main states
4. Press `Alt+W` to cycle forward through special states
5. Press `Alt+Shift+W` to cycle backward through special states

## Expected Behavior

- Main cycle: `[ ]` → `[x]` → `[ ]` → ...
- Special cycle: `[/]` → `[?]` → `[/]` → ...
- Cross-cycle: `[/]` + Alt+Q → `[x]` (switches to main cycle)
- Cross-cycle: `[x]` + Alt+W → `[/]` (switches to special cycle)
