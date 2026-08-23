import 'dotenv/config';
import { query } from '../config/db.js';
import { getAccount } from './tokenStore.js';
import { fetchMediaComments } from './instagram.js';

const GRAPH = `https://graph.instagram.com/${process.env.IG_GRAPH_VERSION || 'v23.0'}`;

// ---------- comment ingestion ----------

/** Fetch + store comments for a list of media objects for one account. */
export async function syncCommentsForAccount(accountId, mediaList) {
  let stored = 0;
  for (const m of mediaList) {
    if (m.media_product_type === 'STORY') continue; // no comments on stories
    const comments = await fetchMediaComments(accountId, m.id);
    for (const c of comments) {
      await query(
        `INSERT INTO comments (id, account_id, post_id, text, username, like_count, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text,
           like_count = COALESCE(EXCLUDED.like_count, comments.like_count),
           synced_at = now()`,
        [
          c.id,
          accountId,
          m.id,
          c.text ?? null,
          c.username ?? null,
          c.like_count ?? null,
          c.timestamp ? new Date(c.timestamp) : null,
        ]
      );
      stored++;
    }
  }
  return stored;
}

// ---------- rules ----------

export async function listRules(accountId) {
  const params = [];
  let where = '';
  if (accountId) {
    where = `WHERE account_id = $${params.push(accountId)}`;
  }
  const { rows } = await query(
    `SELECT * FROM automation_rules ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function createRule({ accountId, name, keywords, action, messageTemplate }) {
  const { rows } = await query(
    `INSERT INTO automation_rules (account_id, name, trigger_keywords, action, message_template)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [accountId, name, keywords, action, messageTemplate]
  );
  return rows[0];
}

export async function deleteRule(id) {
  await query(`DELETE FROM automation_rules WHERE id = $1`, [id]);
}

// ---------- execution ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function publicReply(accountId, commentId, text) {
  const acct = await getAccount(accountId);
  const url = new URL(`${GRAPH}/${commentId}/replies`);
  url.searchParams.set('message', text);
  url.searchParams.set('access_token', acct.access_token);
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `reply failed (${res.status})`);
  return json;
}

async function privateDm(accountId, commentId, text) {
  const acct = await getAccount(accountId);
  const url = new URL(`${GRAPH}/${acct.ig_user_id}/messages`);
  const body = JSON.stringify({
    recipient: { comment_id: commentId },
    message: { text },
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `DM failed (${res.status})`);
  return json;
}

const fillTemplate = (template, ctx) =>
  (template || '').replace(/\{username\}/g, ctx.username || 'friend');

/** Run automation for one account (or all). Returns a summary. */
export async function runAutomation(accountId = null) {
  const rules = await listRules(accountId);
  const enabled = rules.filter((r) => r.enabled);
  if (!enabled.length) return { rules: 0, matches: 0, actions: 0, failures: [] };

  const { rows: pending } = await query(
    `SELECT c.id AS comment_id, c.username, c.text, c.account_id
     FROM comments c
     WHERE NOT EXISTS (
       SELECT 1 FROM automation_actions aa
       WHERE aa.comment_id = c.id AND aa.rule_id = ANY($1)
     )
     ORDER BY c.timestamp DESC NULLS LAST
     LIMIT 200`,
    [enabled.map((r) => r.id)]
  );

  let matches = 0;
  let actions = 0;
  const failures = [];

  for (const comment of pending) {
    const text = (comment.text || '').toLowerCase();
    const appliedRule = enabled.find((r) =>
      (r.trigger_keywords || []).some((k) => k && text.includes(String(k).toLowerCase()))
    );
    if (!appliedRule) continue;
    matches++;

    // Skip if this rule already acted on this comment (deeper dedupe)
    const already = await query(
      `SELECT id FROM automation_actions WHERE comment_id=$1 AND rule_id=$2`,
      [comment.comment_id, appliedRule.id]
    );
    if (already.rows.length > 0) continue;

    const commentIdStr = String(comment.comment_id);

    const doAction = async (action) => {
      const body = fillTemplate(appliedRule.message_template, { username: comment.username });
      try {
        if (action === 'reply') await publicReply(comment.account_id, commentIdStr, body);
        else await privateDm(comment.account_id, commentIdStr, body);
        await query(
          `INSERT INTO automation_actions (rule_id, comment_id, action, status, message)
           VALUES ($1,$2,$3,'ok',$4) ON CONFLICT (rule_id, comment_id, action) DO NOTHING`,
          [appliedRule.id, commentIdStr, action, body]
        );
        actions++;
      } catch (err) {
        failures.push({ commentId: commentIdStr, action, error: err.message });
        await query(
          `INSERT INTO automation_actions (rule_id, comment_id, action, status, message)
           VALUES ($1,$2,$3,'error',$4) ON CONFLICT (rule_id, comment_id, action) DO NOTHING`,
          [appliedRule.id, commentIdStr, action, err.message]
        );
      }
      await sleep(400); // mind rate limits (~200/h/account)
    };

    if (appliedRule.action === 'reply' || appliedRule.action === 'both') await doAction('reply');
    if (appliedRule.action === 'dm' || appliedRule.action === 'both') await doAction('dm');
  }

  return { rules: enabled.length, matches, actions, failures };
}