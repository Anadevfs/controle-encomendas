DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'usuario'
    ) THEN
        ALTER TABLE usuario
            ADD COLUMN IF NOT EXISTS can_view_observation_history BOOLEAN DEFAULT FALSE;

        UPDATE usuario
        SET can_view_observation_history = CASE
            WHEN LOWER(username) = 'ana@eva.com' THEN TRUE
            WHEN LOWER(username) = 'veronica@eva.com' THEN TRUE
            ELSE FALSE
        END;
    END IF;
END $$;
