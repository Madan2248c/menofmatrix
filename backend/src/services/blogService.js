import { query } from '../config/db.js';

const POST_COLUMNS = `id, slug, title, excerpt, content_html, cover_image_url, status, published_at, created_at, updated_at`;

/** Turn a title into a URL slug; falls back to 'post' when nothing usable remains. */
function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'post';
}

/** First slug candidate not taken yet, appending -2, -3, … on collisions. */
async function uniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; ; n += 1) {
    const { rowCount } = await query(`SELECT 1 FROM blog_posts WHERE slug = $1`, [slug]);
    if (!rowCount) return slug;
    slug = `${base}-${n}`;
  }
}

/** Strip tags and collapse whitespace — used to derive an excerpt from the body. */
const plainText = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function deriveExcerpt(html, max = 180) {
  const text = plainText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

const isStatus = (s) => s === 'draft' || s === 'published';

/** Published posts for the public blog, newest first. */
export async function listPublished(limit = 50) {
  const { rows } = await query(
    `SELECT id, slug, title, excerpt, cover_image_url, status, published_at
     FROM blog_posts WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST LIMIT $1`,
    [Math.min(Number(limit) || 50, 200)]
  );
  return rows;
}

/** Every post including drafts, for the owner's admin list. */
export async function listAll() {
  const { rows } = await query(
    `SELECT id, slug, title, excerpt, cover_image_url, status, published_at, updated_at
     FROM blog_posts ORDER BY updated_at DESC`
  );
  return rows;
}

/** One published post by slug for the public detail page. */
export async function getPublishedBySlug(slug) {
  const { rows } = await query(
    `SELECT ${POST_COLUMNS} FROM blog_posts WHERE slug = $1 AND status = 'published'`,
    [String(slug || '')]
  );
  return rows[0] || null;
}

/** One post by id, any status (owner editing). */
export async function getById(id) {
  const { rows } = await query(`SELECT ${POST_COLUMNS} FROM blog_posts WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createPost({ title, excerpt, contentHtml, coverImageUrl, status }) {
  if (!title || !String(title).trim()) throw new Error('Title is required');
  const finalStatus = status === 'published' ? 'published' : 'draft';
  const slug = await uniqueSlug(title);
  const finalExcerpt =
    excerpt && String(excerpt).trim() ? String(excerpt).trim() : deriveExcerpt(contentHtml);

  const { rows } = await query(
    `INSERT INTO blog_posts (slug, title, excerpt, content_html, cover_image_url, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'published' THEN now() ELSE NULL END)
     RETURNING ${POST_COLUMNS}`,
    [slug, String(title).trim(), finalExcerpt, contentHtml || '', coverImageUrl || null, finalStatus]
  );
  return rows[0];
}

export async function updatePost(id, { title, excerpt, contentHtml, coverImageUrl, status }) {
  const existing = await getById(id);
  if (!existing) return null;

  // Regenerate the slug only when the title actually changed.
  let slug = existing.slug;
  const nextTitle = title !== undefined ? String(title).trim() : existing.title;
  if (!nextTitle) throw new Error('Title is required');
  if (title !== undefined && nextTitle !== existing.title) {
    slug = await uniqueSlug(nextTitle);
  }

  const finalStatus = status !== undefined && isStatus(status) ? status : existing.status;
  const finalExcerpt =
    excerpt !== undefined && String(excerpt).trim()
      ? String(excerpt).trim()
      : excerpt !== undefined
        ? deriveExcerpt(contentHtml !== undefined ? contentHtml : existing.content_html)
        : existing.excerpt;

  const { rows } = await query(
    `UPDATE blog_posts SET
       slug = $2,
       title = $3,
       excerpt = $4,
       content_html = $5,
       cover_image_url = $6,
       status = $7,
       -- first publish stamps the date; unpublish/republish keeps the original
       published_at = CASE
         WHEN $7 = 'published' THEN COALESCE(published_at, now())
         ELSE published_at
       END,
       updated_at = now()
     WHERE id = $1
     RETURNING ${POST_COLUMNS}`,
    [
      id,
      slug,
      nextTitle,
      finalExcerpt,
      contentHtml !== undefined ? contentHtml : existing.content_html,
      coverImageUrl !== undefined ? coverImageUrl || null : existing.cover_image_url,
      finalStatus,
    ]
  );
  return rows[0] || null;
}

export async function deletePost(id) {
  const { rowCount } = await query(`DELETE FROM blog_posts WHERE id = $1`, [id]);
  return rowCount > 0;
}
