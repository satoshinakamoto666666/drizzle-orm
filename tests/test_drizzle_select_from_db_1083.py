import os


def test_drizzle_1083_select_from_db_interface_and_column():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "selectFromDb?: (" in src
    assert "decoder: DriverValueMapper<T['data'], T['driverData']>" in src
    assert "this.selectFromDb = config.customTypeParams.selectFromDb;" in src
    assert "getSelectSQL(): SQL<T['data']> | SQL.Aliased<T['data']> | undefined" in src


def test_drizzle_1083_select_from_db_invokes_column_name_and_decoder():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "return this.selectFromDb(this.name, this);" in src


def test_drizzle_1083_driver_value_mapper_imported():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "drizzle-orm", "src", "pg-core", "columns", "custom.ts"), encoding="utf-8").read()
    assert "DriverValueMapper" in src
    assert "SQL.Aliased<T['data']>" in src
