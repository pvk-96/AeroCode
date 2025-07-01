import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Code, FileText, Trash2 } from "lucide-react";
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
  const editorRef = useRef<HTMLDivElement>(null);
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, currentLanguage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[hsl(var(--code-dark))] font-ui">
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
              {/* Theme toggle removed - AeroCode uses dark theme only */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Editor Container */}
        <div className="flex-1 relative bg-white dark:bg-[hsl(var(--code-dark))]">
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

        {/* Status Bar */}
        <div className="bg-[hsl(var(--code-primary))] text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {languageOptions.find(lang => lang.value === currentLanguage)?.label}
            </span>
            <span className="text-blue-200">
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            <span className="text-blue-200">
              {characterCount} characters
            </span>
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
