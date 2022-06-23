CREATE OR REPLACE FUNCTION set_suggestion_id_fn()
RETURNS trigger
LANGUAGE PLPGSQL
AS $$
  BEGIN
    UPDATE suggestion_feeds
    SET last_suggestion_id = last_suggestion_id + 1
    WHERE
      channel_id = NEW.feed_channel_id
      AND application_id = NEW.application_id
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
ON suggestion_feeds (is_default)
WHERE is_default = TRUE;
