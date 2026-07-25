import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import {
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_40 = /^[0-9a-f]{40}$/;
const SHA_256 = /^[0-9a-f]{64}$/;
const COMMIT_LIKE_SCALAR_40 = /^[0-9a-f]{40}$/i;
const MAX_DEPENDENCIES = 100;
const MAX_FRONTMATTER_STRUCTURE_DEPTH = 32;
const PHASE1_COMMIT_SCALAR_KEYS = Object.freeze([
  'candidate_sha',
  'candidate_tree_sha',
]);
const PHASE2_COMMIT_SCALAR_KEYS = Object.freeze([
  'phase2_candidate_sha',
  'phase1_candidate_sha',
]);

const CANDIDATE_RECORD_KEYS = Object.freeze([
  'phase3_candidate_sha',
  'ancestry_status',
  'clean_status',
  'validation_evidence_sha256',
]);

const REVIEW_FIELDS = Object.freeze({
  code: Object.freeze([
    'code_security_sha',
    'code_security_status',
    'code_security_verdict',
    'code_security_reviewer_id',
    'code_security_session_id',
    'code_security_fork_turns',
    'code_security_fresh_context',
    'code_security_evidence_sha256',
  ]),
  ui: Object.freeze([
    'ui_accessibility_sha',
    'ui_accessibility_status',
    'ui_accessibility_verdict',
    'ui_accessibility_reviewer_id',
    'ui_accessibility_session_id',
    'ui_accessibility_fork_turns',
    'ui_accessibility_fresh_context',
    'ui_accessibility_evidence_sha256',
  ]),
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function errorOutput(error) {
  if (typeof error !== 'object' || error === null) {
    return String(error);
  }

  const stdout =
    'stdout' in error && error.stdout !== undefined
      ? String(error.stdout).trim()
      : '';
  const stderr =
    'stderr' in error && error.stderr !== undefined
      ? String(error.stderr).trim()
      : '';
  const message = 'message' in error ? String(error.message).trim() : '';
  return [stderr, stdout, message].filter(Boolean).join('\n');
}

function runGit(cwd, args, label) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  } catch (error) {
    const detail = errorOutput(error);
    throw new Error(
      `git ${label} failed${detail.length > 0 ? `: ${detail}` : ''}`,
    );
  }
}

function readUtf8(path, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`${label} could not be read: ${errorOutput(error)}`);
  }
}

function scanYamlLine(rawLine, initialQuote = null) {
  let quote = initialQuote;
  let text = '';

  for (let index = 0; index < rawLine.length; index += 1) {
    const character = rawLine[index];

    if (quote === '"') {
      text += character;
      if (character === '\\' && index + 1 < rawLine.length) {
        text += rawLine[index + 1];
        index += 1;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      text += character;
      if (character === "'" && rawLine[index + 1] === "'") {
        text += rawLine[index + 1];
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      text += character;
      continue;
    }

    if (
      character === '#' &&
      (index === 0 || /\s/.test(rawLine[index - 1]))
    ) {
      break;
    }

    text += character;
  }

  return Object.freeze({ text: text.trimEnd(), quote });
}

function stripOutsideYamlComment(rawValue) {
  const normalized = rawValue
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');
  const lines = [];
  let quote = null;

  for (const rawLine of normalized.split('\n')) {
    const scanned = scanYamlLine(rawLine, quote);
    lines.push(scanned.text);
    quote = scanned.quote;
  }

  return lines.join('\n').trim();
}

function scalarSyntaxMessage(label, key) {
  return `${label} contains unsupported frontmatter scalar syntax for ${key}`;
}

function skipQuotedLineIndentation(value, index) {
  let next = index;
  while (next < value.length && (value[next] === ' ' || value[next] === '\t')) {
    next += 1;
  }
  return next;
}

function decodeSingleQuotedYamlScalar(value, label, key) {
  invariant(
    value.startsWith("'"),
    scalarSyntaxMessage(label, key),
  );

  let decoded = '';
  for (let index = 1; index < value.length; index += 1) {
    const character = value[index];
    if (character === "'") {
      if (value[index + 1] === "'") {
        decoded += "'";
        index += 1;
        continue;
      }

      invariant(
        value.slice(index + 1).trim().length === 0,
        scalarSyntaxMessage(label, key),
      );
      return decoded;
    }

    if (character === '\n') {
      decoded += ' ';
      index = skipQuotedLineIndentation(value, index + 1) - 1;
      continue;
    }

    decoded += character;
  }

  throw new Error(scalarSyntaxMessage(label, key));
}

const DOUBLE_QUOTED_YAML_ESCAPES = Object.freeze({
  '0': '\0',
  a: '\x07',
  b: '\b',
  t: '\t',
  n: '\n',
  v: '\v',
  f: '\f',
  r: '\r',
  e: '\x1b',
  ' ': ' ',
  '"': '"',
  '/': '/',
  '\\': '\\',
  N: '\u0085',
  _: '\u00a0',
  L: '\u2028',
  P: '\u2029',
});

function decodeDoubleQuotedYamlScalar(value, label, key) {
  invariant(
    value.startsWith('"'),
    scalarSyntaxMessage(label, key),
  );

  let decoded = '';
  for (let index = 1; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"') {
      invariant(
        value.slice(index + 1).trim().length === 0,
        scalarSyntaxMessage(label, key),
      );
      return decoded;
    }

    if (character === '\n') {
      decoded += ' ';
      index = skipQuotedLineIndentation(value, index + 1) - 1;
      continue;
    }

    if (character !== '\\') {
      decoded += character;
      continue;
    }

    const escape = value[index + 1];
    invariant(escape !== undefined, scalarSyntaxMessage(label, key));
    if (escape === '\n') {
      index = skipQuotedLineIndentation(value, index + 2) - 1;
      continue;
    }

    if (Object.hasOwn(DOUBLE_QUOTED_YAML_ESCAPES, escape)) {
      decoded += DOUBLE_QUOTED_YAML_ESCAPES[escape];
      index += 1;
      continue;
    }

    const hexLength = escape === 'x' ? 2 : escape === 'u' ? 4 : escape === 'U' ? 8 : 0;
    invariant(hexLength > 0, scalarSyntaxMessage(label, key));
    const hex = value.slice(index + 2, index + 2 + hexLength);
    invariant(
      hex.length === hexLength && /^[0-9a-f]+$/i.test(hex),
      scalarSyntaxMessage(label, key),
    );
    try {
      decoded += String.fromCodePoint(Number.parseInt(hex, 16));
    } catch {
      throw new Error(scalarSyntaxMessage(label, key));
    }
    index += hexLength + 1;
  }

  throw new Error(scalarSyntaxMessage(label, key));
}

function normalizeFrontmatterScalar(rawValue, label, key) {
  const exactValue = stripOutsideYamlComment(rawValue);
  let semanticValue = exactValue;
  if (exactValue.startsWith('"')) {
    try {
      semanticValue = decodeDoubleQuotedYamlScalar(exactValue, label, key);
    } catch {
      throw new Error(scalarSyntaxMessage(label, key));
    }
  } else if (exactValue.startsWith("'")) {
    semanticValue = decodeSingleQuotedYamlScalar(exactValue, label, key);
  }

  return Object.freeze({ exactValue, semanticValue });
}

function hasSemanticContinuation(node) {
  let quote = scanYamlLine(node.rawValue).quote;
  for (const line of node.continuationLines) {
    const scanned = scanYamlLine(line.trimStart(), quote);
    quote = scanned.quote;
    if (scanned.text.trim().length > 0) {
      return true;
    }
  }
  return false;
}

function hasTopLevelBlockScalar(node) {
  const exactValue = stripOutsideYamlComment(node.rawValue);
  return /(?:^|\s)[|>][+-]?[1-9]?\s*$/.test(exactValue);
}

function topLevelMappingColon(value) {
  const closingStack = [];
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote === '"') {
      if (character === '\\') {
        index += 1;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '[') {
      closingStack.push(']');
      continue;
    }
    if (character === '{') {
      closingStack.push('}');
      continue;
    }
    if (
      (character === ']' || character === '}') &&
      closingStack.at(-1) === character
    ) {
      closingStack.pop();
      continue;
    }

    if (
      character === ':' &&
      closingStack.length === 0 &&
      (index + 1 === value.length || /\s/.test(value[index + 1]))
    ) {
      return index;
    }
  }

  return -1;
}

function splitTopLevelFlow(value, label, key) {
  const parts = [];
  const closingStack = [];
  let quote = null;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote === '"') {
      if (character === '\\') {
        index += 1;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '[') {
      closingStack.push(']');
      continue;
    }
    if (character === '{') {
      closingStack.push('}');
      continue;
    }
    if (character === ']' || character === '}') {
      invariant(
        closingStack.pop() === character,
        `${label} contains malformed flow metadata for ${key}`,
      );
      continue;
    }

    if (character === ',' && closingStack.length === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  invariant(
    quote === null && closingStack.length === 0,
    `${label} contains malformed flow metadata for ${key}`,
  );
  parts.push(value.slice(start));
  return parts;
}

function stripYamlDecorators(value) {
  let remaining = value.trim();

  while (remaining.length > 0) {
    const tag = /^!(?:<[^>]+>|[^\s,[\]{}]+)(?:\s+|$)/.exec(remaining);
    if (tag !== null) {
      remaining = remaining.slice(tag[0].length).trimStart();
      continue;
    }

    const anchor = /^&[^\s,\[\]{}]+(?:\s+|$)/.exec(remaining);
    if (anchor !== null) {
      remaining = remaining.slice(anchor[0].length).trimStart();
      continue;
    }

    break;
  }

  return remaining;
}

function frontmatterStructureDepthInvariant(depth, label, key) {
  invariant(
    depth <= MAX_FRONTMATTER_STRUCTURE_DEPTH,
    `${label} exceeds bounded frontmatter structure depth for ${key}`,
  );
}

function leadingBlockIndicator(value) {
  return /^[-?](?:[ \t]+|$)/.exec(value);
}

function* enumerateFrontmatterStructuralScalars(
  value,
  label,
  key,
  depth = 0,
) {
  frontmatterStructureDepthInvariant(depth, label, key);
  const exactValue = stripOutsideYamlComment(value).trim();
  if (exactValue.length === 0) {
    return;
  }

  const undecorated = stripYamlDecorators(exactValue);
  if (undecorated !== exactValue) {
    yield* enumerateFrontmatterStructuralScalars(
      undecorated,
      label,
      key,
      depth + 1,
    );
    return;
  }

  const blockIndicator = leadingBlockIndicator(undecorated);
  if (blockIndicator !== null) {
    yield* enumerateFrontmatterStructuralScalars(
      undecorated.slice(blockIndicator[0].length),
      label,
      key,
      depth + 1,
    );
    return;
  }

  const mappingColon = topLevelMappingColon(undecorated);
  if (mappingColon !== -1) {
    yield* enumerateFrontmatterStructuralScalars(
      undecorated.slice(0, mappingColon),
      label,
      key,
      depth + 1,
    );
    yield* enumerateFrontmatterStructuralScalars(
      undecorated.slice(mappingColon + 1),
      label,
      key,
      depth + 1,
    );
    return;
  }

  if (undecorated.startsWith('*')) {
    return;
  }

  if (undecorated.startsWith('"') || undecorated.startsWith("'")) {
    const scalar = normalizeFrontmatterScalar(undecorated, label, key);
    yield scalar.semanticValue;
    return;
  }

  if (undecorated.startsWith('[') || undecorated.startsWith('{')) {
    const closing = undecorated.startsWith('[') ? ']' : '}';
    invariant(
      undecorated.endsWith(closing),
      `${label} contains malformed flow metadata for ${key}`,
    );
    const inner = undecorated.slice(1, -1);
    for (const part of splitTopLevelFlow(inner, label, key)) {
      yield* enumerateFrontmatterStructuralScalars(
        part,
        label,
        key,
        depth + 1,
      );
    }
    return;
  }

  yield undecorated;
}

function yamlFragmentContainsCommitScalar(value, label, key) {
  for (const scalar of enumerateFrontmatterStructuralScalars(
    value,
    label,
    key,
  )) {
    if (COMMIT_LIKE_SCALAR_40.test(scalar)) {
      return true;
    }
  }
  return false;
}

function yamlValueContainsCommitScalar(value, label, key) {
  return yamlFragmentContainsCommitScalar(value, label, key);
}

function yamlNodeValueFragment(value, isHeaderValue) {
  let fragment = stripOutsideYamlComment(value).trim();
  let depth = 0;

  while (fragment.length > 0) {
    frontmatterStructureDepthInvariant(
      depth,
      'frontmatter node',
      'metadata',
    );
    const undecorated = stripYamlDecorators(fragment);
    if (undecorated !== fragment) {
      fragment = undecorated;
      depth += 1;
      continue;
    }

    if (!isHeaderValue) {
      const blockIndicator = leadingBlockIndicator(fragment);
      if (blockIndicator !== null) {
        fragment = fragment
          .slice(blockIndicator[0].length)
          .trimStart();
        depth += 1;
        continue;
      }

      const mappingColon = topLevelMappingColon(fragment);
      if (mappingColon !== -1) {
        fragment = fragment.slice(mappingColon + 1).trim();
        depth += 1;
        continue;
      }
    }

    break;
  }

  return fragment;
}

function blockScalarStyle(value, isHeaderValue) {
  const fragment = yamlNodeValueFragment(value, isHeaderValue);
  const match = /^([|>])(?:[+-][1-9]?|[1-9][+-]?)?$/.exec(fragment);
  return match?.[1] ?? null;
}

function leadingSpaceCount(line, label) {
  const indentation = /^[ \t]*/.exec(line)?.[0] ?? '';
  invariant(
    !indentation.includes('\t'),
    `${label} contains unsupported tab indentation`,
  );
  return indentation.length;
}

function flowCollectionState(value, isHeaderValue, label, key) {
  const fragment = yamlNodeValueFragment(value, isHeaderValue);
  if (!fragment.startsWith('[') && !fragment.startsWith('{')) {
    return null;
  }

  const closingStack = [];
  let quote = null;
  let completedAt = -1;

  for (let index = 0; index < fragment.length; index += 1) {
    const character = fragment[index];

    if (quote === '"') {
      if (character === '\\') {
        index += 1;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'" && fragment[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '[') {
      closingStack.push(']');
      continue;
    }
    if (character === '{') {
      closingStack.push('}');
      continue;
    }
    if (character !== ']' && character !== '}') {
      continue;
    }

    invariant(
      closingStack.pop() === character,
      `${label} contains malformed flow metadata for ${key}`,
    );
    if (closingStack.length === 0) {
      completedAt = index;
      break;
    }
  }

  if (completedAt !== -1) {
    invariant(
      fragment.slice(completedAt + 1).trim().length === 0,
      `${label} contains malformed flow metadata for ${key}`,
    );
  }

  return Object.freeze({
    complete: completedAt !== -1,
  });
}

function assembleMultilineFlow(lines, start, label, key) {
  const firstLine = lines[start];
  const initialState = flowCollectionState(
    firstLine.text,
    firstLine.isHeaderValue,
    label,
    key,
  );
  if (initialState === null || initialState.complete) {
    return null;
  }

  const semanticLines = [];
  let quote = null;
  for (let index = start; index < lines.length; index += 1) {
    const scanned = scanYamlLine(lines[index].text, quote);
    semanticLines.push(scanned.text.trim());
    quote = scanned.quote;
    const assembled = semanticLines.join('\n').trim();
    const state = flowCollectionState(
      assembled,
      firstLine.isHeaderValue,
      label,
      key,
    );
    invariant(
      state !== null,
      `${label} contains malformed flow metadata for ${key}`,
    );
    if (state.complete) {
      return Object.freeze({
        value: assembled,
        end: index,
      });
    }
  }

  throw new Error(`${label} contains malformed flow metadata for ${key}`);
}

function assembleMultilineQuotedScalar(lines, start, label, key) {
  const firstLine = scanYamlLine(lines[start].text);
  if (firstLine.quote === null) {
    return null;
  }

  const semanticLines = [firstLine.text];
  let quote = firstLine.quote;
  for (let index = start + 1; index < lines.length; index += 1) {
    const scanned = scanYamlLine(lines[index].text, quote);
    semanticLines.push(scanned.text);
    quote = scanned.quote;
    if (quote === null) {
      return Object.freeze({
        value: semanticLines.join('\n').trim(),
        end: index,
      });
    }
  }

  throw new Error(scalarSyntaxMessage(label, key));
}

function nodeContainsCommitScalar(node, label) {
  const lines = [
    Object.freeze({
      indent: 0,
      text: node.rawValue,
      isHeaderValue: true,
    }),
    ...node.continuationLines.map((line) =>
      Object.freeze({
        indent: leadingSpaceCount(line, label),
        text: line.trimStart(),
        isHeaderValue: false,
      }),
    ),
  ];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.text.trim();
    if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
      continue;
    }

    const style = blockScalarStyle(line.text, line.isHeaderValue);
    if (style !== null) {
      const contentLines = [];
      let next = index + 1;
      while (
        next < lines.length &&
        (
          lines[next].text.trim().length === 0 ||
          lines[next].indent > line.indent
        )
      ) {
        contentLines.push(lines[next]);
        next += 1;
      }

      const contentIndent = contentLines
        .filter((contentLine) => contentLine.text.trim().length > 0)
        .reduce(
          (minimum, contentLine) => Math.min(minimum, contentLine.indent),
          Number.POSITIVE_INFINITY,
        );
      const normalizedLines = contentLines.map((contentLine) =>
        Number.isFinite(contentIndent)
          ? `${' '.repeat(contentLine.indent)}${contentLine.text}`.slice(
              contentIndent,
            )
          : '',
      );
      const blockValue = style === '>'
        ? normalizedLines.join(' ')
        : normalizedLines.join('\n');
      if (COMMIT_LIKE_SCALAR_40.test(blockValue.trim())) {
        return true;
      }

      index = next - 1;
      continue;
    }

    const assembledFlow = assembleMultilineFlow(
      lines,
      index,
      label,
      node.key,
    );
    if (assembledFlow !== null) {
      const containsCommit = line.isHeaderValue
        ? yamlValueContainsCommitScalar(
            assembledFlow.value,
            label,
            node.key,
          )
        : yamlFragmentContainsCommitScalar(
            assembledFlow.value,
            label,
            node.key,
          );
      if (containsCommit) {
        return true;
      }

      index = assembledFlow.end;
      continue;
    }

    const assembledQuotedScalar = assembleMultilineQuotedScalar(
      lines,
      index,
      label,
      node.key,
    );
    if (assembledQuotedScalar !== null) {
      const containsCommit = line.isHeaderValue
        ? yamlValueContainsCommitScalar(
            assembledQuotedScalar.value,
            label,
            node.key,
          )
        : yamlFragmentContainsCommitScalar(
            assembledQuotedScalar.value,
            label,
            node.key,
          );
      if (containsCommit) {
        return true;
      }

      index = assembledQuotedScalar.end;
      continue;
    }

    const containsCommit = line.isHeaderValue
      ? yamlValueContainsCommitScalar(line.text, label, node.key)
      : yamlFragmentContainsCommitScalar(line.text, label, node.key);
    if (containsCommit) {
      return true;
    }
  }

  return false;
}

function yamlReferenceTokens(rawValue) {
  const tokens = [];
  let quote = null;

  for (let index = 0; index < rawValue.length; index += 1) {
    const character = rawValue[index];

    if (quote === '"') {
      if (character === '\\') {
        index += 1;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'" && rawValue[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (
      character === '#' &&
      (index === 0 || /\s/.test(rawValue[index - 1]))
    ) {
      break;
    }

    if (
      (character !== '&' && character !== '*') ||
      (index > 0 && !/[\s,[\]{}:]/.test(rawValue[index - 1]))
    ) {
      continue;
    }

    let end = index + 1;
    while (end < rawValue.length && !/[\s,\[\]{}]/.test(rawValue[end])) {
      end += 1;
    }
    if (end === index + 1) {
      continue;
    }

    tokens.push(Object.freeze({
      kind: character === '&' ? 'anchor' : 'alias',
      name: rawValue.slice(index + 1, end),
    }));
    index = end - 1;
  }

  return tokens;
}

function validateYamlReferences(fields, label) {
  const anchors = new Set();

  for (const node of fields.values()) {
    const referenceLines = [node.rawValue];
    if (!hasTopLevelBlockScalar(node)) {
      referenceLines.push(...node.continuationLines);
    }

    const referenceText = stripOutsideYamlComment(referenceLines.join('\n'));
    for (const token of yamlReferenceTokens(referenceText)) {
      if (token.kind === 'anchor') {
        invariant(
          !anchors.has(token.name),
          `${label} contains duplicate YAML anchor ${token.name}`,
        );
        anchors.add(token.name);
        continue;
      }

      invariant(
        anchors.has(token.name),
        `${label} contains unsupported frontmatter alias ${token.name}`,
      );
    }
  }
}

function parseFrontmatter(text, label) {
  invariant(typeof text === 'string', `${label} must be text`);

  const lines = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  invariant(lines[0] === '---', `${label} must start with YAML frontmatter`);
  const closingIndex = lines.indexOf('---', 1);
  invariant(closingIndex > 1, `${label} frontmatter is incomplete`);

  const fields = new Map();
  let currentNode = null;
  for (const line of lines.slice(1, closingIndex)) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
      currentNode?.continuationLines.push(line);
      continue;
    }

    if (/^\s/.test(line)) {
      invariant(
        currentNode !== null,
        `${label} contains orphaned frontmatter continuation: ${line}`,
      );
      currentNode.continuationLines.push(line);
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    invariant(
      match !== null,
      `${label} contains unsupported top-level frontmatter syntax: ${line}`,
    );

    const [, key, rawValue] = match;
    invariant(!fields.has(key), `${label} contains duplicate key ${key}`);
    currentNode = {
      key,
      rawValue,
      continuationLines: [],
    };
    fields.set(key, currentNode);
  }

  for (const [key, node] of fields) {
    fields.set(
      key,
      Object.freeze({
        ...node,
        continuationLines: Object.freeze([...node.continuationLines]),
      }),
    );
  }

  validateYamlReferences(fields, label);
  return fields;
}

function rejectUnexpectedCommitScalars(fields, allowedKeys, label) {
  for (const [key, node] of fields) {
    invariant(
      !COMMIT_LIKE_SCALAR_40.test(key),
      `${label} uses forbidden candidate SHA alias ${key}`,
    );
    invariant(
      allowedKeys.includes(key) ||
        !nodeContainsCommitScalar(node, label),
      `${label} uses forbidden candidate SHA alias ${key}`,
    );
  }
}

function exactFrontmatterValue(fields, key, label) {
  const node = fields.get(key);
  if (node === undefined) {
    return undefined;
  }

  invariant(
    !hasSemanticContinuation(node),
    `${label} ${key} must be one unambiguous scalar without continuation`,
  );
  return normalizeFrontmatterScalar(node.rawValue, label, key).exactValue;
}

export function parsePhase1CandidateSummary(text) {
  const fields = parseFrontmatter(text, 'Phase 1 summary');

  rejectUnexpectedCommitScalars(
    fields,
    PHASE1_COMMIT_SCALAR_KEYS,
    'Phase 1 summary',
  );

  invariant(
    exactFrontmatterValue(fields, 'status', 'Phase 1 summary') === 'PASS',
    'Phase 1 summary status must be exact PASS',
  );
  const candidateSha = exactFrontmatterValue(
    fields,
    'candidate_sha',
    'Phase 1 summary',
  );
  invariant(
    typeof candidateSha === 'string' && SHA_40.test(candidateSha),
    'Phase 1 summary requires exact candidate_sha with 40 lowercase hex',
  );
  const candidateTreeSha = exactFrontmatterValue(
    fields,
    'candidate_tree_sha',
    'Phase 1 summary',
  );
  invariant(
    candidateTreeSha === undefined || SHA_40.test(candidateTreeSha),
    'Phase 1 summary candidate_tree_sha must be 40 lowercase hex when present',
  );

  return Object.freeze({ phase1CandidateSha: candidateSha });
}

export function parsePhase2HandoffSummary(text) {
  const fields = parseFrontmatter(text, 'Phase 2 summary');

  rejectUnexpectedCommitScalars(
    fields,
    PHASE2_COMMIT_SCALAR_KEYS,
    'Phase 2 summary',
  );

  invariant(
    exactFrontmatterValue(fields, 'status', 'Phase 2 summary') === 'PASS',
    'Phase 2 summary status must be exact PASS',
  );
  const candidateSha = exactFrontmatterValue(
    fields,
    'phase2_candidate_sha',
    'Phase 2 summary',
  );
  invariant(
    typeof candidateSha === 'string' && SHA_40.test(candidateSha),
    'Phase 2 summary requires exact phase2_candidate_sha',
  );
  const featureFlag = exactFrontmatterValue(
    fields,
    'feature_flag',
    'Phase 2 summary',
  );
  invariant(
    featureFlag === 'true',
    'Phase 2 summary feature_flag must be intrinsically true',
  );
  const phase1CandidateSha = exactFrontmatterValue(
    fields,
    'phase1_candidate_sha',
    'Phase 2 summary',
  );
  invariant(
    phase1CandidateSha === undefined || SHA_40.test(phase1CandidateSha),
    'Phase 2 summary phase1_candidate_sha must be exact 40 lowercase hex',
  );

  return Object.freeze({
    phase2CandidateSha: candidateSha,
    featureFlag: true,
  });
}

function skipWhitespace(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) {
    index += 1;
  }
  return index;
}

function readJsonString(text, start) {
  invariant(text[start] === '"', 'JSON object key must be a string');
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text[index] === '"') {
      const token = text.slice(start, index + 1);
      return {
        value: JSON.parse(token),
        end: index + 1,
      };
    }
    index += 1;
  }

  throw new Error('JSON string is unterminated');
}

function skipJsonValue(text, start) {
  let index = skipWhitespace(text, start);
  if (text[index] === '"') {
    return readJsonString(text, index).end;
  }

  if (text[index] === '{' || text[index] === '[') {
    const opening = text[index];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;

    while (index < text.length) {
      const character = text[index];
      if (character === '"') {
        index = readJsonString(text, index).end;
        continue;
      }
      if (character === opening) {
        depth += 1;
      } else if (character === closing) {
        depth -= 1;
        if (depth === 0) {
          return index + 1;
        }
      }
      index += 1;
    }

    throw new Error('JSON value is unterminated');
  }

  while (
    index < text.length &&
    text[index] !== ',' &&
    text[index] !== '}'
  ) {
    index += 1;
  }
  return index;
}

function topLevelJsonKeys(text) {
  let index = skipWhitespace(text, 0);
  invariant(text[index] === '{', 'record JSON must be an object');
  index += 1;
  const keys = [];

  while (index < text.length) {
    index = skipWhitespace(text, index);
    if (text[index] === '}') {
      return keys;
    }

    const keyToken = readJsonString(text, index);
    keys.push(keyToken.value);
    index = skipWhitespace(text, keyToken.end);
    invariant(text[index] === ':', 'record JSON key must have a value');
    index = skipJsonValue(text, index + 1);
    index = skipWhitespace(text, index);

    if (text[index] === ',') {
      index += 1;
      continue;
    }
    invariant(text[index] === '}', 'record JSON must be a flat object');
    return keys;
  }

  throw new Error('record JSON is incomplete');
}

function parseExactJsonRecord(text, expectedKeys, label) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${errorOutput(error)}`);
  }

  invariant(
    typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.getPrototypeOf(parsed) === Object.prototype,
    `${label} must be one JSON object`,
  );

  const textualKeys = topLevelJsonKeys(text);
  invariant(
    textualKeys.length === new Set(textualKeys).size,
    `${label} contains duplicate JSON keys`,
  );

  const actualKeys = Object.keys(parsed);
  invariant(
    actualKeys.length === expectedKeys.length &&
      expectedKeys.every((key) => actualKeys.includes(key)),
    `${label} must contain only exact keys: ${expectedKeys.join(', ')}`,
  );
  invariant(
    textualKeys.length === actualKeys.length,
    `${label} contains ambiguous JSON keys`,
  );

  return parsed;
}

export function parsePhase3CandidateRecord(text) {
  const record = parseExactJsonRecord(
    text,
    CANDIDATE_RECORD_KEYS,
    'Phase 3 candidate record',
  );

  invariant(
    typeof record.phase3_candidate_sha === 'string' &&
      SHA_40.test(record.phase3_candidate_sha),
    'Phase 3 candidate record has invalid phase3_candidate_sha',
  );
  invariant(
    record.ancestry_status === 'PASS',
    'Phase 3 candidate ancestry_status must be PASS',
  );
  invariant(
    record.clean_status === 'PASS',
    'Phase 3 candidate clean_status must be PASS',
  );
  invariant(
    typeof record.validation_evidence_sha256 === 'string' &&
      SHA_256.test(record.validation_evidence_sha256),
    'Phase 3 candidate validation_evidence_sha256 is invalid',
  );

  return Object.freeze(record);
}

function parseReviewRecord(text, role) {
  const isCode = role === 'code';
  const prefix = isCode ? 'code_security' : 'ui_accessibility';
  const label = isCode
    ? 'code/security review record'
    : 'UI/accessibility review record';
  const record = parseExactJsonRecord(text, REVIEW_FIELDS[role], label);

  invariant(
    typeof record[`${prefix}_sha`] === 'string' &&
      SHA_40.test(record[`${prefix}_sha`]),
    `${label} has invalid ${prefix}_sha`,
  );
  invariant(
    record[`${prefix}_status`] === 'PASS',
    `${label} status must be PASS`,
  );
  invariant(
    record[`${prefix}_verdict`] === 'PASS',
    `${label} verdict must be PASS`,
  );

  for (const suffix of ['reviewer_id', 'session_id']) {
    const value = record[`${prefix}_${suffix}`];
    invariant(
      typeof value === 'string' &&
        value.trim().length > 0 &&
        value === value.trim(),
      `${label} ${suffix} must be a nonempty exact string`,
    );
  }

  invariant(
    record[`${prefix}_fork_turns`] === 'none',
    `${label} fork_turns must be none`,
  );
  invariant(
    record[`${prefix}_fresh_context`] === true,
    `${label} fresh_context must be true`,
  );
  invariant(
    typeof record[`${prefix}_evidence_sha256`] === 'string' &&
      SHA_256.test(record[`${prefix}_evidence_sha256`]),
    `${label} evidence SHA-256 is invalid`,
  );

  return Object.freeze(record);
}

export function parseCodeSecurityReviewRecord(text) {
  return parseReviewRecord(text, 'code');
}

export function parseUiAccessibilityReviewRecord(text) {
  return parseReviewRecord(text, 'ui');
}

function comparablePath(path) {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

export function isPathWithinResolvedRoot(rootRealPath, candidateRealPath) {
  const root = comparablePath(resolve(rootRealPath));
  const candidate = comparablePath(resolve(candidateRealPath));
  const pathFromRoot = relative(root, candidate);

  return (
    pathFromRoot.length > 0 &&
    pathFromRoot !== '..' &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot)
  );
}

function sameResolvedPath(left, right) {
  return comparablePath(resolve(left)) === comparablePath(resolve(right));
}

function realPath(path, label, expectedKind) {
  invariant(
    typeof path === 'string' && path.trim().length > 0,
    `${label} is required`,
  );
  invariant(isAbsolute(path), `${label} must be absolute`);

  let resolvedPath;
  try {
    resolvedPath = realpathSync.native(path);
  } catch (error) {
    throw new Error(`${label} realpath failed: ${errorOutput(error)}`);
  }

  let stats;
  try {
    stats = statSync(resolvedPath);
  } catch (error) {
    throw new Error(`${label} stat failed: ${errorOutput(error)}`);
  }

  invariant(
    expectedKind === 'directory' ? stats.isDirectory() : stats.isFile(),
    `${label} must be an existing ${expectedKind}`,
  );
  return resolvedPath;
}

function resolveCandidateEvidencePaths(options, checkoutRoot) {
  const root = realPath(
    options.evidenceRoot,
    'BABYORA_PHASE3_EVIDENCE_ROOT',
    'directory',
  );
  const checkout = realPath(checkoutRoot, 'candidate checkout', 'directory');

  invariant(
    !sameResolvedPath(root, checkout) &&
      !isPathWithinResolvedRoot(checkout, root) &&
      !isPathWithinResolvedRoot(root, checkout),
    'BABYORA_PHASE3_EVIDENCE_ROOT must resolve outside the candidate checkout',
  );

  const entries = [
    ['candidateRecordPath', 'candidate record'],
    ['codeReviewPath', 'code/security review'],
    ['uiReviewPath', 'UI/accessibility review'],
    ['validationBundlePath', 'validation bundle'],
  ];
  const resolvedEntries = {};

  for (const [key, label] of entries) {
    const resolvedPath = realPath(options[key], label, 'file');
    invariant(
      isPathWithinResolvedRoot(root, resolvedPath),
      `${label} must resolve beneath the external evidence root`,
    );
    resolvedEntries[key] = resolvedPath;
  }

  const uniquePaths = new Set(
    Object.values(resolvedEntries).map(comparablePath),
  );
  invariant(
    uniquePaths.size === entries.length,
    'candidate, reviews, and validation bundle must be distinct files',
  );

  return Object.freeze({
    evidenceRoot: root,
    checkoutRoot: checkout,
    ...resolvedEntries,
  });
}

function parseOptions(args, definitions) {
  const values = {};
  for (const [name, definition] of Object.entries(definitions)) {
    values[name] = definition.repeatable ? [] : undefined;
  }

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    invariant(
      typeof option === 'string' && option.startsWith('--'),
      `unexpected positional argument ${String(option)}`,
    );
    const name = option.slice(2);
    const definition = definitions[name];
    invariant(definition !== undefined, `unknown option ${option}`);
    invariant(
      typeof value === 'string' && value.length > 0,
      `${option} requires one value`,
    );

    if (definition.repeatable) {
      values[name].push(value);
    } else {
      invariant(values[name] === undefined, `duplicate option ${option}`);
      values[name] = value;
    }
  }

  for (const [name, definition] of Object.entries(definitions)) {
    if (definition.required) {
      invariant(
        definition.repeatable
          ? values[name].length > 0
          : values[name] !== undefined,
        `--${name} is required`,
      );
    }
  }

  return values;
}

function parseCandidateOptions(args, environment) {
  const values = parseOptions(args, {
    'candidate-record': { required: true },
    'code-security-review': { required: true },
    'ui-accessibility-review': { required: true },
    'validation-bundle': { required: true },
    'phase1-summary': { required: true },
    dependency: { repeatable: true },
    'expected-dependency-count': { required: true },
  });

  const expectedCountText = values['expected-dependency-count'];
  invariant(
    /^[1-9][0-9]*$/.test(expectedCountText),
    'expected dependency count must be a positive integer',
  );
  const expectedDependencyCount = Number(expectedCountText);
  invariant(
    expectedDependencyCount <= MAX_DEPENDENCIES,
    `expected dependency count exceeds ${MAX_DEPENDENCIES}`,
  );

  const evidenceRoot = environment.BABYORA_PHASE3_EVIDENCE_ROOT;
  invariant(
    typeof evidenceRoot === 'string' && evidenceRoot.trim().length > 0,
    'BABYORA_PHASE3_EVIDENCE_ROOT is required and cannot be empty',
  );
  invariant(
    isAbsolute(evidenceRoot),
    'BABYORA_PHASE3_EVIDENCE_ROOT must be absolute',
  );

  return Object.freeze({
    evidenceRoot,
    candidateRecordPath: values['candidate-record'],
    codeReviewPath: values['code-security-review'],
    uiReviewPath: values['ui-accessibility-review'],
    validationBundlePath: values['validation-bundle'],
    phase1SummaryPath: values['phase1-summary'],
    dependencies: Object.freeze([...values.dependency]),
    expectedDependencyCount,
  });
}

function parsePhase2Options(args) {
  const values = parseOptions(args, {
    summary: { required: true },
    'expected-feature-flag': { required: true },
    'ancestor-of': { required: true },
  });
  invariant(
    values['expected-feature-flag'] === 'true',
    '--expected-feature-flag must be intrinsically true',
  );

  return Object.freeze({
    summaryPath: values.summary,
    expectedFeatureFlag: true,
    ancestorOf: values['ancestor-of'],
  });
}

function fileSha256(path) {
  try {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  } catch (error) {
    throw new Error(
      `validation bundle SHA-256 failed: ${errorOutput(error)}`,
    );
  }
}

function validateReviewAgreement(candidate, codeReview, uiReview, evidenceHash) {
  invariant(
    codeReview.code_security_sha === candidate.phase3_candidate_sha,
    'code/security review SHA must equal the Phase 3 candidate',
  );
  invariant(
    uiReview.ui_accessibility_sha === candidate.phase3_candidate_sha,
    'UI/accessibility review SHA must equal the Phase 3 candidate',
  );
  invariant(
    codeReview.code_security_reviewer_id !==
      uiReview.ui_accessibility_reviewer_id,
    'reviewer IDs must be distinct',
  );
  invariant(
    codeReview.code_security_session_id !==
      uiReview.ui_accessibility_session_id,
    'reviewer session IDs must be distinct',
  );

  for (const [label, recordedHash] of [
    ['candidate', candidate.validation_evidence_sha256],
    ['code/security review', codeReview.code_security_evidence_sha256],
    ['UI/accessibility review', uiReview.ui_accessibility_evidence_sha256],
  ]) {
    invariant(
      recordedHash === evidenceHash,
      `${label} evidence SHA-256 must equal the external validation bundle`,
    );
  }
}

function validateDependencies(
  cwd,
  candidateSha,
  phase1CandidateSha,
  dependencies,
  expectedDependencyCount,
) {
  const allDependencies = [phase1CandidateSha, ...dependencies];
  invariant(
    allDependencies.length === expectedDependencyCount,
    `dependency count mismatch: expected ${expectedDependencyCount}, received ${allDependencies.length}`,
  );

  const seen = new Set();
  for (const dependency of allDependencies) {
    invariant(
      SHA_40.test(dependency),
      `dependency must be 40 lowercase hex: ${dependency}`,
    );
    invariant(
      !seen.has(dependency),
      `duplicate dependency SHA: ${dependency}`,
    );
    invariant(
      dependency !== candidateSha,
      'candidate SHA cannot be declared as its own dependency',
    );
    seen.add(dependency);

    runGit(
      cwd,
      ['cat-file', '-e', `${dependency}^{commit}`],
      `dependency object check for ${dependency}`,
    );
    runGit(
      cwd,
      ['merge-base', '--is-ancestor', dependency, candidateSha],
      `dependency ancestor check for ${dependency}`,
    );
  }

  return allDependencies.length;
}

function verifyCandidate(args, environment, cwd) {
  const options = parseCandidateOptions(args, environment);
  const checkoutFromGit = runGit(
    cwd,
    ['rev-parse', '--show-toplevel'],
    'checkout discovery',
  );
  const paths = resolveCandidateEvidencePaths(options, checkoutFromGit);
  const phase1SummaryPath = realPath(
    isAbsolute(options.phase1SummaryPath)
      ? options.phase1SummaryPath
      : resolve(cwd, options.phase1SummaryPath),
    'Phase 1 summary',
    'file',
  );

  const candidate = parsePhase3CandidateRecord(
    readUtf8(paths.candidateRecordPath, 'candidate record'),
  );
  const codeReview = parseCodeSecurityReviewRecord(
    readUtf8(paths.codeReviewPath, 'code/security review'),
  );
  const uiReview = parseUiAccessibilityReviewRecord(
    readUtf8(paths.uiReviewPath, 'UI/accessibility review'),
  );
  const { phase1CandidateSha } = parsePhase1CandidateSummary(
    readUtf8(phase1SummaryPath, 'Phase 1 summary'),
  );
  const evidenceHash = fileSha256(paths.validationBundlePath);

  validateReviewAgreement(candidate, codeReview, uiReview, evidenceHash);

  const headSha = runGit(
    paths.checkoutRoot,
    ['rev-parse', '--verify', 'HEAD^{commit}'],
    'HEAD resolution',
  );
  invariant(
    headSha === candidate.phase3_candidate_sha,
    'detached HEAD must equal the labeled Phase 3 candidate directly',
  );
  const headName = runGit(
    paths.checkoutRoot,
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    'detached HEAD check',
  );
  invariant(headName === 'HEAD', 'candidate checkout must use detached HEAD');

  const porcelain = runGit(
    paths.checkoutRoot,
    ['status', '--porcelain=v1', '--untracked-files=all'],
    'porcelain clean check',
  );
  invariant(
    porcelain.length === 0,
    'candidate checkout must have empty porcelain status and be clean',
  );

  runGit(
    paths.checkoutRoot,
    ['diff-tree', '--check', '--root', '-r', headSha],
    'diff-tree --check',
  );

  const dependencyCount = validateDependencies(
    paths.checkoutRoot,
    headSha,
    phase1CandidateSha,
    options.dependencies,
    options.expectedDependencyCount,
  );

  return Object.freeze({
    status: 'PASS',
    mode: 'candidate',
    phase3CandidateSha: headSha,
    phase1CandidateSha,
    dependencyCount,
    validationEvidenceSha256: evidenceHash,
  });
}

function verifyPhase2Handoff(args, cwd) {
  const options = parsePhase2Options(args);
  const summaryPath = realPath(
    isAbsolute(options.summaryPath)
      ? options.summaryPath
      : resolve(cwd, options.summaryPath),
    'Phase 2 summary',
    'file',
  );
  const handoff = parsePhase2HandoffSummary(
    readUtf8(summaryPath, 'Phase 2 summary'),
  );
  invariant(
    handoff.featureFlag === options.expectedFeatureFlag,
    'Phase 2 feature_flag does not equal the expected value',
  );

  runGit(
    cwd,
    ['cat-file', '-e', `${handoff.phase2CandidateSha}^{commit}`],
    'Phase 2 candidate object check',
  );
  const ancestorOf = runGit(
    cwd,
    [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${options.ancestorOf}^{commit}`,
    ],
    'Phase 2 ancestor target resolution',
  );
  runGit(
    cwd,
    ['merge-base', '--is-ancestor', handoff.phase2CandidateSha, ancestorOf],
    'Phase 2 candidate ancestor check',
  );

  return Object.freeze({
    status: 'PASS',
    mode: 'phase2-handoff',
    phase2CandidateSha: handoff.phase2CandidateSha,
    featureFlag: handoff.featureFlag,
    ancestorOf,
  });
}

export function runPhase3ExactShaVerifier(
  argv,
  {
    environment = process.env,
    cwd = process.cwd(),
  } = {},
) {
  invariant(Array.isArray(argv) && argv.length > 0, 'verification mode is required');
  const [mode, ...args] = argv;

  if (mode === 'candidate') {
    return verifyCandidate(args, environment, cwd);
  }
  if (mode === 'phase2-handoff') {
    return verifyPhase2Handoff(args, cwd);
  }
  throw new Error(`unknown verification mode ${String(mode)}`);
}

function isMainModule() {
  if (process.argv[1] === undefined) {
    return false;
  }

  let invokedPath;
  let loadedModulePath;
  try {
    invokedPath = realpathSync.native(resolve(process.argv[1]));
    loadedModulePath = realpathSync.native(fileURLToPath(import.meta.url));
  } catch (error) {
    throw new Error(
      `main-module canonical path resolution failed: ${errorOutput(error)}`,
    );
  }

  return sameResolvedPath(invokedPath, loadedModulePath);
}

if (isMainModule()) {
  try {
    const result = runPhase3ExactShaVerifier(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `Phase 3 exact-SHA verification failed: ${errorOutput(error)}\n`,
    );
    process.exitCode = 1;
  }
}
