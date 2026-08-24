import { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { api } from '../api';

const emptyForm = {
  id: null,
  title: '',
  coverImageUrl: '',
  excerpt: '',
  contentHtml: '',
};

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false); // editor view open
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const quillRef = useRef(null);
  const coverFileRef = useRef(null);
  const inlineFileRef = useRef(null);
  const inlineRangeRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .allBlogs()
      .then((r) => setPosts(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Image button: upload to S3 (or fall back to pasting a URL) — never base64 blobs.
  const insertInlineImage = (url) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true) || inlineRangeRef.current;
    editor.insertEmbed(range ? range.index : 0, 'image', url);
  };

  // Reset the input so picking the same file again still fires onChange.
  const resetInput = (ref) => {
    if (ref.current) ref.current.value = '';
  };

  const uploadFile = async (file, onDone) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadImage(file);
      onDone(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      resetInput(inlineFileRef);
      resetInput(coverFileRef);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image() {
            const pick = window.confirm('OK to upload an image · Cancel to paste an image URL');
            const editor = quillRef.current?.getEditor();
            inlineRangeRef.current = editor?.getSelection(true);
            if (pick) {
              inlineFileRef.current?.click();
              return;
            }
            const url = window.prompt('Image URL');
            if (url) insertInlineImage(url);
          },
        },
      },
    }),
    []
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(true);
  };

  const openEdit = (p) => {
    setForm({
      id: p.id,
      title: p.title,
      coverImageUrl: p.cover_image_url || '',
      excerpt: p.excerpt || '',
      contentHtml: p.content_html || '',
    });
    setEditing(true);
  };

  const save = async (status) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        coverImageUrl: form.coverImageUrl.trim() || null,
        excerpt: form.excerpt.trim() || null,
        contentHtml: form.contentHtml,
        status,
      };
      if (form.id) {
        await api.updateBlogPost(form.id, payload);
      } else {
        await api.createBlogPost(payload);
      }
      setEditing(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteBlogPost(p.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (editing) {
    const wasPublished = form.id
      ? posts.find((p) => p.id === form.id)?.status === 'published'
      : false;
    return (
      <div>
        <div className="admin-head">
          <h1>{form.id ? 'Edit post' : 'New post'}</h1>
          <button className="btn ghost" onClick={() => setEditing(false)}>← Back to posts</button>
        </div>

        {/* Not a <form>: Quill's toolbar buttons would submit it on click. */}
        <div className="compose blog-compose">
          <input
            ref={coverFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => uploadFile(e.target.files?.[0], (url) => setForm((f) => ({ ...f, coverImageUrl: url })))}
          />
          <input
            ref={inlineFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => uploadFile(e.target.files?.[0], insertInlineImage)}
          />
          <input
            className="blog-title-input"
            placeholder="Post title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save(wasPublished ? 'published' : 'draft');
              }
            }}
          />

          <div className="cover-row">
            {form.coverImageUrl.trim() && (
              <img className="cover-preview" src={form.coverImageUrl} alt="Cover preview" />
            )}
            <input
              placeholder="Cover image URL (optional)"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            />
            <button
              type="button"
              className="btn ghost sm"
              disabled={uploading}
              onClick={() => coverFileRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>

          <textarea
            rows={2}
            placeholder="Excerpt (optional — derived from the body if left empty)"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />

          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={form.contentHtml}
            onChange={(contentHtml) => setForm({ ...form, contentHtml })}
            modules={modules}
            placeholder="Write your post…"
          />

          {error && <p className="error">{error}</p>}

          <div className="compose-actions">
            <button
              className="btn"
              type="button"
              disabled={saving || !form.title.trim()}
              onClick={() => save(wasPublished ? 'published' : 'draft')}
            >
              {saving ? 'Saving…' : wasPublished ? 'Save changes' : 'Save draft'}
            </button>
            {wasPublished ? (
              <button className="btn ghost" type="button" disabled={saving} onClick={() => save('draft')}>
                Unpublish
              </button>
            ) : (
              <button className="btn ghost" type="button" disabled={saving} onClick={() => save('published')}>
                Publish
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-head">
        <h1>Blog posts</h1>
        <button className="btn" onClick={openCreate}>＋ New post</button>
      </div>

      {error && !editing && <p className="error">{error}</p>}
      {loading && <p className="note">Loading posts…</p>}
      {!loading && !posts.length && !error && (
        <p className="note">No posts yet — write your first one.</p>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Published</th>
              <th>Last updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="cell-title">{p.title}</td>
                <td>
                  <span className={`post-status ${p.status}`}>{p.status}</span>
                </td>
                <td>{fmtDate(p.published_at)}</td>
                <td>{fmtDate(p.updated_at)}</td>
                <td className="cell-actions">
                  <button className="btn ghost sm" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn danger sm" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
