const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const srcDir = path.join(__dirname, 'src');
const extractedStrings = {};

const getFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const jsxFiles = getFiles(srcDir);
const TRANSLATABLE_ATTRS = ['label', 'placeholder', 'title', 'alt', 'description', 'message'];

jsxFiles.forEach(file => {
  // Skip some core files to avoid breaking them
  if (file.includes('main.jsx') || file.includes('App.jsx') || file.includes('i18n.js') || file.includes('LanguageSelector.jsx')) return;

  const code = fs.readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (e) {
    console.error('Error parsing', file, e.message);
    return;
  }

  let fileModified = false;
  let hasImport = false;
  let componentsToInject = [];

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'react-i18next') {
        hasImport = true;
      }
    },
    JSXText(path) {
      let text = path.node.value;
      if (!text) return;
      // Extract pure text without leading/trailing whitespace but preserving spaces between words
      const trimmed = text.replace(/^\s+|\s+$/g, '');
      if (trimmed.length > 1 && /[a-zA-Z]/.test(trimmed) && !trimmed.includes('{') && !trimmed.includes('}')) {
        extractedStrings[trimmed] = trimmed;
        
        // Preserve surrounding whitespace in JSX
        const before = text.match(/^\s*/)[0];
        const after = text.match(/\s*$/)[0];
        
        path.replaceWithMultiple([
          t.jsxText(before),
          t.jsxExpressionContainer(t.callExpression(t.identifier('t'), [t.stringLiteral(trimmed)])),
          t.jsxText(after)
        ]);
        fileModified = true;
      }
    },
    JSXAttribute(path) {
      if (TRANSLATABLE_ATTRS.includes(path.node.name.name)) {
        if (t.isStringLiteral(path.node.value)) {
          const text = path.node.value.value.trim();
          if (text.length > 1 && /[a-zA-Z]/.test(text)) {
            extractedStrings[text] = text;
            path.node.value = t.jsxExpressionContainer(
              t.callExpression(t.identifier('t'), [t.stringLiteral(text)])
            );
            fileModified = true;
          }
        }
      }
    },
    FunctionDeclaration(path) {
      if (containsJSX(path)) componentsToInject.push(path);
    },
    ArrowFunctionExpression(path) {
      if (containsJSX(path) && path.parent.type === 'VariableDeclarator') componentsToInject.push(path);
    }
  });

  function containsJSX(path) {
    let hasJSX = false;
    path.traverse({
      JSXElement() { hasJSX = true; },
      JSXFragment() { hasJSX = true; }
    });
    return hasJSX;
  }

  if (fileModified) {
    if (!hasImport) {
      const importDecl = t.importDeclaration(
        [t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))],
        t.stringLiteral('react-i18next')
      );
      ast.program.body.unshift(importDecl);
    }

    componentsToInject.forEach(comp => {
      let alreadyInjected = false;
      comp.traverse({
        CallExpression(p) {
          if (p.node.callee.name === 'useTranslation') alreadyInjected = true;
        }
      });
      if (!alreadyInjected) {
        const useTransCall = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.objectPattern([t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)]),
            t.callExpression(t.identifier('useTranslation'), [])
          )
        ]);
        
        if (!t.isBlockStatement(comp.node.body)) {
          comp.node.body = t.blockStatement([t.returnStatement(comp.node.body)]);
        }
        comp.node.body.body.unshift(useTransCall);
      }
    });

    const output = generate(ast, {}, code);
    fs.writeFileSync(file, output.code);
  }
});

fs.writeFileSync('extracted.json', JSON.stringify(extractedStrings, null, 2));
console.log('Done!');
