import type { ColumnBuilderBaseConfig, ColumnBuilderRuntimeConfig, MakeColumnConfig } from '~/column-builder.ts';
import type { ColumnBaseConfig } from '~/column.ts';
import { entityKind } from '~/entity.ts';
import type { AnyPgTable } from '~/pg-core/table.ts';
import type { DriverValueMapper, SQL } from '~/sql/sql.ts';
import { type Equal, getColumnNameAndConfig } from '~/utils.ts';
import { PgColumn, PgColumnBuilder } from './common.ts';

export type ConvertCustomConfig<TName extends string, T extends Partial<CustomTypeValues>> =
	& {
		name: TName;
		dataType: 'custom';
		columnType: 'PgCustomColumn';
		data: T['data'];
		driverParam: T['driverData'];
		enumValues: undefined;
	}
	& (T['notNull'] extends true ? { notNull: true } : {})
	& (T['default'] extends true ? { hasDefault: true } : {});

export interface PgCustomColumnInnerConfig {
	customTypeValues: CustomTypeValues;
}

export class PgCustomColumnBuilder<T extends ColumnBuilderBaseConfig<'custom', 'PgCustomColumn'>>
	extends PgColumnBuilder<
		T,
		{
			fieldConfig: CustomTypeValues['config'];
			customTypeParams: CustomTypeParams<any>;
		},
		{
			pgColumnBuilderBrand: 'PgCustomColumnBuilderBrand';
		}
	>
{
	static override readonly [entityKind]: string = 'PgCustomColumnBuilder';

	constructor(
		name: T['name'],
		fieldConfig: CustomTypeValues['config'],
		customTypeParams: CustomTypeParams<any>,
	) {
		super(name, 'custom', 'PgCustomColumn');
		this.config.fieldConfig = fieldConfig;
		this.config.customTypeParams = customTypeParams;
	}

	/** @internal */
	build<TTableName extends string>(
		table: AnyPgTable<{ name: TTableName }>,
	): PgCustomColumn<MakeColumnConfig<T, TTableName>> {
		return new PgCustomColumn<MakeColumnConfig<T, TTableName>>(
			table,
			this.config as ColumnBuilderRuntimeConfig<any, any>,
		);
	}
}

export class PgCustomColumn<T extends ColumnBaseConfig<'custom', 'PgCustomColumn'>> extends PgColumn<T> {
	static override readonly [entityKind]: string = 'PgCustomColumn';

	private sqlName: string;
	private mapTo?: (value: T['data']) => T['driverParam'];
	private mapFrom?: (value: T['driverParam']) => T['data'];
	readonly selectFromDb?: (
		column: string,
		decoder: DriverValueMapper<T['data'], T['driverParam']>,
	) => SQL<T['data']> | SQL.Aliased<T['data']>;

	constructor(
		table: AnyPgTable<{ name: T['tableName'] }>,
		config: PgCustomColumnBuilder<T>['config'],
	) {
		super(table, config);
		this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
		this.mapTo = config.customTypeParams.toDriver;
		this.mapFrom = config.customTypeParams.fromDriver;
		this.selectFromDb = config.customTypeParams.selectFromDb;
	}

	getSQLType(): string {
		return this.sqlName;
	}

	getSelectSQL(): SQL<T['data']> | SQL.Aliased<T['data']> | undefined {
		if (typeof this.selectFromDb === 'function') {
			return this.selectFromDb(this.name, this);
		}
		return undefined;
	}

	override mapFromDriverValue(value: T['driverParam']): T['data'] {
		return typeof this.mapFrom === 'function' ? this.mapFrom(value) : value as T['data'];
	}

	override mapToDriverValue(value: T['data']): T['driverParam'] {
		return typeof this.mapTo === 'function' ? this.mapTo(value) : value as T['data'];
	}
}

export type CustomTypeValues = {
	data: unknown;
	driverData?: unknown;
	config?: Record<string, any>;
	configRequired?: boolean;
	notNull?: boolean;
	default?: boolean;
};

export interface CustomTypeParams<T extends CustomTypeValues> {
	dataType: (config: T['config'] | (Equal<T['configRequired'], true> extends true ? never : undefined)) => string;
	toDriver?: (value: T['data']) => T['driverData'] | SQL;
	fromDriver?: (value: T['driverData']) => T['data'];
	/**
	 * Optional default selection wrapper invoked automatically when this custom column is selected.
	 */
	selectFromDb?: (
		column: string,
		decoder: DriverValueMapper<T['data'], T['driverData']>,
	) => SQL<T['data']> | SQL.Aliased<T['data']>;
}

export function customType<T extends CustomTypeValues = CustomTypeValues>(
	customTypeParams: CustomTypeParams<T>,
): Equal<T['configRequired'], true> extends true ? {
		<TConfig extends Record<string, any> & T['config']>(
			fieldConfig: TConfig,
		): PgCustomColumnBuilder<ConvertCustomConfig<'', T>>;
		<TName extends string>(
			dbName: TName,
			fieldConfig: T['config'],
		): PgCustomColumnBuilder<ConvertCustomConfig<TName, T>>;
	}
	: {
		(): PgCustomColumnBuilder<ConvertCustomConfig<'', T>>;
		<TConfig extends Record<string, any> & T['config']>(
			fieldConfig?: TConfig,
		): PgCustomColumnBuilder<ConvertCustomConfig<'', T>>;
		<TName extends string>(
			dbName: TName,
			fieldConfig?: T['config'],
		): PgCustomColumnBuilder<ConvertCustomConfig<TName, T>>;
	}
{
	return <TName extends string>(
		a?: TName | T['config'],
		b?: T['config'],
	): PgCustomColumnBuilder<ConvertCustomConfig<TName, T>> => {
		const { name, config } = getColumnNameAndConfig<T['config']>(a, b);
		return new PgCustomColumnBuilder(
			name as ConvertCustomConfig<TName, T>['name'],
			config,
			customTypeParams,
		);
	};
}
