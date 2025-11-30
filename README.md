A small WordPress plugin that provides:

- A custom Gutenberg block to insert a “Read More” link to another post.
- A WP-CLI command to search for posts containing that block within a date range.

## Gutenberg Block: `DMG Read More Link`

How it works

- It lets editors select a published post via the block sidebar (Inspector Controls).
- It shows recent posts by default.
- It supports searching posts by text.
- It supports searching directly by a specific post ID.
- Once a post is chosen, the block outputs:

```html
<p class="dmg-read-more">Read More: <a href="POST_PERMALINK">POST_TITLE</a></p>
```

## WP-CLI Command: dmg-read-more search

Searches for posts containing the dmg/read-more-link Gutenberg block.

Usage:
wp dmg-read-more search

Options:
--date-after=<YYYY-MM-DD>
--date-before=<YYYY-MM-DD>

Examples:
wp dmg-read-more search
wp dmg-read-more search --date-after=2025-11-01 --date-before=2025-11-30

Output:

- It prints matching post IDs
- It posts a "no posts found" warning
