DROP TRIGGER IF EXISTS generate_suggestion_id ON "Suggestion";
DROP FUNCTION IF EXISTS generate_suggestion_id;

CREATE FUNCTION generate_suggestion_id() RETURNS TRIGGER AS $$
BEGIN
  SELECT (COALESCE(MAX(id), 0) + 1)
  INTO NEW.id
  FROM "Suggestion"
  WHERE feed_id = NEW.feed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_suggestion_id
BEFORE INSERT
ON "Suggestion"
FOR EACH ROW
EXECUTE PROCEDURE generate_suggestion_id();
