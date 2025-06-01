# Markdown Checkbox Replacer

A powerful VS Code extension that makes managing markdown checkboxes effortless. Quickly toggle between different checkbox states using simple keyboard shortcuts, with support for both standard and custom checkbox cycles.

![VS Code Extension Version](https://img.shields.io/badge/vscode-^1.100.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Quick Toggle**: Cycle through checkbox states with keyboard shortcuts
- **Dual Cycles**: Support for main and special checkbox state cycles
- **Multi-checkbox Support**: Handle multiple checkboxes on the same line
- **Fully Customizable**: Configure your own checkbox states and cycles
- **Smart Detection**: Automatically detects and cycles between different checkbox types
- **Bidirectional Cycling**: Move forward or backward through checkbox states

## 🚀 Quick Start

1. Install the extension
2. Open any markdown file (`.md` or `.markdown`)
3. Position your cursor on a line with checkboxes
4. Use the keyboard shortcuts to cycle through states:
   - `Alt+Q` - Cycle forward through main states
   - `Alt+Shift+Q` - Cycle backward through main states
   - `Alt+W` - Cycle forward through special states
   - `Alt+Shift+W` - Cycle backward through special states

## 📋 Basic Usage

### Standard Checkbox Cycling

The extension comes with two pre-configured checkbox cycles:

**Main Cycle** (Alt+Q / Alt+Shift+Q):
```markdown
- [ ] Unchecked task
- [x] Completed task
```

**Special Cycle** (Alt+W / Alt+Shift+W):
```markdown
- [/] In progress task  
- [?] Unclear task
```

### Example Workflow

```markdown
Before: - [ ] Write documentation
Press Alt+Q: - [x] Write documentation

Before: - [/] Review code
Press Alt+W: - [?] Review code
Press Alt+W: - [/] Review code (cycles back)
```

### Multiple Checkboxes

When a line contains multiple checkboxes, they cycle sequentially from left to right:

```markdown
Before: - [ ] Task 1 [ ] Task 2 [ ] Task 3
Press Alt+Q: - [x] Task 1 [ ] Task 2 [ ] Task 3
Press Alt+Q: - [x] Task 1 [x] Task 2 [ ] Task 3
Press Alt+Q: - [x] Task 1 [x] Task 2 [x] Task 3
Press Alt+Q: - [ ] Task 1 [ ] Task 2 [ ] Task 3 (resets all)
```

## ⚙️ Configuration

### Accessing Settings

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "md-checkbox"
3. Configure the checkbox stages

Or edit your `settings.json` directly:

```json
{
  "md-checkbox.mainStages": ["[ ]", "[x]"],
  "md-checkbox.specialStages": ["[/]", "[?]"]
}
```

### Custom Checkbox States

You can create your own checkbox cycles with any symbols or text:

#### Example 1: Priority System
```json
{
  "md-checkbox.mainStages": ["[ ]", "[!]", "[x]"],
  "md-checkbox.specialStages": ["[low]", "[med]", "[high]"]
}
```

**Result:**
```markdown
[ ] → [!] → [x] → [ ] (main cycle)
[low] → [med] → [high] → [low] (special cycle)
```

#### Example 2: Status Tracking
```json
{
  "md-checkbox.mainStages": ["[ ]", "[~]", "[x]"],
  "md-checkbox.specialStages": ["[TODO]", "[DOING]", "[DONE]"]
}
```

**Result:**
```markdown
[ ] → [~] → [x] → [ ] (main cycle)  
[TODO] → [DOING] → [DONE] → [TODO] (special cycle)
```

#### Example 3: Emoji System
```json
{
  "md-checkbox.mainStages": ["[ ]", "[🔄]", "[✅]"],
  "md-checkbox.specialStages": ["[❓]", "[⚠️]", "[🚫]"]
}
```

**Result:**
```markdown
[ ] → [🔄] → [✅] → [ ] (main cycle)
[❓] → [⚠️] → [🚫] → [❓] (special cycle)
```

### Advanced Configuration Examples

#### Single State Cycles
```json
{
  "md-checkbox.mainStages": ["[ ]", "[x]"],
  "md-checkbox.specialStages": ["[!]"]
}
```

#### Extended Workflows
```json
{
  "md-checkbox.mainStages": ["[ ]", "[.]", "[o]", "[x]"],
  "md-checkbox.specialStages": ["[blocked]", "[waiting]", "[review]"]
}
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Q` | Cycle forward through main checkbox states |
| `Alt+Shift+Q` | Cycle backward through main checkbox states |
| `Alt+W` | Cycle forward through special checkbox states |
| `Alt+Shift+W` | Cycle backward through special checkbox states |

### Customizing Shortcuts

You can customize the keyboard shortcuts in VS Code:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "md-checkbox"
4. Click the pencil icon to edit shortcuts

## 🎯 Commands

The extension provides four commands accessible via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Markdown Checkbox: Cycle Next Checkbox State`
- `Markdown Checkbox: Cycle Previous Checkbox State`
- `Markdown Checkbox: Cycle Next Special Checkbox State`
- `Markdown Checkbox: Cycle Previous Special Checkbox State`

## 🔧 How It Works

### Cross-Cycle Transitions

The extension intelligently handles transitions between different checkbox types:

```markdown
# When cycling from special to main states:
[/] → Alt+Q → [x] (switches to main cycle)

# When cycling from main to special states:
[ ] → Alt+W → [/] (switches to special cycle)
```

### Smart Detection

The extension automatically detects which cycle a checkbox belongs to and maintains the cycling behavior accordingly. This allows you to have mixed checkbox types on the same line.

## 📁 File Support

- Works with `.md` and `.markdown` files
- Compatible with untitled markdown documents
- Shows helpful warnings for non-markdown files

## 🐛 Troubleshooting

### Common Issues

**Q: Shortcuts not working?**
A: Ensure your cursor is positioned on a line with checkboxes and you're in a markdown file.

**Q: Custom states not appearing?**
A: Check your settings syntax and ensure all stages are non-empty strings in array format.

**Q: Extension not activating?**
A: Make sure you're working with a `.md` or `.markdown` file, or any text file with markdown content.

### Configuration Validation

The extension validates your configuration and will show error messages for:
- Empty or invalid stage arrays
- Non-string values in stage arrays
- Missing required configuration

## 🔄 Version History

### 0.0.1
- Initial release
- Basic checkbox cycling functionality
- Configurable main and special stages
- Bidirectional cycling support
- Multi-checkbox line support

## 📝 License

This extension is licensed under the MIT License.

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our repository.

---

**Enjoy faster markdown checkbox management! 🎉**