# Resource commands

## Add one resource

Create `resource.json` in the project root:

```json
{
	"slug": "example-library",
	"name": "Example Library",
	"description": "A short description of the resource.",
	"url": "https://example.com",
	"github": "https://github.com/example/example-library",
	"npm": "example-library",
	"kinds": ["library"],
	"categories": ["utilities"],
	"tags": ["typescript"],
	"featured": false
}
```

Then run:

```sh
pnpm resource:add
```

## Add multiple resources

Use a JSON array instead:

```json
[
	{
		"slug": "first-library",
		"name": "First Library",
		"description": "The first resource.",
		"url": "https://first.example.com",
		"kinds": ["library"],
		"categories": ["utilities"],
		"tags": []
	},
	{
		"slug": "second-library",
		"name": "Second Library",
		"description": "The second resource.",
		"url": "https://second.example.com",
		"kinds": ["component-library"],
		"categories": ["ui"],
		"tags": ["accessible"]
	}
]
```

Run the same command:

```sh
pnpm resource:add
```

You can also provide a different input path:

```sh
pnpm resource:add ./data/new-resources.json
```

The script validates the JSON, creates one typed file per resource in `src/lib/content/resources`, and runs `pnpm check`. Imports are atomic: if any resource already exists, the script lists every existing slug and adds nothing. It never merges with or overwrites an existing resource. If project validation fails, no new resource files are kept. The input JSON is not changed or deleted.

Valid kinds and categories are defined in `src/lib/content/schema.ts`.

---

JSON TYPE

```ts
type Resource = {
	slug: string;
	name: string;
	description: string;
	url: string;
	github?: string;
	npm?: string;
	kinds: ResourceKind[];
	categories: ResourceCategory[];
	tags: string[];
	featured?: boolean;
};

type ResourceKind = "library" | "component-library" | "tool" | "framework" | "other";
type ResourceCategory = "utilities" | "ui" | "data" | "testing" | "other";
```
