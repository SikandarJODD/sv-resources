# Resource import

Import `resource.json`:

```sh
pnpm resource:add
```

Import another file:

```sh
pnpm resource:add -- --input ./data/resources.json
```

Useful options:

```sh
--unknown-values drop  # Remove unsupported kinds/categories
--skip-invalid         # Skip invalid resources
--skip-existing        # Skip slugs already imported
--dry-run              # Validate without writing
--help                 # Show options and valid values
```

Example:

```sh
pnpm resource:add -- --input resources.json --unknown-values drop --skip-invalid --skip-existing --dry-run
```

Imports are validated and never overwrite existing resource files.

---

Important Dry Run Example:

```sh
pnpm resource:add -- --input resource.json --unknown-values drop --skip-invalid --skip-existing --dry-run
```

Run:

```sh
pnpm resource:add -- --input resource.json --unknown-values drop --skip-invalid --skip-existing
```
