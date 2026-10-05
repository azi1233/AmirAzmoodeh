#!/usr/bin/env node
/**
 * Post-build checks for the generated site in `dist/`.
 *
 *   1. base-path — every root-relative href/src in the built HTML must carry the
 *      deploy base (`/AmirAzmoodeh/`). `pnpm dev` and a base-less `pnpm build`
 *      both serve from `/`, so a missing base is invisible locally and only
 *      surfaces as 404s after deploy. Highest-value assertion in this repo.
 *   2. smoke — the files the site depends on were actually emitted (RSS,
 *      sitemap, manifest, Pagefind index, OG images, ...).
 *   3. drafts — posts marked `draft: true` must not reach `dist/`, and
 *      published posts must. This is the local/production content split
 *      (`src/data/post.ts`) asserted rather than assumed.
 *
 * Run after a build:  pnpm build && pnpm check:build
 * Honours BASE_PATH so it matches what was built with.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

const DIST = "dist";
const POSTS_SRC = join("src", "content", "post");
const RAW_BASE = process.env.BASE_PATH || "/AmirAzmoodeh";
// "/" or "/AmirAzmoodeh/" -> "/AmirAzmoodeh"
const BASE = RAW_BASE.replace(/\/+$/, "") || "";

/** Files the deployed site is expected to contain, relative to dist/. */
const REQUIRED_FILES = [
	"index.html",
	"404.html",
	"rss.xml",
	"robots.txt",
	"manifest.webmanifest",
	"sitemap-index.xml",
	"posts/index.html",
	"about/index.html",
	"pagefind/pagefind.js",
];

const failures = [];
const fail = (message) => failures.push(message);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function sizeOf(relPath) {
	try {
		return statSync(join(DIST, relPath)).size;
	} catch {
		return -1;
	}
}

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
}

/**
 * True when a URL value needs no base prefix: absolute URLs, protocol-relative
 * URLs, and anything not rooted at "/" (fragments, query strings, relative
 * paths like "config.yml").
 */
function needsBase(value) {
	if (!value) return false;
	if (value.startsWith("//")) return false;
	if (/^[a-z][a-z\d+.-]*:/i.test(value)) return false;
	return value.startsWith("/");
}

/**
 * Collect root-relative URLs from one HTML file.
 *
 * Handles all three attribute-value forms: double-quoted, single-quoted, and
 * unquoted. The unquoted form is not hypothetical — @playform/compress strips
 * attribute quotes, so production HTML really does contain `href=/icon.png`.
 */
function extractRefs(html) {
	const refs = [];
	const attr = /\b(href|src|srcset|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
	let match = attr.exec(html);
	while (match !== null) {
		const value = match[2] ?? match[3] ?? match[4] ?? "";
		// srcset holds a comma-separated list of "url descriptor" pairs.
		const candidates =
			match[1] === "srcset"
				? value.split(",").map((part) => part.trim().split(/\s+/)[0] ?? "")
				: [value];
		for (const url of candidates) {
			if (needsBase(url)) {
				refs.push({
					url,
					line: html.slice(0, match.index).split("\n").length,
				});
			}
		}
		match = attr.exec(html);
	}
	return refs;
}

// ---------------------------------------------------------------------------
// 1. base-path check
// ---------------------------------------------------------------------------

function checkBasePaths() {
	if (BASE === "") {
		console.log("· base-path  skipped (BASE_PATH is /, nothing to prefix)");
		return;
	}

	let htmlFiles = [];
	try {
		htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));
	} catch {
		fail("No dist/ directory found — run `pnpm build` first.");
		return;
	}

	let checked = 0;
	let bad = 0;
	for (const file of htmlFiles) {
		const relFile = relative(DIST, file).split(sep).join("/");
		for (const ref of extractRefs(readFileSync(file, "utf8"))) {
			checked++;
			if (ref.url !== BASE && !ref.url.startsWith(`${BASE}/`)) {
				bad++;
				fail(`base-path  ${relFile}:${ref.line}  missing base prefix: ${ref.url}`);
			}
		}
	}
	console.log(
		`· base-path  ${checked} root-relative refs in ${htmlFiles.length} files, ${bad} bad`,
	);
	if (checked === 0) {
		fail("base-path  found 0 root-relative refs — the extractor is broken, not the site");
	}
}

// ---------------------------------------------------------------------------
// 2. smoke check
// ---------------------------------------------------------------------------

function checkSmoke() {
	const missing = REQUIRED_FILES.filter((f) => sizeOf(f) <= 0);
	for (const file of missing) fail(`smoke      missing or empty: ${file}`);

	// OG images are generated per post, so assert the directory is populated
	// rather than pinning exact filenames.
	let ogCount = 0;
	try {
		ogCount = readdirSync(join(DIST, "og-image")).filter((f) => f.endsWith(".png")).length;
	} catch {
		ogCount = 0;
	}
	if (ogCount === 0) fail("smoke      no OG images generated in dist/og-image/");

	console.log(
		`· smoke      ${REQUIRED_FILES.length - missing.length}/${REQUIRED_FILES.length} required files, ${ogCount} OG image(s)`,
	);
}

// ---------------------------------------------------------------------------
// 3. draft leak check
// ---------------------------------------------------------------------------

function checkDrafts() {
	if (!existsSync(POSTS_SRC)) {
		console.log(`· drafts     skipped (no ${POSTS_SRC}/)`);
		return;
	}

	const sources = walk(POSTS_SRC).filter((f) => [".md", ".mdx"].includes(extname(f)));
	let drafts = 0;
	let published = 0;

	for (const file of sources) {
		const slug = basename(file, extname(file));
		const body = readFileSync(file, "utf8");
		// Frontmatter is the fenced block at the very top of the file.
		const frontmatter = body.startsWith("---") ? (body.split(/^---$/m)[1] ?? "") : "";
		const isDraft = /^draft:\s*true\s*$/m.test(frontmatter);
		const inDist = existsSync(join(DIST, "posts", slug, "index.html"));

		if (isDraft) {
			drafts++;
			if (inDist) fail(`drafts     "${slug}" is draft: true but was built into dist/`);
		} else {
			published++;
			if (!inDist) fail(`drafts     "${slug}" is published but missing from dist/posts/`);
		}
	}

	console.log(`· drafts     ${published} published, ${drafts} draft(s) excluded`);
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

console.log(`\nchecking ${DIST}/ (base: ${BASE || "/"})\n`);

if (!existsSync(join(DIST, "index.html"))) {
	console.error(`✗ ${DIST}/index.html not found — run \`pnpm build\` first.\n`);
	process.exit(1);
}

checkBasePaths();
checkSmoke();
checkDrafts();

if (failures.length > 0) {
	console.error(`\n✗ ${failures.length} problem(s) found:\n`);
	for (const message of failures) console.error(`  ${message}`);
	console.error("");
	process.exit(1);
}

console.log("\n✓ all checks passed\n");
