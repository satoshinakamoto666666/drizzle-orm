import os


def test_drizzle_554_selection_expression_in_custom_type_params():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "selectionExpression?: (column: PgColumn<any>) => SQL;" in src
    assert "this.selectionExpression = config.customTypeParams.selectionExpression;" in src


def test_drizzle_554_wrap_column_in_sql_method():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "wrapColumnInSQL(): SQL | PgColumn<T>" in src
    assert "return this.selectionExpression(this);" in src


def test_drizzle_554_fallback_returns_column_self():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "return this;" in src
