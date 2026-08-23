-- account_snapshots: switch from per-date PK to per-account-per-date PK
ALTER TABLE account_snapshots DROP CONSTRAINT IF EXISTS account_snapshots_pkey;
ALTER TABLE account_snapshots ADD PRIMARY KEY (account_id, snapshot_date);
