CREATE OR REPLACE FUNCTION set_suggestion_id_fn()
RETURNS trigger
LANGUAGE PLPGSQL
AS $$
  BEGIN
    LOCK TABLE ONLY suggestion_feeds IN SHARE UPDATE EXCLUSIVE MODE;
    UPDATE suggestion_feeds
    SET last_suggestion_id = last_suggestion_id + 1
    WHERE
      feed_channel_id = NEW.feed_channel_id
      AND guild_id = NEW.guild_id
    RETURNING last_suggestion_id INTO NEW.public_id;
    RETURN NEW;
  END;
$$;

--

CREATE OR REPLACE TRIGGER set_suggestion_id
BEFORE INSERT ON suggestions
FOR EACH ROW
EXECUTE PROCEDURE set_suggestion_id_fn();

--

CREATE UNIQUE INDEX
ON suggestion_feeds (guild_id, feed_channel_id, is_default)
WHERE is_default = TRUE;
