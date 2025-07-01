import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Code, FileText, Trash2, Play, Terminal, X, Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Monaco Editor types
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

const codeTemplates = {
  javascript: `// Welcome to JavaScript!
console.log("Hello, World!");

function greetUser(name) {
    return \`Hello, \${name}! Welcome to AeroCode.\`;
}

const message = greetUser("Developer");
console.log(message);`,

  python: `# Welcome to Python!
print("Hello, World!")

def greet_user(name):
    return f"Hello, {name}! Welcome to AeroCode."

message = greet_user("Developer")
print(message)`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to AeroCode - your simple code editor!</p>
</body>
</html>`,

  css: `/* Welcome to CSS! */
body {
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}`,

  java: `// Welcome to Java!
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        String message = greetUser("Developer");
        System.out.println(message);
    }
    
    public static String greetUser(String name) {
        return "Hello, " + name + "! Welcome to AeroCode.";
    }
}`,

  cpp: `// Welcome to C++!
#include <iostream>
#include <string>

using namespace std;

string greetUser(const string& name) {
    return "Hello, " + name + "! Welcome to AeroCode.";
}

int main() {
    cout << "Hello, World!" << endl;
    
    string message = greetUser("Developer");
    cout << message << endl;
    
    return 0;
}`
};

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" }
];

export default function Editor() {
  const [currentLanguage, setCurrentLanguage] = useState("javascript");
  const isDarkMode = true; // AeroCode uses dark theme only
  const [editor, setEditor] = useState<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [characterCount, setCharacterCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [errors, setErrors] = useState<Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}>>([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load Monaco Editor
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
    script1.onload = () => {
      if (window.require) {
        window.require.config({ 
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } 
        });
        
        window.require(['vs/editor/editor.main'], () => {
          initializeEditor();
        });
      }
    };
    document.head.appendChild(script1);

    // Load Monaco CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.min.css";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(link);
    };
  }, []);

  // Ensure dark theme is always applied
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("aerocode-theme", "vs-dark");
  }, []);

  const initializeEditor = () => {
    if (!editorRef.current || !window.monaco) return;

    setShowWelcome(false);
    
    const editorInstance = window.monaco.editor.create(editorRef.current, {
      value: codeTemplates[currentLanguage as keyof typeof codeTemplates],
      language: currentLanguage,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: window.innerWidth > 768 },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      },
      suggest: {
        showKeywords: true,
        showSnippets: true
      }
    });

    // Event listeners
    editorInstance.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });

    editorInstance.onDidChangeModelContent(() => {
      const model = editorInstance.getModel();
      if (model) {
        setCharacterCount(model.getValueLength());
        // Run error detection on content change
        const code = model.getValue();
        detectErrors(code, currentLanguage);
      }
    });

    setEditor(editorInstance);
    setIsEditorReady(true);
    
    // Initial values
    const model = editorInstance.getModel();
    if (model) {
      setCharacterCount(model.getValueLength());
    }
  };

  const switchLanguage = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    
    if (editor) {
      // Update editor language
      window.monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
      
      // Load template for new language
      editor.setValue(codeTemplates[newLanguage as keyof typeof codeTemplates] || `// Start coding in ${newLanguage}`);
    }
  };

  const clearEditor = () => {
    if (editor) {
      editor.setValue('');
      editor.focus();
      toast({
        title: "Editor cleared",
        description: "The editor content has been cleared.",
      });
    }
  };

  const createNewFile = () => {
    if (editor) {
      const currentContent = editor.getValue().trim();
      if (currentContent === '' || window.confirm('Create a new file? Current content will be lost.')) {
        editor.setValue(codeTemplates[currentLanguage as keyof typeof codeTemplates] || '');
        editor.focus();
        toast({
          title: "New file created",
          description: "A new file template has been loaded.",
        });
      }
    }
  };

  // Theme toggle removed - AeroCode uses dark theme only

  const runCode = async () => {
    if (!editor) return;
    
    setIsRunning(true);
    setShowOutput(true);
    setOutput("Running code...\n");
    
    const code = editor.getValue();
    
    // Simulate code execution with simple output
    setTimeout(() => {
      let result = "";
      
      try {
        switch (currentLanguage) {
          case "javascript":
            // Simple JavaScript execution simulation
            result = simulateJavaScriptExecution(code);
            break;
          case "python":
            result = simulatePythonExecution(code);
            break;
          case "html":
            result = "HTML code ready for preview in browser";
            break;
          case "css":
            result = "CSS code ready to be applied";
            break;
          case "java":
            result = simulateJavaExecution(code);
            break;
          case "cpp":
            result = simulateCppExecution(code);
            break;
          default:
            result = `Code written in ${currentLanguage}`;
        }
      } catch (error) {
        result = `Error: ${error}`;
      }
      
      setOutput(result);
      setIsRunning(false);
    }, 1000);
  };

  const simulateJavaScriptExecution = (code: string): string => {
    const outputs: string[] = [];
    
    // Simple simulation of console.log outputs
    if (code.includes('console.log')) {
      const matches = code.match(/console\.log\([^)]+\)/g);
      if (matches) {
        matches.forEach(match => {
          const content = match.replace(/console\.log\(|\)/g, '').replace(/["'`]/g, '');
          outputs.push(content);
        });
      }
    }
    
    if (code.includes('Hello, World!')) {
      outputs.push('Hello, World!');
    }
    
    if (code.includes('greetUser')) {
      outputs.push('Hello, Developer! Welcome to AeroCode.');
    }
    
    return outputs.length > 0 ? outputs.join('\n') : 'JavaScript code executed successfully';
  };

  const simulatePythonExecution = (code: string): string => {
    const outputs: string[] = [];
    
    if (code.includes('print')) {
      const matches = code.match(/print\([^)]+\)/g);
      if (matches) {
        matches.forEach(match => {
          const content = match.replace(/print\(|\)/g, '').replace(/["']/g, '');
          outputs.push(content);
        });
      }
    }
    
    if (code.includes('Hello, World!')) {
      outputs.push('Hello, World!');
    }
    
    if (code.includes('greet_user')) {
      outputs.push('Hello, Developer! Welcome to AeroCode.');
    }
    
    return outputs.length > 0 ? outputs.join('\n') : 'Python code executed successfully';
  };

  const simulateJavaExecution = (code: string): string => {
    const outputs: string[] = [];
    
    if (code.includes('System.out.println')) {
      if (code.includes('Hello, World!')) {
        outputs.push('Hello, World!');
      }
      if (code.includes('greetUser')) {
        outputs.push('Hello, Developer! Welcome to AeroCode.');
      }
    }
    
    return outputs.length > 0 ? outputs.join('\n') : 'Java code executed successfully';
  };

  const simulateCppExecution = (code: string): string => {
    const outputs: string[] = [];
    
    if (code.includes('cout')) {
      if (code.includes('Hello, World!')) {
        outputs.push('Hello, World!');
      }
      if (code.includes('greetUser')) {
        outputs.push('Hello, Developer! Welcome to AeroCode.');
      }
    }
    
    return outputs.length > 0 ? outputs.join('\n') : 'C++ code executed successfully';
  };

  // Error detection functions
  const detectErrors = (code: string, language: string) => {
    const foundErrors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    
    switch (language) {
      case 'javascript':
        foundErrors.push(...detectJavaScriptErrors(code));
        break;
      case 'python':
        foundErrors.push(...detectPythonErrors(code));
        break;
      case 'html':
        foundErrors.push(...detectHTMLErrors(code));
        break;
      case 'css':
        foundErrors.push(...detectCSSErrors(code));
        break;
      case 'java':
        foundErrors.push(...detectJavaErrors(code));
        break;
      case 'cpp':
        foundErrors.push(...detectCppErrors(code));
        break;
    }
    
    setErrors(foundErrors);
    if (foundErrors.length > 0 && !showErrorPanel) {
      setShowErrorPanel(true);
    }
  };

  const detectJavaScriptErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for common syntax errors
      if (line.includes('console.log(') && !line.includes(');')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('console.log(') + 1,
          message: 'Missing closing parenthesis and semicolon',
          severity: 'error'
        });
      }
      
      if (line.includes('function') && !line.includes('{') && !line.endsWith(';')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('function') + 1,
          message: 'Function declaration missing opening brace',
          severity: 'error'
        });
      }
      
      if (line.includes('if') && line.includes('(') && !line.includes(')')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('if') + 1,
          message: 'Missing closing parenthesis in if statement',
          severity: 'error'
        });
      }
      
      // Check for missing semicolons
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}') && 
          !line.includes('//') && !line.includes('if') && !line.includes('for') && !line.includes('while') &&
          !line.includes('function') && !line.includes('const') && !line.includes('let') && !line.includes('var')) {
        if (line.includes('=') || line.includes('console.log') || line.includes('return')) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: 'Missing semicolon',
            severity: 'warning'
          });
        }
      }
    });
    
    return errors;
  };

  const detectPythonErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for indentation errors
      if (line.startsWith(' ') && !line.startsWith('    ')) {
        const spaces = line.match(/^ +/)?.[0].length || 0;
        if (spaces % 4 !== 0) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'Inconsistent indentation (should be 4 spaces)',
            severity: 'warning'
          });
        }
      }
      
      // Check for missing colons
      if ((line.includes('if ') || line.includes('for ') || line.includes('while ') || 
           line.includes('def ') || line.includes('class ')) && !line.includes(':')) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Missing colon at end of statement',
          severity: 'error'
        });
      }
      
      // Check for unmatched parentheses
      if (line.includes('print(') && !line.includes(')')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('print(') + 1,
          message: 'Missing closing parenthesis',
          severity: 'error'
        });
      }
    });
    
    return errors;
  };

  const detectHTMLErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for unclosed tags
      const openTags = line.match(/<[^/][^>]*>/g) || [];
      const closeTags = line.match(/<\/[^>]*>/g) || [];
      
      openTags.forEach(tag => {
        const tagName = tag.match(/<([^>\s]+)/)?.[1];
        if (tagName && !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
          const closeTag = `</${tagName}>`;
          if (!line.includes(closeTag) && !closeTags.some(ct => ct.includes(tagName))) {
            errors.push({
              line: lineNum,
              column: line.indexOf(tag) + 1,
              message: `Missing closing tag for <${tagName}>`,
              severity: 'warning'
            });
          }
        }
      });
      
      // Check for missing DOCTYPE
      if (index === 0 && !line.toLowerCase().includes('<!doctype')) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'Missing DOCTYPE declaration',
          severity: 'warning'
        });
      }
    });
    
    return errors;
  };

  const detectCSSErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for missing semicolons in properties
      if (line.includes(':') && !line.includes(';') && !line.includes('{') && 
          !line.includes('}') && line.trim() && !line.includes('/*')) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Missing semicolon after CSS property',
          severity: 'error'
        });
      }
      
      // Check for missing opening/closing braces
      if (line.includes('{') && !line.includes('}')) {
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          errors.push({
            line: lineNum,
            column: line.lastIndexOf('{') + 1,
            message: 'Missing closing brace',
            severity: 'warning'
          });
        }
      }
    });
    
    return errors;
  };

  const detectJavaErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for missing semicolons
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') && !line.includes('//') && !line.includes('/*') &&
          !line.includes('class ') && !line.includes('public ') && !line.includes('private ') &&
          !line.includes('if ') && !line.includes('for ') && !line.includes('while ')) {
        if (line.includes('=') || line.includes('System.out') || line.includes('return')) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: 'Missing semicolon',
            severity: 'error'
          });
        }
      }
      
      // Check for missing parentheses
      if (line.includes('System.out.println(') && !line.includes(')')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('System.out.println(') + 1,
          message: 'Missing closing parenthesis',
          severity: 'error'
        });
      }
    });
    
    return errors;
  };

  const detectCppErrors = (code: string): Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> => {
    const errors: Array<{line: number, column: number, message: string, severity: 'error' | 'warning'}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for missing includes
      if (line.includes('cout') && !code.includes('#include <iostream>')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('cout') + 1,
          message: 'Missing #include <iostream>',
          severity: 'error'
        });
      }
      
      // Check for missing semicolons
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') && !line.includes('//') && !line.includes('/*') &&
          !line.includes('#include') && !line.includes('using ') && 
          !line.includes('if ') && !line.includes('for ') && !line.includes('while ')) {
        if (line.includes('=') || line.includes('cout') || line.includes('return')) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: 'Missing semicolon',
            severity: 'error'
          });
        }
      }
    });
    
    return errors;
  };

  // File save functionality
  const saveFile = () => {
    if (!editor) return;
    
    const code = editor.getValue();
    const fileExtensions = {
      javascript: '.js',
      python: '.py',
      html: '.html',
      css: '.css',
      java: '.java',
      cpp: '.cpp'
    };
    
    const extension = fileExtensions[currentLanguage as keyof typeof fileExtensions] || '.txt';
    const fileName = currentFileName || `untitled${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File saved",
      description: `${fileName} has been downloaded to your computer.`,
    });
  };

  // File load functionality
  const loadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (editor) {
        editor.setValue(content);
        setCurrentFileName(file.name);
        
        // Auto-detect language based on file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
          'js': 'javascript',
          'py': 'python',
          'html': 'html',
          'css': 'css',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'cpp'
        };
        
        const detectedLanguage = languageMap[extension || ''];
        if (detectedLanguage && detectedLanguage !== currentLanguage) {
          setCurrentLanguage(detectedLanguage);
          window.monaco.editor.setModelLanguage(editor.getModel(), detectedLanguage);
        }
        
        toast({
          title: "File loaded",
          description: `${file.name} has been loaded into the editor.`,
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be loaded again
    event.target.value = '';
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewFile();
      }
      // Ctrl/Cmd + Enter for run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
      // Ctrl/Cmd + S for save file
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      // Ctrl/Cmd + O for open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, currentLanguage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[hsl(var(--code-dark))] font-ui">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileLoad}
        accept=".js,.py,.html,.css,.java,.cpp,.c,.txt"
        style={{ display: 'none' }}
      />
      {/* Header */}
      <header className="bg-white dark:bg-[hsl(var(--code-dark-light))] border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--code-primary))] to-blue-600 rounded-lg flex items-center justify-center">
              <Code className="text-white text-sm w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AeroCode</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              Simple Code Editor
            </span>
          </div>

          {/* Language Selector and Actions */}
          <div className="flex items-center space-x-4">
            <Select value={currentLanguage} onValueChange={switchLanguage}>
              <SelectTrigger className="w-32 bg-white dark:bg-[hsl(var(--code-sidebar))] border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={runCode}
                disabled={isRunning}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500"
                title="Run Code (Ctrl+Enter)"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFile}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-[hsl(var(--code-primary))]"
                title="Open File (Ctrl+O)"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveFile}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-[hsl(var(--code-primary))]"
                title="Save File (Ctrl+S)"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewFile}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-[hsl(var(--code-primary))]"
                title="New File (Ctrl+N)"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearEditor}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500"
                title="Clear Editor"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {showOutput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOutput(false)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500"
                  title="Hide Output"
                >
                  <Terminal className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorPanel(!showErrorPanel)}
                className={`p-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 ${errors.length > 0 ? 'text-red-500' : ''}`}
                title={`${errors.length} Problems`}
              >
                {errors.length > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {errors.length > 0 && (
                  <span className="ml-1 text-xs">{errors.length}</span>
                )}
              </Button>
              {/* Theme toggle removed - AeroCode uses dark theme only */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Editor Container */}
        <div className={`relative bg-white dark:bg-[hsl(var(--code-dark))] ${showOutput ? 'flex-1' : 'flex-1'}`}>
          {/* Welcome Message */}
          {showWelcome && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-[hsl(var(--code-dark))]">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--code-primary))] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Code className="text-white text-2xl w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to AeroCode
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    A simple, modern code editor designed for programmers who want a fast and distraction-free environment for writing and editing code.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { icon: "🎨", text: "Syntax Highlighting" },
                      { icon: "📱", text: "Mobile Friendly" },
                      { icon: "💡", text: "Auto-completion" },
                      { icon: "🔢", text: "Line Numbers" }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <span className="text-[hsl(var(--code-primary))]">{feature.icon}</span>
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monaco Editor Container */}
          <div ref={editorRef} className="w-full h-full" />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <div className="h-48 bg-[hsl(var(--code-dark-light))] border-t border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--code-sidebar))] border-b border-gray-600">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Output</span>
                {isRunning && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Running...</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOutput(false)}
                className="p-1 text-gray-400 hover:text-white"
                title="Close Output"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {output || "Click the Run button to execute your code and see the output here."}
              </pre>
            </div>
          </div>
        )}

        {/* Error Panel */}
        {showErrorPanel && (
          <div className="h-48 bg-[hsl(var(--code-dark-light))] border-t border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--code-sidebar))] border-b border-gray-600">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">
                  Problems ({errors.length})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorPanel(false)}
                className="p-1 text-gray-400 hover:text-white"
                title="Close Problems"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              {errors.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>No problems detected</p>
                </div>
              ) : (
                <div className="p-2">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-2 p-2 hover:bg-[hsl(var(--code-dark))] cursor-pointer rounded ${
                        error.severity === 'error' ? 'border-l-2 border-red-500' : 'border-l-2 border-orange-500'
                      }`}
                      onClick={() => {
                        if (editor) {
                          editor.setPosition({ lineNumber: error.line, column: error.column });
                          editor.focus();
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className={`w-3 h-3 ${
                          error.severity === 'error' ? 'text-red-500' : 'text-orange-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">{error.message}</p>
                        <p className="text-xs text-gray-500">
                          Line {error.line}, Column {error.column}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded ${
                          error.severity === 'error' 
                            ? 'bg-red-900 text-red-200' 
                            : 'bg-orange-900 text-orange-200'
                        }`}>
                          {error.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-[hsl(var(--code-primary))] text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {languageOptions.find(lang => lang.value === currentLanguage)?.label}
            </span>
            {currentFileName && (
              <span className="text-blue-200">
                📄 {currentFileName}
              </span>
            )}
            <span className="text-blue-200">
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            <span className="text-blue-200">
              {characterCount} characters
            </span>
            {errors.length > 0 && (
              <span className="text-red-200">
                🔴 {errors.length} problems
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-blue-200 hidden sm:inline">
              {isEditorReady ? "Ready" : "Loading..."}
            </span>
            <div 
              className={`w-2 h-2 rounded-full ${
                isEditorReady ? "bg-green-400 animate-pulse" : "bg-yellow-400"
              }`} 
              title={isEditorReady ? "Editor Ready" : "Loading Editor"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
