import re
import sys

def check_brackets(text):
    stack = []
    lines = text.split('\n')
    
    in_template_literal = False
    in_single_quote = False
    in_double_quote = False
    
    escape_next = False
    
    for row, line in enumerate(lines):
        col = 0
        while col < len(line):
            c = line[col]
            
            if escape_next:
                escape_next = False
                col += 1
                continue
                
            if c == '\\':
                escape_next = True
                col += 1
                continue
                
            if not in_template_literal and not in_single_quote and not in_double_quote:
                if c == '`':
                    in_template_literal = True
                elif c == "'":
                    in_single_quote = True
                elif c == '"':
                    in_double_quote = True
                elif c == '{':
                    stack.append(('{', row+1, col+1))
                elif c == '}':
                    if not stack or stack[-1][0] != '{':
                        print(f"Error: unmatched }} at {row+1}:{col+1}")
                        return
                    stack.pop()
                elif c == '(':
                    stack.append(('(', row+1, col+1))
                elif c == ')':
                    if not stack or stack[-1][0] != '(':
                        print(f"Error: unmatched ) at {row+1}:{col+1}")
                        return
                    stack.pop()
            elif in_single_quote:
                if c == "'":
                    in_single_quote = False
            elif in_double_quote:
                if c == '"':
                    in_double_quote = False
            elif in_template_literal:
                if c == '`':
                    in_template_literal = False
                elif c == '$' and col+1 < len(line) and line[col+1] == '{':
                    stack.append(('${', row+1, col+1))
                    in_template_literal = False # we enter JS execution context
                    col += 1
            
            # if we pop a '}' and it matched '${', we go back to template literal
            if c == '}' and not in_template_literal and not in_single_quote and not in_double_quote:
               # handled above, but if it was indeed popped, check what was popped
               # wait, I already popped it! Let me rewrite slightly
               pass
                
            col += 1
            
# A better JS parser using ast or similar? 
# Wait, let's just use Python's regex to find obvious issues
            
text = open('js/views.js', encoding='utf-8').read()

print("File read, length", len(text))
