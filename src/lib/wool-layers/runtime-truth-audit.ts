import ts from 'typescript';

export type RuntimeTruthIssueCode =
  | 'runtime-v2-call'
  | 'surface-direct-engine-call'
  | 'surface-adapter-missing'
  | 'surface-adapter-call-count'
  | 'tog-secondary-table'
  | 'tog-canonical-adapter-missing'
  | 'production-stroller-sleeping';

export type RuntimeTruthIssue = Readonly<{
  code: RuntimeTruthIssueCode;
  path: string;
  detail: string;
}>;

function parse(path: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function moduleName(node: ts.ImportDeclaration): string | null {
  return ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
}

function moduleMatches(value: string | null, suffix: string): boolean {
  return value?.endsWith(suffix) === true || value?.endsWith(`${suffix}.js`) === true;
}

function importedLocalNames(
  file: ts.SourceFile,
  moduleSuffix: string,
  exportedName: string,
): Set<string> {
  const names = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!moduleMatches(moduleName(statement), moduleSuffix)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
      if ((binding.propertyName?.text ?? binding.name.text) === exportedName) {
        names.add(binding.name.text);
      }
    }
  }
  return names;
}

function countIdentifierCalls(file: ts.SourceFile, names: ReadonlySet<string>): number {
  let count = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
      && names.has(node.expression.text)) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return count;
}

function normalizedModule(value: string): string {
  return value.endsWith('.js') ? value.slice(0, -3) : value;
}

function targetsDirectEngineModule(path: string, value: string): boolean {
  const normalized = normalizedModule(value);
  return normalized.endsWith('/wool-layers/recommend')
    || (path.startsWith('lib/wool-layers/') && normalized === './recommend');
}

function targetsWoolLayersIndex(value: string): boolean {
  const normalized = normalizedModule(value);
  return normalized.endsWith('/wool-layers')
    || normalized.endsWith('/wool-layers/index');
}

function namedBindingExportsRecommend(
  bindings: ts.NamedImportBindings | ts.NamedExportBindings | undefined,
): boolean {
  if (bindings === undefined) return true;
  if (!ts.isNamedImports(bindings) && !ts.isNamedExports(bindings)) return true;
  return bindings.elements.some(
    (binding) => (binding.propertyName?.text ?? binding.name.text) === 'recommend',
  );
}

function referencesDirectEngine(path: string, file: ts.SourceFile): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isImportDeclaration(node)) {
      const imported = moduleName(node);
      if (imported !== null && (
        targetsDirectEngineModule(path, imported)
        || (targetsWoolLayersIndex(imported)
          && namedBindingExportsRecommend(node.importClause?.namedBindings))
      )) {
        found = true;
        return;
      }
    }
    if (ts.isExportDeclaration(node)
      && node.moduleSpecifier !== undefined
      && ts.isStringLiteral(node.moduleSpecifier)) {
      const exported = node.moduleSpecifier.text;
      if (targetsDirectEngineModule(path, exported)
        || (targetsWoolLayersIndex(exported)
          && namedBindingExportsRecommend(node.exportClause))) {
        found = true;
        return;
      }
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments;
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        const imported = argument.text;
        if (targetsDirectEngineModule(path, imported) || targetsWoolLayersIndex(imported)) {
          found = true;
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function referencesV2Runtime(file: ts.SourceFile): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isIdentifier(node) && node.text === 'recommendV2') {
      found = true;
      return;
    }
    if (ts.isImportDeclaration(node)) {
      const imported = moduleName(node) ?? '';
      if (imported.includes('clothing-engine-v2/recommend')) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function assignsSleepingStrollerMode(file: ts.SourceFile): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isPropertyAssignment(node)
      && ((ts.isIdentifier(node.name) && node.name.text === 'vognMode')
        || (ts.isStringLiteral(node.name) && node.name.text === 'vognMode'))
      && ts.isStringLiteral(node.initializer)
      && node.initializer.text === 'sleeping') {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

const SURFACE_CALLS: Readonly<Record<string, Readonly<{
  exportedName: string;
  expectedCalls: number;
}>>> = {
  'screens/HjemScreen.tsx': {
    exportedName: 'recommendForHomeSurface',
    expectedCalls: 1,
  },
  'screens/UkeScreen.tsx': {
    exportedName: 'recommendForPlanSurface',
    expectedCalls: 1,
  },
  'screens/FinnAntrekkScreen.tsx': {
    exportedName: 'recommendForFindSurface',
    expectedCalls: 2,
  },
  'lib/wool-layers/tog-recommendation.ts': {
    exportedName: 'recommendForTogSurface',
    expectedCalls: 1,
  },
};

// These modules own the active engine or offline verification; they are not
// UI recommendation surfaces. Every other production source must enter via
// surface-recommendation so a newly added screen/helper cannot bypass its
// explicit material-preference and stroller-mode contract.
const DIRECT_ENGINE_ALLOWLIST = new Set([
  'lib/wool-layers/surface-recommendation.ts',
  'lib/wool-layers/consistency-contract.ts',
  'lib/wool-layers/index.ts',
  'lib/clothing-engine-v2/review-export.ts',
]);

/** AST-backed release gate for every runtime recommendation owner. */
export function auditRuntimeRecommendationTruth(
  sources: Readonly<Record<string, string>>,
): RuntimeTruthIssue[] {
  const issues: RuntimeTruthIssue[] = [];
  const add = (code: RuntimeTruthIssueCode, path: string, detail: string): void => {
    issues.push({ code, path, detail });
  };

  for (const [path, source] of Object.entries(sources)) {
    const file = parse(path, source);
    if (!path.startsWith('lib/clothing-engine-v2/') && referencesV2Runtime(file)) {
      add('runtime-v2-call', path, 'inactive candidate engine referenced at runtime');
    }
    if (!DIRECT_ENGINE_ALLOWLIST.has(path) && referencesDirectEngine(path, file)) {
      add('surface-direct-engine-call', path, 'production source bypasses the shared adapter');
    }
    if (assignsSleepingStrollerMode(file)) {
      add('production-stroller-sleeping', path, 'outdoor stroller sleep is not release-authorized');
    }
  }

  for (const [path, contract] of Object.entries(SURFACE_CALLS)) {
    const source = sources[path] ?? '';
    const file = parse(path, source);
    const adapterNames = importedLocalNames(
      file,
      '/wool-layers/surface-recommendation',
      contract.exportedName,
    );
    // The adapter itself is one directory away from TOG rather than under /wool-layers/.
    if (path === 'lib/wool-layers/tog-recommendation.ts') {
      for (const name of importedLocalNames(
        file,
        './surface-recommendation',
        contract.exportedName,
      )) {
        adapterNames.add(name);
      }
    }
    if (adapterNames.size === 0) {
      add(
        'surface-adapter-missing',
        path,
        `${contract.exportedName} is not imported`,
      );
      continue;
    }
    const actualCalls = countIdentifierCalls(file, adapterNames);
    if (actualCalls !== contract.expectedCalls) {
      add(
        'surface-adapter-call-count',
        path,
        `expected ${contract.expectedCalls} ${contract.exportedName} call(s), found ${actualCalls}`,
      );
    }
  }

  const togPath = 'screens/TogGuideScreen.tsx';
  const tog = parse(togPath, sources[togPath] ?? '');
  const togAdapters = importedLocalNames(
    tog,
    '/wool-layers/tog-recommendation',
    'buildTogGuideRecommendation',
  );
  if (countIdentifierCalls(tog, togAdapters) < 1) {
    add('tog-canonical-adapter-missing', togPath, 'screen does not delegate to active engine');
  }
  const togSource = sources[togPath] ?? '';
  if (/function\s+tempToTog\s*\(|togLabel\s*:\s*['"]/u.test(togSource)) {
    add('tog-secondary-table', togPath, 'screen owns a second temperature-to-TOG table');
  }

  return issues;
}
