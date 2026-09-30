/**
 * Lightweight native C++ source code formatter.
 * Adjusts indentation based on block scope ({ }), strips trailing whitespace,
 * and handles access specifiers (public:, private:) and preprocessor directives (#).
 */
export function formatCppCode(source: string, indentSize: number = 4): string {
  const lines = source.split("\n");
  const indentChar = " ".repeat(indentSize);
  let depth = 0;
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve empty lines
    if (!trimmed) {
      // Avoid more than 2 consecutive blank lines
      if (
        formattedLines.length === 0 ||
        formattedLines[formattedLines.length - 1] !== ""
      ) {
        formattedLines.push("");
      }
      continue;
    }

    // Preprocessor directives stay at column 0
    if (trimmed.startsWith("#")) {
      formattedLines.push(trimmed);
      continue;
    }

    // Single line comments
    if (trimmed.startsWith("//")) {
      formattedLines.push(indentChar.repeat(depth) + trimmed);
      continue;
    }

    // Count closing brackets that start the line or reduce depth before current line
    const leadingCloses = (trimmed.match(/^(\}|\]|\))/g) || []).length;
    const closesInLine = (trimmed.match(/[\}\]\)]/g) || []).length;
    const opensInLine = (trimmed.match(/[\{\[\(]/g) || []).length;

    // Adjust depth down before printing if line starts with a closing brace
    if (trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")")) {
      depth = Math.max(0, depth - 1);
    }

    // Access specifiers (public:, private:, protected:) are indented 1 level less
    const isAccessSpecifier = /^(public|private|protected)\s*:/.test(trimmed);
    const lineIndent = isAccessSpecifier
      ? indentChar.repeat(Math.max(0, depth - 1))
      : indentChar.repeat(depth);

    formattedLines.push(lineIndent + trimmed);

    // If line didn't start with closing brace, adjust depth by net change
    if (!(trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")"))) {
      const net = opensInLine - closesInLine;
      depth = Math.max(0, depth + net);
    } else {
      // It started with closing, but might contain more opens
      const netAfterFirst = opensInLine - (closesInLine - 1);
      depth = Math.max(0, depth + netAfterFirst);
    }
  }

  return formattedLines.join("\n") + "\n";
}
