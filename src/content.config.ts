import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

function removeDupsAndLowerCase(array: string[]) {
	if (!array.length) return array;
	const lowercaseItems = array.map((str) => str.toLowerCase());
	const distinctItems = new Set(lowercaseItems);
	return Array.from(distinctItems);
}

const post = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/post" }),
	schema: ({ image }) =>
		z.object({
			coverImage: z
				.object({
					// Alt text is optional: the CMS cover-image fields are all
					// `required: false` (Decap validates inner object fields even
					// when the object is empty, so they cannot be required there),
					// which means the CMS can save `src` without `alt`. An empty
					// alt is valid HTML (decorative image); `src` stays required
					// since an image without a source cannot render.
					alt: z.string().optional().default(""),
					src: z.string().or(image()),
				})
				.optional(),
			description: z.string().min(10).max(160),
			draft: z.boolean().default(false),
			ogImage: z.string().optional(),
			publishDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val))
				.refine((date) => !Number.isNaN(date.getTime()), {
					message: "Invalid publishDate: expected an ISO date string or Date",
				}),
			tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
			title: z.string().max(120),
			updatedDate: z
				.string()
				.or(z.date())
				.optional()
				.transform((val) => (val === undefined ? undefined : new Date(val)))
				.refine((date) => date === undefined || !Number.isNaN(date.getTime()), {
					message: "Invalid updatedDate: expected an ISO date string or Date",
				}),
		}),
});

const page = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/page" }),
	schema: z.object({
		title: z.string().max(120),
		description: z.string().max(160).optional(),
	}),
});

export const collections = { post, page };
