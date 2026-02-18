/**
 * Code Snippet Syntax Validator
 * Validates JavaScript and CSS syntax to prevent site-breaking errors
 */

class CodeSnippetValidator {
  /**
   * Validate JavaScript syntax
   */
  validateJavaScript(code) {
    const errors = [];
    const warnings = [];
    
    try {
      // Basic syntax check using eval in a safe context
      // Note: This is a basic check, not a full parser
      
      // Check for common dangerous patterns
      const dangerousPatterns = [
        {
          pattern: /eval\s*\(/gi,
          message: 'Use of eval() is dangerous and not recommended',
          severity: 'warning'
        },
        {
          pattern: /Function\s*\(/gi,
          message: 'Use of Function() constructor is dangerous',
          severity: 'warning'
        },
        {
          pattern: /document\.write\s*\(/gi,
          message: 'document.write() can break page rendering',
          severity: 'warning'
        },
        {
          pattern: /innerHTML\s*=/gi,
          message: 'Direct innerHTML assignment can be unsafe (XSS risk)',
          severity: 'warning'
        }
      ];
      
      dangerousPatterns.forEach(({ pattern, message, severity }) => {
        const matches = code.match(pattern);
        if (matches) {
          const lines = code.substring(0, code.search(pattern)).split('\n');
          warnings.push({
            line: lines.length,
            column: lines[lines.length - 1].length,
            message,
            severity
          });
        }
      });
      
      // Try to parse as JavaScript (basic check)
      // We'll use a simple bracket/brace matching approach
      const bracketStack = [];
      const openBrackets = ['(', '[', '{'];
      const closeBrackets = [')', ']', '}'];
      const bracketMap = { '(': ')', '[': ']', '{': '}' };
      
      const lines = code.split('\n');
      lines.forEach((line, lineIndex) => {
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          // Skip strings and comments
          if (char === '"' || char === "'" || char === '`') {
            const quote = char;
            i++;
            while (i < line.length && line[i] !== quote) {
              if (line[i] === '\\') i++; // Skip escaped quotes
              i++;
            }
            continue;
          }
          
          if (line.substring(i).startsWith('//')) break; // Single line comment
          if (line.substring(i).startsWith('/*')) {
            // Multi-line comment - find end
            const endIndex = line.indexOf('*/', i + 2);
            if (endIndex !== -1) {
              i = endIndex + 1;
              continue;
            }
          }
          
          if (openBrackets.includes(char)) {
            bracketStack.push({ char, line: lineIndex + 1, column: i + 1 });
          } else if (closeBrackets.includes(char)) {
            if (bracketStack.length === 0) {
              errors.push({
                line: lineIndex + 1,
                column: i + 1,
                message: `Unexpected closing bracket: ${char}`,
                severity: 'error'
              });
            } else {
              const last = bracketStack.pop();
              if (bracketMap[last.char] !== char) {
                errors.push({
                  line: lineIndex + 1,
                  column: i + 1,
                  message: `Mismatched brackets: expected ${bracketMap[last.char]}, found ${char}`,
                  severity: 'error'
                });
              }
            }
          }
        }
      });
      
      // Check for unmatched brackets
      if (bracketStack.length > 0) {
        const last = bracketStack[bracketStack.length - 1];
        errors.push({
          line: last.line,
          column: last.column,
          message: `Unclosed bracket: ${last.char}`,
          severity: 'error'
        });
      }
      
      // Check for common syntax errors
      const syntaxChecks = [
        {
          pattern: /if\s*\([^)]*\)\s*\{[^}]*$/m,
          message: 'Unclosed if statement block',
          severity: 'error'
        },
        {
          pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*$/m,
          message: 'Unclosed function block',
          severity: 'error'
        }
      ];
      
      // Basic quote matching
      const singleQuotes = (code.match(/'/g) || []).length;
      const doubleQuotes = (code.match(/"/g) || []).length;
      const backticks = (code.match(/`/g) || []).length;
      
      if (singleQuotes % 2 !== 0) {
        errors.push({
          line: 1,
          column: 1,
          message: 'Unmatched single quotes',
          severity: 'error'
        });
      }
      if (doubleQuotes % 2 !== 0) {
        errors.push({
          line: 1,
          column: 1,
          message: 'Unmatched double quotes',
          severity: 'error'
        });
      }
      if (backticks % 2 !== 0) {
        errors.push({
          line: 1,
          column: 1,
          message: 'Unmatched backticks',
          severity: 'error'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          line: 1,
          column: 1,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }
  
  /**
   * Validate CSS syntax
   */
  validateCSS(code) {
    const errors = [];
    const warnings = [];
    
    try {
      // Basic CSS validation
      const lines = code.split('\n');
      
      // Check for unmatched braces
      let braceCount = 0;
      let inComment = false;
      
      lines.forEach((line, lineIndex) => {
        // Handle comments
        if (line.includes('/*')) {
          inComment = true;
        }
        if (line.includes('*/')) {
          inComment = false;
          return;
        }
        if (inComment) return;
        
        // Count braces
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '{') braceCount++;
          if (line[i] === '}') {
            braceCount--;
            if (braceCount < 0) {
              errors.push({
                line: lineIndex + 1,
                column: i + 1,
                message: 'Unexpected closing brace',
                severity: 'error'
              });
            }
          }
        }
      });
      
      if (braceCount > 0) {
        errors.push({
          line: lines.length,
          column: 1,
          message: 'Unclosed CSS block (missing closing brace)',
          severity: 'error'
        });
      }
      
      // Check for common CSS errors
      const cssPattern = /[^{}]*\{[^}]*$/m;
      if (cssPattern.test(code) && braceCount > 0) {
        // Potential unclosed rule
        warnings.push({
          line: 1,
          column: 1,
          message: 'Potential unclosed CSS rule detected',
          severity: 'warning'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          line: 1,
          column: 1,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }
  
  /**
   * Validate HTML syntax (basic)
   */
  validateHTML(code) {
    const errors = [];
    const warnings = [];
    
    try {
      // Basic HTML tag matching
      const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
      const openTags = [];
      const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'meta', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
      
      let match;
      while ((match = tagRegex.exec(code)) !== null) {
        const tagName = match[1].toLowerCase();
        const isClosing = match[0].startsWith('</');
        const isSelfClosing = match[0].endsWith('/>') || selfClosingTags.includes(tagName);
        
        if (isClosing) {
          if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
            warnings.push({
              line: 1,
              column: match.index,
              message: `Potentially mismatched HTML tag: ${tagName}`,
              severity: 'warning'
            });
          } else {
            openTags.pop();
          }
        } else if (!isSelfClosing) {
          openTags.push(tagName);
        }
      }
      
      if (openTags.length > 0) {
        warnings.push({
          line: 1,
          column: 1,
          message: `Potentially unclosed HTML tags: ${openTags.join(', ')}`,
          severity: 'warning'
        });
      }
      
      return {
        valid: true, // HTML is generally more forgiving
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          line: 1,
          column: 1,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }
  
  /**
   * Validate code based on type
   */
  validate(code, type) {
    switch (type) {
      case 'javascript':
        return this.validateJavaScript(code);
      case 'css':
        return this.validateCSS(code);
      case 'html':
        return this.validateHTML(code);
      default:
        return {
          valid: true,
          errors: [],
          warnings: []
        };
    }
  }
}

module.exports = new CodeSnippetValidator();
