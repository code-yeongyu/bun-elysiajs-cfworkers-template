import { describe, test, expect } from 'bun:test';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

describe('OpenAPI Spec Freshness', () => {
  test('OpenAPI spec should exist', () => {
    // given
    const specPath = join(process.cwd(), 'public/docs/openapi.json');

    // when
    const fileExists = existsSync(specPath);

    // then
    expect(fileExists).toBe(true);
  });

  test('OpenAPI spec should be up-to-date', () => {
    // given
    const specPath = join(process.cwd(), 'public/docs/openapi.json');
    const metaPath = join(process.cwd(), 'public/docs/meta.json');
    const routeFiles = [
      'src/routes/base/index.ts',
      'src/routes/base/echo.ts',
      'src/routes/base/check_health.ts',
      'src/routes/base/get_hello_world.ts'
    ];

    if (!existsSync(specPath) || !existsSync(metaPath)) {
      throw new Error('OpenAPI spec or metadata not found. Run `bun run generate:openapi`');
    }

    // when
    const specStat = statSync(specPath);
    const specMtime = specStat.mtime.getTime();

    let hasNewerFiles = false;
    const newerFiles: string[] = [];

    for (const file of routeFiles) {
      const filePath = join(process.cwd(), file);
      if (existsSync(filePath)) {
        const fileStat = statSync(filePath);
        const fileMtime = fileStat.mtime.getTime();

        if (fileMtime > specMtime) {
          hasNewerFiles = true;
          newerFiles.push(file);
        }
      }
    }

    if (hasNewerFiles) {
      console.warn(
        '⚠️  The following files have been modified after the OpenAPI spec was generated:'
      );
      newerFiles.forEach((file) => console.warn(`   - ${file}`));
      console.warn('   Run `bun run generate:openapi` to regenerate the spec.');
    }

    // then
    expect(hasNewerFiles).toBe(false);
  });

  test('OpenAPI spec should be valid JSON', () => {
    // given
    const specPath = join(process.cwd(), 'public/docs/openapi.json');

    if (!existsSync(specPath)) {
      throw new Error('OpenAPI spec not found');
    }

    // when
    const specContent = readFileSync(specPath, 'utf-8');
    let spec;

    try {
      spec = JSON.parse(specContent);
    } catch (error) {
      throw new Error('Invalid JSON in OpenAPI spec');
    }

    // then
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
    expect(spec.info).toHaveProperty('title');
    expect(spec.info).toHaveProperty('version');
  });

  test('Metadata should be valid', () => {
    // given
    const metaPath = join(process.cwd(), 'public/docs/meta.json');

    if (!existsSync(metaPath)) {
      throw new Error('Metadata not found');
    }

    // when
    const metaContent = readFileSync(metaPath, 'utf-8');
    let meta;

    try {
      meta = JSON.parse(metaContent);
    } catch (error) {
      throw new Error('Invalid JSON in metadata');
    }

    const generatedDate = new Date(meta.generatedAt);

    // then
    expect(meta).toHaveProperty('generatedAt');
    expect(meta).toHaveProperty('version');
    expect(generatedDate.toString()).not.toBe('Invalid Date');
  });
});
