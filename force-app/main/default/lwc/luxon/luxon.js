class LuxonError extends Error {}
class InvalidDateTimeError extends LuxonError {
    constructor(e) {
        super(`Invalid DateTime: ${e.toMessage()}`);
    }
}
class InvalidIntervalError extends LuxonError {
    constructor(e) {
        super(`Invalid Interval: ${e.toMessage()}`);
    }
}
class InvalidDurationError extends LuxonError {
    constructor(e) {
        super(`Invalid Duration: ${e.toMessage()}`);
    }
}
class ConflictingSpecificationError extends LuxonError {}
class InvalidUnitError extends LuxonError {
    constructor(e) {
        super(`Invalid unit ${e}`);
    }
}
class InvalidArgumentError extends LuxonError {}
class ZoneIsAbstractError extends LuxonError {
    constructor() {
        super('Zone is an abstract class');
    }
}
function isUndefined(e) {
    return 'undefined' == typeof e;
}
function isNumber(e) {
    return 'number' == typeof e;
}
function isString(e) {
    return 'string' == typeof e;
}
function isDate(e) {
    return '[object Date]' === Object.prototype.toString.call(e);
}
function hasIntl() {
    return 'undefined' != typeof Intl && Intl.DateTimeFormat;
}
function hasFormatToParts() {
    return !isUndefined(Intl.DateTimeFormat.prototype.formatToParts);
}
function hasRelative() {
    return 'undefined' != typeof Intl && !!Intl.RelativeTimeFormat;
}
function maybeArray(e) {
    return Array.isArray(e) ? e : [e];
}
function bestBy(e, n, i) {
    return 0 === e.length
        ? void 0
        : e.reduce((e, a) => {
              const o = [n(a), a];
              return e ? (i(e[0], o[0]) === e[0] ? e : o) : o;
          }, null)[1];
}
function pick(e, n) {
    return n.reduce((n, i) => ((n[i] = e[i]), n), {});
}
function numberBetween(e, n, i) {
    return isNumber(e) && e >= n && e <= i;
}
function floorMod(e, i) {
    return e - i * Math.floor(e / i);
}
function padStart(e, i = 2) {
    return e.toString().length < i ? ('0'.repeat(i) + e).slice(-i) : e.toString();
}
function parseInteger(e) {
    return isUndefined(e) || null === e || '' === e ? void 0 : parseInt(e, 10);
}
function parseMillis(e) {
    if (isUndefined(e) || null === e || '' === e) return;
    else {
        const n = 1e3 * parseFloat('0.' + e);
        return Math.floor(n);
    }
}
function roundTo(e, n, i = !1) {
    const a = 10 ** n,
        o = i ? Math.trunc : Math.round;
    return o(e * a) / a;
}
function isLeapYear(e) {
    return 0 == e % 4 && (0 != e % 100 || 0 == e % 400);
}
function daysInYear(e) {
    return isLeapYear(e) ? 366 : 365;
}
function daysInMonth(e, n) {
    const i = floorMod(n - 1, 12) + 1;
    return 2 === i
        ? isLeapYear(e + (n - i) / 12)
            ? 29
            : 28
        : [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i - 1];
}
function objToLocalTS(e) {
    let n = Date.UTC(e.year, e.month - 1, e.day, e.hour, e.minute, e.second, e.millisecond);
    return 100 > e.year && 0 <= e.year && ((n = new Date(n)), n.setUTCFullYear(n.getUTCFullYear() - 1900)), +n;
}
function weeksInWeekYear(e) {
    const n = (e + Math.floor(e / 4) - Math.floor(e / 100) + Math.floor(e / 400)) % 7,
        i = e - 1,
        a = (i + Math.floor(i / 4) - Math.floor(i / 100) + Math.floor(i / 400)) % 7;
    return 4 == n || 3 == a ? 53 : 52;
}
function untruncateYear(e) {
    return 99 < e ? e : 60 < e ? 1900 + e : 2e3 + e;
}
function parseZoneInfo(e, n, i, a = null) {
    const o = new Date(e),
        s = { hour12: !1, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    a && (s.timeZone = a);
    const t = Object.assign({ timeZoneName: n }, s),
        d = hasIntl();
    if (d && hasFormatToParts()) {
        const e = new Intl.DateTimeFormat(i, t).formatToParts(o).find(e => 'timezonename' === e.type.toLowerCase());
        return e ? e.value : null;
    }
    if (d) {
        const e = new Intl.DateTimeFormat(i, s).format(o),
            n = new Intl.DateTimeFormat(i, t).format(o),
            a = n.substring(e.length),
            d = a.replace(/^[, \u200e]+/, '');
        return d;
    }
    return null;
}
function signedOffset(e, n) {
    const i = parseInt(e, 10) || 0,
        a = parseInt(n, 10) || 0,
        o = 0 > i ? -a : a;
    return 60 * i + o;
}
function asNumber(e) {
    const n = +e;
    if ('boolean' == typeof e || '' === e || Number.isNaN(n)) throw new InvalidArgumentError(`Invalid unit value ${e}`);
    return n;
}
function normalizeObject(e, n, i) {
    const a = {};
    for (const o in e)
        if (e.hasOwnProperty(o)) {
            if (0 <= i.indexOf(o)) continue;
            const s = e[o];
            if (s === void 0 || null === s) continue;
            a[n(o)] = asNumber(s);
        }
    return a;
}
function formatOffset(e, n) {
    const i = Math.trunc(e / 60),
        a = Math.abs(e % 60),
        o = 0 <= i ? '+' : '-',
        s = `${o}${Math.abs(i)}`;
    switch (n) {
        case 'short':
            return `${o}${padStart(Math.abs(i), 2)}:${padStart(a, 2)}`;
        case 'narrow':
            return 0 < a ? `${s}:${a}` : s;
        case 'techie':
            return `${o}${padStart(Math.abs(i), 2)}${padStart(a, 2)}`;
        default:
            throw new RangeError(`Value format ${n} is out of range for property format`);
    }
}
function timeObject(e) {
    return pick(e, ['hour', 'minute', 'second', 'millisecond']);
}
const ianaRegex = /[A-Za-z_+-]{1,256}(:?\/[A-Za-z_+-]{1,256}(\/[A-Za-z_+-]{1,256})?)?/,
    n = 'numeric',
    s = 'short',
    l = 'long',
    d2 = '2-digit',
    DATE_SHORT = { year: n, month: n, day: n },
    DATE_MED = { year: n, month: s, day: n },
    DATE_FULL = { year: n, month: l, day: n },
    DATE_HUGE = { year: n, month: l, day: n, weekday: l },
    TIME_SIMPLE = { hour: n, minute: d2 },
    TIME_WITH_SECONDS = { hour: n, minute: d2, second: d2 },
    TIME_WITH_SHORT_OFFSET = { hour: n, minute: d2, second: d2, timeZoneName: s },
    TIME_WITH_LONG_OFFSET = { hour: n, minute: d2, second: d2, timeZoneName: l },
    TIME_24_SIMPLE = { hour: n, minute: d2, hour12: !1 },
    TIME_24_WITH_SECONDS = { hour: n, minute: d2, second: d2, hour12: !1 },
    TIME_24_WITH_SHORT_OFFSET = { hour: n, minute: d2, second: d2, hour12: !1, timeZoneName: s },
    TIME_24_WITH_LONG_OFFSET = { hour: n, minute: d2, second: d2, hour12: !1, timeZoneName: l },
    DATETIME_SHORT = { year: n, month: n, day: n, hour: n, minute: d2 },
    DATETIME_SHORT_WITH_SECONDS = { year: n, month: n, day: n, hour: n, minute: d2, second: d2 },
    DATETIME_MED = { year: n, month: s, day: n, hour: n, minute: d2 },
    DATETIME_MED_WITH_SECONDS = { year: n, month: s, day: n, hour: n, minute: d2, second: d2 },
    DATETIME_FULL = { year: n, month: l, day: n, hour: n, minute: d2, timeZoneName: s },
    DATETIME_FULL_WITH_SECONDS = { year: n, month: l, day: n, hour: n, minute: d2, second: d2, timeZoneName: s },
    DATETIME_HUGE = { year: n, month: l, day: n, weekday: l, hour: n, minute: d2, timeZoneName: l },
    DATETIME_HUGE_WITH_SECONDS = {
        year: n,
        month: l,
        day: n,
        weekday: l,
        hour: n,
        minute: d2,
        second: d2,
        timeZoneName: l
    };
function stringify(e) {
    return JSON.stringify(e, Object.keys(e).sort());
}
const monthsLong = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsNarrow = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
function months(e) {
    return 'narrow' === e
        ? monthsNarrow
        : 'short' === e
        ? monthsShort
        : 'long' === e
        ? monthsLong
        : 'numeric' === e
        ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        : '2-digit' === e
        ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        : null;
}
const weekdaysLong = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    weekdaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekdaysNarrow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
function weekdays(e) {
    return 'narrow' === e
        ? weekdaysNarrow
        : 'short' === e
        ? weekdaysShort
        : 'long' === e
        ? weekdaysLong
        : 'numeric' === e
        ? ['1', '2', '3', '4', '5', '6', '7']
        : null;
}
const meridiems = ['AM', 'PM'],
    erasLong = ['Before Christ', 'Anno Domini'],
    erasShort = ['BC', 'AD'],
    erasNarrow = ['B', 'A'];
function eras(e) {
    return 'narrow' === e ? erasNarrow : 'short' === e ? erasShort : 'long' === e ? erasLong : null;
}
function meridiemForDateTime(e) {
    return meridiems[12 > e.hour ? 0 : 1];
}
function weekdayForDateTime(e, n) {
    return weekdays(n)[e.weekday - 1];
}
function monthForDateTime(e, n) {
    return months(n)[e.month - 1];
}
function eraForDateTime(e, n) {
    return eras(n)[0 > e.year ? 0 : 1];
}
function formatRelativeTime(e, n, i = 'always', a = !1) {
    const o = {
            years: ['year', 'yr.'],
            quarters: ['quarer', 'qtr.'],
            months: ['month', 'mo.'],
            weeks: ['week', 'wk.'],
            days: ['day', 'day'],
            hours: ['hour', 'hr.'],
            minutes: ['minute', 'min.'],
            seconds: ['second', 'sec.']
        },
        s = -1 === ['hours', 'minutes', 'seconds'].indexOf(e);
    if ('auto' === i && s) {
        const i = 'days' === e;
        switch (n) {
            case 1:
                return i ? 'tomorrow' : `next ${o[e][0]}`;
            case -1:
                return i ? 'yesterday' : `last ${o[e][0]}`;
            case 0:
                return i ? 'today' : `this ${o[e][0]}`;
            default:
        }
    }
    const t = Object.is(n, -0) || 0 > n,
        d = Math.abs(n),
        r = a ? o[e][1] : 1 === d ? o[e][0] : e;
    return t ? `${d} ${r} ago` : `in ${d} ${r}`;
}
function formatString(e) {
    const n = pick(e, ['weekday', 'era', 'year', 'month', 'day', 'hour', 'minute', 'second', 'timeZoneName', 'hour12']),
        i = stringify(n);
    return i === stringify(DATE_SHORT)
        ? 'M/d/yyyy'
        : i === stringify(DATE_MED)
        ? 'LLL d, yyyy'
        : i === stringify(DATE_FULL)
        ? 'LLLL d, yyyy'
        : i === stringify(DATE_HUGE)
        ? 'EEEE, LLLL d, yyyy'
        : i === stringify(TIME_SIMPLE)
        ? 'h:mm a'
        : i === stringify(TIME_WITH_SECONDS)
        ? 'h:mm:ss a'
        : i === stringify(TIME_WITH_SHORT_OFFSET)
        ? 'h:mm a'
        : i === stringify(TIME_WITH_LONG_OFFSET)
        ? 'h:mm a'
        : i === stringify(TIME_24_SIMPLE)
        ? 'HH:mm'
        : i === stringify(TIME_24_WITH_SECONDS)
        ? 'HH:mm:ss'
        : i === stringify(TIME_24_WITH_SHORT_OFFSET)
        ? 'HH:mm'
        : i === stringify(TIME_24_WITH_LONG_OFFSET)
        ? 'HH:mm'
        : i === stringify(DATETIME_SHORT)
        ? 'M/d/yyyy, h:mm a'
        : i === stringify(DATETIME_MED)
        ? 'LLL d, yyyy, h:mm a'
        : i === stringify(DATETIME_FULL)
        ? 'LLLL d, yyyy, h:mm a'
        : i === stringify(DATETIME_HUGE)
        ? 'EEEE, LLLL d, yyyy, h:mm a'
        : i === stringify(DATETIME_SHORT_WITH_SECONDS)
        ? 'M/d/yyyy, h:mm:ss a'
        : i === stringify(DATETIME_MED_WITH_SECONDS)
        ? 'LLL d, yyyy, h:mm:ss a'
        : i === stringify(DATETIME_FULL_WITH_SECONDS)
        ? 'LLLL d, yyyy, h:mm:ss a'
        : i === stringify(DATETIME_HUGE_WITH_SECONDS)
        ? 'EEEE, LLLL d, yyyy, h:mm:ss a'
        : 'EEEE, LLLL d, yyyy, h:mm a';
}
class Zone {
    get type() {
        throw new ZoneIsAbstractError();
    }
    get name() {
        throw new ZoneIsAbstractError();
    }
    get universal() {
        throw new ZoneIsAbstractError();
    }
    offsetName(e, n) {
        throw new ZoneIsAbstractError();
    }
    formatOffset(e, n) {
        throw new ZoneIsAbstractError();
    }
    offset(e) {
        throw new ZoneIsAbstractError();
    }
    equals(e) {
        throw new ZoneIsAbstractError();
    }
    get isValid() {
        throw new ZoneIsAbstractError();
    }
}
let singleton = null;
class LocalZone extends Zone {
    static get instance() {
        return null == singleton && (singleton = new LocalZone()), singleton;
    }
    get type() {
        return 'local';
    }
    get name() {
        return hasIntl() ? new Intl.DateTimeFormat().resolvedOptions().timeZone : 'local';
    }
    get universal() {
        return !1;
    }
    offsetName(e, { format: n, locale: i }) {
        return parseZoneInfo(e, n, i);
    }
    formatOffset(e, n) {
        return formatOffset(this.offset(e), n);
    }
    offset(e) {
        return -new Date(e).getTimezoneOffset();
    }
    equals(e) {
        return 'local' === e.type;
    }
    get isValid() {
        return !0;
    }
}
const matchingRegex = RegExp(`^${ianaRegex.source}$`);
let dtfCache = {};
function makeDTF(e) {
    return (
        dtfCache[e] ||
            (dtfCache[e] = new Intl.DateTimeFormat('en-US', {
                hour12: !1,
                timeZone: e,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })),
        dtfCache[e]
    );
}
const typeToPos = { year: 0, month: 1, day: 2, hour: 3, minute: 4, second: 5 };
function hackyOffset(e, n) {
    const i = e.format(n).replace(/\u200E/g, ''),
        a = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(i),
        [, o, s, t, d, r, l] = a;
    return [t, o, s, d, r, l];
}
function partsOffset(e, n) {
    const a = e.formatToParts(n),
        o = [];
    for (let s = 0; s < a.length; s++) {
        const { type: e, value: n } = a[s],
            i = typeToPos[e];
        isUndefined(i) || (o[i] = parseInt(n, 10));
    }
    return o;
}
let ianaZoneCache = {};
class IANAZone extends Zone {
    static create(e) {
        return ianaZoneCache[e] || (ianaZoneCache[e] = new IANAZone(e)), ianaZoneCache[e];
    }
    static resetCache() {
        (ianaZoneCache = {}), (dtfCache = {});
    }
    static isValidSpecifier(e) {
        return !!(e && e.match(matchingRegex));
    }
    static isValidZone(e) {
        try {
            return new Intl.DateTimeFormat('en-US', { timeZone: e }).format(), !0;
        } catch (n) {
            return !1;
        }
    }
    static parseGMTOffset(e) {
        if (e) {
            const n = e.match(/^Etc\/GMT([+-]\d{1,2})$/i);
            if (n) return -60 * parseInt(n[1]);
        }
        return null;
    }
    constructor(e) {
        super(), (this.zoneName = e), (this.valid = IANAZone.isValidZone(e));
    }
    get type() {
        return 'iana';
    }
    get name() {
        return this.zoneName;
    }
    get universal() {
        return !1;
    }
    offsetName(e, { format: n, locale: i }) {
        return parseZoneInfo(e, n, i, this.name);
    }
    formatOffset(e, n) {
        return formatOffset(this.offset(e), n);
    }
    offset(e) {
        const n = new Date(e),
            i = makeDTF(this.name),
            [a, o, s, t, d, r] = i.formatToParts ? partsOffset(i, n) : hackyOffset(i, n),
            l = objToLocalTS({ year: a, month: o, day: s, hour: t, minute: d, second: r, millisecond: 0 });
        let u = n.valueOf();
        return (u -= u % 1e3), (l - u) / 60000;
    }
    equals(e) {
        return 'iana' === e.type && e.name === this.name;
    }
    get isValid() {
        return this.valid;
    }
}
let singleton$1 = null;
class FixedOffsetZone extends Zone {
    static get utcInstance() {
        return null == singleton$1 && (singleton$1 = new FixedOffsetZone(0)), singleton$1;
    }
    static instance(e) {
        return 0 === e ? FixedOffsetZone.utcInstance : new FixedOffsetZone(e);
    }
    static parseSpecifier(e) {
        if (e) {
            const n = e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
            if (n) return new FixedOffsetZone(signedOffset(n[1], n[2]));
        }
        return null;
    }
    constructor(e) {
        super(), (this.fixed = e);
    }
    get type() {
        return 'fixed';
    }
    get name() {
        return 0 === this.fixed ? 'UTC' : `UTC${formatOffset(this.fixed, 'narrow')}`;
    }
    offsetName() {
        return this.name;
    }
    formatOffset(e, n) {
        return formatOffset(this.fixed, n);
    }
    get universal() {
        return !0;
    }
    offset() {
        return this.fixed;
    }
    equals(e) {
        return 'fixed' === e.type && e.fixed === this.fixed;
    }
    get isValid() {
        return !0;
    }
}
class InvalidZone extends Zone {
    constructor(e) {
        super(), (this.zoneName = e);
    }
    get type() {
        return 'invalid';
    }
    get name() {
        return this.zoneName;
    }
    get universal() {
        return !1;
    }
    offsetName() {
        return null;
    }
    formatOffset() {
        return '';
    }
    offset() {
        return NaN;
    }
    equals() {
        return !1;
    }
    get isValid() {
        return !1;
    }
}
function normalizeZone(e, n) {
    let i;
    if (isUndefined(e) || null === e) return n;
    if (e instanceof Zone) return e;
    if (isString(e)) {
        const a = e.toLowerCase();
        return 'local' === a
            ? n
            : 'utc' === a || 'gmt' === a
            ? FixedOffsetZone.utcInstance
            : null == (i = IANAZone.parseGMTOffset(e))
            ? IANAZone.isValidSpecifier(a)
                ? IANAZone.create(e)
                : FixedOffsetZone.parseSpecifier(a) || new InvalidZone(e)
            : FixedOffsetZone.instance(i);
    }
    return isNumber(e)
        ? FixedOffsetZone.instance(e)
        : 'object' == typeof e && e.offset && 'number' == typeof e.offset
        ? e
        : new InvalidZone(e);
}
let now = () => Date.now(),
    defaultZone = null,
    defaultLocale = null,
    defaultNumberingSystem = null,
    defaultOutputCalendar = null,
    throwOnInvalid = !1;
class Settings {
    static get now() {
        return now;
    }
    static set now(e) {
        now = e;
    }
    static get defaultZoneName() {
        return Settings.defaultZone.name;
    }
    static set defaultZoneName(e) {
        defaultZone = e ? normalizeZone(e) : null;
    }
    static get defaultZone() {
        return defaultZone || LocalZone.instance;
    }
    static get defaultLocale() {
        return defaultLocale;
    }
    static set defaultLocale(e) {
        defaultLocale = e;
    }
    static get defaultNumberingSystem() {
        return defaultNumberingSystem;
    }
    static set defaultNumberingSystem(e) {
        defaultNumberingSystem = e;
    }
    static get defaultOutputCalendar() {
        return defaultOutputCalendar;
    }
    static set defaultOutputCalendar(e) {
        defaultOutputCalendar = e;
    }
    static get throwOnInvalid() {
        return throwOnInvalid;
    }
    static set throwOnInvalid(e) {
        throwOnInvalid = e;
    }
    static resetCaches() {
        Locale.resetCache(), IANAZone.resetCache();
    }
}
function stringifyTokens(e, n) {
    let i = '';
    for (const a of e) i += a.literal ? a.val : n(a.val);
    return i;
}
const tokenToObject = {
    D: DATE_SHORT,
    DD: DATE_MED,
    DDD: DATE_FULL,
    DDDD: DATE_HUGE,
    t: TIME_SIMPLE,
    tt: TIME_WITH_SECONDS,
    ttt: TIME_WITH_SHORT_OFFSET,
    tttt: TIME_WITH_LONG_OFFSET,
    T: TIME_24_SIMPLE,
    TT: TIME_24_WITH_SECONDS,
    TTT: TIME_24_WITH_SHORT_OFFSET,
    TTTT: TIME_24_WITH_LONG_OFFSET,
    f: DATETIME_SHORT,
    ff: DATETIME_MED,
    fff: DATETIME_FULL,
    ffff: DATETIME_HUGE,
    F: DATETIME_SHORT_WITH_SECONDS,
    FF: DATETIME_MED_WITH_SECONDS,
    FFF: DATETIME_FULL_WITH_SECONDS,
    FFFF: DATETIME_HUGE_WITH_SECONDS
};
class Formatter {
    static create(e, n = {}) {
        return new Formatter(e, n);
    }
    static parseFormat(e) {
        let n = null,
            a = '',
            o = !1;
        const s = [];
        for (let t = 0; t < e.length; t++) {
            const i = e.charAt(t);
            "'" === i
                ? (0 < a.length && s.push({ literal: o, val: a }), (n = null), (a = ''), (o = !o))
                : o
                ? (a += i)
                : i === n
                ? (a += i)
                : (0 < a.length && s.push({ literal: !1, val: a }), (a = i), (n = i));
        }
        return 0 < a.length && s.push({ literal: o, val: a }), s;
    }
    constructor(e, n) {
        (this.opts = n), (this.loc = e), (this.systemLoc = null);
    }
    formatWithSystemDefault(e, n) {
        null === this.systemLoc && (this.systemLoc = this.loc.redefaultToSystem());
        const i = this.systemLoc.dtFormatter(e, Object.assign({}, this.opts, n));
        return i.format();
    }
    formatDateTime(e, n = {}) {
        const i = this.loc.dtFormatter(e, Object.assign({}, this.opts, n));
        return i.format();
    }
    formatDateTimeParts(e, n = {}) {
        const i = this.loc.dtFormatter(e, Object.assign({}, this.opts, n));
        return i.formatToParts();
    }
    resolvedOptions(e, n = {}) {
        const i = this.loc.dtFormatter(e, Object.assign({}, this.opts, n));
        return i.resolvedOptions();
    }
    num(e, n = 0) {
        if (this.opts.forceSimple) return padStart(e, n);
        const i = Object.assign({}, this.opts);
        return 0 < n && (i.padTo = n), this.loc.numberFormatter(i).format(e);
    }
    formatDateTimeFromString(e, n) {
        const i = 'en' === this.loc.listingMode(),
            a = (n, i) => this.loc.extract(e, n, i),
            o = n =>
                e.isOffsetFixed && 0 === e.offset && n.allowZ
                    ? 'Z'
                    : e.isValid
                    ? e.zone.formatOffset(e.ts, n.format)
                    : '',
            s = () => (i ? meridiemForDateTime(e) : a({ hour: 'numeric', hour12: !0 }, 'dayperiod')),
            t = (n, o) => (i ? monthForDateTime(e, n) : a(o ? { month: n } : { month: n, day: 'numeric' }, 'month')),
            d = (n, o) =>
                i
                    ? weekdayForDateTime(e, n)
                    : a(o ? { weekday: n } : { weekday: n, month: 'long', day: 'numeric' }, 'weekday'),
            r = n => {
                const i = tokenToObject[n];
                return i ? this.formatWithSystemDefault(e, i) : n;
            },
            l = n => (i ? eraForDateTime(e, n) : a({ era: n }, 'era'));
        return stringifyTokens(Formatter.parseFormat(n), n => {
            const i = this.loc.outputCalendar;
            return 'S' === n
                ? this.num(e.millisecond)
                : 'u' === n || 'SSS' === n
                ? this.num(e.millisecond, 3)
                : 's' === n
                ? this.num(e.second)
                : 'ss' === n
                ? this.num(e.second, 2)
                : 'm' === n
                ? this.num(e.minute)
                : 'mm' === n
                ? this.num(e.minute, 2)
                : 'h' === n
                ? this.num(0 == e.hour % 12 ? 12 : e.hour % 12)
                : 'hh' === n
                ? this.num(0 == e.hour % 12 ? 12 : e.hour % 12, 2)
                : 'H' === n
                ? this.num(e.hour)
                : 'HH' === n
                ? this.num(e.hour, 2)
                : 'Z' === n
                ? o({ format: 'narrow', allowZ: this.opts.allowZ })
                : 'ZZ' === n
                ? o({ format: 'short', allowZ: this.opts.allowZ })
                : 'ZZZ' === n
                ? o({ format: 'techie', allowZ: !1 })
                : 'ZZZZ' === n
                ? e.zone.offsetName(e.ts, { format: 'short', locale: this.loc.locale })
                : 'ZZZZZ' === n
                ? e.zone.offsetName(e.ts, { format: 'long', locale: this.loc.locale })
                : 'z' === n
                ? e.zoneName
                : 'a' === n
                ? s()
                : 'd' === n
                ? i
                    ? a({ day: 'numeric' }, 'day')
                    : this.num(e.day)
                : 'dd' === n
                ? i
                    ? a({ day: '2-digit' }, 'day')
                    : this.num(e.day, 2)
                : 'c' === n
                ? this.num(e.weekday)
                : 'ccc' === n
                ? d('short', !0)
                : 'cccc' === n
                ? d('long', !0)
                : 'ccccc' === n
                ? d('narrow', !0)
                : 'E' === n
                ? this.num(e.weekday)
                : 'EEE' === n
                ? d('short', !1)
                : 'EEEE' === n
                ? d('long', !1)
                : 'EEEEE' === n
                ? d('narrow', !1)
                : 'L' === n
                ? i
                    ? a({ month: 'numeric', day: 'numeric' }, 'month')
                    : this.num(e.month)
                : 'LL' === n
                ? i
                    ? a({ month: '2-digit', day: 'numeric' }, 'month')
                    : this.num(e.month, 2)
                : 'LLL' === n
                ? t('short', !0)
                : 'LLLL' === n
                ? t('long', !0)
                : 'LLLLL' === n
                ? t('narrow', !0)
                : 'M' === n
                ? i
                    ? a({ month: 'numeric' }, 'month')
                    : this.num(e.month)
                : 'MM' === n
                ? i
                    ? a({ month: '2-digit' }, 'month')
                    : this.num(e.month, 2)
                : 'MMM' === n
                ? t('short', !1)
                : 'MMMM' === n
                ? t('long', !1)
                : 'MMMMM' === n
                ? t('narrow', !1)
                : 'y' === n
                ? i
                    ? a({ year: 'numeric' }, 'year')
                    : this.num(e.year)
                : 'yy' === n
                ? i
                    ? a({ year: '2-digit' }, 'year')
                    : this.num(e.year.toString().slice(-2), 2)
                : 'yyyy' === n
                ? i
                    ? a({ year: 'numeric' }, 'year')
                    : this.num(e.year, 4)
                : 'yyyyyy' === n
                ? i
                    ? a({ year: 'numeric' }, 'year')
                    : this.num(e.year, 6)
                : 'G' === n
                ? l('short')
                : 'GG' === n
                ? l('long')
                : 'GGGGG' === n
                ? l('narrow')
                : 'kk' === n
                ? this.num(e.weekYear.toString().slice(-2), 2)
                : 'kkkk' === n
                ? this.num(e.weekYear, 4)
                : 'W' === n
                ? this.num(e.weekNumber)
                : 'WW' === n
                ? this.num(e.weekNumber, 2)
                : 'o' === n
                ? this.num(e.ordinal)
                : 'ooo' === n
                ? this.num(e.ordinal, 3)
                : 'q' === n
                ? this.num(e.quarter)
                : 'qq' === n
                ? this.num(e.quarter, 2)
                : 'X' === n
                ? this.num(Math.floor(e.ts / 1e3))
                : 'x' === n
                ? this.num(e.ts)
                : r(n);
        });
    }
    formatDurationFromString(e, n) {
        const i = e => {
                switch (e[0]) {
                    case 'S':
                        return 'millisecond';
                    case 's':
                        return 'second';
                    case 'm':
                        return 'minute';
                    case 'h':
                        return 'hour';
                    case 'd':
                        return 'day';
                    case 'M':
                        return 'month';
                    case 'y':
                        return 'year';
                    default:
                        return null;
                }
            },
            a = Formatter.parseFormat(n),
            o = a.reduce((e, { literal: n, val: i }) => (n ? e : e.concat(i)), []),
            s = e.shiftTo(...o.map(i).filter(e => e));
        return stringifyTokens(
            a,
            (e => n => {
                const a = i(n);
                return a ? this.num(e.get(a), n.length) : n;
            })(s)
        );
    }
}
let intlDTCache = {};
function getCachedDTF(e, n = {}) {
    const i = JSON.stringify([e, n]);
    let a = intlDTCache[i];
    return a || ((a = new Intl.DateTimeFormat(e, n)), (intlDTCache[i] = a)), a;
}
let intlNumCache = {};
function getCachendINF(e, n = {}) {
    const i = JSON.stringify([e, n]);
    let a = intlNumCache[i];
    return a || ((a = new Intl.NumberFormat(e, n)), (intlNumCache[i] = a)), a;
}
let intlRelCache = {};
function getCachendRTF(e, n = {}) {
    const i = JSON.stringify([e, n]);
    let a = intlRelCache[i];
    return a || ((a = new Intl.RelativeTimeFormat(e, n)), (intlRelCache[i] = a)), a;
}
let sysLocaleCache = null;
function systemLocale() {
    if (sysLocaleCache) return sysLocaleCache;
    if (hasIntl()) {
        const e = new Intl.DateTimeFormat().resolvedOptions().locale;
        return (sysLocaleCache = 'und' === e ? 'en-US' : e), sysLocaleCache;
    }
    return (sysLocaleCache = 'en-US'), sysLocaleCache;
}
function parseLocaleString(e) {
    const n = e.indexOf('-u-');
    if (-1 === n) return [e];
    else {
        let i;
        const a = e.substring(0, n);
        try {
            i = getCachedDTF(e).resolvedOptions();
        } catch (n) {
            i = getCachedDTF(a).resolvedOptions();
        }
        const { numberingSystem: o, calendar: s } = i;
        return [a, o, s];
    }
}
function intlConfigString(e, n, i) {
    return hasIntl() ? (i || n ? ((e += '-u'), i && (e += `-ca-${i}`), n && (e += `-nu-${n}`), e) : e) : [];
}
function mapMonths(e) {
    const n = [];
    for (let a = 1; 12 >= a; a++) {
        const i = DateTime.utc(2016, a, 1);
        n.push(e(i));
    }
    return n;
}
function mapWeekdays(e) {
    const n = [];
    for (let a = 1; 7 >= a; a++) {
        const i = DateTime.utc(2016, 11, 13 + a);
        n.push(e(i));
    }
    return n;
}
function listStuff(e, n, i, a, o) {
    const s = e.listingMode(i);
    return 'error' === s ? null : 'en' === s ? a(n) : o(n);
}
function supportsFastNumbers(e) {
    return (
        !(e.numberingSystem && 'latn' !== e.numberingSystem) &&
        ('latn' === e.numberingSystem ||
            !e.locale ||
            e.locale.startsWith('en') ||
            (hasIntl() && 'latn' === Intl.DateTimeFormat(e.intl).resolvedOptions().numberingSystem))
    );
}
class PolyNumberFormatter {
    constructor(e, n, i) {
        if (((this.padTo = i.padTo || 0), (this.floor = i.floor || !1), !n && hasIntl())) {
            const n = { useGrouping: !1 };
            0 < i.padTo && (n.minimumIntegerDigits = i.padTo), (this.inf = getCachendINF(e, n));
        }
    }
    format(e) {
        if (this.inf) {
            const n = this.floor ? Math.floor(e) : e;
            return this.inf.format(n);
        } else {
            const n = this.floor ? Math.floor(e) : roundTo(e, 3);
            return padStart(n, this.padTo);
        }
    }
}
class PolyDateFormatter {
    constructor(e, n, i) {
        (this.opts = i), (this.hasIntl = hasIntl());
        let a;
        if (
            (e.zone.universal && this.hasIntl
                ? ((a = 'UTC'),
                  (this.dt = i.timeZoneName
                      ? e
                      : 0 === e.offset
                      ? e
                      : DateTime.fromMillis(e.ts + 1e3 * (60 * e.offset))))
                : 'local' === e.zone.type
                ? (this.dt = e)
                : ((this.dt = e), (a = e.zone.name)),
            this.hasIntl)
        ) {
            const e = Object.assign({}, this.opts);
            a && (e.timeZone = a), (this.dtf = getCachedDTF(n, e));
        }
    }
    format() {
        if (this.hasIntl) return this.dtf.format(this.dt.toJSDate());
        else {
            const e = formatString(this.opts),
                n = Locale.create('en-US');
            return Formatter.create(n).formatDateTimeFromString(this.dt, e);
        }
    }
    formatToParts() {
        return this.hasIntl && hasFormatToParts() ? this.dtf.formatToParts(this.dt.toJSDate()) : [];
    }
    resolvedOptions() {
        return this.hasIntl
            ? this.dtf.resolvedOptions()
            : { locale: 'en-US', numberingSystem: 'latn', outputCalendar: 'gregory' };
    }
}
class PolyRelFormatter {
    constructor(e, n, i) {
        (this.opts = Object.assign({ style: 'long' }, i)), !n && hasRelative() && (this.rtf = getCachendRTF(e, i));
    }
    format(e, n) {
        return this.rtf
            ? this.rtf.format(e, n)
            : formatRelativeTime(n, e, this.opts.numeric, 'long' !== this.opts.style);
    }
    formatToParts(e, n) {
        return this.rtf ? this.rtf.formatToParts(e, n) : [];
    }
}
class Locale {
    static fromOpts(e) {
        return Locale.create(e.locale, e.numberingSystem, e.outputCalendar, e.defaultToEN);
    }
    static create(e, n, i, a = !1) {
        const o = e || Settings.defaultLocale,
            s = o || (a ? 'en-US' : systemLocale()),
            t = n || Settings.defaultNumberingSystem,
            d = i || Settings.defaultOutputCalendar;
        return new Locale(s, t, d, o);
    }
    static resetCache() {
        (sysLocaleCache = null), (intlDTCache = {}), (intlNumCache = {});
    }
    static fromObject({ locale: e, numberingSystem: n, outputCalendar: i } = {}) {
        return Locale.create(e, n, i);
    }
    constructor(e, n, i, a) {
        let [o, s, t] = parseLocaleString(e);
        (this.locale = o),
            (this.numberingSystem = n || s || null),
            (this.outputCalendar = i || t || null),
            (this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar)),
            (this.weekdaysCache = { format: {}, standalone: {} }),
            (this.monthsCache = { format: {}, standalone: {} }),
            (this.meridiemCache = null),
            (this.eraCache = {}),
            (this.specifiedLocale = a),
            (this.fastNumbersCached = null);
    }
    get fastNumbers() {
        return (
            null == this.fastNumbersCached && (this.fastNumbersCached = supportsFastNumbers(this)),
            this.fastNumbersCached
        );
    }
    listingMode(e = !0) {
        const n = hasIntl(),
            i = n && hasFormatToParts(),
            a = this.isEnglish(),
            o =
                (null === this.numberingSystem || 'latn' === this.numberingSystem) &&
                (null === this.outputCalendar || 'gregory' === this.outputCalendar);
        return i || (a && o) || e ? (!i || (a && o) ? 'en' : 'intl') : 'error';
    }
    clone(e) {
        return e && 0 !== Object.getOwnPropertyNames(e).length
            ? Locale.create(
                  e.locale || this.specifiedLocale,
                  e.numberingSystem || this.numberingSystem,
                  e.outputCalendar || this.outputCalendar,
                  e.defaultToEN || !1
              )
            : this;
    }
    redefaultToEN(e = {}) {
        return this.clone(Object.assign({}, e, { defaultToEN: !0 }));
    }
    redefaultToSystem(e = {}) {
        return this.clone(Object.assign({}, e, { defaultToEN: !1 }));
    }
    months(e, n = !1, i = !0) {
        return listStuff(this, e, i, months, () => {
            const i = n ? { month: e, day: 'numeric' } : { month: e },
                a = n ? 'format' : 'standalone';
            return (
                this.monthsCache[a][e] || (this.monthsCache[a][e] = mapMonths(e => this.extract(e, i, 'month'))),
                this.monthsCache[a][e]
            );
        });
    }
    weekdays(e, n = !1, i = !0) {
        return listStuff(this, e, i, weekdays, () => {
            const i = n ? { weekday: e, year: 'numeric', month: 'long', day: 'numeric' } : { weekday: e },
                a = n ? 'format' : 'standalone';
            return (
                this.weekdaysCache[a][e] ||
                    (this.weekdaysCache[a][e] = mapWeekdays(e => this.extract(e, i, 'weekday'))),
                this.weekdaysCache[a][e]
            );
        });
    }
    meridiems(e = !0) {
        return listStuff(
            this,
            void 0,
            e,
            () => meridiems,
            () => {
                if (!this.meridiemCache) {
                    const e = { hour: 'numeric', hour12: !0 };
                    this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map(n =>
                        this.extract(n, e, 'dayperiod')
                    );
                }
                return this.meridiemCache;
            }
        );
    }
    eras(e, n = !0) {
        return listStuff(this, e, n, eras, () => {
            const n = { era: e };
            return (
                this.eraCache[e] ||
                    (this.eraCache[e] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(e =>
                        this.extract(e, n, 'era')
                    )),
                this.eraCache[e]
            );
        });
    }
    extract(e, n, i) {
        const a = this.dtFormatter(e, n),
            o = a.formatToParts(),
            s = o.find(e => e.type.toLowerCase() === i);
        return s ? s.value : null;
    }
    numberFormatter(e = {}) {
        return new PolyNumberFormatter(this.intl, e.forceSimple || this.fastNumbers, e);
    }
    dtFormatter(e, n = {}) {
        return new PolyDateFormatter(e, this.intl, n);
    }
    relFormatter(e = {}) {
        return new PolyRelFormatter(this.intl, this.isEnglish(), e);
    }
    isEnglish() {
        return (
            'en' === this.locale ||
            'en-us' === this.locale.toLowerCase() ||
            (hasIntl() &&
                Intl.DateTimeFormat(this.intl)
                    .resolvedOptions()
                    .locale.startsWith('en-us'))
        );
    }
    equals(e) {
        return (
            this.locale === e.locale &&
            this.numberingSystem === e.numberingSystem &&
            this.outputCalendar === e.outputCalendar
        );
    }
}
function combineRegexes(...e) {
    const n = e.reduce((e, n) => e + n.source, '');
    return RegExp(`^${n}$`);
}
function combineExtractors(...e) {
    return n =>
        e
            .reduce(
                ([e, i, a], o) => {
                    const [s, t, d] = o(n, a);
                    return [Object.assign(e, s), i || t, d];
                },
                [{}, null, 1]
            )
            .slice(0, 2);
}
function parse(e, ...n) {
    if (null == e) return [null, null];
    for (const [i, a] of n) {
        const n = i.exec(e);
        if (n) return a(n);
    }
    return [null, null];
}
function simpleParse(...e) {
    return (n, a) => {
        const o = {};
        let s;
        for (s = 0; s < e.length; s++) o[e[s]] = parseInteger(n[a + s]);
        return [o, null, a + s];
    };
}
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/,
    isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,9}))?)?)?/,
    isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${offsetRegex.source}?`),
    isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`),
    isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,
    isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/,
    isoOrdinalRegex = /(\d{4})-?(\d{3})/,
    extractISOWeekData = simpleParse('weekYear', 'weekNumber', 'weekDay'),
    extractISOOrdinalData = simpleParse('year', 'ordinal'),
    sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/,
    sqlTimeRegex = RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`),
    sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function extractISOYmd(e, n) {
    const i = { year: parseInteger(e[n]), month: parseInteger(e[n + 1]) || 1, day: parseInteger(e[n + 2]) || 1 };
    return [i, null, n + 3];
}
function extractISOTime(e, n) {
    const i = {
        hour: parseInteger(e[n]) || 0,
        minute: parseInteger(e[n + 1]) || 0,
        second: parseInteger(e[n + 2]) || 0,
        millisecond: parseMillis(e[n + 3])
    };
    return [i, null, n + 4];
}
function extractISOOffset(e, n) {
    const i = !e[n] && !e[n + 1],
        a = signedOffset(e[n + 1], e[n + 2]),
        o = i ? null : FixedOffsetZone.instance(a);
    return [{}, o, n + 3];
}
function extractIANAZone(e, n) {
    const i = e[n] ? IANAZone.create(e[n]) : null;
    return [{}, i, n + 1];
}
const isoDuration = /^P(?:(?:(-?\d{1,9})Y)?(?:(-?\d{1,9})M)?(?:(-?\d{1,9})W)?(?:(-?\d{1,9})D)?(?:T(?:(-?\d{1,9})H)?(?:(-?\d{1,9})M)?(?:(-?\d{1,9})(?:[.,](-?\d{1,9}))?S)?)?)$/;
function extractISODuration(e) {
    const [, n, i, a, o, s, t, d, r] = e;
    return [
        {
            years: parseInteger(n),
            months: parseInteger(i),
            weeks: parseInteger(a),
            days: parseInteger(o),
            hours: parseInteger(s),
            minutes: parseInteger(t),
            seconds: parseInteger(d),
            milliseconds: parseMillis(r)
        }
    ];
}
const obsOffsets = { GMT: 0, EDT: -240, EST: -300, CDT: -300, CST: -360, MDT: -360, MST: -420, PDT: -420, PST: -480 };
function fromStrings(e, n, i, a, o, s, t) {
    const d = {
        year: 2 === n.length ? untruncateYear(parseInteger(n)) : parseInteger(n),
        month: monthsShort.indexOf(i) + 1,
        day: parseInteger(a),
        hour: parseInteger(o),
        minute: parseInteger(s)
    };
    return (
        t && (d.second = parseInteger(t)),
        e && (d.weekday = 3 < e.length ? weekdaysLong.indexOf(e) + 1 : weekdaysShort.indexOf(e) + 1),
        d
    );
}
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(e) {
    const [, n, i, a, o, s, t, d, r, l, u, m] = e,
        c = fromStrings(n, o, a, i, s, t, d);
    let f;
    return (f = r ? obsOffsets[r] : l ? 0 : signedOffset(u, m)), [c, new FixedOffsetZone(f)];
}
function preprocessRFC2822(e) {
    return e
        .replace(/\([^)]*\)|[\n\t]/g, ' ')
        .replace(/(\s\s+)/g, ' ')
        .trim();
}
const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
    rfc850 = /^(Monday|Tuesday|Wedsday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
    ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(e) {
    const [, n, i, a, o, s, t, d] = e,
        r = fromStrings(n, o, a, i, s, t, d);
    return [r, FixedOffsetZone.utcInstance];
}
function extractASCII(e) {
    const [, n, i, a, o, s, t, d] = e,
        r = fromStrings(n, d, i, a, o, s, t);
    return [r, FixedOffsetZone.utcInstance];
}
const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex),
    isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex),
    isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex),
    isoTimeCombinedRegex = combineRegexes(isoTimeRegex),
    extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset),
    extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset),
    extractISOOrdinalDataAndTime = combineExtractors(extractISOOrdinalData, extractISOTime),
    extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset);
function parseISODate(e) {
    return parse(
        e,
        [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
        [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
        [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDataAndTime],
        [isoTimeCombinedRegex, extractISOTimeAndOffset]
    );
}
function parseRFC2822Date(e) {
    return parse(preprocessRFC2822(e), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(e) {
    return parse(e, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}
function parseISODuration(e) {
    return parse(e, [isoDuration, extractISODuration]);
}
const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex),
    sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex),
    extractISOYmdTimeOffsetAndIANAZone = combineExtractors(
        extractISOYmd,
        extractISOTime,
        extractISOOffset,
        extractIANAZone
    ),
    extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseSQL(e) {
    return parse(
        e,
        [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeOffsetAndIANAZone],
        [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
    );
}
class Invalid {
    constructor(e, n) {
        (this.reason = e), (this.explanation = n);
    }
    toMessage() {
        return this.explanation ? `${this.reason}: ${this.explanation}` : this.reason;
    }
}
const INVALID = 'Invalid Duration',
    lowOrderMatrix = {
        weeks: { days: 7, hours: 168, minutes: 10080, seconds: 604800, milliseconds: 604800000 },
        days: { hours: 24, minutes: 1440, seconds: 86400, milliseconds: 86400000 },
        hours: { minutes: 60, seconds: 3600, milliseconds: 3600000 },
        minutes: { seconds: 60, milliseconds: 60000 },
        seconds: { milliseconds: 1e3 }
    },
    casualMatrix = Object.assign(
        {
            years: {
                months: 12,
                weeks: 52,
                days: 365,
                hours: 8760,
                minutes: 525600,
                seconds: 31536000,
                milliseconds: 31536000000
            },
            quarters: { months: 3, weeks: 13, days: 91, hours: 2184, minutes: 131040, milliseconds: 7862400000 },
            months: { weeks: 4, days: 30, hours: 720, minutes: 43200, seconds: 2592000, milliseconds: 2592000000 }
        },
        lowOrderMatrix
    ),
    daysInYearAccurate = 146097 / 400,
    daysInMonthAccurate = 146097 / 4800,
    accurateMatrix = Object.assign(
        {
            years: {
                months: 12,
                weeks: daysInYearAccurate / 7,
                days: daysInYearAccurate,
                hours: 24 * daysInYearAccurate,
                minutes: 60 * (24 * daysInYearAccurate),
                seconds: 60 * (60 * (24 * daysInYearAccurate)),
                milliseconds: 1e3 * (60 * (60 * (24 * daysInYearAccurate)))
            },
            quarters: {
                months: 3,
                weeks: daysInYearAccurate / 28,
                days: daysInYearAccurate / 4,
                hours: (24 * daysInYearAccurate) / 4,
                minutes: (60 * (24 * daysInYearAccurate)) / 4,
                seconds: (60 * (60 * (24 * daysInYearAccurate))) / 4,
                milliseconds: (1e3 * (60 * (60 * (24 * daysInYearAccurate)))) / 4
            },
            months: {
                weeks: daysInMonthAccurate / 7,
                days: daysInMonthAccurate,
                hours: 24 * daysInMonthAccurate,
                minutes: 60 * (24 * daysInMonthAccurate),
                seconds: 60 * (60 * (24 * daysInMonthAccurate)),
                milliseconds: 1e3 * (60 * (60 * (24 * daysInMonthAccurate)))
            }
        },
        lowOrderMatrix
    ),
    orderedUnits = ['years', 'quarters', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'],
    reverseUnits = orderedUnits.slice(0).reverse();
function clone(e, n, i = !1) {
    const a = {
        values: i ? n.values : Object.assign({}, e.values, n.values || {}),
        loc: e.loc.clone(n.loc),
        conversionAccuracy: n.conversionAccuracy || e.conversionAccuracy
    };
    return new Duration(a);
}
function antiTrunc(e) {
    return 0 > e ? Math.floor(e) : Math.ceil(e);
}
function convert(e, n, i, a, o) {
    const s = e[o][i],
        t = n[i] / s,
        d = Math.sign(t) === Math.sign(a[o]),
        r = !d && 0 !== a[o] && 1 >= Math.abs(t) ? antiTrunc(t) : Math.trunc(t);
    (a[o] += r), (n[i] -= r * s);
}
function normalizeValues(e, n) {
    reverseUnits.reduce((i, a) => (isUndefined(n[a]) ? i : (i && convert(e, n, i, n, a), a)), null);
}
class Duration {
    constructor(e) {
        const n = 'longterm' === e.conversionAccuracy || !1;
        (this.values = e.values),
            (this.loc = e.loc || Locale.create()),
            (this.conversionAccuracy = n ? 'longterm' : 'casual'),
            (this.invalid = e.invalid || null),
            (this.matrix = n ? accurateMatrix : casualMatrix),
            (this.isLuxonDuration = !0);
    }
    static fromMillis(e, n) {
        return Duration.fromObject(Object.assign({ milliseconds: e }, n));
    }
    static fromObject(e) {
        if (null == e || 'object' != typeof e)
            throw new InvalidArgumentError(
                `Duration.fromObject: argument expected to be an object, got ${null === e ? 'null' : typeof e}`
            );
        return new Duration({
            values: normalizeObject(e, Duration.normalizeUnit, [
                'locale',
                'numberingSystem',
                'conversionAccuracy',
                'zone'
            ]),
            loc: Locale.fromObject(e),
            conversionAccuracy: e.conversionAccuracy
        });
    }
    static fromISO(e, n) {
        const [i] = parseISODuration(e);
        if (i) {
            const e = Object.assign(i, n);
            return Duration.fromObject(e);
        }
        return Duration.invalid('unparsable', `the input "${e}" can't be parsed as ISO 8601`);
    }
    static invalid(e, n = null) {
        if (!e) throw new InvalidArgumentError('need to specify a reason the Duration is invalid');
        const i = e instanceof Invalid ? e : new Invalid(e, n);
        if (Settings.throwOnInvalid) throw new InvalidDurationError(i);
        else return new Duration({ invalid: i });
    }
    static normalizeUnit(e) {
        const n = {
            year: 'years',
            years: 'years',
            quarter: 'quarters',
            quarters: 'quarters',
            month: 'months',
            months: 'months',
            week: 'weeks',
            weeks: 'weeks',
            day: 'days',
            days: 'days',
            hour: 'hours',
            hours: 'hours',
            minute: 'minutes',
            minutes: 'minutes',
            second: 'seconds',
            seconds: 'seconds',
            millisecond: 'milliseconds',
            milliseconds: 'milliseconds'
        }[e ? e.toLowerCase() : e];
        if (!n) throw new InvalidUnitError(e);
        return n;
    }
    static isDuration(e) {
        return (e && e.isLuxonDuration) || !1;
    }
    get locale() {
        return this.isValid ? this.loc.locale : null;
    }
    get numberingSystem() {
        return this.isValid ? this.loc.numberingSystem : null;
    }
    toFormat(e, n = {}) {
        const i = Object.assign({}, n, { floor: !1 !== n.round && !1 !== n.floor });
        return this.isValid ? Formatter.create(this.loc, i).formatDurationFromString(this, e) : INVALID;
    }
    toObject(e = {}) {
        if (!this.isValid) return {};
        const n = Object.assign({}, this.values);
        return (
            e.includeConfig &&
                ((n.conversionAccuracy = this.conversionAccuracy),
                (n.numberingSystem = this.loc.numberingSystem),
                (n.locale = this.loc.locale)),
            n
        );
    }
    toISO() {
        if (!this.isValid) return null;
        let e = 'P';
        return (
            0 !== this.years && (e += this.years + 'Y'),
            (0 !== this.months || 0 !== this.quarters) && (e += this.months + 3 * this.quarters + 'M'),
            0 !== this.weeks && (e += this.weeks + 'W'),
            0 !== this.days && (e += this.days + 'D'),
            (0 !== this.hours || 0 !== this.minutes || 0 !== this.seconds || 0 !== this.milliseconds) && (e += 'T'),
            0 !== this.hours && (e += this.hours + 'H'),
            0 !== this.minutes && (e += this.minutes + 'M'),
            (0 !== this.seconds || 0 !== this.milliseconds) && (e += this.seconds + this.milliseconds / 1e3 + 'S'),
            'P' == e && (e += 'T0S'),
            e
        );
    }
    toJSON() {
        return this.toISO();
    }
    toString() {
        return this.toISO();
    }
    valueOf() {
        return this.as('milliseconds');
    }
    plus(e) {
        if (!this.isValid) return this;
        const n = friendlyDuration(e),
            i = {};
        for (const a of orderedUnits)
            (n.values.hasOwnProperty(a) || this.values.hasOwnProperty(a)) && (i[a] = n.get(a) + this.get(a));
        return clone(this, { values: i }, !0);
    }
    minus(e) {
        if (!this.isValid) return this;
        const n = friendlyDuration(e);
        return this.plus(n.negate());
    }
    get(e) {
        return this[Duration.normalizeUnit(e)];
    }
    set(e) {
        if (!this.isValid) return this;
        const n = Object.assign(this.values, normalizeObject(e, Duration.normalizeUnit, []));
        return clone(this, { values: n });
    }
    reconfigure({ locale: e, numberingSystem: n, conversionAccuracy: i } = {}) {
        const a = this.loc.clone({ locale: e, numberingSystem: n }),
            o = { loc: a };
        return i && (o.conversionAccuracy = i), clone(this, o);
    }
    as(e) {
        return this.isValid ? this.shiftTo(e).get(e) : NaN;
    }
    normalize() {
        if (!this.isValid) return this;
        const e = this.toObject();
        return normalizeValues(this.matrix, e), Duration.fromObject(e);
    }
    shiftTo(...e) {
        if (!this.isValid) return this;
        if (0 === e.length) return this;
        e = e.map(e => Duration.normalizeUnit(e));
        const n = {},
            a = {},
            o = this.toObject();
        let s;
        normalizeValues(this.matrix, o);
        for (const t of orderedUnits)
            if (0 <= e.indexOf(t)) {
                s = t;
                let e = 0;
                for (const n in a) (e += this.matrix[n][t] * a[n]), (a[n] = 0);
                isNumber(o[t]) && (e += o[t]);
                const d = Math.trunc(e);
                for (const i in ((n[t] = d), (a[t] = e - d), o))
                    orderedUnits.indexOf(i) > orderedUnits.indexOf(t) && convert(this.matrix, o, i, n, t);
            } else isNumber(o[t]) && (a[t] = o[t]);
        for (const i in a) 0 !== a[i] && (n[s] += i === s ? a[i] : a[i] / this.matrix[s][i]);
        return clone(this, { values: n }, !0);
    }
    negate() {
        if (!this.isValid) return this;
        const e = {};
        for (const n of Object.keys(this.values)) e[n] = -this.values[n];
        return clone(this, { values: e }, !0);
    }
    get years() {
        return this.isValid ? this.values.years || 0 : NaN;
    }
    get quarters() {
        return this.isValid ? this.values.quarters || 0 : NaN;
    }
    get months() {
        return this.isValid ? this.values.months || 0 : NaN;
    }
    get weeks() {
        return this.isValid ? this.values.weeks || 0 : NaN;
    }
    get days() {
        return this.isValid ? this.values.days || 0 : NaN;
    }
    get hours() {
        return this.isValid ? this.values.hours || 0 : NaN;
    }
    get minutes() {
        return this.isValid ? this.values.minutes || 0 : NaN;
    }
    get seconds() {
        return this.isValid ? this.values.seconds || 0 : NaN;
    }
    get milliseconds() {
        return this.isValid ? this.values.milliseconds || 0 : NaN;
    }
    get isValid() {
        return null === this.invalid;
    }
    get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
    }
    get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
    }
    equals(e) {
        if (!this.isValid || !e.isValid) return !1;
        if (!this.loc.equals(e.loc)) return !1;
        for (const n of orderedUnits) if (this.values[n] !== e.values[n]) return !1;
        return !0;
    }
}
function friendlyDuration(e) {
    if (isNumber(e)) return Duration.fromMillis(e);
    if (Duration.isDuration(e)) return e;
    if ('object' == typeof e) return Duration.fromObject(e);
    throw new InvalidArgumentError(`Unknown duration argument ${e} of type ${typeof e}`);
}
const INVALID$1 = 'Invalid Interval';
function validateStartEnd(e, n) {
    return e && e.isValid
        ? n && n.isValid
            ? n < e
                ? new Invalid(
                      'end before start',
                      `The end of an interval must be after its start, but you had start=${e.toISO()} and end=${n.toISO()}`
                  )
                : null
            : new Invalid('missing or invalid end')
        : new Invalid('missing or invalid start');
}
class Interval {
    constructor(e) {
        (this.s = e.start), (this.e = e.end), (this.invalid = e.invalid || null), (this.isLuxonInterval = !0);
    }
    static invalid(e, n = null) {
        if (!e) throw new InvalidArgumentError('need to specify a reason the Interval is invalid');
        const i = e instanceof Invalid ? e : new Invalid(e, n);
        if (Settings.throwOnInvalid) throw new InvalidIntervalError(i);
        else return new Interval({ invalid: i });
    }
    static fromDateTimes(e, n) {
        const i = friendlyDateTime(e),
            a = friendlyDateTime(n);
        return new Interval({ start: i, end: a, invalid: validateStartEnd(i, a) });
    }
    static after(e, n) {
        const i = friendlyDuration(n),
            a = friendlyDateTime(e);
        return Interval.fromDateTimes(a, a.plus(i));
    }
    static before(e, n) {
        const i = friendlyDuration(n),
            a = friendlyDateTime(e);
        return Interval.fromDateTimes(a.minus(i), a);
    }
    static fromISO(n, i) {
        const [a, o] = (n || '').split('/', 2);
        if (a && o) {
            const e = DateTime.fromISO(a, i),
                n = DateTime.fromISO(o, i);
            if (e.isValid && n.isValid) return Interval.fromDateTimes(e, n);
            if (e.isValid) {
                const n = Duration.fromISO(o, i);
                if (n.isValid) return Interval.after(e, n);
            } else if (n.isValid) {
                const e = Duration.fromISO(a, i);
                if (e.isValid) return Interval.before(n, e);
            }
        }
        return Interval.invalid('unparsable', `the input "${n}" can't be parsed asISO 8601`);
    }
    static isInterval(e) {
        return (e && e.isLuxonInterval) || !1;
    }
    get start() {
        return this.isValid ? this.s : null;
    }
    get end() {
        return this.isValid ? this.e : null;
    }
    get isValid() {
        return null === this.invalidReason;
    }
    get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
    }
    get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
    }
    length(e = 'milliseconds') {
        return this.isValid ? this.toDuration(...[e]).get(e) : NaN;
    }
    count(e = 'milliseconds') {
        if (!this.isValid) return NaN;
        const n = this.start.startOf(e),
            i = this.end.startOf(e);
        return Math.floor(i.diff(n, e).get(e)) + 1;
    }
    hasSame(e) {
        return !!this.isValid && this.e.minus(1).hasSame(this.s, e);
    }
    isEmpty() {
        return this.s.valueOf() === this.e.valueOf();
    }
    isAfter(e) {
        return !!this.isValid && this.s > e;
    }
    isBefore(e) {
        return !!this.isValid && this.e <= e;
    }
    contains(e) {
        return !!this.isValid && this.s <= e && this.e > e;
    }
    set({ start: e, end: n } = {}) {
        return this.isValid ? Interval.fromDateTimes(e || this.s, n || this.e) : this;
    }
    splitAt(...e) {
        if (!this.isValid) return [];
        const n = e.map(friendlyDateTime).sort(),
            a = [];
        for (let { s: o } = this, s = 0; o < this.e; ) {
            const e = n[s] || this.e,
                i = +e > +this.e ? this.e : e;
            a.push(Interval.fromDateTimes(o, i)), (o = i), (s += 1);
        }
        return a;
    }
    splitBy(e) {
        const n = friendlyDuration(e);
        if (!this.isValid || !n.isValid || 0 === n.as('milliseconds')) return [];
        let i,
            a,
            { s: o } = this;
        const t = [];
        for (; o < this.e; )
            (i = o.plus(n)), (a = +i > +this.e ? this.e : i), t.push(Interval.fromDateTimes(o, a)), (o = a);
        return t;
    }
    divideEqually(e) {
        return this.isValid ? this.splitBy(this.length() / e).slice(0, e) : [];
    }
    overlaps(e) {
        return this.e > e.s && this.s < e.e;
    }
    abutsStart(e) {
        return !!this.isValid && +this.e == +e.s;
    }
    abutsEnd(e) {
        return !!this.isValid && +e.e == +this.s;
    }
    engulfs(e) {
        return !!this.isValid && this.s <= e.s && this.e >= e.e;
    }
    equals(e) {
        return !!(this.isValid && e.isValid) && this.s.equals(e.s) && this.e.equals(e.e);
    }
    intersection(n) {
        if (!this.isValid) return this;
        const i = this.s > n.s ? this.s : n.s,
            a = this.e < n.e ? this.e : n.e;
        return i > a ? null : Interval.fromDateTimes(i, a);
    }
    union(n) {
        if (!this.isValid) return this;
        const i = this.s < n.s ? this.s : n.s,
            a = this.e > n.e ? this.e : n.e;
        return Interval.fromDateTimes(i, a);
    }
    static merge(e) {
        const [n, i] = e
            .sort((e, n) => e.s - n.s)
            .reduce(
                ([e, n], i) => (n ? (n.overlaps(i) || n.abutsStart(i) ? [e, n.union(i)] : [e.concat([n]), i]) : [e, i]),
                [[], null]
            );
        return i && n.push(i), n;
    }
    static xor(e) {
        let n = null,
            a = 0;
        const o = [],
            s = e.map(e => [
                { time: e.s, type: 's' },
                { time: e.e, type: 'e' }
            ]),
            t = Array.prototype.concat(...s),
            d = t.sort((e, n) => e.time - n.time);
        for (const s of d)
            (a += 's' === s.type ? 1 : -1),
                1 == a ? (n = s.time) : (n && +n != +s.time && o.push(Interval.fromDateTimes(n, s.time)), (n = null));
        return Interval.merge(o);
    }
    difference(...e) {
        return Interval.xor([this].concat(e))
            .map(e => this.intersection(e))
            .filter(e => e && !e.isEmpty());
    }
    toString() {
        return this.isValid ? `[${this.s.toISO()} – ${this.e.toISO()})` : INVALID$1;
    }
    toISO(e) {
        return this.isValid ? `${this.s.toISO(e)}/${this.e.toISO(e)}` : INVALID$1;
    }
    toFormat(e, { separator: n = ' \u2013 ' } = {}) {
        return this.isValid ? `${this.s.toFormat(e)}${n}${this.e.toFormat(e)}` : INVALID$1;
    }
    toDuration(e, n) {
        return this.isValid ? this.e.diff(this.s, e, n) : Duration.invalid(this.invalidReason);
    }
    mapEndpoints(e) {
        return Interval.fromDateTimes(e(this.s), e(this.e));
    }
}
class Info {
    static hasDST(e = Settings.defaultZone) {
        const n = DateTime.local()
            .setZone(e)
            .set({ month: 12 });
        return !e.universal && n.offset !== n.set({ month: 6 }).offset;
    }
    static isValidIANAZone(e) {
        return IANAZone.isValidSpecifier(e) && IANAZone.isValidZone(e);
    }
    static normalizeZone(e) {
        return normalizeZone(e, Settings.defaultZone);
    }
    static months(e = 'long', { locale: n = null, numberingSystem: i = null, outputCalendar: a = 'gregory' } = {}) {
        return Locale.create(n, i, a).months(e);
    }
    static monthsFormat(
        e = 'long',
        { locale: n = null, numberingSystem: i = null, outputCalendar: a = 'gregory' } = {}
    ) {
        return Locale.create(n, i, a).months(e, !0);
    }
    static weekdays(e = 'long', { locale: n = null, numberingSystem: i = null } = {}) {
        return Locale.create(n, i, null).weekdays(e);
    }
    static weekdaysFormat(e = 'long', { locale: n = null, numberingSystem: i = null } = {}) {
        return Locale.create(n, i, null).weekdays(e, !0);
    }
    static meridiems({ locale: e = null } = {}) {
        return Locale.create(e).meridiems();
    }
    static eras(e = 'short', { locale: n = null } = {}) {
        return Locale.create(n, null, 'gregory').eras(e);
    }
    static features() {
        let e = !1,
            n = !1,
            i = !1,
            a = hasRelative();
        if (hasIntl()) {
            (e = !0), (n = hasFormatToParts());
            try {
                i =
                    'America/New_York' ===
                    new Intl.DateTimeFormat('en', { timeZone: 'America/New_York' }).resolvedOptions().timeZone;
            } catch (n) {
                i = !1;
            }
        }
        return { intl: e, intlTokens: n, zones: i, relative: a };
    }
}
function dayDiff(e, n) {
    const i = e =>
            e
                .toUTC(0, { keepLocalTime: !0 })
                .startOf('day')
                .valueOf(),
        a = i(n) - i(e);
    return Math.floor(Duration.fromMillis(a).as('days'));
}
function highOrderDiffs(e, n, i) {
    const a = [
            ['years', (e, n) => n.year - e.year],
            ['months', (e, n) => n.month - e.month + 12 * (n.year - e.year)],
            [
                'weeks',
                (e, n) => {
                    const i = dayDiff(e, n);
                    return (i - (i % 7)) / 7;
                }
            ],
            ['days', dayDiff]
        ],
        o = {};
    let s, t;
    for (const [d, r] of a)
        if (0 <= i.indexOf(d)) {
            s = d;
            let i = r(e, n);
            (t = e.plus({ [d]: i })), t > n ? ((e = e.plus({ [d]: i - 1 })), (i -= 1)) : (e = t), (o[d] = i);
        }
    return [e, o, t, s];
}
function diff(e, n, i, a) {
    let [o, s, t, d] = highOrderDiffs(e, n, i);
    const r = n - o,
        l = i.filter(e => 0 <= ['hours', 'minutes', 'seconds', 'milliseconds'].indexOf(e));
    0 === l.length && (t < n && (t = o.plus({ [d]: 1 })), t !== o && (s[d] = (s[d] || 0) + r / (t - o)));
    const u = Duration.fromObject(Object.assign(s, a));
    return 0 < l.length
        ? Duration.fromMillis(r, a)
              .shiftTo(...l)
              .plus(u)
        : u;
}
const numberingSystems = {
        arab: '[\u0660-\u0669]',
        arabext: '[\u06F0-\u06F9]',
        bali: '[\u1B50-\u1B59]',
        beng: '[\u09E6-\u09EF]',
        deva: '[\u0966-\u096F]',
        fullwide: '[\uFF10-\uFF19]',
        gujr: '[\u0AE6-\u0AEF]',
        hanidec: '[\u3007|\u4E00|\u4E8C|\u4E09|\u56DB|\u4E94|\u516D|\u4E03|\u516B|\u4E5D]',
        khmr: '[\u17E0-\u17E9]',
        knda: '[\u0CE6-\u0CEF]',
        laoo: '[\u0ED0-\u0ED9]',
        limb: '[\u1946-\u194F]',
        mlym: '[\u0D66-\u0D6F]',
        mong: '[\u1810-\u1819]',
        mymr: '[\u1040-\u1049]',
        orya: '[\u0B66-\u0B6F]',
        tamldec: '[\u0BE6-\u0BEF]',
        telu: '[\u0C66-\u0C6F]',
        thai: '[\u0E50-\u0E59]',
        tibt: '[\u0F20-\u0F29]',
        latn: '\\d'
    },
    numberingSystemsUTF16 = {
        arab: [1632, 1641],
        arabext: [1776, 1785],
        bali: [6992, 7001],
        beng: [2534, 2543],
        deva: [2406, 2415],
        fullwide: [65296, 65303],
        gujr: [2790, 2799],
        khmr: [6112, 6121],
        knda: [3302, 3311],
        laoo: [3792, 3801],
        limb: [6470, 6479],
        mlym: [3430, 3439],
        mong: [6160, 6169],
        mymr: [4160, 4169],
        orya: [2918, 2927],
        tamldec: [3046, 3055],
        telu: [3174, 3183],
        thai: [3664, 3673],
        tibt: [3872, 3881]
    },
    hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, '').split('');
function parseDigits(e) {
    let n = parseInt(e, 10);
    if (isNaN(n)) {
        n = '';
        for (let a = 0; a < e.length; a++) {
            const i = e.charCodeAt(a);
            if (-1 !== e[a].search(numberingSystems.hanidec)) n += hanidecChars.indexOf(e[a]);
            else
                for (let e in numberingSystemsUTF16) {
                    const [a, o] = numberingSystemsUTF16[e];
                    i >= a && i <= o && (n += i - a);
                }
        }
        return parseInt(n, 10);
    }
    return n;
}
function digitRegex({ numberingSystem: e }, n = '') {
    return new RegExp(`${numberingSystems[e || 'latn']}${n}`);
}
const MISSING_FTP = 'missing Intl.DateTimeFormat.formatToParts support';
function intUnit(e, n = e => e) {
    return { regex: e, deser: ([e]) => n(parseDigits(e)) };
}
function fixListRegex(e) {
    return e.replace(/\./, '\\.?');
}
function stripInsensitivities(e) {
    return e.replace(/\./, '').toLowerCase();
}
function oneOf(e, n) {
    return null === e
        ? null
        : {
              regex: RegExp(e.map(fixListRegex).join('|')),
              deser: ([a]) => e.findIndex(e => stripInsensitivities(a) === stripInsensitivities(e)) + n
          };
}
function offset(e, n) {
    return { regex: e, deser: ([, e, n]) => signedOffset(e, n), groups: n };
}
function simple(e) {
    return { regex: e, deser: ([e]) => e };
}
function escapeToken(e) {
    return e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}
function unitForToken(e, n) {
    const i = digitRegex(n),
        a = digitRegex(n, '{2}'),
        o = digitRegex(n, '{3}'),
        s = digitRegex(n, '{4}'),
        d = digitRegex(n, '{6}'),
        r = digitRegex(n, '{1,2}'),
        l = digitRegex(n, '{1,3}'),
        u = digitRegex(n, '{1,6}'),
        m = digitRegex(n, '{1,9}'),
        c = digitRegex(n, '{2,4}'),
        f = digitRegex(n, '{4,6}'),
        y = e => ({ regex: RegExp(escapeToken(e.val)), deser: ([e]) => e, literal: !0 }),
        h = (h => {
            if (e.literal) return y(h);
            switch (h.val) {
                case 'G':
                    return oneOf(n.eras('short', !1), 0);
                case 'GG':
                    return oneOf(n.eras('long', !1), 0);
                case 'y':
                    return intUnit(u);
                case 'yy':
                    return intUnit(c, untruncateYear);
                case 'yyyy':
                    return intUnit(s);
                case 'yyyyy':
                    return intUnit(f);
                case 'yyyyyy':
                    return intUnit(d);
                case 'M':
                    return intUnit(r);
                case 'MM':
                    return intUnit(a);
                case 'MMM':
                    return oneOf(n.months('short', !0, !1), 1);
                case 'MMMM':
                    return oneOf(n.months('long', !0, !1), 1);
                case 'L':
                    return intUnit(r);
                case 'LL':
                    return intUnit(a);
                case 'LLL':
                    return oneOf(n.months('short', !1, !1), 1);
                case 'LLLL':
                    return oneOf(n.months('long', !1, !1), 1);
                case 'd':
                    return intUnit(r);
                case 'dd':
                    return intUnit(a);
                case 'o':
                    return intUnit(l);
                case 'ooo':
                    return intUnit(o);
                case 'HH':
                    return intUnit(a);
                case 'H':
                    return intUnit(r);
                case 'hh':
                    return intUnit(a);
                case 'h':
                    return intUnit(r);
                case 'mm':
                    return intUnit(a);
                case 'm':
                    return intUnit(r);
                case 's':
                    return intUnit(r);
                case 'ss':
                    return intUnit(a);
                case 'S':
                    return intUnit(l);
                case 'SSS':
                    return intUnit(o);
                case 'u':
                    return simple(m);
                case 'a':
                    return oneOf(n.meridiems(), 0);
                case 'kkkk':
                    return intUnit(s);
                case 'kk':
                    return intUnit(c, untruncateYear);
                case 'W':
                    return intUnit(r);
                case 'WW':
                    return intUnit(a);
                case 'E':
                case 'c':
                    return intUnit(i);
                case 'EEE':
                    return oneOf(n.weekdays('short', !1, !1), 1);
                case 'EEEE':
                    return oneOf(n.weekdays('long', !1, !1), 1);
                case 'ccc':
                    return oneOf(n.weekdays('short', !0, !1), 1);
                case 'cccc':
                    return oneOf(n.weekdays('long', !0, !1), 1);
                case 'Z':
                case 'ZZ':
                    return offset(new RegExp(`([+-]${r.source})(?::(${a.source}))?`), 2);
                case 'ZZZ':
                    return offset(new RegExp(`([+-]${r.source})(${a.source})?`), 2);
                case 'z':
                    return simple(/[a-z_+-/]{1,256}?/i);
                default:
                    return y(h);
            }
        })(e) || { invalidReason: MISSING_FTP };
    return (h.token = e), h;
}
function buildRegex(e) {
    const n = e.map(e => e.regex).reduce((e, n) => `${e}(${n.source})`, '');
    return [`^${n}$`, e];
}
function match(e, n, a) {
    const o = e.match(n);
    if (o) {
        const e = {};
        let n = 1;
        for (const s in a)
            if (a.hasOwnProperty(s)) {
                const i = a[s],
                    t = i.groups ? i.groups + 1 : 1;
                !i.literal && i.token && (e[i.token.val[0]] = i.deser(o.slice(n, n + t))), (n += t);
            }
        return [o, e];
    }
    return [o, {}];
}
function dateTimeFromMatches(e) {
    const n = e =>
        'S' === e
            ? 'millisecond'
            : 's' === e
            ? 'second'
            : 'm' === e
            ? 'minute'
            : 'h' === e || 'H' === e
            ? 'hour'
            : 'd' === e
            ? 'day'
            : 'o' === e
            ? 'ordinal'
            : 'L' === e || 'M' === e
            ? 'month'
            : 'y' === e
            ? 'year'
            : 'E' === e || 'c' === e
            ? 'weekday'
            : 'W' === e
            ? 'weekNumber'
            : 'k' === e
            ? 'weekYear'
            : null;
    let i;
    (i = isUndefined(e.Z) ? (isUndefined(e.z) ? null : IANAZone.create(e.z)) : new FixedOffsetZone(e.Z)),
        isUndefined(e.h) || (12 > e.h && 1 === e.a ? (e.h += 12) : 12 === e.h && 0 === e.a && (e.h = 0)),
        0 === e.G && e.y && (e.y = -e.y),
        isUndefined(e.u) || (e.S = parseMillis(e.u));
    const a = Object.keys(e).reduce((i, a) => {
        const o = n(a);
        return o && (i[o] = e[a]), i;
    }, {});
    return [a, i];
}
function explainFromTokens(e, n, i) {
    const a = Formatter.parseFormat(i),
        o = a.map(n => unitForToken(n, e)),
        s = o.find(e => e.invalidReason);
    if (s) return { input: n, tokens: a, invalidReason: s.invalidReason };
    else {
        const [e, i] = buildRegex(o),
            s = RegExp(e, 'i'),
            [t, d] = match(n, s, i),
            [r, l] = d ? dateTimeFromMatches(d) : [null, null];
        return { input: n, tokens: a, regex: s, rawMatches: t, matches: d, result: r, zone: l };
    }
}
function parseFromTokens(e, n, i) {
    const { result: a, zone: o, invalidReason: s } = explainFromTokens(e, n, i);
    return [a, o, s];
}
const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function unitOutOfRange(e, n) {
    return new Invalid('unit out of range', `you specified ${n} (of type ${typeof n}) as a ${e}, which is invalid`);
}
function dayOfWeek(e, n, i) {
    const a = new Date(Date.UTC(e, n - 1, i)).getUTCDay();
    return 0 === a ? 7 : a;
}
function computeOrdinal(e, n, i) {
    return i + (isLeapYear(e) ? leapLadder : nonLeapLadder)[n - 1];
}
function uncomputeOrdinal(e, n) {
    const i = isLeapYear(e) ? leapLadder : nonLeapLadder,
        a = i.findIndex(e => e < n),
        o = n - i[a];
    return { month: a + 1, day: o };
}
function gregorianToWeek(e) {
    const { year: n, month: i, day: a } = e,
        o = computeOrdinal(n, i, a),
        s = dayOfWeek(n, i, a);
    let t,
        d = Math.floor((o - s + 10) / 7);
    return (
        1 > d ? ((t = n - 1), (d = weeksInWeekYear(t))) : d > weeksInWeekYear(n) ? ((t = n + 1), (d = 1)) : (t = n),
        Object.assign({ weekYear: t, weekNumber: d, weekday: s }, timeObject(e))
    );
}
function weekToGregorian(e) {
    const { weekYear: n, weekNumber: i, weekday: a } = e,
        o = dayOfWeek(n, 1, 4),
        s = daysInYear(n);
    let t,
        d = 7 * i + a - o - 3;
    1 > d ? ((t = n - 1), (d += daysInYear(t))) : d > s ? ((t = n + 1), (d -= daysInYear(n))) : (t = n);
    const { month: r, day: l } = uncomputeOrdinal(t, d);
    return Object.assign({ year: t, month: r, day: l }, timeObject(e));
}
function gregorianToOrdinal(e) {
    const { year: n, month: i, day: a } = e,
        o = computeOrdinal(n, i, a);
    return Object.assign({ year: n, ordinal: o }, timeObject(e));
}
function ordinalToGregorian(e) {
    const { year: n, ordinal: i } = e,
        { month: a, day: o } = uncomputeOrdinal(n, i);
    return Object.assign({ year: n, month: a, day: o }, timeObject(e));
}
function hasInvalidWeekData(e) {
    const n = isNumber(e.weekYear),
        i = numberBetween(e.weekNumber, 1, weeksInWeekYear(e.weekYear)),
        a = numberBetween(e.weekday, 1, 7);
    return n
        ? i
            ? !a && unitOutOfRange('weekday', e.weekday)
            : unitOutOfRange('week', e.week)
        : unitOutOfRange('weekYear', e.weekYear);
}
function hasInvalidOrdinalData(e) {
    const n = isNumber(e.year),
        i = numberBetween(e.ordinal, 1, daysInYear(e.year));
    return n ? !i && unitOutOfRange('ordinal', e.ordinal) : unitOutOfRange('year', e.year);
}
function hasInvalidGregorianData(e) {
    const n = isNumber(e.year),
        i = numberBetween(e.month, 1, 12),
        a = numberBetween(e.day, 1, daysInMonth(e.year, e.month));
    return n
        ? i
            ? !a && unitOutOfRange('day', e.day)
            : unitOutOfRange('month', e.month)
        : unitOutOfRange('year', e.year);
}
function hasInvalidTimeData(e) {
    const { hour: n, minute: i, second: a, millisecond: o } = e,
        s = numberBetween(n, 0, 23) || (24 === n && 0 === i && 0 === a && 0 === o),
        t = numberBetween(i, 0, 59),
        d = numberBetween(a, 0, 59),
        r = numberBetween(o, 0, 999);
    return s
        ? t
            ? d
                ? !r && unitOutOfRange('millisecond', o)
                : unitOutOfRange('second', a)
            : unitOutOfRange('minute', i)
        : unitOutOfRange('hour', n);
}
const INVALID$2 = 'Invalid DateTime';
function unsupportedZone(e) {
    return new Invalid('unsupported zone', `the zone "${e.name}" is not supported`);
}
function possiblyCachedWeekData(e) {
    return null === e.weekData && (e.weekData = gregorianToWeek(e.c)), e.weekData;
}
function clone$1(e, n) {
    const i = { ts: e.ts, zone: e.zone, c: e.c, o: e.o, loc: e.loc, invalid: e.invalid };
    return new DateTime(Object.assign({}, i, n, { old: i }));
}
function fixOffset(e, n, i) {
    let a = e - 1e3 * (60 * n);
    const o = i.offset(a);
    if (n === o) return [a, n];
    a -= 1e3 * (60 * (o - n));
    const s = i.offset(a);
    return o === s ? [a, o] : [e - 1e3 * (60 * Math.min(o, s)), Math.max(o, s)];
}
function tsToObj(e, n) {
    e += 1e3 * (60 * n);
    const i = new Date(e);
    return {
        year: i.getUTCFullYear(),
        month: i.getUTCMonth() + 1,
        day: i.getUTCDate(),
        hour: i.getUTCHours(),
        minute: i.getUTCMinutes(),
        second: i.getUTCSeconds(),
        millisecond: i.getUTCMilliseconds()
    };
}
function objToTS(e, n, i) {
    return fixOffset(objToLocalTS(e), n, i);
}
function adjustTime(e, n) {
    const i = e.o,
        a = e.c.year + n.years,
        s = e.c.month + n.months + 3 * n.quarters,
        t = Object.assign({}, e.c, {
            year: a,
            month: s,
            day: Math.min(e.c.day, daysInMonth(a, s)) + n.days + 7 * n.weeks
        }),
        d = Duration.fromObject({
            hours: n.hours,
            minutes: n.minutes,
            seconds: n.seconds,
            milliseconds: n.milliseconds
        }).as('milliseconds'),
        r = objToLocalTS(t);
    let [l, u] = fixOffset(r, i, e.zone);
    return 0 !== d && ((l += d), (u = e.zone.offset(l))), { ts: l, o: u };
}
function parseDataToDateTime(e, n, i, a, o) {
    const { setZone: s, zone: t } = i;
    if (e && 0 !== Object.keys(e).length) {
        const a = DateTime.fromObject(Object.assign(e, i, { zone: n || t, setZone: void 0 }));
        return s ? a : a.setZone(t);
    }
    return DateTime.invalid(new Invalid('unparsable', `the input "${o}" can't be parsed as ${a}`));
}
function toTechFormat(e, n) {
    return e.isValid
        ? Formatter.create(Locale.create('en-US'), { allowZ: !0, forceSimple: !0 }).formatDateTimeFromString(e, n)
        : null;
}
function toTechTimeFormat(
    e,
    { suppressSeconds: i = !1, suppressMilliseconds: a = !1, includeOffset: n, includeZone: o = !1, spaceZone: s = !1 }
) {
    let t = 'HH:mm';
    return (
        (i && 0 === e.second && 0 === e.millisecond) || ((t += ':ss'), (!a || 0 !== e.millisecond) && (t += '.SSS')),
        (o || n) && s && (t += ' '),
        o ? (t += 'z') : n && (t += 'ZZ'),
        toTechFormat(e, t)
    );
}
const defaultUnitValues = { month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    defaultWeekUnitValues = { weekNumber: 1, weekday: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    defaultOrdinalUnitValues = { ordinal: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    orderedUnits$1 = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'],
    orderedWeekUnits = ['weekYear', 'weekNumber', 'weekday', 'hour', 'minute', 'second', 'millisecond'],
    orderedOrdinalUnits = ['year', 'ordinal', 'hour', 'minute', 'second', 'millisecond'];
function normalizeUnit(e) {
    const n = {
        year: 'year',
        years: 'year',
        month: 'month',
        months: 'month',
        day: 'day',
        days: 'day',
        hour: 'hour',
        hours: 'hour',
        minute: 'minute',
        minutes: 'minute',
        second: 'second',
        seconds: 'second',
        millisecond: 'millisecond',
        milliseconds: 'millisecond',
        weekday: 'weekday',
        weekdays: 'weekday',
        weeknumber: 'weekNumber',
        weeksnumber: 'weekNumber',
        weeknumbers: 'weekNumber',
        weekyear: 'weekYear',
        weekyears: 'weekYear',
        ordinal: 'ordinal'
    }[e.toLowerCase()];
    if (!n) throw new InvalidUnitError(e);
    return n;
}
function quickDT(e, n) {
    for (const i of orderedUnits$1) isUndefined(e[i]) && (e[i] = defaultUnitValues[i]);
    const i = hasInvalidGregorianData(e) || hasInvalidTimeData(e);
    if (i) return DateTime.invalid(i);
    const a = Settings.now(),
        s = n.offset(a),
        [t, d] = objToTS(e, s, n);
    return new DateTime({ ts: t, zone: n, o: d });
}
function diffRelative(e, n, i) {
    const a = !!isUndefined(i.round) || i.round,
        o = (e, o) => {
            e = roundTo(e, a || i.calendary ? 0 : 2, !0);
            const s = n.loc.clone(i).relFormatter(i);
            return s.format(e, o);
        },
        s = a =>
            i.calendary
                ? n.hasSame(e, a)
                    ? 0
                    : n
                          .startOf(a)
                          .diff(e.startOf(a), a)
                          .get(a)
                : n.diff(e, a).get(a);
    if (i.unit) return o(s(i.unit), i.unit);
    for (const a of i.units) {
        const e = s(a);
        if (1 <= Math.abs(e)) return o(e, a);
    }
    return o(0, i.units[i.units.length - 1]);
}
class DateTime {
    constructor(e) {
        const n = e.zone || Settings.defaultZone,
            i =
                e.invalid ||
                (Number.isNaN(e.ts) ? new Invalid('invalid input') : null) ||
                (n.isValid ? null : unsupportedZone(n));
        this.ts = isUndefined(e.ts) ? Settings.now() : e.ts;
        let a = null,
            s = null;
        if (!i) {
            const i = e.old && e.old.ts === this.ts && e.old.zone.equals(n);
            (a = i ? e.old.c : tsToObj(this.ts, n.offset(this.ts))), (s = i ? e.old.o : n.offset(this.ts));
        }
        (this._zone = n),
            (this.loc = e.loc || Locale.create()),
            (this.invalid = i),
            (this.weekData = null),
            (this.c = a),
            (this.o = s),
            (this.isLuxonDateTime = !0);
    }
    static local(e, n, i, a, o, s, t) {
        return isUndefined(e)
            ? new DateTime({ ts: Settings.now() })
            : quickDT(
                  { year: e, month: n, day: i, hour: a, minute: o, second: s, millisecond: t },
                  Settings.defaultZone
              );
    }
    static utc(e, n, i, a, o, s, t) {
        return isUndefined(e)
            ? new DateTime({ ts: Settings.now(), zone: FixedOffsetZone.utcInstance })
            : quickDT(
                  { year: e, month: n, day: i, hour: a, minute: o, second: s, millisecond: t },
                  FixedOffsetZone.utcInstance
              );
    }
    static fromJSDate(e, n = {}) {
        const i = isDate(e) ? e.valueOf() : NaN;
        if (Number.isNaN(i)) return DateTime.invalid('invalid input');
        const a = normalizeZone(n.zone, Settings.defaultZone);
        return a.isValid
            ? new DateTime({ ts: i, zone: a, loc: Locale.fromObject(n) })
            : DateTime.invalid(unsupportedZone(a));
    }
    static fromMillis(e, n = {}) {
        if (!isNumber(e)) throw new InvalidArgumentError('fromMillis requires a numerical input');
        else
            return new DateTime({
                ts: e,
                zone: normalizeZone(n.zone, Settings.defaultZone),
                loc: Locale.fromObject(n)
            });
    }
    static fromSeconds(e, n = {}) {
        if (!isNumber(e)) throw new InvalidArgumentError('fromSeconds requires a numerical input');
        else
            return new DateTime({
                ts: 1e3 * e,
                zone: normalizeZone(n.zone, Settings.defaultZone),
                loc: Locale.fromObject(n)
            });
    }
    static fromObject(e) {
        const n = normalizeZone(e.zone, Settings.defaultZone);
        if (!n.isValid) return DateTime.invalid(unsupportedZone(n));
        const i = Settings.now(),
            a = n.offset(i),
            o = normalizeObject(e, normalizeUnit, ['zone', 'locale', 'outputCalendar', 'numberingSystem']),
            s = !isUndefined(o.ordinal),
            t = !isUndefined(o.year),
            d = !isUndefined(o.month) || !isUndefined(o.day),
            r = t || d,
            l = o.weekYear || o.weekNumber,
            u = Locale.fromObject(e);
        if ((r || s) && l)
            throw new ConflictingSpecificationError(
                "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
            );
        if (d && s) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
        const m = l || (o.weekday && !r);
        let c,
            f,
            y = tsToObj(i, a);
        m
            ? ((c = orderedWeekUnits), (f = defaultWeekUnitValues), (y = gregorianToWeek(y)))
            : s
            ? ((c = orderedOrdinalUnits), (f = defaultOrdinalUnitValues), (y = gregorianToOrdinal(y)))
            : ((c = orderedUnits$1), (f = defaultUnitValues));
        let h = !1;
        for (const n of c) {
            const e = o[n];
            isUndefined(e) ? (h ? (o[n] = f[n]) : (o[n] = y[n])) : (h = !0);
        }
        const g = m ? hasInvalidWeekData(o) : s ? hasInvalidOrdinalData(o) : hasInvalidGregorianData(o),
            p = g || hasInvalidTimeData(o);
        if (p) return DateTime.invalid(p);
        const k = m ? weekToGregorian(o) : s ? ordinalToGregorian(o) : o,
            [w, v] = objToTS(k, a, n),
            S = new DateTime({ ts: w, zone: n, o: v, loc: u });
        return o.weekday && r && e.weekday !== S.weekday
            ? DateTime.invalid(
                  'mismatched weekday',
                  `you can't specify both a weekday of ${o.weekday} and a date of ${S.toISO()}`
              )
            : S;
    }
    static fromISO(e, n = {}) {
        const [i, a] = parseISODate(e);
        return parseDataToDateTime(i, a, n, 'ISO 8601', e);
    }
    static fromRFC2822(e, n = {}) {
        const [i, a] = parseRFC2822Date(e);
        return parseDataToDateTime(i, a, n, 'RFC 2822', e);
    }
    static fromHTTP(e, n = {}) {
        const [i, a] = parseHTTPDate(e);
        return parseDataToDateTime(i, a, n, 'HTTP', n);
    }
    static fromFormat(e, n, i = {}) {
        if (isUndefined(e) || isUndefined(n))
            throw new InvalidArgumentError('fromFormat requires an input string and a format');
        const { locale: a = null, numberingSystem: o = null } = i,
            s = Locale.fromOpts({ locale: a, numberingSystem: o, defaultToEN: !0 }),
            [t, d, r] = parseFromTokens(s, e, n);
        return r ? DateTime.invalid(r) : parseDataToDateTime(t, d, i, `format ${n}`, e);
    }
    static fromString(e, n, i = {}) {
        return DateTime.fromFormat(e, n, i);
    }
    static fromSQL(e, n = {}) {
        const [i, a] = parseSQL(e);
        return parseDataToDateTime(i, a, n, 'SQL', e);
    }
    static invalid(e, n = null) {
        if (!e) throw new InvalidArgumentError('need to specify a reason the DateTime is invalid');
        const i = e instanceof Invalid ? e : new Invalid(e, n);
        if (Settings.throwOnInvalid) throw new InvalidDateTimeError(i);
        else return new DateTime({ invalid: i });
    }
    static isDateTime(e) {
        return (e && e.isLuxonDateTime) || !1;
    }
    get(e) {
        return this[e];
    }
    get isValid() {
        return null === this.invalid;
    }
    get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
    }
    get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
    }
    get locale() {
        return this.isValid ? this.loc.locale : null;
    }
    get numberingSystem() {
        return this.isValid ? this.loc.numberingSystem : null;
    }
    get outputCalendar() {
        return this.isValid ? this.loc.outputCalendar : null;
    }
    get zone() {
        return this._zone;
    }
    get zoneName() {
        return this.isValid ? this.zone.name : null;
    }
    get year() {
        return this.isValid ? this.c.year : NaN;
    }
    get quarter() {
        return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
    }
    get month() {
        return this.isValid ? this.c.month : NaN;
    }
    get day() {
        return this.isValid ? this.c.day : NaN;
    }
    get hour() {
        return this.isValid ? this.c.hour : NaN;
    }
    get minute() {
        return this.isValid ? this.c.minute : NaN;
    }
    get second() {
        return this.isValid ? this.c.second : NaN;
    }
    get millisecond() {
        return this.isValid ? this.c.millisecond : NaN;
    }
    get weekYear() {
        return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
    }
    get weekNumber() {
        return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
    }
    get weekday() {
        return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
    }
    get ordinal() {
        return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
    }
    get monthShort() {
        return this.isValid ? Info.months('short', { locale: this.locale })[this.month - 1] : null;
    }
    get monthLong() {
        return this.isValid ? Info.months('long', { locale: this.locale })[this.month - 1] : null;
    }
    get weekdayShort() {
        return this.isValid ? Info.weekdays('short', { locale: this.locale })[this.weekday - 1] : null;
    }
    get weekdayLong() {
        return this.isValid ? Info.weekdays('long', { locale: this.locale })[this.weekday - 1] : null;
    }
    get offset() {
        return this.isValid ? this.zone.offset(this.ts) : NaN;
    }
    get offsetNameShort() {
        return this.isValid ? this.zone.offsetName(this.ts, { format: 'short', locale: this.locale }) : null;
    }
    get offsetNameLong() {
        return this.isValid ? this.zone.offsetName(this.ts, { format: 'long', locale: this.locale }) : null;
    }
    get isOffsetFixed() {
        return this.isValid ? this.zone.universal : null;
    }
    get isInDST() {
        return (
            !this.isOffsetFixed &&
            (this.offset > this.set({ month: 1 }).offset || this.offset > this.set({ month: 5 }).offset)
        );
    }
    get isInLeapYear() {
        return isLeapYear(this.year);
    }
    get daysInMonth() {
        return daysInMonth(this.year, this.month);
    }
    get daysInYear() {
        return this.isValid ? daysInYear(this.year) : NaN;
    }
    get weeksInWeekYear() {
        return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
    }
    resolvedLocaleOpts(e = {}) {
        const { locale: n, numberingSystem: i, calendar: a } = Formatter.create(this.loc.clone(e), e).resolvedOptions(
            this
        );
        return { locale: n, numberingSystem: i, outputCalendar: a };
    }
    toUTC(e = 0, n = {}) {
        return this.setZone(FixedOffsetZone.instance(e), n);
    }
    toLocal() {
        return this.setZone(Settings.defaultZone);
    }
    setZone(e, { keepLocalTime: n = !1, keepCalendarTime: i = !1 } = {}) {
        if (((e = normalizeZone(e, Settings.defaultZone)), e.equals(this.zone))) return this;
        if (!e.isValid) return DateTime.invalid(unsupportedZone(e));
        else {
            let a = this.ts;
            if (n || i) {
                const n = this.o - e.offset(this.ts),
                    i = this.toObject();
                [a] = objToTS(i, n, e);
            }
            return clone$1(this, { ts: a, zone: e });
        }
    }
    reconfigure({ locale: e, numberingSystem: n, outputCalendar: i } = {}) {
        const a = this.loc.clone({ locale: e, numberingSystem: n, outputCalendar: i });
        return clone$1(this, { loc: a });
    }
    setLocale(e) {
        return this.reconfigure({ locale: e });
    }
    set(e) {
        if (!this.isValid) return this;
        const n = normalizeObject(e, normalizeUnit, []),
            i = !isUndefined(n.weekYear) || !isUndefined(n.weekNumber) || !isUndefined(n.weekday);
        let a;
        i
            ? (a = weekToGregorian(Object.assign(gregorianToWeek(this.c), n)))
            : isUndefined(n.ordinal)
            ? ((a = Object.assign(this.toObject(), n)),
              isUndefined(n.day) && (a.day = Math.min(daysInMonth(a.year, a.month), a.day)))
            : (a = ordinalToGregorian(Object.assign(gregorianToOrdinal(this.c), n)));
        const [s, t] = objToTS(a, this.o, this.zone);
        return clone$1(this, { ts: s, o: t });
    }
    plus(e) {
        if (!this.isValid) return this;
        const n = friendlyDuration(e);
        return clone$1(this, adjustTime(this, n));
    }
    minus(e) {
        if (!this.isValid) return this;
        const n = friendlyDuration(e).negate();
        return clone$1(this, adjustTime(this, n));
    }
    startOf(e) {
        if (!this.isValid) return this;
        const n = {},
            i = Duration.normalizeUnit(e);
        switch (i) {
            case 'years':
                n.month = 1;
            case 'quarters':
            case 'months':
                n.day = 1;
            case 'weeks':
            case 'days':
                n.hour = 0;
            case 'hours':
                n.minute = 0;
            case 'minutes':
                n.second = 0;
            case 'seconds':
                n.millisecond = 0;
                break;
            case 'milliseconds':
        }
        if (('weeks' === i && (n.weekday = 1), 'quarters' === i)) {
            const e = Math.ceil(this.month / 3);
            n.month = 3 * (e - 1) + 1;
        }
        return this.set(n);
    }
    endOf(e) {
        return this.isValid
            ? this.plus({ [e]: 1 })
                  .startOf(e)
                  .minus(1)
            : this;
    }
    toFormat(e, n = {}) {
        return this.isValid ? Formatter.create(this.loc.redefaultToEN(n)).formatDateTimeFromString(this, e) : INVALID$2;
    }
    toLocaleString(e = DATE_SHORT) {
        return this.isValid ? Formatter.create(this.loc.clone(e), e).formatDateTime(this) : INVALID$2;
    }
    toLocaleParts(e = {}) {
        return this.isValid ? Formatter.create(this.loc.clone(e), e).formatDateTimeParts(this) : [];
    }
    toISO(e = {}) {
        return this.isValid ? `${this.toISODate()}T${this.toISOTime(e)}` : null;
    }
    toISODate() {
        let e = 'yyyy-MM-dd';
        return 9999 < this.year && (e = '+' + e), toTechFormat(this, e);
    }
    toISOWeekDate() {
        return toTechFormat(this, "kkkk-'W'WW-c");
    }
    toISOTime({ suppressMilliseconds: e = !1, suppressSeconds: n = !1, includeOffset: i = !0 } = {}) {
        return toTechTimeFormat(this, { suppressSeconds: n, suppressMilliseconds: e, includeOffset: i });
    }
    toRFC2822() {
        return toTechFormat(this, 'EEE, dd LLL yyyy HH:mm:ss ZZZ');
    }
    toHTTP() {
        return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
    }
    toSQLDate() {
        return toTechFormat(this, 'yyyy-MM-dd');
    }
    toSQLTime({ includeOffset: e = !0, includeZone: n = !1 } = {}) {
        return toTechTimeFormat(this, { includeOffset: e, includeZone: n, spaceZone: !0 });
    }
    toSQL(e = {}) {
        return this.isValid ? `${this.toSQLDate()} ${this.toSQLTime(e)}` : null;
    }
    toString() {
        return this.isValid ? this.toISO() : INVALID$2;
    }
    valueOf() {
        return this.toMillis();
    }
    toMillis() {
        return this.isValid ? this.ts : NaN;
    }
    toSeconds() {
        return this.isValid ? this.ts / 1e3 : NaN;
    }
    toJSON() {
        return this.toISO();
    }
    toBSON() {
        return this.toJSDate();
    }
    toObject(e = {}) {
        if (!this.isValid) return {};
        const n = Object.assign({}, this.c);
        return (
            e.includeConfig &&
                ((n.outputCalendar = this.outputCalendar),
                (n.numberingSystem = this.loc.numberingSystem),
                (n.locale = this.loc.locale)),
            n
        );
    }
    toJSDate() {
        return new Date(this.isValid ? this.ts : NaN);
    }
    diff(e, n = 'milliseconds', i = {}) {
        if (!this.isValid || !e.isValid)
            return Duration.invalid(this.invalid || e.invalid, 'created by diffing an invalid DateTime');
        const a = Object.assign({ locale: this.locale, numberingSystem: this.numberingSystem }, i),
            o = maybeArray(n).map(Duration.normalizeUnit),
            s = e.valueOf() > this.valueOf(),
            t = s ? this : e,
            d = s ? e : this,
            r = diff(t, d, o, a);
        return s ? r.negate() : r;
    }
    diffNow(e = 'milliseconds', n = {}) {
        return this.diff(DateTime.local(), e, n);
    }
    until(e) {
        return this.isValid ? Interval.fromDateTimes(this, e) : this;
    }
    hasSame(e, n) {
        if (!this.isValid) return !1;
        if ('millisecond' === n) return this.valueOf() === e.valueOf();
        else {
            const i = e.valueOf();
            return this.startOf(n) <= i && i <= this.endOf(n);
        }
    }
    equals(e) {
        return (
            this.isValid &&
            e.isValid &&
            this.valueOf() === e.valueOf() &&
            this.zone.equals(e.zone) &&
            this.loc.equals(e.loc)
        );
    }
    toRelative(e = {}) {
        if (!this.isValid) return null;
        const n = e.base || DateTime.fromObject({ zone: this.zone }),
            i = e.padding ? (this < n ? -e.padding : e.padding) : 0;
        return diffRelative(
            n,
            this.plus(i),
            Object.assign(e, { numeric: 'always', units: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'] })
        );
    }
    toRelativeCalendar(e = {}) {
        return this.isValid
            ? diffRelative(
                  e.base || DateTime.fromObject({ zone: this.zone }),
                  this,
                  Object.assign(e, { numeric: 'auto', units: ['years', 'months', 'days'], calendary: !0 })
              )
            : null;
    }
    static min(...e) {
        return bestBy(e, e => e.valueOf(), Math.min);
    }
    static max(...e) {
        return bestBy(e, e => e.valueOf(), Math.max);
    }
    static fromFormatExplain(e, n, i = {}) {
        const { locale: a = null, numberingSystem: o = null } = i,
            s = Locale.fromOpts({ locale: a, numberingSystem: o, defaultToEN: !0 });
        return explainFromTokens(s, e, n);
    }
    static fromStringExplain(e, n, i = {}) {
        return DateTime.fromFormatExplain(e, n, i);
    }
    static get DATE_SHORT() {
        return DATE_SHORT;
    }
    static get DATE_MED() {
        return DATE_MED;
    }
    static get DATE_FULL() {
        return DATE_FULL;
    }
    static get DATE_HUGE() {
        return DATE_HUGE;
    }
    static get TIME_SIMPLE() {
        return TIME_SIMPLE;
    }
    static get TIME_WITH_SECONDS() {
        return TIME_WITH_SECONDS;
    }
    static get TIME_WITH_SHORT_OFFSET() {
        return TIME_WITH_SHORT_OFFSET;
    }
    static get TIME_WITH_LONG_OFFSET() {
        return TIME_WITH_LONG_OFFSET;
    }
    static get TIME_24_SIMPLE() {
        return TIME_24_SIMPLE;
    }
    static get TIME_24_WITH_SECONDS() {
        return TIME_24_WITH_SECONDS;
    }
    static get TIME_24_WITH_SHORT_OFFSET() {
        return TIME_24_WITH_SHORT_OFFSET;
    }
    static get TIME_24_WITH_LONG_OFFSET() {
        return TIME_24_WITH_LONG_OFFSET;
    }
    static get DATETIME_SHORT() {
        return DATETIME_SHORT;
    }
    static get DATETIME_SHORT_WITH_SECONDS() {
        return DATETIME_SHORT_WITH_SECONDS;
    }
    static get DATETIME_MED() {
        return DATETIME_MED;
    }
    static get DATETIME_MED_WITH_SECONDS() {
        return DATETIME_MED_WITH_SECONDS;
    }
    static get DATETIME_FULL() {
        return DATETIME_FULL;
    }
    static get DATETIME_FULL_WITH_SECONDS() {
        return DATETIME_FULL_WITH_SECONDS;
    }
    static get DATETIME_HUGE() {
        return DATETIME_HUGE;
    }
    static get DATETIME_HUGE_WITH_SECONDS() {
        return DATETIME_HUGE_WITH_SECONDS;
    }
}
function friendlyDateTime(e) {
    if (DateTime.isDateTime(e)) return e;
    if (e && e.valueOf && isNumber(e.valueOf())) return DateTime.fromJSDate(e);
    if (e && 'object' == typeof e) return DateTime.fromObject(e);
    throw new InvalidArgumentError(`Unknown datetime argument: ${e}, of type ${typeof e}`);
}
export { DateTime, Duration, FixedOffsetZone, IANAZone, Info, Interval, InvalidZone, LocalZone, Settings, Zone };
