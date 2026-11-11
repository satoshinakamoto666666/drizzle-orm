import type { ColumnBuilderBaseConfig, ColumnBuilderRuntimeConfig, MakeColumnConfig } from '~/column-builder.ts';
import type { ColumnBaseConfig } from '~/column.ts';
import { entityKind } from '~/entity.ts';
import type { AnyPgTable } from '~/pg-core/table.ts';
import type { SQL } from '~/sql/sql.ts';
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
	readonly selectionExpression?: (column: PgColumn<T>) => SQL;

	constructor(
		table: AnyPgTable<{ name: T['tableName'] }>,
		config: PgCustomColumnBuilder<T>['config'],
	) {
		super(table, config);
		this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
		this.mapTo = config.customTypeParams.toDriver;
		this.mapFrom = config.customTypeParams.fromDriver;
		this.selectionExpression = config.customTypeParams.selectionExpression;
	}

	getSQLType(): string {
		return this.sqlName;
	}

	wrapColumnInSQL(): SQL | PgColumn<T> {
		if (typeof this.selectionExpression === 'function') {
			return this.selectionExpression(this);
		}
		return this;
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
	 * Optional SQL wrapper expression applied when selecting this custom column (e.g. `ST_AsText(column)`).
	 */
	selectionExpression?: (column: PgColumn<any>) => SQL;
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
