DO
$$
DECLARE
    tables text;
BEGIN
    -- Generate a comma-separated list of all tables in the public schema
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO tables
    FROM pg_tables
    WHERE schemaname = 'public';

    -- Disable referential integrity
    EXECUTE 'SET session_replication_role = replica';

    -- Truncate all tables
    IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
    END IF;

    -- Re-enable referential integrity
    EXECUTE 'SET session_replication_role = DEFAULT';
END
$$;