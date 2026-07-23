// Phase 2 fills the closed physical Arrow type sublanguage. Keeping the module
// present in the skeleton fixes ownership without duplicating SQL cast types.
const PRIMITIVES = [
  "boolean",
  "int8", "int16", "int32", "int64",
  "uint8", "uint16", "uint32", "uint64",
  "float16", "float32", "float64",
  "utf8", "large_utf8", "binary", "large_binary",
  "date32", "date64",
];

const TIME_UNITS = ["second", "millisecond", "microsecond", "nanosecond"];
const INTERVAL_UNITS = ["year_month", "day_time", "month_day_nano"];

export default {
  arrow_type: $ => choice(
    $.primitive_arrow_type,
    $.parameterized_arrow_type,
  ),

  primitive_arrow_type: _ => choice(...PRIMITIVES),

  parameterized_arrow_type: $ => choice(
    seq(
      field("constructor", alias("time32", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._time32_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("time64", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._time64_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("timestamp", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._timestamp_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("duration", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._duration_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("interval", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._interval_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("fixed_size_binary", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._length_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias(choice("decimal128", "decimal256"), $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._decimal_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias(choice("list", "large_list"), $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._list_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("fixed_size_list", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._fixed_size_list_arguments, $.arrow_type_arguments)),
      ")",
    ),
    seq(
      field("constructor", alias("struct", $.arrow_type_constructor)),
      "(",
      optional(field("arguments", alias($._struct_arguments, $.arrow_type_arguments))),
      ")",
    ),
    seq(
      field("constructor", alias("map", $.arrow_type_constructor)),
      "(",
      field("arguments", alias($._map_arguments, $.arrow_type_arguments)),
      ")",
    ),
  ),

  _time32_arguments: $ => choice("second", "millisecond"),
  _time64_arguments: $ => choice("microsecond", "nanosecond"),
  _timestamp_arguments: $ => seq(
    $.arrow_time_unit,
    optional(seq(",", $.single_quoted_string)),
  ),
  _duration_arguments: $ => $.arrow_time_unit,
  _interval_arguments: $ => $.arrow_interval_unit,
  _length_arguments: $ => $.arrow_unsigned_integer,
  _decimal_arguments: $ => seq(
    $.arrow_unsigned_integer,
    ",",
    $.arrow_signed_integer,
  ),
  _list_arguments: $ => $.arrow_type,
  _fixed_size_list_arguments: $ => seq(
    $.arrow_type,
    ",",
    $.arrow_unsigned_integer,
  ),
  _struct_arguments: $ => seq(
    $.arrow_struct_field,
    repeat(seq(",", $.arrow_struct_field)),
    optional(","),
  ),
  _map_arguments: $ => seq($.arrow_type, ",", $.arrow_type),

  arrow_struct_field: $ => seq(
    "field",
    "(",
    field("type", $.arrow_type),
    ",",
    field("name", $.single_quoted_string),
    ")",
  ),

  arrow_time_unit: _ => choice(...TIME_UNITS),
  arrow_interval_unit: _ => choice(...INTERVAL_UNITS),
  arrow_unsigned_integer: $ => $.number,
  arrow_signed_integer: $ => seq(optional(choice("+", "-")), $.number),
};
