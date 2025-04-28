// SQL portions of the grammar adapted from https://github.com/DerekStride/tree-sitter-sql
module.exports = grammar({
  name: 'avenger',

  extras: $ => [
    /\s\n/,
    /\s/,
    $.comment,
    $.marginalia,
    $.slash_comment,
  ],

  conflicts: $ => [
    [$.boolean_literal, $.table_identifier],
    [$.object_reference],
    [$.between_expression, $.binary_expression]
  ],

  precedences: $ => [
    [
      'binary_is',
      'unary_not',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'unary_other',
      'binary_op',
      'binary_in',
      'binary_compare',
      'binary_relation',
      'pattern_matching',
      'between',
      'clause_connective',
      'clause_disjunctive',
    ],
  ],

  supertypes:  $ => [
    $.statement, $.fn_statement, $.sql_expression, $.sql_expr_or_query, $._select_or_set_operation,
    $._order_target_direction, $._order_target_nulls_position, $._frame_definition_bound,
    $._join_condition, $._join_type, $._lateral_join_condition, $._lateral_join_source 
  ],

  word: $ => $._identifier,
  rules: {
    file: $ => field('statements', repeat($.statement)),

    statement: $ => choice(
      $.import_statement,
      $.val_prop,
      $.expr_prop,
      $.dataset_prop,
      $.comp_prop,
      $.prop_binding,
      $.comp_instance,
      $.function_def,
    ),

    // Basic elements
    identifier: $ => /[a-z][a-zA-Z0-9_]*/,
    pascal_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,
    table_identifier: $ => {
      const tableIdentPattern = /[a-zA-Z][a-zA-Z0-9_]*/;
      return token(prec(1, tableIdentPattern));
    },
    variable_reference: $ => /@[a-z][a-zA-Z0-9_]*/,
    boolean_literal: $ => prec(5, choice($.keyword_true, $.keyword_false)),
    
    type: $ => seq(
      '<',
      $.identifier,
      '>'
    ),

    prop_qualifier: $ => choice($.keyword_in, $.keyword_out),

    // Function definition and related constructs    
    function_def: $ => seq(
      $.keyword_fn,
      field("name", $.identifier),
      '(',
      field("parameters", optional(comma_list($.parameter_decl, true))),
      ')',
      seq(
        '->',
        field("return_kind", choice(
          $.keyword_val,
          $.keyword_expr,
          $.keyword_dataset
        )),
        field("return_type", optional($.type))
      ),
      '{',
      field("statements", repeat($.fn_statement)),
      field("return_statement", $.return_statement),
      '}'
    ),

    parameter_decl: $ => seq(
      field("kind", choice(
        $.keyword_val,
        $.keyword_expr,
        $.keyword_dataset
      )),
      optional($.type),
      field("name", $.identifier)
    ),

    fn_statement: $ => choice(
      $.val_prop,
      $.expr_prop,
      $.dataset_prop
    ),

    return_statement: $ => seq(
      $.keyword_return,
      field("expr", $.sql_expr_or_query),
      optional(';')
    ),

    // For the list items themselves (without commas)
    import_item: $ => seq(
      field("name", $.pascal_identifier),
      optional(seq(
        'as',
        field("alias", $.pascal_identifier)
      ))
    ),

    import_path: $ => seq(
      "from",
      field('path', $.single_quote_string),
      ';'
    ),

    // In your import_statement rule
    import_statement: $ => seq(
      $.keyword_import,
      '{',
      field('items', comma_list($.import_item, true)),
      optional(','),
      '}',
      field('path', $.import_path)
    ),
    
    // SQL expressions and queries with simpler approach
    sql_expr_or_query: $ => choice(
      field('query', $.sql_query),
      field('expression', $.sql_expression),
    ),

    // Property types
    val_prop: $ => seq(
      field('qualifier', optional($.prop_qualifier)),
      $.keyword_val,
      field('type', optional($.type)),
      field("name", $.identifier),
      ':',
      field('expr', $.sql_expression),
      ';'
    ),

    expr_prop: $ => seq(
      field('qualifier', optional($.prop_qualifier)),
      $.keyword_expr,
      field('type', optional($.type)),
      field("name", $.identifier),
      ':',
      field('expr', $.sql_expression),
      ';'
    ),

    dataset_prop: $ => seq(
      field('qualifier', optional($.prop_qualifier)),
      $.keyword_dataset,
      field('type', optional($.type)),
      field("name", $.identifier),
      ':',
      field('query', $.sql_query),
      ';'
    ),

    comp_prop: $ => seq(
      field('qualifier', optional($.prop_qualifier)),
      $.keyword_comp,
      field("name", $.identifier),
      ':',
      field('instance', $.comp_instance),
    ),

    // Component instance
    comp_instance: $ => seq(
      field('name', $.pascal_identifier),
      '{',
      field('statements', repeat($.statement)),
      '}'
    ),

    // Property binding
    prop_binding: $ => seq(
      field('name', $.identifier),
      ':=',
      field('expr_or_query', $.sql_expr_or_query),
      ';'
    ),
  
    // SQL Definitions
    keyword_select: _ => make_keyword("select"),
    keyword_delete: _ => make_keyword("delete"),
    keyword_insert: _ => make_keyword("insert"),
    keyword_replace: _ => make_keyword("replace"),
    keyword_update: _ => make_keyword("update"),
    keyword_truncate: _ => make_keyword("truncate"),
    keyword_merge: _ => make_keyword("merge"),
    keyword_into: _ => make_keyword("into"),
    keyword_overwrite: _ => make_keyword("overwrite"),
    keyword_values: _ => make_keyword("values"),
    keyword_value: _ => make_keyword("value"),
    keyword_matched: _ => make_keyword("matched"),
    keyword_set: _ => make_keyword("set"),
    keyword_from: _ => make_keyword("from"),
    keyword_left: _ => make_keyword("left"),
    keyword_right: _ => make_keyword("right"),
    keyword_inner: _ => make_keyword("inner"),
    keyword_full: _ => make_keyword("full"),
    keyword_outer: _ => make_keyword("outer"),
    keyword_cross: _ => make_keyword("cross"),
    keyword_join: _ => make_keyword("join"),
    keyword_lateral: _ => make_keyword("lateral"),
    keyword_natural: _ => make_keyword("natural"),
    keyword_on: _ => make_keyword("on"),
    keyword_off: _ => make_keyword("off"),
    keyword_where: _ => make_keyword("where"),
    keyword_order: _ => make_keyword("order"),
    keyword_group: _ => make_keyword("group"),
    keyword_partition: _ => make_keyword("partition"),
    keyword_by: _ => make_keyword("by"),
    keyword_having: _ => make_keyword("having"),
    keyword_desc: _ => make_keyword("desc"),
    keyword_asc: _ => make_keyword("asc"),
    keyword_limit: _ => make_keyword("limit"),
    keyword_offset: _ => make_keyword("offset"),
    keyword_primary: _ => make_keyword("primary"),
    keyword_create: _ => make_keyword("create"),
    keyword_change: _ => make_keyword("change"),
    keyword_modify: _ => make_keyword("modify"),
    keyword_drop: _ => make_keyword("drop"),
    keyword_add: _ => make_keyword("add"),
    keyword_table: _ => make_keyword("table"),
    keyword_tables: _ => make_keyword("tables"),
    keyword_view: _ => make_keyword("view"),
    keyword_column: _ => make_keyword("column"),
    keyword_columns: _ => make_keyword("columns"),
    keyword_materialized: _ => make_keyword("materialized"),
    keyword_tablespace: _ => make_keyword("tablespace"),
    keyword_sequence: _ => make_keyword("sequence"),
    keyword_increment: _ => make_keyword("increment"),
    keyword_minvalue: _ => make_keyword("minvalue"),
    keyword_maxvalue: _ => make_keyword("maxvalue"),
    keyword_none: _ => make_keyword("none"),
    keyword_owned: _ => make_keyword("owned"),
    keyword_start: _ => make_keyword("start"),
    keyword_restart: _ => make_keyword("restart"),
    keyword_key: _ => make_keyword("key"),
    keyword_as: _ => make_keyword("as"),
    keyword_distinct: _ => make_keyword("distinct"),
    keyword_constraint: _ => make_keyword("constraint"),
    keyword_filter: _ => make_keyword("filter"),
    keyword_cast: _ => make_keyword("cast"),
    keyword_separator: _ => make_keyword("separator"),
    keyword_max: _ => make_keyword("max"),
    keyword_min: _ => make_keyword("min"),
    keyword_avg: _ => make_keyword("avg"),
    keyword_case: _ => make_keyword("case"),
    keyword_when: _ => make_keyword("when"),
    keyword_then: _ => make_keyword("then"),
    keyword_else: _ => make_keyword("else"),
    keyword_end: _ => make_keyword("end"),
    keyword_in: _ => make_keyword("in"),
    keyword_and: _ => make_keyword("and"),
    keyword_or: _ => make_keyword("or"),
    keyword_is: _ => make_keyword("is"),
    keyword_not: _ => make_keyword("not"),
    keyword_force: _ => make_keyword("force"),
    keyword_ignore: _ => make_keyword("ignore"),
    keyword_using: _ => make_keyword("using"),
    keyword_use: _ => make_keyword("use"),
    keyword_index: _ => make_keyword("index"),
    keyword_for: _ => make_keyword("for"),
    keyword_if: _ => make_keyword("if"),
    keyword_exists: _ => make_keyword("exists"),
    keyword_auto_increment: _ => make_keyword("auto_increment"),
    keyword_generated: _ => make_keyword("generated"),
    keyword_always: _ => make_keyword("always"),
    keyword_collate: _ => make_keyword("collate"),
    keyword_character: _ => make_keyword("character"),
    keyword_engine: _ => make_keyword("engine"),
    keyword_default: _ => make_keyword("default"),
    keyword_cascade: _ => make_keyword("cascade"),
    keyword_restrict: _ => make_keyword("restrict"),
    keyword_with: _ => make_keyword("with"),
    keyword_without: _ => make_keyword("without"),
    keyword_no: _ => make_keyword("no"),
    keyword_data: _ => make_keyword("data"),
    keyword_type: _ => make_keyword("type"),
    keyword_rename: _ => make_keyword("rename"),
    keyword_to: _ => make_keyword("to"),
    keyword_database: _ => make_keyword("database"),
    keyword_schema: _ => make_keyword("schema"),
    keyword_owner: _ => make_keyword("owner"),
    keyword_user: _ => make_keyword("user"),
    keyword_admin: _ => make_keyword("admin"),
    keyword_password: _ => make_keyword("password"),
    keyword_encrypted: _ => make_keyword("encrypted"),
    keyword_valid: _ => make_keyword("valid"),
    keyword_until: _ => make_keyword("until"),
    keyword_connection: _ => make_keyword("connection"),
    keyword_role: _ => make_keyword("role"),
    keyword_reset: _ => make_keyword("reset"),
    keyword_temp: _ => make_keyword("temp"),
    keyword_unlogged: _ => make_keyword("unlogged"),
    keyword_logged: _ => make_keyword("logged"),
    keyword_cycle: _ => make_keyword("cycle"),
    keyword_union: _ => make_keyword("union"),
    keyword_all: _ => make_keyword("all"),
    keyword_any: _ => make_keyword("any"),
    keyword_some: _ => make_keyword("some"),
    keyword_except: _ => make_keyword("except"),
    keyword_intersect: _ => make_keyword("intersect"),
    keyword_returning: _ => make_keyword("returning"),
    keyword_commit: _ => make_keyword("commit"),
    keyword_rollback: _ => make_keyword("rollback"),
    keyword_over: _ => make_keyword("over"),
    keyword_nulls: _ => make_keyword("nulls"),
    keyword_first: _ => make_keyword("first"),
    keyword_after: _ => make_keyword("after"),
    keyword_before: _ => make_keyword("before"),
    keyword_last: _ => make_keyword("last"),
    keyword_window: _ => make_keyword("window"),
    keyword_range: _ => make_keyword("range"),
    keyword_rows: _ => make_keyword("rows"),
    keyword_groups: _ => make_keyword("groups"),
    keyword_between: _ => make_keyword("between"),
    keyword_unbounded: _ => make_keyword("unbounded"),
    keyword_preceding: _ => make_keyword("preceding"),
    keyword_following: _ => make_keyword("following"),
    keyword_exclude: _ => make_keyword("exclude"),
    keyword_current: _ => make_keyword("current"),
    keyword_row: _ => make_keyword("row"),
    keyword_ties: _ => make_keyword("ties"),
    keyword_others: _ => make_keyword("others"),
    keyword_only: _ => make_keyword("only"),
    keyword_unique: _ => make_keyword("unique"),
    keyword_foreign: _ => make_keyword("foreign"),
    keyword_references: _ => make_keyword("references"),
    keyword_concurrently: _ => make_keyword("concurrently"),
    keyword_btree: _ => make_keyword("btree"),
    keyword_hash: _ => make_keyword("hash"),
    keyword_gist: _ => make_keyword("gist"),
    keyword_spgist: _ => make_keyword("spgist"),
    keyword_gin:  _ => make_keyword("gin"),
    keyword_brin: _ => make_keyword("brin"),
    keyword_like: _ => choice(make_keyword("like"),make_keyword("ilike")),
    keyword_similar: _ => make_keyword("similar"),
    keyword_preserve: _ => make_keyword("preserve"),
    keyword_unsigned: _ => make_keyword("unsigned"),
    keyword_zerofill: _ => make_keyword("zerofill"),
    keyword_conflict: _ => make_keyword("conflict"),
    keyword_do: _ => make_keyword("do"),
    keyword_nothing: _ => make_keyword("nothing"),
    keyword_high_priority: _ => make_keyword("high_priority"),
    keyword_low_priority: _ => make_keyword("low_priority"),
    keyword_delayed: _ => make_keyword("delayed"),
    keyword_recursive: _ => make_keyword("recursive"),
    keyword_cascaded: _ => make_keyword("cascaded"),
    keyword_local: _ => make_keyword("local"),
    keyword_current_timestamp: _ => make_keyword("current_timestamp"),
    keyword_check: _ => make_keyword("check"),
    keyword_option: _ => make_keyword("option"),
    keyword_vacuum: _ => make_keyword("vacuum"),
    keyword_wait: _ => make_keyword("wait"),
    keyword_nowait: _ => make_keyword("nowait"),
    keyword_attribute: _ => make_keyword("attribute"),
    keyword_authorization: _ => make_keyword("authorization"),
    keyword_action: _ => make_keyword("action"),
    keyword_extension: _ => make_keyword("extension"),

    keyword_trigger: _ => make_keyword('trigger'),
    keyword_returns: _ => make_keyword("returns"),
    keyword_setof: _ => make_keyword("setof"),
    keyword_atomic: _ => make_keyword("atomic"),
    keyword_declare: _ => make_keyword("declare"),
    keyword_language: _ => make_keyword("language"),
    keyword_sql: _ => make_keyword("sql"),
    keyword_plpgsql: _ => make_keyword("plpgsql"),
    keyword_immutable: _ => make_keyword("immutable"),
    keyword_stable: _ => make_keyword("stable"),
    keyword_volatile: _ => make_keyword("volatile"),
    keyword_leakproof: _ => make_keyword("leakproof"),
    keyword_parallel: _ => make_keyword("parallel"),
    keyword_safe: _ => make_keyword("safe"),
    keyword_unsafe: _ => make_keyword("unsafe"),
    keyword_restricted: _ => make_keyword("restricted"),
    keyword_called: _ => make_keyword("called"),
    keyword_input: _ => make_keyword("input"),
    keyword_strict: _ => make_keyword("strict"),
    keyword_cost: _ => make_keyword("cost"),
    keyword_rows: _ => make_keyword("rows"),
    keyword_support: _ => make_keyword("support"),
    keyword_definer: _ => make_keyword("definer"),
    keyword_invoker: _ => make_keyword("invoker"),
    keyword_security: _ => make_keyword("security"),
    keyword_version: _ => make_keyword("version"),
    keyword_extension: _ => make_keyword("extension"),
    keyword_out: _ => make_keyword("out"),
    keyword_inout: _ => make_keyword("inout"),
    keyword_variadic: _ => make_keyword("variadic"),

    keyword_session: _ => make_keyword("session"),
    keyword_isolation: _ => make_keyword("isolation"),
    keyword_level: _ => make_keyword("level"),
    keyword_serializable: _ => make_keyword("serializable"),
    keyword_repeatable: _ => make_keyword("repeatable"),
    keyword_read: _ => make_keyword("read"),
    keyword_write: _ => make_keyword("write"),
    keyword_committed: _ => make_keyword("committed"),
    keyword_uncommitted: _ => make_keyword("uncommitted"),
    keyword_deferrable: _ => make_keyword("deferrable"),
    keyword_names: _ => make_keyword("names"),
    keyword_zone: _ => make_keyword("zone"),
    keyword_immediate: _ => make_keyword("immediate"),
    keyword_characteristics: _ => make_keyword("characteristics"),
    keyword_follows: _ => make_keyword("follows"),
    keyword_precedes: _ => make_keyword("precedes"),
    keyword_each: _ => make_keyword("each"),
    keyword_instead: _ => make_keyword("instead"),
    keyword_of: _ => make_keyword("of"),
    keyword_initially: _ => make_keyword("initially"),
    keyword_old: _ => make_keyword("old"),
    keyword_new: _ => make_keyword("new"),
    keyword_referencing: _ => make_keyword("referencing"),
    keyword_execute: _ => make_keyword("execute"),
    keyword_procedure: _ => make_keyword("procedure"),

    // Hive Keywords
    keyword_external: _ => make_keyword("external"),
    keyword_stored: _ => make_keyword("stored"),
    keyword_virtual: _ => make_keyword("virtual"),
    keyword_cached: _ => make_keyword("cached"),
    keyword_uncached: _ => make_keyword("uncached"),
    keyword_replication: _ => make_keyword("replication"),
    keyword_tblproperties: _ => make_keyword("tblproperties"),
    keyword_options: _ => make_keyword("options"),
    keyword_compute: _ => make_keyword("compute"),
    keyword_stats: _ => make_keyword("stats"),
    keyword_statistics: _ => make_keyword("statistics"),
    keyword_optimize: _ => make_keyword("optimize"),
    keyword_rewrite: _ => make_keyword("rewrite"),
    keyword_bin_pack: _ => make_keyword("bin_pack"),
    keyword_incremental: _ => make_keyword("incremental"),
    keyword_location: _ => make_keyword("location"),
    keyword_partitioned: _ => make_keyword("partitioned"),
    keyword_comment: _ => make_keyword("comment"),
    keyword_sort: _ => make_keyword("sort"),
    keyword_format: _ => make_keyword("format"),
    keyword_delimited: _ => make_keyword("delimited"),
    keyword_fields: _ => make_keyword("fields"),
    keyword_terminated: _ => make_keyword("terminated"),
    keyword_escaped: _ => make_keyword("escaped"),
    keyword_lines: _ => make_keyword("lines"),
    keyword_cache: _ => make_keyword("cache"),
    keyword_metadata: _ => make_keyword("metadata"),
    keyword_noscan: _ => make_keyword("noscan"),

    // Hive file formats
    keyword_parquet: _ => make_keyword("parquet"),
    keyword_rcfile: _ => make_keyword("rcfile"),
    keyword_csv: _ => make_keyword("csv"),
    keyword_textfile: _ => make_keyword("textfile"),
    keyword_avro: _ => make_keyword("avro"),
    keyword_sequencefile: _ => make_keyword("sequencefile"),
    keyword_orc: _ => make_keyword("orc"),
    keyword_jsonfile: _ => make_keyword("jsonfile"),

    // Operators
    is_not: $ => prec.left(seq($.keyword_is, $.keyword_not)),
    not_like: $ => seq($.keyword_not, $.keyword_like),
    similar_to: $ => seq($.keyword_similar, $.keyword_to),
    not_similar_to: $ => seq($.keyword_not, $.keyword_similar, $.keyword_to),
    distinct_from: $ => seq($.keyword_is, $.keyword_distinct, $.keyword_from),
    not_distinct_from: $ => seq($.keyword_is, $.keyword_not, $.keyword_distinct, $.keyword_from),

    _not_null: $ => seq($.keyword_not, $.keyword_null),
    _primary_key: $ => seq($.keyword_primary, $.keyword_key),
    _if_exists: $ => seq($.keyword_if, $.keyword_exists),
    _if_not_exists: $ => seq($.keyword_if, $.keyword_not, $.keyword_exists),
    _or_replace: $ => seq($.keyword_or, $.keyword_replace),
    _default_null: $ => seq($.keyword_default, $.keyword_null),
    _current_row: $ => seq($.keyword_current, $.keyword_row),
    _exclude_current_row: $ => seq($.keyword_exclude, $.keyword_current, $.keyword_row),
    _exclude_group: $ => seq($.keyword_exclude, $.keyword_group),
    _exclude_no_others: $ => seq($.keyword_exclude, $.keyword_no, $.keyword_others),
    _exclude_ties: $ => seq($.keyword_exclude, $.keyword_ties),
    _check_option: $ => seq($.keyword_check, $.keyword_option),
    direction: $ => choice($.keyword_desc, $.keyword_asc),

    // Types
    keyword_null: _ => make_keyword("null"),
    keyword_true: _ => make_keyword("true"),
    keyword_false: _ => make_keyword("false"),

    keyword_boolean: _ => make_keyword("boolean"),
    keyword_bit: _ => make_keyword("bit"),
    keyword_binary: _ => make_keyword("binary"),
    keyword_varbinary: _ => make_keyword("varbinary"),
    keyword_image: _ => make_keyword("image"),

    keyword_smallserial: _ => choice(make_keyword("smallserial"),make_keyword("serial2")),
    keyword_serial: _ => choice(make_keyword("serial"),make_keyword("serial4")),
    keyword_bigserial: _ => choice(make_keyword("bigserial"),make_keyword("serial8")),
    keyword_tinyint: _ => choice(make_keyword("tinyint"),make_keyword("int1")),
    keyword_smallint: _ => choice(make_keyword("smallint"),make_keyword("int2")),
    keyword_mediumint: _ => choice(make_keyword("mediumint"),make_keyword("int3")),
    keyword_int: _ => choice(make_keyword("int"), make_keyword("integer"), make_keyword("int4")),
    keyword_bigint: _ => choice(make_keyword("bigint"),make_keyword("int8")),
    keyword_decimal: _ => make_keyword("decimal"),
    keyword_numeric: _ => make_keyword("numeric"),
    keyword_real: _ => choice(make_keyword("real"),make_keyword("float4")),
    keyword_float: _ => make_keyword("float"),
    keyword_double: _ => make_keyword("double"),
    keyword_precision: _ => make_keyword("precision"),
    keyword_inet: _ => make_keyword("inet"),

    keyword_money: _ => make_keyword("money"),
    keyword_smallmoney: _ => make_keyword("smallmoney"),
    keyword_varying: _ => make_keyword("varying"),

    keyword_char: _ => choice(make_keyword("char"), make_keyword("character")),
    keyword_nchar: _ => make_keyword("nchar"),
    keyword_varchar: $ => choice(
      make_keyword("varchar"),
      seq(
        make_keyword("character"),
        $.keyword_varying,
      )
    ),
    keyword_nvarchar: _ => make_keyword("nvarchar"),
    keyword_text: _ => make_keyword("text"),
    keyword_string: _ => make_keyword("string"),
    keyword_uuid: _ => make_keyword("uuid"),

    keyword_json: _ => make_keyword("json"),
    keyword_jsonb: _ => make_keyword("jsonb"),
    keyword_xml: _ => make_keyword("xml"),

    keyword_bytea: _ => make_keyword("bytea"),

    keyword_enum: _ => make_keyword("enum"),

    keyword_date: _ => make_keyword("date"),
    keyword_datetime: _ => make_keyword("datetime"),
    keyword_datetime2: _ => make_keyword("datetime2"),
    keyword_smalldatetime: _ => make_keyword("smalldatetime"),
    keyword_datetimeoffset: _ => make_keyword("datetimeoffset"),
    keyword_time: _ => make_keyword("time"),
    keyword_timestamp: _ => make_keyword("timestamp"),
    keyword_timestamptz: _ => make_keyword('timestamptz'),
    keyword_interval: _ => make_keyword("interval"),

    keyword_geometry: _ => make_keyword("geometry"),
    keyword_geography: _ => make_keyword("geography"),
    keyword_box2d: _ => make_keyword("box2d"),
    keyword_box3d: _ => make_keyword("box3d"),

    keyword_oid: _ => make_keyword("oid"),
    keyword_oids: _ => make_keyword("oids"),
    keyword_name: _ => make_keyword("name"),
    keyword_regclass: _ => make_keyword("regclass"),
    keyword_regnamespace: _ => make_keyword("regnamespace"),
    keyword_regproc: _ => make_keyword("regproc"),
    keyword_regtype: _ => make_keyword("regtype"),

    keyword_array: _ => make_keyword("array"), // not included in _type since it's a constructor literal

    keyword_fn: _ => make_keyword("fn"),
    keyword_return: _ => make_keyword("return"),
    keyword_val: _ => make_keyword("val"),
    keyword_expr: _ => make_keyword("expr"),
    keyword_dataset: _ => make_keyword("dataset"),
    keyword_comp: _ => make_keyword("comp"),
    keyword_import: _ => make_keyword("import"),

    _open_paren: _ => "(",
    _close_paren: _ => ")",

    _type: $ => prec.left(
      seq(
        choice(
          $.keyword_boolean,
          $.bit,
          $.binary,
          $.varbinary,
          $.keyword_image,

          $.keyword_smallserial,
          $.keyword_serial,
          $.keyword_bigserial,

          $.tinyint,
          $.smallint,
          $.mediumint,
          $.int,
          $.bigint,
          $.decimal,
          $.numeric,
          $.double,
          $.float,

          $.keyword_money,
          $.keyword_smallmoney,

          $.char,
          $.varchar,
          $.nchar,
          $.nvarchar,
          $.numeric,
          $.keyword_string,
          $.keyword_text,

          $.keyword_uuid,

          $.keyword_json,
          $.keyword_jsonb,
          $.keyword_xml,

          $.keyword_bytea,
          $.keyword_inet,

          $.enum,

          $.keyword_date,
          $.keyword_datetime,
          $.keyword_datetime2,
          $.datetimeoffset,
          $.keyword_smalldatetime,
          $.time,
          $.timestamp,
          $.keyword_timestamptz,
          $.keyword_interval,

          $.keyword_geometry,
          $.keyword_geography,
          $.keyword_box2d,
          $.keyword_box3d,

          $.keyword_oid,
          $.keyword_name,
          $.keyword_regclass,
          $.keyword_regnamespace,
          $.keyword_regproc,
          $.keyword_regtype,

          field("custom_type", $.object_reference)
        ),
        optional($.array_size_definition)
      ),
    ),

    array_size_definition: $ => prec.left(
      choice(
        seq($.keyword_array, optional($._array_size_definition)),
        repeat1($._array_size_definition),
      ),
    ),

    _array_size_definition: $ => seq(
      '[',
      optional(field("size", alias($._integer, $.literal))),
      ']'
    ),

    tinyint: $ => unsigned_type($, parametric_type($, $.keyword_tinyint)),
    smallint: $ => unsigned_type($, parametric_type($, $.keyword_smallint)),
    mediumint: $ => unsigned_type($, parametric_type($, $.keyword_mediumint)),
    int: $ => unsigned_type($, parametric_type($, $.keyword_int)),
    bigint: $ => unsigned_type($, parametric_type($, $.keyword_bigint)),

    bit: $ => choice(
        $.keyword_bit,
        seq(
            $.keyword_bit,
            prec(0, parametric_type($, $.keyword_varying, ['precision'])),
        ),
        prec(1, parametric_type($, $.keyword_bit, ['precision'])),
    ),

    binary: $ => parametric_type($, $.keyword_binary, ['precision']),
    varbinary: $ => parametric_type($, $.keyword_varbinary, ['precision']),

    // TODO: should qualify against /\\b(0?[1-9]|[1-4][0-9]|5[0-4])\\b/g
    float: $  => choice(
      parametric_type($, $.keyword_float, ['precision']),
      unsigned_type($, parametric_type($, $.keyword_float, ['precision', 'scale'])),
    ),

    double: $ => choice(
      make_keyword("float8"),
      unsigned_type($, parametric_type($, $.keyword_double, ['precision', 'scale'])),
      unsigned_type($, parametric_type($, seq($.keyword_double, $.keyword_precision), ['precision', 'scale'])),
      unsigned_type($, parametric_type($, $.keyword_real, ['precision', 'scale'])),
    ),

    decimal: $ => choice(
      parametric_type($, $.keyword_decimal, ['precision']),
      parametric_type($, $.keyword_decimal, ['precision', 'scale']),
    ),
    numeric: $ => choice(
      parametric_type($, $.keyword_numeric, ['precision']),
      parametric_type($, $.keyword_numeric, ['precision', 'scale']),
    ),
    char: $ => parametric_type($, $.keyword_char),
    varchar: $ => parametric_type($, $.keyword_varchar),
    nchar: $ => parametric_type($, $.keyword_nchar),
    nvarchar: $ => parametric_type($, $.keyword_nvarchar),

    _include_time_zone: $ => seq(
      choice($.keyword_with, $.keyword_without),
      $.keyword_time,
      $.keyword_zone,
    ),
    datetimeoffset: $ => parametric_type($, $.keyword_datetimeoffset),
    time: $ => seq(
      parametric_type($, $.keyword_time),
      optional($._include_time_zone),
    ),
    timestamp: $ => seq(
      parametric_type($, $.keyword_timestamp),
      optional($._include_time_zone),
    ),
    timestamptz: $ => parametric_type($, $.keyword_timestamptz),

    enum: $ => seq(
      $.keyword_enum,
      paren_list(field("value", alias($._literal_string, $.literal)), true)
    ),

    array: $ => seq(
      $.keyword_array,
      field('contents', $._array_contents)
    ),
    
    _array_contents: $ => choice(
      $.array_elements,
      $.array_query
    ),
    
    array_elements: $ => seq(
      "[",
      field('elements', comma_list($.sql_expression)),
      "]"
    ),
    
    array_query: $ => seq(
      "(",
      field('query', $.sql_query),
      ")",
    ),

    comment: _ => /--.*/,
    slash_comment: _ => /\/\/.*/,
    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment
    marginalia: _ => /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//,

    _cte: $ => seq(
        $.keyword_with,
        field("recursive", optional($.keyword_recursive)),
        field("ctes", comma_list($.cte, true)),
    ),

    _select_or_set_operation: $ => choice(
      $.select_statement,
      $.set_operation,
    ),

    sql_query: $ => seq(
      optional(optional_parenthesis($._cte)),
      field("query", optional_parenthesis(
          $._select_or_set_operation,
        )
      ),
    ),

    cte: $ => seq(
      $.identifier,
      optional(paren_list(field("argument", $.identifier))),
      $.keyword_as,
      optional(
        seq(
          optional($.keyword_not),
          $.keyword_materialized,
        ),
      ),
      wrapped_in_parenthesis($.sql_query),
    ),

    set_operation: $ => seq(
      field('left', $.select_statement),
      repeat1(
        seq(
          field(
            "operation",
            choice(
              seq($.keyword_union, optional($.keyword_all)),
              $.keyword_except,
              $.keyword_intersect,
            ),
          ),
          field('right', $.select_statement),
        ),
      ),
    ),

    select_statement: $ => optional_parenthesis(
      seq(
        $.select,
        optional($.from),
      ),
    ),

    _argmode: $ => choice(
      $.keyword_in,
      $.keyword_out,
      $.keyword_inout,
      $.keyword_variadic,
      seq($.keyword_in, $.keyword_out),
    ),

    select: $ => seq(
      $.keyword_select,
      seq(
        optional($.keyword_distinct),
        field('expressions', $.select_expression),
      ),
    ),

    select_expression: $ => seq(
      $.term,
      repeat(
        seq(
          ',',
          $.term,
        ),
      ),
    ),

    term: $ => seq(
      field(
        'value',
        choice(
          $.all_fields,
          $.sql_expression,
        ),
      ),
      optional(field('alias', $._alias)),
    ),

    object_reference: $ => seq(
      optional(
        seq(
          field('schema', $.table_identifier),
          '.',
        ),
      ),
      field('name', $.table_identifier),
    ),

    _column_list: $ => paren_list(alias($._column, $.column), true),
    _column: $ => choice(
      $.identifier,
      alias($._literal_string, $.literal),
    ),

    all_fields: $ => seq(
      optional(
        seq(
          $.object_reference,
          '.',
        ),
      ),
      '*',
    ),

    parameter: $ => /\?|(\$[0-9]+)|(@[a-z][a-zA-Z0-9_]*)/,

    case: $ => seq(
      $.keyword_case,
      choice(
        // simplified CASE x WHEN
        seq(
          field('value', $.sql_expression),
          $.keyword_when,
          field('when_condition', $.sql_expression),
          $.keyword_then,
          field('then_result', $.sql_expression),
          repeat(
            seq(
              $.keyword_when,
              field('when_condition', $.sql_expression),
              $.keyword_then,
              field('then_result', $.sql_expression),
            )
          ),
        ),
        // standard CASE WHEN x, where x must be a predicate
        seq(
          $.keyword_when,
          field('when_condition', $.sql_expression),
          $.keyword_then,
          field('then_result', $.sql_expression),
          repeat(
            seq(
              $.keyword_when,
              field('when_condition', $.sql_expression),
              $.keyword_then,
              field('then_result', $.sql_expression),
            )
          ),
        ),
      ),
      optional(
        seq(
          $.keyword_else,
          field('else_result', $.sql_expression),
        )
      ),
      $.keyword_end,
    ),

    field: $ => field('name', $.identifier),

    _qualified_field: $ => seq(
      optional(
        seq(
          optional_parenthesis($.object_reference),
          '.',
        ),
      ),
      field('name', $.identifier),
    ),

    implicit_cast: $ => seq(
      field('expression', $.sql_expression),
      '::',
      field('type', $._type),
    ),

    // Postgres syntax for intervals
    interval: $ => seq(
        $.keyword_interval,
        field('value', $._literal_string),
    ),

    cast: $ => seq(
      field('name', $.keyword_cast),
      wrapped_in_parenthesis(
        seq(
          field('parameter', $.sql_expression),
          $.keyword_as,
          field('type', $._type),
        ),
      ),
    ),

    filter_expression : $ => seq(
      $.keyword_filter,
      wrapped_in_parenthesis(field('condition', $.where)),
    ),

    invocation: $ => prec(1,
      seq(
        field('function', $.object_reference),
        choice(
          // default invocation
          paren_list(
            seq(
              optional($.keyword_distinct),
              field(
                'parameter',
                $.term,
              ),
              optional(field('order', $.order_by))
            )
          ),
          // _aggregate_function, e.g. group_concat
          wrapped_in_parenthesis(
            seq(
              optional($.keyword_distinct),
              field('parameter', $.term),
              optional(field('order', $.order_by)),
              optional(seq(
                choice($.keyword_separator, ','),
                field('separator', alias($._literal_string, $.literal))
              )),
              optional(field('limit', $.limit)),
            ),
          ),
        ),
        optional(
          field('filter', $.filter_expression)
        )
      ),
    ),

    exists: $ => seq(
      $.keyword_exists,
      field('subquery', $.subquery),
    ),

    partition_by: $ => seq(
        $.keyword_partition,
        $.keyword_by,
        field('expressions', comma_list($.sql_expression, true)),
    ),

    frame_definition: $ => seq(
        choice(
          seq(
            $.keyword_unbounded,
            $.keyword_preceding,
          ),
          seq(
              field("start",
                choice(
                  $.identifier,
                  $.binary_expression,
                  alias($._literal_string, $.literal),
                  alias($._integer, $.literal)
                )
              ),
              $.keyword_preceding,
          ),
          $._current_row,
          seq(
              field("end",
                choice(
                  $.identifier,
                  $.binary_expression,
                  alias($._literal_string, $.literal),
                  alias($._integer, $.literal)
                )
              ),
              $.keyword_following,
          ),
          seq(
            $.keyword_unbounded,
            $.keyword_following,
          ),
        ),
    ),

    window_frame: $ => seq(
        choice(
            $.keyword_range,
            $.keyword_rows,
            $.keyword_groups,
        ),

        choice(
            seq(
                $.keyword_between,
                $.frame_definition,
                optional(
                  seq(
                    $.keyword_and,
                    $.frame_definition,
                  )
                )
            ),
            seq(
                $.frame_definition,
            )
        ),
        optional(
            choice(
                $._exclude_current_row,
                $._exclude_group,
                $._exclude_ties,
                $._exclude_no_others,
            ),
        ),
    ),

    window_clause: $ => seq(
        $.keyword_window,
        $.identifier,
        $.keyword_as,
        $.window_specification,
    ),

    window_specification: $ => wrapped_in_parenthesis(
      seq(
        optional($.partition_by),
        optional($.order_by),
        optional($.window_frame),
      ),
    ),

    window_function: $ => seq(
        field('function', $.invocation),
        $.keyword_over,
        field('window', choice(
            $.identifier,
            $.window_specification,
        )),
    ),

    _alias: $ => seq(
      optional($.keyword_as),
      field('alias', $.identifier),
    ),

    from: $ => seq(
      $.keyword_from,
      optional(
        field('only', $.keyword_only),
      ),
      field('relations', comma_list($.relation, true)),
      field('joins', repeat(
        choice(
          $.join,
          $.cross_join,
          $.lateral_join,
          $.lateral_cross_join,
        ),
      )),
      optional(field('where', $.where)),
      optional(field('group_by', $.group_by)),
      optional(field('window', $.window_clause)),
      optional(field('order_by', $.order_by)),
      optional(field('limit', $.limit)),
    ),

    relation: $ => prec.right(
      seq(
        field('source',
          choice(
            $.subquery,
            $.invocation,
            $.table_ref_with_var,
            $.object_reference,
            wrapped_in_parenthesis($.values),
          )
        ),
        optional(
          seq(
            field('alias', $._alias),
            optional(field('columns', alias($._column_list, $.list))),
          ),
        ),
      ),
    ),
    
    table_ref_with_var: $ => seq(
      '@', 
      field("ref", $.object_reference)
    ),

    values: $ => seq(
      $.keyword_values,
      field('lists', comma_list($.list, true)),
    ),

    join: $ => seq(
      optional(field('natural', $.keyword_natural)),
      optional(
        field('join_type',
          choice(
            $.keyword_left,
            seq($.keyword_full, $.keyword_outer),
            seq($.keyword_left, $.keyword_outer),
            $.keyword_right,
            seq($.keyword_right, $.keyword_outer),
            $.keyword_inner,
            $.keyword_full,
          )
        )
      ),
      $.keyword_join,
      field('relation', $.relation),
      optional(field('next_join', $.join)),
      field('condition',
        choice(
          seq(
            $.keyword_on,
            field("predicate", $.sql_expression),
          ),
          seq(
            $.keyword_using,
            field('columns', alias($._column_list, $.list)),
          )
        )
      )
    ),

    cross_join: $ => seq(
      $.keyword_cross,
      $.keyword_join,
      field('relation', $.relation),
    ),

    lateral_join: $ => seq(
      optional(
        field('join_type',
          choice(
            // lateral joins cannot be right!
            $.keyword_left,
            seq($.keyword_left, $.keyword_outer),
            $.keyword_inner,
          )
        )
      ),
      $.keyword_join,
      $.keyword_lateral,
      field('source',
        choice(
          $.invocation,
          $.subquery,
        )
      ),
      optional(
        field('alias',
          choice(
            seq(
              $.keyword_as,
              field('name', $.identifier),
            ),
            field('name', $.identifier),
          )
        )
      ),
      $.keyword_on,
      field('condition',
        choice(
          $.sql_expression,
          $.keyword_true,
          $.keyword_false,
        )
      ),
    ),

    lateral_cross_join: $ => seq(
      $.keyword_cross,
      $.keyword_join,
      $.keyword_lateral,
      field('source',
        choice(
          $.invocation,
          $.subquery,
        )
      ),
      optional(
        field('alias',
          choice(
            seq(
              $.keyword_as,
              field('name', $.identifier),
            ),
            field('name', $.identifier),
          )
        )
      ),
    ),

    where: $ => seq(
      $.keyword_where,
      field("predicate", $.sql_expression),
    ),

    group_by: $ => seq(
      $.keyword_group,
      $.keyword_by,
      field('expressions', comma_list($.sql_expression, true)),
      optional(field('having', $._having)),
    ),

    _having: $ => seq(
      $.keyword_having,
      field('condition', $.sql_expression),
    ),

    order_by: $ => prec.right(seq(
      $.keyword_order,
      $.keyword_by,
      field('targets', comma_list($.order_target, true)),
    )),

    order_target: $ => seq(
      field('expression', $.sql_expression),
      optional(
        seq(
          field('direction',
            choice(
              $.direction,
              seq(
                $.keyword_using,
                field('operator', choice('<', '>', '<=', '>=')),
              ),
            )
          ),
          optional(
            seq(
              $.keyword_nulls,
              field('nulls_position',
                choice(
                  $.keyword_first,
                  $.keyword_last,
                )
              ),
            ),
          ),
        ),
      ),
    ),

    limit: $ => seq(
      $.keyword_limit,
      field('count', $.literal),
      optional(field('offset', $.offset)),
    ),

    offset: $ => seq(
      $.keyword_offset,
      field('count', $.literal),
    ),

    returning: $ => seq(
      $.keyword_returning,
      $.select_expression,
    ),

    sql_expression: $ => prec(1,
      choice(
        field('literal', $.literal),
        field('field', alias(
          $._qualified_field,
          $.field,
        )),
        field('parameter', $.parameter),
        field('list', $.list),
        field('case', $.case),
        field('window_function', $.window_function),
        field('subquery', $.subquery),
        field('cast', $.cast),
        field('cast', alias($.implicit_cast, $.cast)),
        field('exists', $.exists),
        field('invocation', $.invocation),
        field('binary', $.binary_expression),
        field('subscript', $.subscript),
        field('unary', $.unary_expression),
        field('array', $.array),
        field('interval', $.interval),
        field('between', $.between_expression),
        field('group', $.grouped_expression),
      )
    ),

    subscript: $ => prec.left('binary_is',
      seq(
        field('expression', $.sql_expression),
        "[",
        choice(
          field('subscript', $.sql_expression),
          seq(
            field('lower', $.sql_expression),
            ':',
            field('upper', $.sql_expression),
          ),
        ),
        "]",
      ),
    ),

    op_other: $ => token(
      choice(
        '+',
        '-',
        '*',
        '/',
        '%',
        '^',
        '=',
        '<',
        '<=',
        '!=',
        '>=',
        '>',
        '<>',
        '->',
        '->>',
        '#>',
        '#>>',
        '~',
        '!~',
        '~*',
        '!~*',
        '|',
        '&',
        '#',
        '<<',
        '>>',
        '<<=',
        '>>=',
        '##',
        '<->',
        '@>',
        '<@',
        '&<',
        '&>',
        '|>>',
        '<<|',
        '&<|',
        '|&>',
        '<^',
        '^>',
        '?#',
        '?-',
        '?|',
        '?-|',
        '?||',
        '@@',
        '@@@',
        '@?',
        '#-',
        '?&',
        '?',
        '-|-',
        '||',
        '^@',
      ),
    ),

    binary_expression: $ => choice(
      ...[
        [$.op_other, 'binary_op'],
        [$.keyword_is, 'binary_is'],
        [$.is_not, 'binary_is'],
        [$.keyword_like, 'pattern_matching'],
        [$.not_like, 'pattern_matching'],
        [$.similar_to, 'pattern_matching'],
        [$.not_similar_to, 'pattern_matching'],
        // binary_is precedence disambiguates `(is not distinct from)` from an
        // `is (not distinct from)` with a unary `not`
        [$.distinct_from, 'binary_is'],
        [$.not_distinct_from, 'binary_is'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.sql_expression),
          field('operator', operator),
          field('right', $.sql_expression)
        ))
      ),
      ...[
        [$.keyword_and, 'clause_connective'],
        [$.keyword_or, 'clause_disjunctive'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.sql_expression),
          field('operator', operator),
          field('right', $.sql_expression)
        ))
      ),
      ...[
        [$.keyword_in, 'binary_in'],
        [$.not_in, 'binary_in'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.sql_expression),
          field('operator', operator),
          field('right', choice($.list, $.subquery))
        ))
      ),
    ),

    op_unary_other: $ => token(
      choice(
        '|/',
        '||/',
        '@',
        '~',
        '@-@',
        '@@',
        '#',
        '?-',
        '?|',
        '!!',
      ),
    ),

    unary_expression: $ => choice(
      ...[
        [$.keyword_not, 'unary_not'],
        [$.bang, 'unary_not'],
        [$.keyword_any, 'unary_not'],
        [$.keyword_some, 'unary_not'],
        [$.keyword_all, 'unary_not'],
        [$.op_unary_other, 'unary_other'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('operator', operator),
          field('operand', $.sql_expression)
        ))
      ),
    ),

    grouped_expression: $ => prec(3, seq(
      "(",
      field('expression', $.sql_expression),
      ")",
    )),

    between_expression: $ => choice(
      ...[
            [$.keyword_between, 'between'],
            [seq($.keyword_not, $.keyword_between), 'between'],
        ].map(([operator, precedence]) =>
                prec.left(precedence, seq(
                field('left', $.sql_expression),
                field('operator', operator),
                field('low', $.sql_expression),
                $.keyword_and,
                field('high', $.sql_expression)
            ))
        ),
    ),

    not_in: $ => seq(
      $.keyword_not,
      $.keyword_in,
    ),

    subquery: $ => wrapped_in_parenthesis(
      field('query', $.sql_query)
    ),

    list: $ => paren_list(field('expression', $.sql_expression)),

    literal: $ => prec(5,
      choice(
        $._integer,
        $._decimal_number,
        $._literal_string,
        $._bit_string,
        $._string_casting,
        $.keyword_true,
        $.keyword_false,
        $.keyword_null,
      ),
    ),
    _double_quote_string: _ => /"[^"]*"/,
    // The norm specify that between two consecutive string must be a return,
    // but this is good enough.
    single_quote_string: _ => seq(/([uU]&)?'([^']|'')*'/, repeat(/'([^']|'')*'/)),
    _literal_string: $ => prec(
      1,
      choice(
        $.single_quote_string,
        $._double_quote_string,
      ),
    ),
    _natural_number: _ => /\d+/,
    _integer: $ => seq(
      optional(choice("-", "+")),
      /(0[xX][0-9A-Fa-f]+(_[0-9A-Fa-f]+)*)|(0[oO][0-7]+(_[0-7]+)*)|(0[bB][01]+(_[01]+)*)|(\d+(_\d+)*(e[+-]?\d+(_\d+)*)?)/
    ),
    _decimal_number: $ => seq(
      optional(
        choice("-", "+")),
      /((\d+(_\d+)*)?[.]\d+(_\d+)*(e[+-]?\d+(_\d+)*)?)|(\d+(_\d+)*[.](e[+-]?\d+(_\d+)*)?)/
    ),
    _bit_string: $ => seq(/[bBxX]'([^']|'')*'/, repeat(/'([^']|'')*'/)),
    // The identifier should be followed by a string (no parenthesis allowed)
    _string_casting: $ => seq($.identifier, $.single_quote_string),

    bang: _ => '!',

    identifier: $ => choice(
      $._identifier,
      $._double_quote_string,
      /`([a-zA-Z_][0-9a-zA-Z_]*)`/,
    ),
    _identifier: _ => /[a-zA-Z_][0-9a-zA-Z_]*/,

    _order_target_direction: $ => choice(
      $.direction,
      seq($.keyword_using, field('operator', choice('<', '>', '<=', '>=')))
    ),

    _order_target_nulls_position: $ => choice(
      $.keyword_first,
      $.keyword_last
    ),

    _frame_definition_bound: $ => choice(
      $.binary_expression,
      $.identifier,
      $.literal
    ),

    // Missing definitions
    _join_condition: $ => choice(
      seq(
        $.keyword_on,
        field("predicate", $.sql_expression),
      ),
      seq(
        $.keyword_using,
        field('columns', alias($._column_list, $.list)),
      )
    ),

    _join_type: $ => choice(
      $.keyword_left,
      seq($.keyword_full, $.keyword_outer),
      seq($.keyword_left, $.keyword_outer),
      $.keyword_right,
      seq($.keyword_right, $.keyword_outer),
      $.keyword_inner,
      $.keyword_full,
    ),

    _lateral_join_condition: $ => choice(
      $.sql_expression,
      $.keyword_true,
      $.keyword_false,
    ),

    _lateral_join_source: $ => choice(
      $.invocation,
      $.subquery,
    )
  }

});

function unsigned_type($, type) {
  return choice(
    seq($.keyword_unsigned, type),
    seq(
      type,
      optional($.keyword_unsigned),
      optional($.keyword_zerofill),
    ),
  )
}

function optional_parenthesis(node) {
  return prec.right(
    choice(
      node,
      wrapped_in_parenthesis(node),
    ),
  )
}

function wrapped_in_parenthesis(node) {
  if (node) {
    return seq("(", node, ")");
  }
  return seq("(", ")");
}

function parametric_type($, type, params = ['size']) {
  return prec.right(1,
    choice(
      type,
      seq(
        type,
        wrapped_in_parenthesis(
          seq(
            // first parameter is guaranteed, shift it out of the array
            field(params.shift(), alias($._natural_number, $.literal)),
            // then, fill in the ", next" until done
            ...params.map(p => seq(',', field(p, alias($._natural_number, $.literal)))),
          ),
        ),
      ),
    ),
  )
}

function comma_list(field, requireFirst) {
  sequence = seq(field, repeat(seq(',', field)));

  if (requireFirst) {
    return sequence;
  }

  return optional(sequence);
}

function paren_list(field, requireFirst) {
  return wrapped_in_parenthesis(
    comma_list(field, requireFirst),
  )
}

function make_keyword(word) {
  str = "";
  for (var i = 0; i < word.length; i++) {
    str = str + "[" + word.charAt(i).toLowerCase() + word.charAt(i).toUpperCase() + "]";
  }
  return new RegExp(str);
}
