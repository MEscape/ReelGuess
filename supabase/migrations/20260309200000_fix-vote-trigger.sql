-- Drop the broken trigger and function — is_correct is now computed in the application layer
DROP TRIGGER IF EXISTS votes_set_is_correct ON votes;
DROP FUNCTION IF EXISTS set_is_correct();
