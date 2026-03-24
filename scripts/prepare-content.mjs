import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOT = "/home/hexo-backup/markdown";
const TARGET_ROOT = "/home/hexo-backup/.astro-migration";
const BLOG_DIR = path.join(TARGET_ROOT, "src/content/blog");
const PAGES_DIR = path.join(TARGET_ROOT, "src/content/pages");
const PUBLIC_DIR = path.join(TARGET_ROOT, "public");

const CONTENT_DIRECTORIES = new Set([
  "_posts",
  "archives",
  "security",
  "topic",
  "work"
]);

function slugify(input) {
  return input
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .split("/")
    .map((segment) =>
      segment
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[?#%]/g, "")
    )
    .join("/");
}

function normalizeContentPath(relativePath) {
  const segments = relativePath.replace(/\\/g, "/").split("/");
  const [topLevel, ...rest] = segments;
  if (topLevel === "_posts") {
    return rest.join("/");
  }
  const normalizedTopLevel = topLevel.replace(/^_/, "");
  return [normalizedTopLevel, ...rest].join("/");
}

function splitFrontmatter(raw) {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw };
  }

  const parts = raw.split("\n---");
  if (parts.length < 2) {
    return { data: {}, body: raw };
  }

  const frontmatterBlock = parts[0].replace(/^---\n?/, "");
  const body = raw.slice(parts[0].length + 4).replace(/^\n/, "");
  return { data: parseYamlLike(frontmatterBlock), body };
}

function parseYamlLike(input) {
  const lines = input.replace(/\r/g, "").split("\n");
  const root = {};
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(root[currentKey])) {
        root[currentKey] = [];
      }
      const value = normalizeScalar(listMatch[1]);
      if (value !== "") {
        root[currentKey].push(value);
      }
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    currentKey = key;
    if (!rawValue) {
      root[key] = [];
      continue;
    }

    if (rawValue.includes(",") && (key === "tags" || key === "categories")) {
      root[key] = rawValue
        .split(",")
        .map((value) => normalizeScalar(value))
        .filter(Boolean);
      continue;
    }

    if ((key === "tags" || key === "categories") && rawValue.includes(" ")) {
      root[key] = rawValue
        .split(/\s+/)
        .map((value) => normalizeScalar(value))
        .filter(Boolean);
      continue;
    }

    root[key] = normalizeScalar(rawValue);
  }

  return root;
}

function normalizeScalar(value) {
  return value
    .trim()
    .replace(/^-+\s*/, "")
    .replace(/^['"]|['"]$/g, "");
}

function normalizeMarkdown(body) {
  return body
    .replace(/<link rel="stylesheet"[^>]*auto-number-title\.css[^>]*>\s*/gi, "")
    .replace(/\]\(\.\.\/image\//g, "](/image/")
    .replace(/\]\(image\//g, "](/image/")
    .replace(/\]\(\.\.\/\.\.\/image\//g, "](/image/")
    .replace(
      /!\[([^\]]*)\]\(((?!https?:\/\/|\/image\/|\.\.\/image\/|image\/)[^)]+)\)/g,
      (_match, alt, target) => `\n> Omitted unresolved image: ${alt || "image"} (${target})\n`
    );
}

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function collectMarkdownFiles(dir, bucket = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(fullPath, bucket);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      bucket.push(fullPath);
    }
  }
  return bucket;
}

function toFrontmatter(data) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${String(item).replace(/"/g, '\\"')}`);
      }
      continue;
    }
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

async function main() {
  await ensureCleanDir(BLOG_DIR);
  await ensureCleanDir(PAGES_DIR);
  await ensureCleanDir(PUBLIC_DIR);

  const allFiles = await collectMarkdownFiles(SOURCE_ROOT);
  const published = allFiles.filter((file) => {
    const relative = path.relative(SOURCE_ROOT, file);
    const topLevel = relative.split(path.sep)[0];
    return CONTENT_DIRECTORIES.has(topLevel) || relative.startsWith(`about${path.sep}`);
  });

  for (const file of published) {
    const relative = path.relative(SOURCE_ROOT, file);
    const raw = await fs.readFile(file, "utf8");
    const { data, body } = splitFrontmatter(raw);
    const normalizedBody = normalizeMarkdown(body);
    const topLevel = relative.split(path.sep)[0];
    const isAbout = relative.startsWith(`about${path.sep}`);
    const sourcePath = `markdown/${relative.replace(/\\/g, "/")}`;
    const normalizedRelative = normalizeContentPath(relative);
    const slug = isAbout ? "about" : slugify(normalizedRelative);
    const title = typeof data.title === "string" ? data.title : path.basename(file, ".md");
    const tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(/\s+/).map((item) => item.trim()).filter(Boolean)
        : [];
    const categories = Array.isArray(data.categories)
      ? data.categories
      : typeof data.categories === "string"
        ? data.categories.split(/\s+/).map((item) => item.trim()).filter(Boolean)
        : [];

    const frontmatter = {
      title,
      date: data.date || undefined,
      updated: data.updated || undefined,
      subtitle: data.subtitle || undefined,
      author: data.author || undefined,
      tags,
      categories,
      draft: topLevel === "_drafts",
      section: isAbout ? "page" : topLevel.replace(/^_/, ""),
      sourcePath,
      slug
    };

    const targetDir = isAbout ? PAGES_DIR : BLOG_DIR;
    const targetFile = isAbout
      ? path.join(targetDir, "about.md")
      : path.join(targetDir, normalizedRelative);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, `${toFrontmatter(frontmatter)}${normalizedBody}`);
  }

  const imageSource = path.join(SOURCE_ROOT, "image");
  const imageTarget = path.join(PUBLIC_DIR, "image");
  try {
    await copyDir(imageSource, imageTarget);
  } catch (error) {
    if (!error || error.code !== "ENOENT") {
      throw error;
    }
  }

  console.log(`Prepared ${published.length} markdown files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
