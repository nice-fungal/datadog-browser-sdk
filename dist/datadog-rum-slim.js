/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  W: () => (/* reexport */ DefaultPrivacyLevel),
  L: () => (/* binding */ datadogRum)
});

;// ../core/src/tools/display.ts
/* eslint-disable local-rules/disallow-side-effects */
/**
 * Keep references on console methods to avoid triggering patched behaviors
 *
 * NB: in some setup, console could already be patched by another SDK.
 * In this case, some display messages can be sent by the other SDK
 * but we should be safe from infinite loop nonetheless.
 */
const display_ConsoleApiName = {
    log: 'log',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
};
/**
 * When building JS bundles, some users might use a plugin[1] or configuration[2] to remove
 * "console.*" references. This causes some issue as we expect `console.*` to be defined.
 * As a workaround, let's use a variable alias, so those expressions won't be taken into account by
 * simple static analysis.
 *
 * [1]: https://babeljs.io/docs/babel-plugin-transform-remove-console/
 * [2]: https://github.com/terser/terser#compress-options (look for drop_console)
 */
const globalConsole = console;
const originalConsoleMethods = {};
Object.keys(display_ConsoleApiName).forEach((name) => {
    originalConsoleMethods[name] = globalConsole[name];
});
const PREFIX = 'Datadog Browser SDK:';
const display = {
    debug: originalConsoleMethods.debug.bind(globalConsole, PREFIX),
    log: originalConsoleMethods.log.bind(globalConsole, PREFIX),
    info: originalConsoleMethods.info.bind(globalConsole, PREFIX),
    warn: originalConsoleMethods.warn.bind(globalConsole, PREFIX),
    error: originalConsoleMethods.error.bind(globalConsole, PREFIX),
};
const DOCS_ORIGIN = 'https://docs.datadoghq.com';
const DOCS_TROUBLESHOOTING = `${DOCS_ORIGIN}/real_user_monitoring/browser/troubleshooting`;
const MORE_DETAILS = 'More details:';

;// ../core/src/tools/catchUserErrors.ts

function catchUserErrors(fn, errorMsg) {
    return (...args) => {
        try {
            return fn(...args);
        }
        catch (err) {
            display.error(errorMsg, err);
        }
    };
}

;// ../core/src/tools/monitor.ts

let onMonitorErrorCollected;
let debugMode = false;
function monitor_startMonitorErrorCollection(newOnMonitorErrorCollected) {
    onMonitorErrorCollected = newOnMonitorErrorCollected;
}
function setDebugMode(newDebugMode) {
    debugMode = newDebugMode;
}
function resetMonitor() {
    onMonitorErrorCollected = undefined;
    debugMode = false;
}
function monitored(_, __, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
        const decorated = onMonitorErrorCollected ? monitor(originalMethod) : originalMethod;
        return decorated.apply(this, args);
    };
}
function monitor(fn) {
    return function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return callMonitored(fn, this, arguments);
    }; // consider output type has input type
}
function callMonitored(fn, context, args) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn.apply(context, args);
    }
    catch (e) {
        monitorError(e);
    }
}
function monitorError(e) {
    monitor_displayIfDebugEnabled(e);
    if (onMonitorErrorCollected) {
        try {
            onMonitorErrorCollected(e);
        }
        catch (e) {
            monitor_displayIfDebugEnabled(e);
        }
    }
}
function monitor_displayIfDebugEnabled(...args) {
    if (debugMode) {
        display.error('[MONITOR]', ...args);
    }
}

;// ../core/src/boot/init.ts



function makePublicApi(stub) {
    const publicApi = Object.assign({ version: "6.0.0", 
        // This API method is intentionally not monitored, since the only thing executed is the
        // user-provided 'callback'.  All SDK usages executed in the callback should be monitored, and
        // we don't want to interfere with the user uncaught exceptions.
        onReady(callback) {
            callback();
        } }, stub);
    // Add a "hidden" property to set debug mode. We define it that way to hide it
    // as much as possible but of course it's not a real protection.
    Object.defineProperty(publicApi, '_setDebug', {
        get() {
            return setDebugMode;
        },
        enumerable: false,
    });
    return publicApi;
}
function defineGlobal(global, name, api) {
    const existingGlobalVariable = global[name];
    if (existingGlobalVariable && !existingGlobalVariable.q && existingGlobalVariable.version) {
        display.warn('SDK is loaded more than once. This is unsupported and might have unexpected behavior.');
    }
    global[name] = api;
    if (existingGlobalVariable && existingGlobalVariable.q) {
        existingGlobalVariable.q.forEach((fn) => catchUserErrors(fn, 'onReady callback threw an error:')());
    }
}

;// ../core/src/tools/getGlobalObject.ts
/**
 * inspired by https://mathiasbynens.be/notes/globalthis
 */
function getGlobalObject() {
    if (typeof globalThis === 'object') {
        return globalThis;
    }
    Object.defineProperty(Object.prototype, '_dd_temp_', {
        get() {
            return this;
        },
        configurable: true,
    });
    // @ts-ignore _dd_temp is defined using defineProperty
    let globalObject = _dd_temp_;
    // @ts-ignore _dd_temp is defined using defineProperty
    delete Object.prototype._dd_temp_;
    if (typeof globalObject !== 'object') {
        // on safari _dd_temp_ is available on window but not globally
        // fallback on other browser globals check
        if (typeof self === 'object') {
            globalObject = self;
        }
        else if (typeof window === 'object') {
            globalObject = window;
        }
        else {
            globalObject = {};
        }
    }
    return globalObject;
}

;// ../core/src/tools/utils/byteUtils.ts
const ONE_KIBI_BYTE = 1024;
const ONE_MEBI_BYTE = 1024 * ONE_KIBI_BYTE;
// eslint-disable-next-line no-control-regex
const HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/;
function computeBytesCount(candidate) {
    // Accurate bytes count computations can degrade performances when there is a lot of events to process
    if (!HAS_MULTI_BYTES_CHARACTERS.test(candidate)) {
        return candidate.length;
    }
    if (window.TextEncoder !== undefined) {
        return new TextEncoder().encode(candidate).length;
    }
    return new Blob([candidate]).size;
}
function concatBuffers(buffers) {
    const length = buffers.reduce((total, buffer) => total + buffer.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

;// ../core/src/tools/getZoneJsOriginalValue.ts

/**
 * Gets the original value for a DOM API that was potentially patched by Zone.js.
 *
 * Zone.js[1] is a library that patches a bunch of JS and DOM APIs. It usually stores the original
 * value of the patched functions/constructors/methods in a hidden property prefixed by
 * __zone_symbol__.
 *
 * In multiple occasions, we observed that Zone.js is the culprit of important issues leading to
 * browser resource exhaustion (memory leak, high CPU usage). This method is used as a workaround to
 * use the original DOM API instead of the one patched by Zone.js.
 *
 * [1]: https://github.com/angular/angular/tree/main/packages/zone.js
 */
function getZoneJsOriginalValue(target, name) {
    const browserWindow = getGlobalObject();
    let original;
    if (browserWindow.Zone && typeof browserWindow.Zone.__symbol__ === 'function') {
        original = target[browserWindow.Zone.__symbol__(name)];
    }
    if (!original) {
        original = target[name];
    }
    return original;
}

;// ../core/src/tools/timer.ts



function timer_setTimeout(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), 'setTimeout')(monitor(callback), delay);
}
function timer_clearTimeout(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), 'clearTimeout')(timeoutId);
}
function timer_setInterval(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), 'setInterval')(monitor(callback), delay);
}
function timer_clearInterval(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), 'clearInterval')(timeoutId);
}

;// ../core/src/tools/utils/functionUtils.ts

// use lodash API
function throttle(fn, wait, options) {
    const needLeadingExecution = options && options.leading !== undefined ? options.leading : true;
    const needTrailingExecution = options && options.trailing !== undefined ? options.trailing : true;
    let inWaitPeriod = false;
    let pendingExecutionWithParameters;
    let pendingTimeoutId;
    return {
        throttled: (...parameters) => {
            if (inWaitPeriod) {
                pendingExecutionWithParameters = parameters;
                return;
            }
            if (needLeadingExecution) {
                fn(...parameters);
            }
            else {
                pendingExecutionWithParameters = parameters;
            }
            inWaitPeriod = true;
            pendingTimeoutId = timer_setTimeout(() => {
                if (needTrailingExecution && pendingExecutionWithParameters) {
                    fn(...pendingExecutionWithParameters);
                }
                inWaitPeriod = false;
                pendingExecutionWithParameters = undefined;
            }, wait);
        },
        cancel: () => {
            timer_clearTimeout(pendingTimeoutId);
            inWaitPeriod = false;
            pendingExecutionWithParameters = undefined;
        },
    };
}
// eslint-disable-next-line @typescript-eslint/no-empty-function
function functionUtils_noop() { }

;// ../core/src/tools/serialisation/jsonStringify.ts

/**
 * Custom implementation of JSON.stringify that ignores some toJSON methods. We need to do that
 * because some sites badly override toJSON on certain objects. Removing all toJSON methods from
 * nested values would be too costly, so we just detach them from the root value, and native classes
 * used to build JSON values (Array and Object).
 *
 * Note: this still assumes that JSON.stringify is correct.
 */
function jsonStringify_jsonStringify(value, replacer, space) {
    if (typeof value !== 'object' || value === null) {
        return JSON.stringify(value);
    }
    // Note: The order matter here. We need to detach toJSON methods on parent classes before their
    // subclasses.
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
    const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
    const restoreValuePrototypeToJson = detachToJsonMethod(Object.getPrototypeOf(value));
    const restoreValueToJson = detachToJsonMethod(value);
    try {
        return JSON.stringify(value, replacer, space);
    }
    catch (_a) {
        return '<error: unable to serialize object>';
    }
    finally {
        restoreObjectPrototypeToJson();
        restoreArrayPrototypeToJson();
        restoreValuePrototypeToJson();
        restoreValueToJson();
    }
}
function detachToJsonMethod(value) {
    const object = value;
    const objectToJson = object.toJSON;
    if (objectToJson) {
        delete object.toJSON;
        return () => {
            object.toJSON = objectToJson;
        };
    }
    return functionUtils_noop;
}

;// ../core/src/tools/utils/objectUtils.ts
function shallowClone(object) {
    return Object.assign({}, object);
}
function objectHasValue(object, value) {
    return Object.keys(object).some((key) => object[key] === value);
}
function isEmptyObject(object) {
    return Object.keys(object).length === 0;
}
function mapValues(object, fn) {
    const newObject = {};
    for (const key of Object.keys(object)) {
        newObject[key] = fn(object[key]);
    }
    return newObject;
}

;// ../core/src/domain/context/customerDataTracker.ts





// RUM and logs batch bytes limit is 16KB
// ensure that we leave room for other event attributes and maintain a decent amount of event per batch
// (3KB (customer data) + 1KB (other attributes)) * 4 (events per batch) = 16KB
const CUSTOMER_DATA_BYTES_LIMIT = 3 * ONE_KIBI_BYTE;
// We observed that the compression ratio is around 8 in general, but we also want to keep a margin
// because some data might not be compressed (ex: last view update on page exit). We chose 16KiB
// because it is also the limit of the 'batchBytesCount' that we use for RUM and Logs data, but this
// is a bit arbitrary.
const CUSTOMER_COMPRESSED_DATA_BYTES_LIMIT = 16 * ONE_KIBI_BYTE;
const BYTES_COMPUTATION_THROTTLING_DELAY = 200;
function createCustomerDataTrackerManager(compressionStatus = 2 /* CustomerDataCompressionStatus.Disabled */) {
    const customerDataTrackers = new Map();
    let alreadyWarned = false;
    function checkCustomerDataLimit(initialBytesCount = 0) {
        if (alreadyWarned || compressionStatus === 0 /* CustomerDataCompressionStatus.Unknown */) {
            return;
        }
        const bytesCountLimit = compressionStatus === 2 /* CustomerDataCompressionStatus.Disabled */
            ? CUSTOMER_DATA_BYTES_LIMIT
            : CUSTOMER_COMPRESSED_DATA_BYTES_LIMIT;
        let bytesCount = initialBytesCount;
        customerDataTrackers.forEach((tracker) => {
            bytesCount += tracker.getBytesCount();
        });
        if (bytesCount > bytesCountLimit) {
            displayCustomerDataLimitReachedWarning(bytesCountLimit);
            alreadyWarned = true;
        }
    }
    return {
        /**
         * Creates a detached tracker. The manager will not store a reference to that tracker, and the
         * bytes count will be counted independently from other detached trackers.
         *
         * This is particularly useful when we don't know when the tracker will be unused, so we don't
         * leak memory (ex: when used in Logger instances).
         */
        createDetachedTracker: () => {
            const tracker = createCustomerDataTracker(() => checkCustomerDataLimit(tracker.getBytesCount()));
            return tracker;
        },
        /**
         * Creates a tracker if it doesn't exist, and returns it.
         */
        getOrCreateTracker: (type) => {
            if (!customerDataTrackers.has(type)) {
                customerDataTrackers.set(type, createCustomerDataTracker(checkCustomerDataLimit));
            }
            return customerDataTrackers.get(type);
        },
        setCompressionStatus: (newCompressionStatus) => {
            if (compressionStatus === 0 /* CustomerDataCompressionStatus.Unknown */) {
                compressionStatus = newCompressionStatus;
                checkCustomerDataLimit();
            }
        },
        getCompressionStatus: () => compressionStatus,
        stop: () => {
            customerDataTrackers.forEach((tracker) => tracker.stop());
            customerDataTrackers.clear();
        },
    };
}
function createCustomerDataTracker(checkCustomerDataLimit) {
    let bytesCountCache = 0;
    // Throttle the bytes computation to minimize the impact on performance.
    // Especially useful if the user call context APIs synchronously multiple times in a row
    const { throttled: computeBytesCountThrottled, cancel: cancelComputeBytesCount } = throttle((context) => {
        bytesCountCache = computeBytesCount(jsonStringify_jsonStringify(context));
        checkCustomerDataLimit();
    }, BYTES_COMPUTATION_THROTTLING_DELAY);
    const resetBytesCount = () => {
        cancelComputeBytesCount();
        bytesCountCache = 0;
    };
    return {
        updateCustomerData: (context) => {
            if (isEmptyObject(context)) {
                resetBytesCount();
            }
            else {
                computeBytesCountThrottled(context);
            }
        },
        resetCustomerData: resetBytesCount,
        getBytesCount: () => bytesCountCache,
        stop: () => {
            cancelComputeBytesCount();
        },
    };
}
function displayCustomerDataLimitReachedWarning(bytesCountLimit) {
    display.warn(`Customer data exceeds the recommended ${bytesCountLimit / ONE_KIBI_BYTE}KiB threshold. ${MORE_DETAILS} ${DOCS_TROUBLESHOOTING}/#customer-data-exceeds-the-recommended-threshold-warning`);
}

;// ../core/src/tools/utils/typeUtils.ts
/**
 * Similar to `typeof`, but distinguish plain objects from `null` and arrays
 */
function typeUtils_getType(value) {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    return typeof value;
}

;// ../core/src/tools/mergeInto.ts

/**
 * Iterate over source and affect its sub values into destination, recursively.
 * If the source and destination can't be merged, return source.
 */
function mergeInto(destination, source, circularReferenceChecker = createCircularReferenceChecker()) {
    // ignore the source if it is undefined
    if (source === undefined) {
        return destination;
    }
    if (typeof source !== 'object' || source === null) {
        // primitive values - just return source
        return source;
    }
    else if (source instanceof Date) {
        return new Date(source.getTime());
    }
    else if (source instanceof RegExp) {
        const flags = source.flags ||
            // old browsers compatibility
            [
                source.global ? 'g' : '',
                source.ignoreCase ? 'i' : '',
                source.multiline ? 'm' : '',
                source.sticky ? 'y' : '',
                source.unicode ? 'u' : '',
            ].join('');
        return new RegExp(source.source, flags);
    }
    if (circularReferenceChecker.hasAlreadyBeenSeen(source)) {
        // remove circular references
        return undefined;
    }
    else if (Array.isArray(source)) {
        const merged = Array.isArray(destination) ? destination : [];
        for (let i = 0; i < source.length; ++i) {
            merged[i] = mergeInto(merged[i], source[i], circularReferenceChecker);
        }
        return merged;
    }
    const merged = typeUtils_getType(destination) === 'object' ? destination : {};
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            merged[key] = mergeInto(merged[key], source[key], circularReferenceChecker);
        }
    }
    return merged;
}
/**
 * A simplistic implementation of a deep clone algorithm.
 * Caveats:
 * - It doesn't maintain prototype chains - don't use with instances of custom classes.
 * - It doesn't handle Map and Set
 */
function deepClone(value) {
    return mergeInto(undefined, value);
}
function mergeInto_combine(...sources) {
    let destination;
    for (const source of sources) {
        // Ignore any undefined or null sources.
        if (source === undefined || source === null) {
            continue;
        }
        destination = mergeInto(destination, source);
    }
    return destination;
}
function createCircularReferenceChecker() {
    if (typeof WeakSet !== 'undefined') {
        const set = new WeakSet();
        return {
            hasAlreadyBeenSeen(value) {
                const has = set.has(value);
                if (!has) {
                    set.add(value);
                }
                return has;
            },
        };
    }
    const array = [];
    return {
        hasAlreadyBeenSeen(value) {
            const has = array.indexOf(value) >= 0;
            if (!has) {
                array.push(value);
            }
            return has;
        },
    };
}

;// ../core/src/tools/serialisation/sanitize.ts



// The maximum size of a single event is 256KiB. By default, we ensure that user-provided data
// going through sanitize fits inside our events, while leaving room for other contexts, metadata, ...
const SANITIZE_DEFAULT_MAX_CHARACTER_COUNT = 220 * ONE_KIBI_BYTE;
// Symbol for the root element of the JSONPath used for visited objects
const JSON_PATH_ROOT_ELEMENT = '$';
// When serializing (using JSON.stringify) a key of an object, { key: 42 } gets wrapped in quotes as "key".
// With the separator (:), we need to add 3 characters to the count.
const KEY_DECORATION_LENGTH = 3;
function sanitize(source, maxCharacterCount = SANITIZE_DEFAULT_MAX_CHARACTER_COUNT) {
    // Unbind any toJSON function we may have on [] or {} prototypes
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype);
    const restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype);
    // Initial call to sanitizeProcessor - will populate containerQueue if source is an Array or a plain Object
    const containerQueue = [];
    const visitedObjectsWithPath = new WeakMap();
    const sanitizedData = sanitizeProcessor(source, JSON_PATH_ROOT_ELEMENT, undefined, containerQueue, visitedObjectsWithPath);
    const serializedSanitizedData = JSON.stringify(sanitizedData);
    let accumulatedCharacterCount = serializedSanitizedData ? serializedSanitizedData.length : 0;
    if (accumulatedCharacterCount > maxCharacterCount) {
        warnOverCharacterLimit(maxCharacterCount, 'discarded', source);
        return undefined;
    }
    while (containerQueue.length > 0 && accumulatedCharacterCount < maxCharacterCount) {
        const containerToProcess = containerQueue.shift();
        let separatorLength = 0; // 0 for the first element, 1 for subsequent elements
        // Arrays and Objects have to be handled distinctly to ensure
        // we do not pick up non-numerical properties from Arrays
        if (Array.isArray(containerToProcess.source)) {
            for (let key = 0; key < containerToProcess.source.length; key++) {
                const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
                if (targetData !== undefined) {
                    accumulatedCharacterCount += JSON.stringify(targetData).length;
                }
                else {
                    // When an element of an Array (targetData) is undefined, it is serialized as null:
                    // JSON.stringify([undefined]) => '[null]' - This accounts for 4 characters
                    accumulatedCharacterCount += 4;
                }
                accumulatedCharacterCount += separatorLength;
                separatorLength = 1;
                if (accumulatedCharacterCount > maxCharacterCount) {
                    warnOverCharacterLimit(maxCharacterCount, 'truncated', source);
                    break;
                }
                ;
                containerToProcess.target[key] = targetData;
            }
        }
        else {
            for (const key in containerToProcess.source) {
                if (Object.prototype.hasOwnProperty.call(containerToProcess.source, key)) {
                    const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
                    // When a property of an object has an undefined value, it will be dropped during serialization:
                    // JSON.stringify({a:undefined}) => '{}'
                    if (targetData !== undefined) {
                        accumulatedCharacterCount +=
                            JSON.stringify(targetData).length + separatorLength + key.length + KEY_DECORATION_LENGTH;
                        separatorLength = 1;
                    }
                    if (accumulatedCharacterCount > maxCharacterCount) {
                        warnOverCharacterLimit(maxCharacterCount, 'truncated', source);
                        break;
                    }
                    ;
                    containerToProcess.target[key] = targetData;
                }
            }
        }
    }
    // Rebind detached toJSON functions
    restoreObjectPrototypeToJson();
    restoreArrayPrototypeToJson();
    return sanitizedData;
}
/**
 * Internal function to factorize the process common to the
 * initial call to sanitize, and iterations for Arrays and Objects
 *
 */
function sanitizeProcessor(source, parentPath, key, queue, visitedObjectsWithPath) {
    // Start by handling toJSON, as we want to sanitize its output
    const sourceToSanitize = tryToApplyToJSON(source);
    if (!sourceToSanitize || typeof sourceToSanitize !== 'object') {
        return sanitizePrimitivesAndFunctions(sourceToSanitize);
    }
    const sanitizedSource = sanitizeObjects(sourceToSanitize);
    if (sanitizedSource !== '[Object]' && sanitizedSource !== '[Array]' && sanitizedSource !== '[Error]') {
        return sanitizedSource;
    }
    // Handle potential cyclic references
    // We need to use source as sourceToSanitize could be a reference to a new object
    // At this stage, we know the source is an object type
    const sourceAsObject = source;
    if (visitedObjectsWithPath.has(sourceAsObject)) {
        return `[Reference seen at ${visitedObjectsWithPath.get(sourceAsObject)}]`;
    }
    // Add processed source to queue
    const currentPath = key !== undefined ? `${parentPath}.${key}` : parentPath;
    const target = Array.isArray(sourceToSanitize) ? [] : {};
    visitedObjectsWithPath.set(sourceAsObject, currentPath);
    queue.push({ source: sourceToSanitize, target, path: currentPath });
    return target;
}
/**
 * Handles sanitization of simple, non-object types
 *
 */
function sanitizePrimitivesAndFunctions(value) {
    // BigInt cannot be serialized by JSON.stringify(), convert it to a string representation
    if (typeof value === 'bigint') {
        return `[BigInt] ${value.toString()}`;
    }
    // Functions cannot be serialized by JSON.stringify(). Moreover, if a faulty toJSON is present, it needs to be converted
    // so it won't prevent stringify from serializing later
    if (typeof value === 'function') {
        return `[Function] ${value.name || 'unknown'}`;
    }
    // JSON.stringify() does not serialize symbols.
    if (typeof value === 'symbol') {
        return `[Symbol] ${value.description || value.toString()}`;
    }
    return value;
}
/**
 * Handles sanitization of object types
 *
 * LIMITATIONS
 * - If a class defines a toStringTag Symbol, it will fall in the catch-all method and prevent enumeration of properties.
 * To avoid this, a toJSON method can be defined.
 */
function sanitizeObjects(value) {
    try {
        if (value instanceof Event) {
            return sanitizeEvent(value);
        }
        if (value instanceof RegExp) {
            return `[RegExp] ${value.toString()}`;
        }
        // Handle all remaining object types in a generic way
        const result = Object.prototype.toString.call(value);
        const match = result.match(/\[object (.*)\]/);
        if (match && match[1]) {
            return `[${match[1]}]`;
        }
    }
    catch (_a) {
        // If the previous serialization attempts failed, and we cannot convert using
        // Object.prototype.toString, declare the value unserializable
    }
    return '[Unserializable]';
}
function sanitizeEvent(event) {
    return {
        type: event.type,
        isTrusted: event.isTrusted,
        currentTarget: event.currentTarget ? sanitizeObjects(event.currentTarget) : null,
        target: event.target ? sanitizeObjects(event.target) : null,
    };
}
/**
 * Checks if a toJSON function exists and tries to execute it
 *
 */
function tryToApplyToJSON(value) {
    const object = value;
    if (object && typeof object.toJSON === 'function') {
        try {
            return object.toJSON();
        }
        catch (_a) {
            // If toJSON fails, we continue by trying to serialize the value manually
        }
    }
    return value;
}
/**
 * Helper function to display the warning when the accumulated character count is over the limit
 */
function warnOverCharacterLimit(maxCharacterCount, changeType, source) {
    display.warn(`The data provided has been ${changeType} as it is over the limit of ${maxCharacterCount} characters:`, source);
}

;// ../core/src/tools/observable.ts
// eslint-disable-next-line no-restricted-syntax
class observable_Observable {
    constructor(onFirstSubscribe) {
        this.onFirstSubscribe = onFirstSubscribe;
        this.observers = [];
    }
    subscribe(f) {
        this.observers.push(f);
        if (this.observers.length === 1 && this.onFirstSubscribe) {
            this.onLastUnsubscribe = this.onFirstSubscribe(this) || undefined;
        }
        return {
            unsubscribe: () => {
                this.observers = this.observers.filter((other) => f !== other);
                if (!this.observers.length && this.onLastUnsubscribe) {
                    this.onLastUnsubscribe();
                }
            },
        };
    }
    notify(data) {
        this.observers.forEach((observer) => observer(data));
    }
}
function mergeObservables(...observables) {
    return new observable_Observable((globalObservable) => {
        const subscriptions = observables.map((observable) => observable.subscribe((data) => globalObservable.notify(data)));
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    });
}

;// ../core/src/domain/context/contextManager.ts




function createContextManager(customerDataTracker) {
    let context = {};
    const changeObservable = new observable_Observable();
    const contextManager = {
        getContext: () => deepClone(context),
        setContext: (newContext) => {
            if (typeUtils_getType(newContext) === 'object') {
                context = sanitize(newContext);
                customerDataTracker === null || customerDataTracker === void 0 ? void 0 : customerDataTracker.updateCustomerData(context);
            }
            else {
                contextManager.clearContext();
            }
            changeObservable.notify();
        },
        setContextProperty: (key, property) => {
            context[key] = sanitize(property);
            customerDataTracker === null || customerDataTracker === void 0 ? void 0 : customerDataTracker.updateCustomerData(context);
            changeObservable.notify();
        },
        removeContextProperty: (key) => {
            delete context[key];
            customerDataTracker === null || customerDataTracker === void 0 ? void 0 : customerDataTracker.updateCustomerData(context);
            changeObservable.notify();
        },
        clearContext: () => {
            context = {};
            customerDataTracker === null || customerDataTracker === void 0 ? void 0 : customerDataTracker.resetCustomerData();
            changeObservable.notify();
        },
        changeObservable,
    };
    return contextManager;
}

;// ../core/src/domain/trackingConsent.ts

const TrackingConsent = {
    GRANTED: 'granted',
    NOT_GRANTED: 'not-granted',
};
function createTrackingConsentState(currentConsent) {
    const observable = new observable_Observable();
    return {
        tryToInit(trackingConsent) {
            if (!currentConsent) {
                currentConsent = trackingConsent;
            }
        },
        update(trackingConsent) {
            currentConsent = trackingConsent;
            observable.notify();
        },
        isGranted() {
            return currentConsent === TrackingConsent.GRANTED;
        },
        observable,
    };
}

;// ../core/src/browser/addEventListener.ts


/**
 * Add an event listener to an event target object (Window, Element, mock object...).  This provides
 * a few conveniences compared to using `element.addEventListener` directly:
 *
 * * supports IE11 by: using an option object only if needed and emulating the `once` option
 *
 * * wraps the listener with a `monitor` function
 *
 * * returns a `stop` function to remove the listener
 */
function addEventListener(configuration, eventTarget, eventName, listener, options) {
    return addEventListeners(configuration, eventTarget, [eventName], listener, options);
}
/**
 * Add event listeners to an event target object (Window, Element, mock object...).  This provides
 * a few conveniences compared to using `element.addEventListener` directly:
 *
 * * supports IE11 by: using an option object only if needed and emulating the `once` option
 *
 * * wraps the listener with a `monitor` function
 *
 * * returns a `stop` function to remove the listener
 *
 * * with `once: true`, the listener will be called at most once, even if different events are listened
 */
function addEventListeners(configuration, eventTarget, eventNames, listener, { once, capture, passive } = {}) {
    const listenerWithMonitor = monitor((event) => {
        if (!event.isTrusted && !event.__ddIsTrusted && !configuration.allowUntrustedEvents) {
            return;
        }
        if (once) {
            stop();
        }
        listener(event);
    });
    const options = passive ? { capture, passive } : capture;
    // Use the window.EventTarget.prototype when possible to avoid wrong overrides (e.g: https://github.com/salesforce/lwc/issues/1824)
    const listenerTarget = window.EventTarget && eventTarget instanceof EventTarget ? window.EventTarget.prototype : eventTarget;
    const add = getZoneJsOriginalValue(listenerTarget, 'addEventListener');
    eventNames.forEach((eventName) => add.call(eventTarget, eventName, listenerWithMonitor, options));
    function stop() {
        const remove = getZoneJsOriginalValue(listenerTarget, 'removeEventListener');
        eventNames.forEach((eventName) => remove.call(eventTarget, eventName, listenerWithMonitor, options));
    }
    return {
        stop,
    };
}

;// ../core/src/domain/context/storeContextManager.ts


const CONTEXT_STORE_KEY_PREFIX = '_dd_c';
const storageListeners = [];
function storeContextManager(configuration, contextManager, productKey, customerDataType) {
    const storageKey = buildStorageKey(productKey, customerDataType);
    storageListeners.push(addEventListener(configuration, window, "storage" /* DOM_EVENT.STORAGE */, ({ key }) => {
        if (storageKey === key) {
            synchronizeWithStorage();
        }
    }));
    contextManager.changeObservable.subscribe(dumpToStorage);
    contextManager.setContext(mergeInto_combine(getFromStorage(), contextManager.getContext()));
    function synchronizeWithStorage() {
        contextManager.setContext(getFromStorage());
    }
    function dumpToStorage() {
        localStorage.setItem(storageKey, JSON.stringify(contextManager.getContext()));
    }
    function getFromStorage() {
        const rawContext = localStorage.getItem(storageKey);
        return rawContext !== null ? JSON.parse(rawContext) : {};
    }
}
function buildStorageKey(productKey, customerDataType) {
    return `${CONTEXT_STORE_KEY_PREFIX}_${productKey}_${customerDataType}`;
}
function removeStorageListeners() {
    storageListeners.map((listener) => listener.stop());
}

;// ../core/src/tools/encoder.ts

function createIdentityEncoder() {
    let output = '';
    let outputBytesCount = 0;
    return {
        isAsync: false,
        get isEmpty() {
            return !output;
        },
        write(data, callback) {
            const additionalEncodedBytesCount = computeBytesCount(data);
            outputBytesCount += additionalEncodedBytesCount;
            output += data;
            if (callback) {
                callback(additionalEncodedBytesCount);
            }
        },
        finish(callback) {
            callback(this.finishSync());
        },
        finishSync() {
            const result = {
                output,
                outputBytesCount,
                rawBytesCount: outputBytesCount,
                pendingData: '',
            };
            output = '';
            outputBytesCount = 0;
            return result;
        },
        estimateEncodedBytesCount(data) {
            return data.length;
        },
    };
}

;// ../core/src/tools/stackTrace/computeStackTrace.ts
/**
 * Cross-browser stack trace computation.
 *
 * Reference implementation: https://github.com/csnover/TraceKit/blob/04530298073c3823de72deb0b97e7b38ca7bcb59/tracekit.js
 */
const UNKNOWN_FUNCTION = '?';
function computeStackTrace(ex) {
    const stack = [];
    let stackProperty = tryToGetString(ex, 'stack');
    const exString = String(ex);
    if (stackProperty && stackProperty.startsWith(exString)) {
        stackProperty = stackProperty.slice(exString.length);
    }
    if (stackProperty) {
        stackProperty.split('\n').forEach((line) => {
            const stackFrame = parseChromeLine(line) || parseChromeAnonymousLine(line) || parseWinLine(line) || parseGeckoLine(line);
            if (stackFrame) {
                if (!stackFrame.func && stackFrame.line) {
                    stackFrame.func = UNKNOWN_FUNCTION;
                }
                stack.push(stackFrame);
            }
        });
    }
    return {
        message: tryToGetString(ex, 'message'),
        name: tryToGetString(ex, 'name'),
        stack,
    };
}
const fileUrl = '((?:file|https?|blob|chrome-extension|electron|native|eval|webpack|snippet|<anonymous>|\\w+\\.|\\/).*?)';
const filePosition = '(?::(\\d+))';
const CHROME_LINE_RE = new RegExp(`^\\s*at (.*?) ?\\(${fileUrl}${filePosition}?${filePosition}?\\)?\\s*$`, 'i');
const CHROME_EVAL_RE = new RegExp(`\\((\\S*)${filePosition}${filePosition}\\)`);
function parseChromeLine(line) {
    const parts = CHROME_LINE_RE.exec(line);
    if (!parts) {
        return;
    }
    const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
    const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line
    const submatch = CHROME_EVAL_RE.exec(parts[2]);
    if (isEval && submatch) {
        // throw out eval line/column and use top-most line/column number
        parts[2] = submatch[1]; // url
        parts[3] = submatch[2]; // line
        parts[4] = submatch[3]; // column
    }
    return {
        args: isNative ? [parts[2]] : [],
        column: parts[4] ? +parts[4] : undefined,
        func: parts[1] || UNKNOWN_FUNCTION,
        line: parts[3] ? +parts[3] : undefined,
        url: !isNative ? parts[2] : undefined,
    };
}
const CHROME_ANONYMOUS_FUNCTION_RE = new RegExp(`^\\s*at ?${fileUrl}${filePosition}?${filePosition}??\\s*$`, 'i');
function parseChromeAnonymousLine(line) {
    const parts = CHROME_ANONYMOUS_FUNCTION_RE.exec(line);
    if (!parts) {
        return;
    }
    return {
        args: [],
        column: parts[3] ? +parts[3] : undefined,
        func: UNKNOWN_FUNCTION,
        line: parts[2] ? +parts[2] : undefined,
        url: parts[1],
    };
}
const WINJS_LINE_RE = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
function parseWinLine(line) {
    const parts = WINJS_LINE_RE.exec(line);
    if (!parts) {
        return;
    }
    return {
        args: [],
        column: parts[4] ? +parts[4] : undefined,
        func: parts[1] || UNKNOWN_FUNCTION,
        line: +parts[3],
        url: parts[2],
    };
}
const GECKO_LINE_RE = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|capacitor|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i;
const GECKO_EVAL_RE = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
function parseGeckoLine(line) {
    const parts = GECKO_LINE_RE.exec(line);
    if (!parts) {
        return;
    }
    const isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
    const submatch = GECKO_EVAL_RE.exec(parts[3]);
    if (isEval && submatch) {
        // throw out eval line/column and use top-most line number
        parts[3] = submatch[1];
        parts[4] = submatch[2];
        parts[5] = undefined; // no column when eval
    }
    return {
        args: parts[2] ? parts[2].split(',') : [],
        column: parts[5] ? +parts[5] : undefined,
        func: parts[1] || UNKNOWN_FUNCTION,
        line: parts[4] ? +parts[4] : undefined,
        url: parts[3],
    };
}
function tryToGetString(candidate, property) {
    if (typeof candidate !== 'object' || !candidate || !(property in candidate)) {
        return undefined;
    }
    const value = candidate[property];
    return typeof value === 'string' ? value : undefined;
}
function computeStackTraceFromOnErrorMessage(messageObj, url, line, column) {
    const stack = [{ url, column, line }];
    const { name, message } = tryToParseMessage(messageObj);
    return {
        name,
        message,
        stack,
    };
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Error_types
const ERROR_TYPES_RE = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?([\s\S]*)$/;
function tryToParseMessage(messageObj) {
    let name;
    let message;
    if ({}.toString.call(messageObj) === '[object String]') {
        ;
        [, name, message] = ERROR_TYPES_RE.exec(messageObj);
    }
    return { name, message };
}

;// ../core/src/tools/stackTrace/handlingStack.ts


/**
 * Creates a stacktrace without SDK internal frames.
 * Constraints:
 * - Has to be called at the utmost position of the call stack.
 * - No monitored function should encapsulate it, that is why we need to use callMonitored inside it.
 */
function createHandlingStack() {
    /**
     * Skip the two internal frames:
     * - SDK API (console.error, ...)
     * - this function
     * in order to keep only the user calls
     */
    const internalFramesToSkip = 2;
    const error = new Error();
    let formattedStack;
    callMonitored(() => {
        const stackTrace = computeStackTrace(error);
        stackTrace.stack = stackTrace.stack.slice(internalFramesToSkip);
        formattedStack = toStackTraceString(stackTrace);
    });
    return formattedStack;
}
function toStackTraceString(stack) {
    let result = formatErrorMessage(stack);
    stack.stack.forEach((frame) => {
        const func = frame.func === '?' ? '<anonymous>' : frame.func;
        const args = frame.args && frame.args.length > 0 ? `(${frame.args.join(', ')})` : '';
        const line = frame.line ? `:${frame.line}` : '';
        const column = frame.line && frame.column ? `:${frame.column}` : '';
        result += `\n  at ${func}${args} @ ${frame.url}${line}${column}`;
    });
    return result;
}
function formatErrorMessage(stack) {
    return `${stack.name || 'Error'}: ${stack.message}`;
}

;// ../core/src/tools/utils/numberUtils.ts
/**
 * Return true if the draw is successful
 * @param threshold between 0 and 100
 */
function numberUtils_performDraw(threshold) {
    return threshold !== 0 && Math.random() * 100 <= threshold;
}
function round(num, decimals) {
    return +num.toFixed(decimals);
}
function isPercentage(value) {
    return isNumber(value) && value >= 0 && value <= 100;
}
function isNumber(value) {
    return typeof value === 'number';
}

;// ../core/src/tools/utils/timeUtils.ts

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_YEAR = 365 * ONE_DAY;
function relativeToClocks(relative) {
    return { relative, timeStamp: getCorrectedTimeStamp(relative) };
}
function timeStampToClocks(timeStamp) {
    return { relative: getRelativeTime(timeStamp), timeStamp };
}
function getCorrectedTimeStamp(relativeTime) {
    const correctedOrigin = (dateNow() - performance.now());
    // apply correction only for positive drift
    if (correctedOrigin > getNavigationStart()) {
        return Math.round(addDuration(correctedOrigin, relativeTime));
    }
    return getTimeStamp(relativeTime);
}
function currentDrift() {
    return Math.round(dateNow() - addDuration(getNavigationStart(), performance.now()));
}
function toServerDuration(duration) {
    if (!isNumber(duration)) {
        return duration;
    }
    return round(duration * 1e6, 0);
}
function dateNow() {
    // Do not use `Date.now` because sometimes websites are wrongly "polyfilling" it. For example, we
    // had some users using a very old version of `datejs`, which patched `Date.now` to return a Date
    // instance instead of a timestamp[1]. Those users are unlikely to fix this, so let's handle this
    // case ourselves.
    // [1]: https://github.com/datejs/Datejs/blob/97f5c7c58c5bc5accdab8aa7602b6ac56462d778/src/core-debug.js#L14-L16
    return new Date().getTime();
}
function timeUtils_timeStampNow() {
    return dateNow();
}
function timeUtils_relativeNow() {
    return performance.now();
}
function clocksNow() {
    return { relative: timeUtils_relativeNow(), timeStamp: timeUtils_timeStampNow() };
}
function clocksOrigin() {
    return { relative: 0, timeStamp: getNavigationStart() };
}
function timeUtils_elapsed(start, end) {
    return (end - start);
}
function addDuration(a, b) {
    return a + b;
}
// Get the time since the navigation was started.
function getRelativeTime(timestamp) {
    return (timestamp - getNavigationStart());
}
function getTimeStamp(relativeTime) {
    return Math.round(addDuration(getNavigationStart(), relativeTime));
}
function looksLikeRelativeTime(time) {
    return time < ONE_YEAR;
}
/**
 * Navigation start slightly change on some rare cases
 */
let navigationStart;
/**
 * Notes: this does not use `performance.timeOrigin` because:
 * - It doesn't seem to reflect the actual time on which the navigation has started: it may be much farther in the past,
 * at least in Firefox 71. (see: https://bugzilla.mozilla.org/show_bug.cgi?id=1429926)
 * - It is not supported in Safari <15
 */
function getNavigationStart() {
    if (navigationStart === undefined) {
        navigationStart = performance.timing.navigationStart;
    }
    return navigationStart;
}

;// ../core/src/domain/user/user.ts


/**
 * Clone input data and ensure known user properties (id, name, email)
 * are strings, as defined here:
 * https://docs.datadoghq.com/logs/log_configuration/attributes_naming_convention/#user-related-attributes
 */
function sanitizeUser(newUser) {
    // We shallow clone only to prevent mutation of user data.
    const user = Object.assign({}, newUser);
    const keys = ['id', 'name', 'email'];
    keys.forEach((key) => {
        if (key in user) {
            /* eslint-disable @typescript-eslint/no-base-to-string */
            user[key] = String(user[key]);
        }
    });
    return user;
}
/**
 * Simple check to ensure user is valid
 */
function checkUser(newUser) {
    const isValid = typeUtils_getType(newUser) === 'object';
    if (!isValid) {
        display.error('Unsupported user:', newUser);
    }
    return isValid;
}
function generateAnonymousId() {
    return Math.floor(Math.random() * Math.pow(36, 10))
        .toString(36)
        .padStart(10, '0');
}

;// ../core/src/boot/displayAlreadyInitializedError.ts

function displayAlreadyInitializedError(sdkName, initConfiguration) {
    if (!initConfiguration.silentMultipleInit) {
        display.error(`${sdkName} is already initialized.`);
    }
}

;// ../rum-core/src/domain/contexts/commonContext.ts
function buildCommonContext(globalContextManager, userContextManager, recorderApi) {
    return {
        context: globalContextManager.getContext(),
        user: userContextManager.getContext(),
        hasReplay: recorderApi.isRecording() ? true : undefined,
    };
}

;// ../core/src/tools/utils/stringUtils.ts
/**
 * UUID v4
 * from https://gist.github.com/jed/982883
 */
function generateUUID(placeholder) {
    return placeholder
        ? // eslint-disable-next-line  no-bitwise
            (parseInt(placeholder, 10) ^ ((Math.random() * 16) >> (parseInt(placeholder, 10) / 4))).toString(16)
        : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateUUID);
}
const COMMA_SEPARATED_KEY_VALUE = /([\w-]+)\s*=\s*([^;]+)/g;
function findCommaSeparatedValue(rawString, name) {
    COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
        if (match) {
            if (match[1] === name) {
                return match[2];
            }
        }
        else {
            break;
        }
    }
}
function findCommaSeparatedValues(rawString) {
    const result = new Map();
    COMMA_SEPARATED_KEY_VALUE.lastIndex = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
        if (match) {
            result.set(match[1], match[2]);
        }
        else {
            break;
        }
    }
    return result;
}
function stringUtils_safeTruncate(candidate, length, suffix = '') {
    const lastChar = candidate.charCodeAt(length - 1);
    const isLastCharSurrogatePair = lastChar >= 0xd800 && lastChar <= 0xdbff;
    const correctedLength = isLastCharSurrogatePair ? length + 1 : length;
    if (candidate.length <= correctedLength) {
        return candidate;
    }
    return `${candidate.slice(0, correctedLength)}${suffix}`;
}

;// ../rum-core/src/domain/vital/vitalCollection.ts

function createCustomVitalsState() {
    const vitalsByName = new Map();
    const vitalsByReference = new WeakMap();
    return { vitalsByName, vitalsByReference };
}
function startVitalCollection(lifeCycle, pageStateHistory, customVitalsState) {
    function isValid(vital) {
        return !pageStateHistory.wasInPageStateDuringPeriod("frozen" /* PageState.FROZEN */, vital.startClocks.relative, vital.duration);
    }
    function addDurationVital(vital) {
        if (isValid(vital)) {
            lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, processVital(vital, true));
        }
    }
    return {
        addDurationVital,
        startDurationVital: (name, options = {}) => startDurationVital(customVitalsState, name, options),
        stopDurationVital: (nameOrRef, options = {}) => {
            stopDurationVital(addDurationVital, customVitalsState, nameOrRef, options);
        },
    };
}
function startDurationVital({ vitalsByName, vitalsByReference }, name, options = {}) {
    const vital = {
        name,
        startClocks: clocksNow(),
        context: options.context,
        description: options.description,
    };
    // To avoid leaking implementation details of the vital, we return a reference to it.
    const reference = { __dd_vital_reference: true };
    vitalsByName.set(name, vital);
    // To avoid memory leaks caused by the creation of numerous references (e.g., from improper useEffect implementations), we use a WeakMap.
    vitalsByReference.set(reference, vital);
    return reference;
}
function stopDurationVital(stopCallback, { vitalsByName, vitalsByReference }, nameOrRef, options = {}) {
    const vitalStart = typeof nameOrRef === 'string' ? vitalsByName.get(nameOrRef) : vitalsByReference.get(nameOrRef);
    if (!vitalStart) {
        return;
    }
    stopCallback(buildDurationVital(vitalStart, vitalStart.startClocks, options, clocksNow()));
    if (typeof nameOrRef === 'string') {
        vitalsByName.delete(nameOrRef);
    }
    else {
        vitalsByReference.delete(nameOrRef);
    }
}
function buildDurationVital(vitalStart, startClocks, stopOptions, stopClocks) {
    var _a;
    return {
        name: vitalStart.name,
        type: "duration" /* VitalType.DURATION */,
        startClocks,
        duration: timeUtils_elapsed(startClocks.timeStamp, stopClocks.timeStamp),
        context: mergeInto_combine(vitalStart.context, stopOptions.context),
        description: (_a = stopOptions.description) !== null && _a !== void 0 ? _a : vitalStart.description,
    };
}
function processVital(vital, valueComputedBySdk) {
    const rawRumEvent = {
        date: vital.startClocks.timeStamp,
        vital: {
            id: generateUUID(),
            type: vital.type,
            name: vital.name,
            duration: toServerDuration(vital.duration),
            description: vital.description,
        },
        type: "vital" /* RumEventType.VITAL */,
    };
    if (valueComputedBySdk) {
        rawRumEvent._dd = {
            vital: {
                computed_value: true,
            },
        };
    }
    return {
        rawRumEvent,
        startTime: vital.startClocks.relative,
        customerContext: vital.context,
        domainContext: {},
    };
}

;// ../core/src/tools/utils/arrayUtils.ts
function removeDuplicates(array) {
    const set = new Set();
    array.forEach((item) => set.add(item));
    return Array.from(set);
}
function removeItem(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) {
        array.splice(index, 1);
    }
}

;// ../core/src/tools/boundedBuffer.ts

const BUFFER_LIMIT = 500;
function boundedBuffer_createBoundedBuffer() {
    const buffer = [];
    const add = (callback) => {
        const length = buffer.push(callback);
        if (length > BUFFER_LIMIT) {
            buffer.splice(0, 1);
        }
    };
    const remove = (callback) => {
        removeItem(buffer, callback);
    };
    const drain = (arg) => {
        buffer.forEach((callback) => callback(arg));
        buffer.length = 0;
    };
    return {
        add,
        remove,
        drain,
    };
}

;// ../core/src/tools/instrumentMethod.ts




/**
 * Instruments a method on a object, calling the given callback before the original method is
 * invoked. The callback receives an object with information about the method call.
 *
 * This function makes sure that we are "good citizens" regarding third party instrumentations: when
 * removing the instrumentation, the original method is usually restored, but if a third party
 * instrumentation was set after ours, we keep it in place and just replace our instrumentation with
 * a noop.
 *
 * Note: it is generally better to instrument methods that are "owned" by the object instead of ones
 * that are inherited from the prototype chain. Example:
 * * do:    `instrumentMethod(Array.prototype, 'push', ...)`
 * * don't: `instrumentMethod([], 'push', ...)`
 *
 * This method is also used to set event handler properties (ex: window.onerror = ...), as it has
 * the same requirements as instrumenting a method:
 * * if the event handler is already set by a third party, we need to call it and not just blindly
 * override it.
 * * if the event handler is set by a third party after us, we need to keep it in place when
 * removing ours.
 *
 * @example
 *
 *  instrumentMethod(window, 'fetch', ({ target, parameters, onPostCall }) => {
 *    console.log('Before calling fetch on', target, 'with parameters', parameters)
 *
 *    onPostCall((result) => {
 *      console.log('After fetch calling on', target, 'with parameters', parameters, 'and result', result)
 *    })
 *  })
 */
function instrumentMethod(targetPrototype, method, onPreCall, { computeHandlingStack } = {}) {
    let original = targetPrototype[method];
    if (typeof original !== 'function') {
        if (method in targetPrototype && method.startsWith('on')) {
            original = functionUtils_noop;
        }
        else {
            return { stop: functionUtils_noop };
        }
    }
    let stopped = false;
    const instrumentation = function () {
        if (stopped) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return original.apply(this, arguments);
        }
        const parameters = Array.from(arguments);
        let postCallCallback;
        callMonitored(onPreCall, null, [
            {
                target: this,
                parameters,
                onPostCall: (callback) => {
                    postCallCallback = callback;
                },
                handlingStack: computeHandlingStack ? createHandlingStack() : undefined,
            },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = original.apply(this, parameters);
        if (postCallCallback) {
            callMonitored(postCallCallback, null, [result]);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
    };
    targetPrototype[method] = instrumentation;
    return {
        stop: () => {
            stopped = true;
            // If the instrumentation has been removed by a third party, keep the last one
            if (targetPrototype[method] === instrumentation) {
                targetPrototype[method] = original;
            }
        },
    };
}
function instrumentSetter(targetPrototype, property, after) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, property);
    if (!originalDescriptor || !originalDescriptor.set || !originalDescriptor.configurable) {
        return { stop: noop };
    }
    const stoppedInstrumentation = noop;
    let instrumentation = (target, value) => {
        // put hooked setter into event loop to avoid of set latency
        setTimeout(() => {
            if (instrumentation !== stoppedInstrumentation) {
                after(target, value);
            }
        }, 0);
    };
    const instrumentationWrapper = function (value) {
        originalDescriptor.set.call(this, value);
        instrumentation(this, value);
    };
    Object.defineProperty(targetPrototype, property, {
        set: instrumentationWrapper,
    });
    return {
        stop: () => {
            var _a;
            if (((_a = Object.getOwnPropertyDescriptor(targetPrototype, property)) === null || _a === void 0 ? void 0 : _a.set) === instrumentationWrapper) {
                Object.defineProperty(targetPrototype, property, originalDescriptor);
            }
            instrumentation = stoppedInstrumentation;
        },
    };
}

;// ../core/src/tools/utils/urlPolyfill.ts

function normalizeUrl(url) {
    return buildUrl(url, location.href).href;
}
function isValidUrl(url) {
    try {
        return !!buildUrl(url);
    }
    catch (_a) {
        return false;
    }
}
function getPathName(url) {
    const pathname = buildUrl(url).pathname;
    return pathname[0] === '/' ? pathname : `/${pathname}`;
}
function buildUrl(url, base) {
    const supportedURL = getSupportedUrl();
    if (supportedURL) {
        try {
            return base !== undefined ? new supportedURL(url, base) : new supportedURL(url);
        }
        catch (error) {
            throw new Error(`Failed to construct URL: ${String(error)} ${jsonStringify_jsonStringify({ url, base })}`);
        }
    }
    if (base === undefined && !/:/.test(url)) {
        throw new Error(`Invalid URL: '${url}'`);
    }
    let doc = document;
    const anchorElement = doc.createElement('a');
    if (base !== undefined) {
        doc = document.implementation.createHTMLDocument('');
        const baseElement = doc.createElement('base');
        baseElement.href = base;
        doc.head.appendChild(baseElement);
        doc.body.appendChild(anchorElement);
    }
    anchorElement.href = url;
    return anchorElement;
}
const originalURL = URL;
let isURLSupported;
function getSupportedUrl() {
    if (isURLSupported === undefined) {
        try {
            const url = new originalURL('http://test/path');
            isURLSupported = url.href === 'http://test/path';
        }
        catch (_a) {
            isURLSupported = false;
        }
    }
    return isURLSupported ? originalURL : undefined;
}

;// ../core/src/browser/fetchObservable.ts





let fetchObservable;
function initFetchObservable() {
    if (!fetchObservable) {
        fetchObservable = createFetchObservable();
    }
    return fetchObservable;
}
function resetFetchObservable() {
    fetchObservable = undefined;
}
function createFetchObservable() {
    return new observable_Observable((observable) => {
        if (!window.fetch) {
            return;
        }
        const { stop } = instrumentMethod(window, 'fetch', (call) => beforeSend(call, observable), {
            computeHandlingStack: true,
        });
        return stop;
    });
}
function beforeSend({ parameters, onPostCall, handlingStack }, observable) {
    const [input, init] = parameters;
    let methodFromParams = init && init.method;
    if (methodFromParams === undefined && input instanceof Request) {
        methodFromParams = input.method;
    }
    const method = methodFromParams !== undefined ? String(methodFromParams).toUpperCase() : 'GET';
    const url = input instanceof Request ? input.url : normalizeUrl(String(input));
    const startClocks = clocksNow();
    const context = {
        state: 'start',
        init,
        input,
        method,
        startClocks,
        url,
        handlingStack,
    };
    observable.notify(context);
    // Those properties can be changed by observable subscribers
    parameters[0] = context.input;
    parameters[1] = context.init;
    onPostCall((responsePromise) => afterSend(observable, responsePromise, context));
}
function afterSend(observable, responsePromise, startContext) {
    const context = startContext;
    function reportFetch(partialContext) {
        context.state = 'resolve';
        Object.assign(context, partialContext);
        observable.notify(context);
    }
    responsePromise.then(monitor((response) => {
        reportFetch({
            response,
            responseType: response.type,
            status: response.status,
            isAborted: false,
        });
    }), monitor((error) => {
        var _a, _b;
        reportFetch({
            status: 0,
            isAborted: ((_b = (_a = context.init) === null || _a === void 0 ? void 0 : _a.signal) === null || _b === void 0 ? void 0 : _b.aborted) || (error instanceof DOMException && error.code === DOMException.ABORT_ERR),
            error,
        });
    }));
}

;// ../core/src/browser/cookie.ts



function setCookie(name, value, expireDelay = 0, options) {
    const date = new Date();
    date.setTime(date.getTime() + expireDelay);
    const expires = `expires=${date.toUTCString()}`;
    const sameSite = options && options.crossSite ? 'none' : 'strict';
    const domain = options && options.domain ? `;domain=${options.domain}` : '';
    const secure = options && options.secure ? ';secure' : '';
    const partitioned = options && options.partitioned ? ';partitioned' : '';
    document.cookie = `${name}=${value};${expires};path=/;samesite=${sameSite}${domain}${secure}${partitioned}`;
}
function getCookie(name) {
    return findCommaSeparatedValue(document.cookie, name);
}
let initCookieParsed;
/**
 * Returns a cached value of the cookie. Use this during SDK initialization (and whenever possible)
 * to avoid accessing document.cookie multiple times.
 */
function getInitCookie(name) {
    if (!initCookieParsed) {
        initCookieParsed = findCommaSeparatedValues(document.cookie);
    }
    return initCookieParsed.get(name);
}
function resetInitCookies() {
    initCookieParsed = undefined;
}
function deleteCookie(name, options) {
    setCookie(name, '', 0, options);
}
function areCookiesAuthorized(options) {
    if (document.cookie === undefined || document.cookie === null) {
        return false;
    }
    try {
        // Use a unique cookie name to avoid issues when the SDK is initialized multiple times during
        // the test cookie lifetime
        const testCookieName = `dd_cookie_test_${generateUUID()}`;
        const testCookieValue = 'test';
        setCookie(testCookieName, testCookieValue, ONE_MINUTE, options);
        const isCookieCorrectlySet = getCookie(testCookieName) === testCookieValue;
        deleteCookie(testCookieName, options);
        return isCookieCorrectlySet;
    }
    catch (error) {
        display.error(error);
        return false;
    }
}
/**
 * No API to retrieve it, number of levels for subdomain and suffix are unknown
 * strategy: find the minimal domain on which cookies are allowed to be set
 * https://web.dev/same-site-same-origin/#site
 */
let getCurrentSiteCache;
function getCurrentSite() {
    if (getCurrentSiteCache === undefined) {
        // Use a unique cookie name to avoid issues when the SDK is initialized multiple times during
        // the test cookie lifetime
        const testCookieName = `dd_site_test_${generateUUID()}`;
        const testCookieValue = 'test';
        const domainLevels = window.location.hostname.split('.');
        let candidateDomain = domainLevels.pop();
        while (domainLevels.length && !getCookie(testCookieName)) {
            candidateDomain = `${domainLevels.pop()}.${candidateDomain}`;
            setCookie(testCookieName, testCookieValue, ONE_SECOND, { domain: candidateDomain });
        }
        deleteCookie(testCookieName, { domain: candidateDomain });
        getCurrentSiteCache = candidateDomain;
    }
    return getCurrentSiteCache;
}

;// ../core/src/domain/synthetics/syntheticsWorkerValues.ts

const SYNTHETICS_TEST_ID_COOKIE_NAME = 'datadog-synthetics-public-id';
const SYNTHETICS_RESULT_ID_COOKIE_NAME = 'datadog-synthetics-result-id';
const SYNTHETICS_INJECTS_RUM_COOKIE_NAME = 'datadog-synthetics-injects-rum';
function willSyntheticsInjectRum() {
    return Boolean(window._DATADOG_SYNTHETICS_INJECTS_RUM || getInitCookie(SYNTHETICS_INJECTS_RUM_COOKIE_NAME));
}
function getSyntheticsTestId() {
    const value = window._DATADOG_SYNTHETICS_PUBLIC_ID || getInitCookie(SYNTHETICS_TEST_ID_COOKIE_NAME);
    return typeof value === 'string' ? value : undefined;
}
function getSyntheticsResultId() {
    const value = window._DATADOG_SYNTHETICS_RESULT_ID || getInitCookie(SYNTHETICS_RESULT_ID_COOKIE_NAME);
    return typeof value === 'string' ? value : undefined;
}

;// ../core/src/tools/utils/browserDetection.ts
function isChromium() {
    return detectBrowserCached() === 0 /* Browser.CHROMIUM */;
}
function isSafari() {
    return detectBrowserCached() === 1 /* Browser.SAFARI */;
}
let browserCache;
function detectBrowserCached() {
    return browserCache !== null && browserCache !== void 0 ? browserCache : (browserCache = detectBrowser());
}
// Exported only for tests
function detectBrowser(browserWindow = window) {
    var _a;
    const userAgent = browserWindow.navigator.userAgent;
    if (browserWindow.chrome || /HeadlessChrome/.test(userAgent)) {
        return 0 /* Browser.CHROMIUM */;
    }
    if (
    // navigator.vendor is deprecated, but it is the most resilient way we found to detect
    // "Apple maintained browsers" (AKA Safari). If one day it gets removed, we still have the
    // useragent test as a semi-working fallback.
    ((_a = browserWindow.navigator.vendor) === null || _a === void 0 ? void 0 : _a.indexOf('Apple')) === 0 ||
        (/safari/i.test(userAgent) && !/chrome|android/i.test(userAgent))) {
        return 1 /* Browser.SAFARI */;
    }
    return 2 /* Browser.OTHER */;
}

;// ../core/src/domain/session/sessionConstants.ts

const SESSION_TIME_OUT_DELAY = 4 * ONE_HOUR;
const SESSION_EXPIRATION_DELAY = 15 * ONE_MINUTE;
const SESSION_COOKIE_EXPIRATION_DELAY = ONE_YEAR;
const SessionPersistence = {
    COOKIE: 'cookie',
    LOCAL_STORAGE: 'local-storage',
};

;// ../core/src/tools/utils/polyfills.ts
function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
        const item = array[i];
        if (predicate(item, i, array)) {
            return item;
        }
    }
    return undefined;
}
// Keep the following wrapper functions as it can be mangled and will result in smaller bundle size that using
// the native Object.values and Object.entries directly
function objectValues(object) {
    return Object.values(object);
}
function objectEntries(object) {
    return Object.entries(object);
}

;// ../core/src/domain/session/sessionStateValidation.ts
const SESSION_ENTRY_REGEXP = /^([a-zA-Z]+)=([a-z0-9-]+)$/;
const SESSION_ENTRY_SEPARATOR = '&';
function isValidSessionString(sessionString) {
    return (!!sessionString &&
        (sessionString.indexOf(SESSION_ENTRY_SEPARATOR) !== -1 || SESSION_ENTRY_REGEXP.test(sessionString)));
}

;// ../core/src/domain/session/sessionState.ts






const EXPIRED = '1';
function getExpiredSessionState(previousSessionState, configuration) {
    const expiredSessionState = {
        isExpired: EXPIRED,
    };
    if (configuration.trackAnonymousUser) {
        if (previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId) {
            expiredSessionState.anonymousId = previousSessionState === null || previousSessionState === void 0 ? void 0 : previousSessionState.anonymousId;
        }
        else {
            expiredSessionState.anonymousId = generateAnonymousId();
        }
    }
    return expiredSessionState;
}
function isSessionInNotStartedState(session) {
    return isEmptyObject(session);
}
function isSessionStarted(session) {
    return !isSessionInNotStartedState(session);
}
function isSessionInExpiredState(session) {
    return session.isExpired !== undefined || !isActiveSession(session);
}
// An active session is a session in either `Tracked` or `NotTracked` state
function isActiveSession(sessionState) {
    // created and expire can be undefined for versions which was not storing them
    // these checks could be removed when older versions will not be available/live anymore
    return ((sessionState.created === undefined || dateNow() - Number(sessionState.created) < SESSION_TIME_OUT_DELAY) &&
        (sessionState.expire === undefined || dateNow() < Number(sessionState.expire)));
}
function expandSessionState(session) {
    session.expire = String(dateNow() + SESSION_EXPIRATION_DELAY);
}
function toSessionString(session) {
    return (objectEntries(session)
        // we use `aid` as a key for anonymousId
        .map(([key, value]) => (key === 'anonymousId' ? `aid=${value}` : `${key}=${value}`))
        .join(SESSION_ENTRY_SEPARATOR));
}
function toSessionState(sessionString) {
    const session = {};
    if (isValidSessionString(sessionString)) {
        sessionString.split(SESSION_ENTRY_SEPARATOR).forEach((entry) => {
            const matches = SESSION_ENTRY_REGEXP.exec(entry);
            if (matches !== null) {
                const [, key, value] = matches;
                if (key === 'aid') {
                    // we use `aid` as a key for anonymousId
                    session.anonymousId = value;
                }
                else {
                    session[key] = value;
                }
            }
        });
    }
    return session;
}

;// ../core/src/domain/session/storeStrategies/sessionStoreStrategy.ts
const SESSION_STORE_KEY = '_dd_s';

;// ../core/src/domain/session/storeStrategies/sessionInCookie.ts


// import { tryOldCookiesMigration } from '../oldCookiesMigration'



function selectCookieStrategy(initConfiguration) {
    const cookieOptions = buildCookieOptions(initConfiguration);
    return areCookiesAuthorized(cookieOptions) ? { type: SessionPersistence.COOKIE, cookieOptions } : undefined;
}
function initCookieStrategy(configuration, cookieOptions) {
    const cookieStore = {
        /**
         * Lock strategy allows mitigating issues due to concurrent access to cookie.
         * This issue concerns only chromium browsers and enabling this on firefox increases cookie write failures.
         */
        isLockEnabled: isChromium(),
        persistSession: persistSessionCookie(cookieOptions),
        retrieveSession: retrieveSessionCookie,
        expireSession: (sessionState) => expireSessionCookie(cookieOptions, sessionState, configuration),
    };
    // tryOldCookiesMigration(cookieStore)
    return cookieStore;
}
function persistSessionCookie(options) {
    return (session) => {
        setCookie(SESSION_STORE_KEY, toSessionString(session), SESSION_EXPIRATION_DELAY, options);
    };
}
function expireSessionCookie(options, sessionState, configuration) {
    const expiredSessionState = getExpiredSessionState(sessionState, configuration);
    // we do not extend cookie expiration date
    setCookie(SESSION_STORE_KEY, toSessionString(expiredSessionState), configuration.trackAnonymousUser ? SESSION_COOKIE_EXPIRATION_DELAY : SESSION_TIME_OUT_DELAY, options);
}
function retrieveSessionCookie() {
    const sessionString = getCookie(SESSION_STORE_KEY);
    const sessionState = toSessionState(sessionString);
    return sessionState;
}
function buildCookieOptions(initConfiguration) {
    const cookieOptions = {};
    cookieOptions.secure =
        !!initConfiguration.useSecureSessionCookie || !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    cookieOptions.crossSite = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    cookieOptions.partitioned = !!initConfiguration.usePartitionedCrossSiteSessionCookie;
    if (initConfiguration.trackSessionAcrossSubdomains) {
        cookieOptions.domain = getCurrentSite();
    }
    return cookieOptions;
}

;// ../core/src/domain/session/storeStrategies/sessionInLocalStorage.ts




const LOCAL_STORAGE_TEST_KEY = '_dd_test_';
function selectLocalStorageStrategy() {
    try {
        const id = generateUUID();
        const testKey = `${LOCAL_STORAGE_TEST_KEY}${id}`;
        localStorage.setItem(testKey, id);
        const retrievedId = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return id === retrievedId ? { type: SessionPersistence.LOCAL_STORAGE } : undefined;
    }
    catch (_a) {
        return undefined;
    }
}
function initLocalStorageStrategy(configuration) {
    return {
        isLockEnabled: false,
        persistSession: persistInLocalStorage,
        retrieveSession: retrieveSessionFromLocalStorage,
        expireSession: (sessionState) => expireSessionFromLocalStorage(sessionState, configuration),
    };
}
function persistInLocalStorage(sessionState) {
    localStorage.setItem(SESSION_STORE_KEY, toSessionString(sessionState));
}
function retrieveSessionFromLocalStorage() {
    const sessionString = localStorage.getItem(SESSION_STORE_KEY);
    return toSessionState(sessionString);
}
function expireSessionFromLocalStorage(previousSessionState, configuration) {
    persistInLocalStorage(getExpiredSessionState(previousSessionState, configuration));
}

;// ../core/src/domain/session/sessionStoreOperations.ts



const LOCK_RETRY_DELAY = 10;
const LOCK_MAX_TRIES = 100;
const bufferedOperations = [];
let ongoingOperations;
function processSessionStoreOperations(operations, sessionStoreStrategy, numberOfRetries = 0) {
    var _a;
    const { isLockEnabled, persistSession, expireSession } = sessionStoreStrategy;
    const persistWithLock = (session) => persistSession(Object.assign(Object.assign({}, session), { lock: currentLock }));
    const retrieveStore = () => {
        const session = sessionStoreStrategy.retrieveSession();
        const lock = session.lock;
        if (session.lock) {
            delete session.lock;
        }
        return {
            session,
            lock,
        };
    };
    if (!ongoingOperations) {
        ongoingOperations = operations;
    }
    if (operations !== ongoingOperations) {
        bufferedOperations.push(operations);
        return;
    }
    if (isLockEnabled && numberOfRetries >= LOCK_MAX_TRIES) {
        next(sessionStoreStrategy);
        return;
    }
    let currentLock;
    let currentStore = retrieveStore();
    if (isLockEnabled) {
        // if someone has lock, retry later
        if (currentStore.lock) {
            retryLater(operations, sessionStoreStrategy, numberOfRetries);
            return;
        }
        // acquire lock
        currentLock = generateUUID();
        persistWithLock(currentStore.session);
        // if lock is not acquired, retry later
        currentStore = retrieveStore();
        if (currentStore.lock !== currentLock) {
            retryLater(operations, sessionStoreStrategy, numberOfRetries);
            return;
        }
    }
    let processedSession = operations.process(currentStore.session);
    if (isLockEnabled) {
        // if lock corrupted after process, retry later
        currentStore = retrieveStore();
        if (currentStore.lock !== currentLock) {
            retryLater(operations, sessionStoreStrategy, numberOfRetries);
            return;
        }
    }
    if (processedSession) {
        if (isSessionInExpiredState(processedSession)) {
            expireSession(processedSession);
        }
        else {
            expandSessionState(processedSession);
            if (isLockEnabled) {
                persistWithLock(processedSession);
            }
            else {
                persistSession(processedSession);
            }
        }
    }
    if (isLockEnabled) {
        // correctly handle lock around expiration would require to handle this case properly at several levels
        // since we don't have evidence of lock issues around expiration, let's just not do the corruption check for it
        if (!(processedSession && isSessionInExpiredState(processedSession))) {
            // if lock corrupted after persist, retry later
            currentStore = retrieveStore();
            if (currentStore.lock !== currentLock) {
                retryLater(operations, sessionStoreStrategy, numberOfRetries);
                return;
            }
            persistSession(currentStore.session);
            processedSession = currentStore.session;
        }
    }
    // call after even if session is not persisted in order to perform operations on
    // up-to-date session state value => the value could have been modified by another tab
    (_a = operations.after) === null || _a === void 0 ? void 0 : _a.call(operations, processedSession || currentStore.session);
    next(sessionStoreStrategy);
}
function retryLater(operations, sessionStore, currentNumberOfRetries) {
    timer_setTimeout(() => {
        processSessionStoreOperations(operations, sessionStore, currentNumberOfRetries + 1);
    }, LOCK_RETRY_DELAY);
}
function next(sessionStore) {
    ongoingOperations = undefined;
    const nextOperations = bufferedOperations.shift();
    if (nextOperations) {
        processSessionStoreOperations(nextOperations, sessionStore);
    }
}

;// ../core/src/domain/session/sessionStore.ts











/**
 * Every second, the storage will be polled to check for any change that can occur
 * to the session state in another browser tab, or another window.
 * This value has been determined from our previous cookie-only implementation.
 */
const STORAGE_POLL_DELAY = ONE_SECOND;
/**
 * Selects the correct session store strategy type based on the configuration and storage
 * availability.
 */
function selectSessionStoreStrategyType(initConfiguration) {
    switch (initConfiguration.sessionPersistence) {
        case SessionPersistence.COOKIE:
            return selectCookieStrategy(initConfiguration);
        case SessionPersistence.LOCAL_STORAGE:
            return selectLocalStorageStrategy();
        case undefined: {
            let sessionStoreStrategyType = selectCookieStrategy(initConfiguration);
            if (!sessionStoreStrategyType /* && initConfiguration.allowFallbackToLocalStorage */) {
                sessionStoreStrategyType = selectLocalStorageStrategy();
            }
            return sessionStoreStrategyType;
        }
        default:
            display.error(`Invalid session persistence '${String(initConfiguration.sessionPersistence)}'`);
    }
}
/**
 * Different session concepts:
 * - tracked, the session has an id and is updated along the user navigation
 * - not tracked, the session does not have an id but it is updated along the user navigation
 * - inactive, no session in store or session expired, waiting for a renew session
 */
function startSessionStore(sessionStoreStrategyType, configuration, productKey, computeSessionState) {
    const renewObservable = new observable_Observable();
    const expireObservable = new observable_Observable();
    const sessionStateUpdateObservable = new observable_Observable();
    const sessionStoreStrategy = sessionStoreStrategyType.type === SessionPersistence.COOKIE
        ? initCookieStrategy(configuration, sessionStoreStrategyType.cookieOptions)
        : initLocalStorageStrategy(configuration);
    const { expireSession } = sessionStoreStrategy;
    const watchSessionTimeoutId = timer_setInterval(watchSession, STORAGE_POLL_DELAY);
    let sessionCache;
    startSession();
    const { throttled: throttledExpandOrRenewSession, cancel: cancelExpandOrRenewSession } = throttle(() => {
        processSessionStoreOperations({
            process: (sessionState) => {
                if (isSessionInNotStartedState(sessionState)) {
                    return;
                }
                const synchronizedSession = synchronizeSession(sessionState);
                expandOrRenewSessionState(synchronizedSession);
                return synchronizedSession;
            },
            after: (sessionState) => {
                if (isSessionStarted(sessionState) && !hasSessionInCache()) {
                    renewSessionInCache(sessionState);
                }
                sessionCache = sessionState;
            },
        }, sessionStoreStrategy);
    }, STORAGE_POLL_DELAY);
    function expandSession() {
        processSessionStoreOperations({
            process: (sessionState) => (hasSessionInCache() ? synchronizeSession(sessionState) : undefined),
        }, sessionStoreStrategy);
    }
    /**
     * allows two behaviors:
     * - if the session is active, synchronize the session cache without updating the session store
     * - if the session is not active, clear the session store and expire the session cache
     */
    function watchSession() {
        processSessionStoreOperations({
            process: (sessionState) => isSessionInExpiredState(sessionState) ? getExpiredSessionState(sessionState, configuration) : undefined,
            after: synchronizeSession,
        }, sessionStoreStrategy);
    }
    function synchronizeSession(sessionState) {
        if (isSessionInExpiredState(sessionState)) {
            sessionState = getExpiredSessionState(sessionState, configuration);
        }
        if (hasSessionInCache()) {
            if (isSessionInCacheOutdated(sessionState)) {
                expireSessionInCache();
            }
            else {
                sessionStateUpdateObservable.notify({ previousState: sessionCache, newState: sessionState });
                sessionCache = sessionState;
            }
        }
        return sessionState;
    }
    function startSession() {
        processSessionStoreOperations({
            process: (sessionState) => {
                if (isSessionInNotStartedState(sessionState)) {
                    return getExpiredSessionState(sessionState, configuration);
                }
            },
            after: (sessionState) => {
                sessionCache = sessionState;
            },
        }, sessionStoreStrategy);
    }
    function expandOrRenewSessionState(sessionState) {
        if (isSessionInNotStartedState(sessionState)) {
            return false;
        }
        const { trackingType, isTracked } = computeSessionState(sessionState[productKey]);
        sessionState[productKey] = trackingType;
        delete sessionState.isExpired;
        if (isTracked && !sessionState.id) {
            sessionState.id = generateUUID();
            sessionState.created = String(dateNow());
        }
    }
    function hasSessionInCache() {
        return sessionCache[productKey] !== undefined;
    }
    function isSessionInCacheOutdated(sessionState) {
        return sessionCache.id !== sessionState.id || sessionCache[productKey] !== sessionState[productKey];
    }
    function expireSessionInCache() {
        sessionCache = getExpiredSessionState(sessionCache, configuration);
        expireObservable.notify();
    }
    function renewSessionInCache(sessionState) {
        sessionCache = sessionState;
        renewObservable.notify();
    }
    function updateSessionState(partialSessionState) {
        processSessionStoreOperations({
            process: (sessionState) => (Object.assign(Object.assign({}, sessionState), partialSessionState)),
            after: synchronizeSession,
        }, sessionStoreStrategy);
    }
    return {
        expandOrRenewSession: throttledExpandOrRenewSession,
        expandSession,
        getSession: () => sessionCache,
        renewObservable,
        expireObservable,
        sessionStateUpdateObservable,
        restartSession: startSession,
        expire: () => {
            cancelExpandOrRenewSession();
            expireSession(sessionCache);
            synchronizeSession(getExpiredSessionState(sessionCache, configuration));
        },
        stop: () => {
            timer_clearInterval(watchSessionTimeoutId);
        },
        updateSessionState,
    };
}

;// ../core/src/domain/configuration/intakeSites.ts
const intakeSites_INTAKE_SITE_STAGING = 'datad0g.com';
const INTAKE_SITE_FED_STAGING = 'dd0g-gov.com';
const INTAKE_SITE_US1 = 'datadoghq.com';
const INTAKE_SITE_EU1 = 'datadoghq.eu';
const INTAKE_SITE_US1_FED = 'ddog-gov.com';
const PCI_INTAKE_HOST_US1 = 'pci.browser-intake-datadoghq.com';
const INTAKE_URL_PARAMETERS = ['ddsource', 'ddtags'];

;// ../core/src/domain/configuration/endpointBuilder.ts




function createEndpointBuilder(initConfiguration, trackType, configurationTags) {
    const buildUrlWithParameters = createEndpointUrlWithParametersBuilder(initConfiguration, trackType);
    return {
        build(api, payload) {
            const parameters = buildEndpointParameters(initConfiguration, trackType, configurationTags, api, payload);
            return buildUrlWithParameters(parameters);
        },
        urlPrefix: buildUrlWithParameters(''),
        trackType,
    };
}
/**
 * Create a function used to build a full endpoint url from provided parameters. The goal of this
 * function is to pre-compute some parts of the URL to avoid re-computing everything on every
 * request, as only parameters are changing.
 */
function createEndpointUrlWithParametersBuilder(initConfiguration, trackType) {
    const path = `/api/v2/${trackType}`;
    const proxy = initConfiguration.proxy;
    if (typeof proxy === 'string') {
        const normalizedProxyUrl = normalizeUrl(proxy);
        return (parameters) => `${normalizedProxyUrl}?ddforward=${encodeURIComponent(`${path}?${parameters}`)}`;
    }
    if (typeof proxy === 'function') {
        return (parameters) => proxy({ path, parameters });
    }
    const host = buildEndpointHost(trackType, initConfiguration);
    return (parameters) => `https://${host}${path}?${parameters}`;
}
function buildEndpointHost(trackType, initConfiguration) {
    const { site = INTAKE_SITE_US1, internalAnalyticsSubdomain } = initConfiguration;
    if (trackType === 'logs' && initConfiguration.usePciIntake && site === INTAKE_SITE_US1) {
        return PCI_INTAKE_HOST_US1;
    }
    if (internalAnalyticsSubdomain && site === INTAKE_SITE_US1) {
        return `${internalAnalyticsSubdomain}.${INTAKE_SITE_US1}`;
    }
    if (site === INTAKE_SITE_FED_STAGING) {
        return `http-intake.logs.${site}`;
    }
    const domainParts = site.split('.');
    const extension = domainParts.pop();
    return `browser-intake-${domainParts.join('-')}.${extension}`;
}
/**
 * Build parameters to be used for an intake request. Parameters should be re-built for each
 * request, as they change randomly.
 */
function buildEndpointParameters({ clientToken, internalAnalyticsSubdomain }, trackType, configurationTags, api, { retry, encoding }) {
    const tags = [`sdk_version:${"6.0.0"}`, `api:${api}`].concat(configurationTags);
    if (retry) {
        tags.push(`retry_count:${retry.count}`, `retry_after:${retry.lastFailureStatus}`);
    }
    const parameters = [
        'ddsource=browser',
        `ddtags=${encodeURIComponent(tags.join(','))}`,
        `dd-api-key=${clientToken}`,
        `dd-evp-origin-version=${encodeURIComponent("6.0.0")}`,
        'dd-evp-origin=browser',
        `dd-request-id=${generateUUID()}`,
    ];
    if (encoding) {
        parameters.push(`dd-evp-encoding=${encoding}`);
    }
    if (trackType === 'rum') {
        parameters.push(`batch_time=${timeUtils_timeStampNow()}`);
    }
    if (internalAnalyticsSubdomain) {
        parameters.reverse();
    }
    return parameters.join('&');
}

;// ../core/src/domain/configuration/tags.ts

const TAG_SIZE_LIMIT = 200;
function buildTags(configuration) {
    const { env, service, version, datacenter } = configuration;
    const tags = [];
    if (env) {
        tags.push(buildTag('env', env));
    }
    if (service) {
        tags.push(buildTag('service', service));
    }
    if (version) {
        tags.push(buildTag('version', version));
    }
    if (datacenter) {
        tags.push(buildTag('datacenter', datacenter));
    }
    return tags;
}
function buildTag(key, rawValue) {
    // See https://docs.datadoghq.com/getting_started/tagging/#defining-tags for tags syntax. Note
    // that the backend may not follow the exact same rules, so we only want to display an informal
    // warning.
    const valueSizeLimit = TAG_SIZE_LIMIT - key.length - 1;
    if (rawValue.length > valueSizeLimit || hasForbiddenCharacters(rawValue)) {
        display.warn(`${key} value doesn't meet tag requirements and will be sanitized. ${MORE_DETAILS} ${DOCS_ORIGIN}/getting_started/tagging/#defining-tags`);
    }
    // Let the backend do most of the sanitization, but still make sure multiple tags can't be crafted
    // by forging a value containing commas.
    const sanitizedValue = rawValue.replace(/,/g, '_');
    return `${key}:${sanitizedValue}`;
}
function hasForbiddenCharacters(rawValue) {
    // Unicode property escapes is not supported in all browsers, so we use a try/catch.
    // Todo: Remove the try/catch when dropping support for Chrome 63 and Firefox 67
    // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape#browser_compatibility
    if (!supportUnicodePropertyEscapes()) {
        return false;
    }
    // We use the Unicode property escapes to match any character that is a letter including other languages like Chinese, Japanese, etc.
    // p{Ll} matches a lowercase letter.
    // p{Lo} matches a letter that is neither uppercase nor lowercase (ex: Japanese characters).
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape#unicode_property_escapes_vs._character_classes
    return new RegExp('[^\\p{Ll}\\p{Lo}0-9_:./-]', 'u').test(rawValue);
}
function supportUnicodePropertyEscapes() {
    try {
        new RegExp('[\\p{Ll}]', 'u');
        return true;
    }
    catch (_a) {
        return false;
    }
}

;// ../core/src/domain/configuration/transportConfiguration.ts



function computeTransportConfiguration(initConfiguration) {
    const site = initConfiguration.site || INTAKE_SITE_US1;
    const tags = buildTags(initConfiguration);
    const endpointBuilders = computeEndpointBuilders(initConfiguration, tags);
    const replicaConfiguration = computeReplicaConfiguration(initConfiguration, tags);
    return Object.assign({ replica: replicaConfiguration, site }, endpointBuilders);
}
function computeEndpointBuilders(initConfiguration, tags) {
    return {
        logsEndpointBuilder: createEndpointBuilder(initConfiguration, 'logs', tags),
        rumEndpointBuilder: createEndpointBuilder(initConfiguration, 'rum', tags),
        sessionReplayEndpointBuilder: createEndpointBuilder(initConfiguration, 'replay', tags),
    };
}
function computeReplicaConfiguration(initConfiguration, tags) {
    if (!initConfiguration.replica) {
        return;
    }
    const replicaConfiguration = Object.assign(Object.assign({}, initConfiguration), { site: INTAKE_SITE_US1, clientToken: initConfiguration.replica.clientToken });
    const replicaEndpointBuilders = {
        logsEndpointBuilder: createEndpointBuilder(replicaConfiguration, 'logs', tags),
        rumEndpointBuilder: createEndpointBuilder(replicaConfiguration, 'rum', tags),
    };
    return Object.assign({ applicationId: initConfiguration.replica.applicationId }, replicaEndpointBuilders);
}
function isIntakeUrl(url) {
    // check if tags is present in the query string
    return INTAKE_URL_PARAMETERS.every((param) => url.includes(param));
}

;// ../core/src/domain/configuration/configuration.ts









const DefaultPrivacyLevel = {
    ALLOW: 'allow',
    MASK: 'mask',
    MASK_USER_INPUT: 'mask-user-input',
};
const TraceContextInjection = {
    ALL: 'all',
    SAMPLED: 'sampled',
};
function isString(tag, tagName) {
    if (tag !== undefined && tag !== null && typeof tag !== 'string') {
        display.error(`${tagName} must be defined as a string`);
        return false;
    }
    return true;
}
function isDatadogSite(site) {
    if (site && typeof site === 'string' && !/(datadog|ddog|datad0g|dd0g)/.test(site)) {
        display.error(`Site should be a valid Datadog site. ${MORE_DETAILS} ${DOCS_ORIGIN}/getting_started/site/.`);
        return false;
    }
    return true;
}
function isSampleRate(sampleRate, name) {
    if (sampleRate !== undefined && !isPercentage(sampleRate)) {
        display.error(`${name} Sample Rate should be a number between 0 and 100`);
        return false;
    }
    return true;
}
function validateAndBuildConfiguration(initConfiguration) {
    var _a, _b, _c, _d, _e, _f;
    if (!initConfiguration || !initConfiguration.clientToken) {
        display.error('Client Token is not configured, we will not send any data.');
        return;
    }
    if (!isDatadogSite(initConfiguration.site) ||
        !isSampleRate(initConfiguration.sessionSampleRate, 'Session') ||
        !isSampleRate(initConfiguration.telemetrySampleRate, 'Telemetry') ||
        !isSampleRate(initConfiguration.telemetryConfigurationSampleRate, 'Telemetry Configuration') ||
        !isSampleRate(initConfiguration.telemetryUsageSampleRate, 'Telemetry Usage') ||
        !isString(initConfiguration.version, 'Version') ||
        !isString(initConfiguration.env, 'Env') ||
        !isString(initConfiguration.service, 'Service')) {
        return;
    }
    if (initConfiguration.trackingConsent !== undefined &&
        !objectHasValue(TrackingConsent, initConfiguration.trackingConsent)) {
        display.error('Tracking Consent should be either "granted" or "not-granted"');
        return;
    }
    return Object.assign({ beforeSend: initConfiguration.beforeSend && catchUserErrors(initConfiguration.beforeSend, 'beforeSend threw an error:'), sessionStoreStrategyType: selectSessionStoreStrategyType(initConfiguration), sessionSampleRate: (_a = initConfiguration.sessionSampleRate) !== null && _a !== void 0 ? _a : 100, telemetrySampleRate: (_b = initConfiguration.telemetrySampleRate) !== null && _b !== void 0 ? _b : 20, telemetryConfigurationSampleRate: (_c = initConfiguration.telemetryConfigurationSampleRate) !== null && _c !== void 0 ? _c : 5, telemetryUsageSampleRate: (_d = initConfiguration.telemetryUsageSampleRate) !== null && _d !== void 0 ? _d : 5, service: initConfiguration.service || undefined, silentMultipleInit: !!initConfiguration.silentMultipleInit, allowUntrustedEvents: !!initConfiguration.allowUntrustedEvents, trackingConsent: (_e = initConfiguration.trackingConsent) !== null && _e !== void 0 ? _e : TrackingConsent.GRANTED, trackAnonymousUser: (_f = initConfiguration.trackAnonymousUser) !== null && _f !== void 0 ? _f : true, storeContextsAcrossPages: !!initConfiguration.storeContextsAcrossPages, 
        /**
         * beacon payload max queue size implementation is 64kb
         * ensure that we leave room for logs, rum and potential other users
         */
        batchBytesLimit: 16 * ONE_KIBI_BYTE, eventRateLimiterThreshold: 3000, maxTelemetryEventsPerPage: 15, 
        /**
         * flush automatically, aim to be lower than ALB connection timeout
         * to maximize connection reuse.
         */
        flushTimeout: (30 * ONE_SECOND), 
        /**
         * Logs intake limit
         */
        batchMessagesLimit: 50, messageBytesLimit: 256 * ONE_KIBI_BYTE }, computeTransportConfiguration(initConfiguration));
}
function configuration_serializeConfiguration(initConfiguration) {
    return {
        session_sample_rate: initConfiguration.sessionSampleRate,
        telemetry_sample_rate: initConfiguration.telemetrySampleRate,
        telemetry_configuration_sample_rate: initConfiguration.telemetryConfigurationSampleRate,
        telemetry_usage_sample_rate: initConfiguration.telemetryUsageSampleRate,
        use_before_send: !!initConfiguration.beforeSend,
        use_partitioned_cross_site_session_cookie: initConfiguration.usePartitionedCrossSiteSessionCookie,
        use_secure_session_cookie: initConfiguration.useSecureSessionCookie,
        use_proxy: !!initConfiguration.proxy,
        silent_multiple_init: initConfiguration.silentMultipleInit,
        track_session_across_subdomains: initConfiguration.trackSessionAcrossSubdomains,
        track_anonymous_user: initConfiguration.trackAnonymousUser,
        session_persistence: initConfiguration.sessionPersistence,
        // allow_fallback_to_local_storage: !!initConfiguration.allowFallbackToLocalStorage,
        store_contexts_across_pages: !!initConfiguration.storeContextsAcrossPages,
        allow_untrusted_events: !!initConfiguration.allowUntrustedEvents,
        tracking_consent: initConfiguration.trackingConsent,
    };
}

;// ../core/src/tools/matchOption.ts


function matchOption_isMatchOption(item) {
    const itemType = typeUtils_getType(item);
    return itemType === 'string' || itemType === 'function' || item instanceof RegExp;
}
/**
 * Returns true if value can be matched by at least one of the provided MatchOptions.
 * When comparing strings, setting useStartsWith to true will compare the value with the start of
 * the option, instead of requiring an exact match.
 */
function matchList(list, value, useStartsWith = false) {
    return list.some((item) => {
        try {
            if (typeof item === 'function') {
                return item(value);
            }
            else if (item instanceof RegExp) {
                return item.test(value);
            }
            else if (typeof item === 'string') {
                return useStartsWith ? value.startsWith(item) : item === value;
            }
        }
        catch (e) {
            display.error(e);
        }
        return false;
    });
}

;// ../rum-core/src/domain/tracing/tracer.ts

function isTracingOption(item) {
    const expectedItem = item;
    return (typeUtils_getType(expectedItem) === 'object' &&
        matchOption_isMatchOption(expectedItem.match) &&
        Array.isArray(expectedItem.propagatorTypes));
}
/**
 * Clear tracing information to avoid incomplete traces. Ideally, we should do it when the
 * request did not reach the server, but the browser does not expose this. So, we clear tracing
 * information if the request ended with status 0 without being aborted by the application.
 *
 * Reasoning:
 *
 * * Applications are usually aborting requests after a bit of time, for example when the user is
 * typing (autocompletion) or navigating away (in a SPA). With a performant device and good
 * network conditions, the request is likely to reach the server before being canceled.
 *
 * * Requests aborted otherwise (ex: lack of internet, CORS issue, blocked by a privacy extension)
 * are likely to finish quickly and without reaching the server.
 *
 * Of course, it might not be the case every time, but it should limit having incomplete traces a
 * bit.
 * */
function clearTracingIfNeeded(context) {
    if (context.status === 0 && !context.isAborted) {
        context.traceId = undefined;
        context.spanId = undefined;
        context.traceSampled = undefined;
    }
}
function startTracer(configuration, sessionManager) {
    return {
        clearTracingIfNeeded,
        traceFetch: (context) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, (tracingHeaders) => {
            var _a;
            if (context.input instanceof Request && !((_a = context.init) === null || _a === void 0 ? void 0 : _a.headers)) {
                context.input = new Request(context.input);
                Object.keys(tracingHeaders).forEach((key) => {
                    ;
                    context.input.headers.append(key, tracingHeaders[key]);
                });
            }
            else {
                context.init = shallowClone(context.init);
                const headers = [];
                if (context.init.headers instanceof Headers) {
                    context.init.headers.forEach((value, key) => {
                        headers.push([key, value]);
                    });
                }
                else if (Array.isArray(context.init.headers)) {
                    context.init.headers.forEach((header) => {
                        headers.push(header);
                    });
                }
                else if (context.init.headers) {
                    Object.keys(context.init.headers).forEach((key) => {
                        headers.push([key, context.init.headers[key]]);
                    });
                }
                context.init.headers = headers.concat(objectEntries(tracingHeaders));
            }
        }),
        traceXhr: (context, xhr) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, (tracingHeaders) => {
            Object.keys(tracingHeaders).forEach((name) => {
                xhr.setRequestHeader(name, tracingHeaders[name]);
            });
        }),
    };
}
function injectHeadersIfTracingAllowed(configuration, context, sessionManager, inject) {
    if (!isTracingSupported() || !sessionManager.findTrackedSession()) {
        return;
    }
    // const tracingOption = configuration.allowedTracingUrls.find((tracingOption: TracingOption) =>
    //   matchList([tracingOption.match], context.url!, true)
    // )
    // if (!tracingOption) {
    //   return
    // }
    // const traceId = createTraceIdentifier()
    // context.traceSampled = isTraceSampled(traceId, configuration.traceSampleRate)
    // const shouldInjectHeaders = context.traceSampled || configuration.traceContextInjection === TraceContextInjection.ALL
    // if (!shouldInjectHeaders) {
    //   return
    // }
    // context.traceId = traceId
    // context.spanId = createSpanIdentifier()
    // inject(makeTracingHeaders(context.traceId, context.spanId, context.traceSampled, tracingOption.propagatorTypes))
}
function isTracingSupported() {
    // return getCrypto() !== undefined
    return false;
}
/**
 * When trace is not sampled, set priority to '0' instead of not adding the tracing headers
 * to prepare the implementation for sampling delegation.
 */
// function makeTracingHeaders(
//   traceId: TraceIdentifier,
//   spanId: SpanIdentifier,
//   traceSampled: boolean,
//   propagatorTypes: PropagatorType[]
// ): TracingHeaders {
//   const tracingHeaders: TracingHeaders = {}
// 
//   propagatorTypes.forEach((propagatorType) => {
//     switch (propagatorType) {
//       case 'datadog': {
//         Object.assign(tracingHeaders, {
//           'x-datadog-origin': 'rum',
//           'x-datadog-parent-id': spanId.toString(),
//           'x-datadog-sampling-priority': traceSampled ? '1' : '0',
//           'x-datadog-trace-id': traceId.toString(),
//         })
//         break
//       }
//       // https://www.w3.org/TR/trace-context/
//       case 'tracecontext': {
//         Object.assign(tracingHeaders, {
//           traceparent: `00-0000000000000000${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-0${
//             traceSampled ? '1' : '0'
//           }`,
//           tracestate: `dd=s:${traceSampled ? '1' : '0'};o:rum`,
//         })
//         break
//       }
//       // https://github.com/openzipkin/b3-propagation
//       case 'b3': {
//         Object.assign(tracingHeaders, {
//           b3: `${toPaddedHexadecimalString(traceId)}-${toPaddedHexadecimalString(spanId)}-${traceSampled ? '1' : '0'}`,
//         })
//         break
//       }
//       case 'b3multi': {
//         Object.assign(tracingHeaders, {
//           'X-B3-TraceId': toPaddedHexadecimalString(traceId),
//           'X-B3-SpanId': toPaddedHexadecimalString(spanId),
//           'X-B3-Sampled': traceSampled ? '1' : '0',
//         })
//         break
//       }
//     }
//   })
//   return tracingHeaders
// }

;// ../rum-core/src/domain/configuration/configuration.ts


const DEFAULT_PROPAGATOR_TYPES = ['tracecontext', 'datadog'];
function validateAndBuildRumConfiguration(initConfiguration) {
    var _a, _b, _c, _d, _e, _f;
    if (!initConfiguration.applicationId) {
        display.error('Application ID is not configured, no RUM data will be collected.');
        return;
    }
    if (!isSampleRate(initConfiguration.sessionReplaySampleRate, 'Session Replay') ||
        !isSampleRate(initConfiguration.traceSampleRate, 'Trace')) {
        return;
    }
    if (initConfiguration.excludedActivityUrls !== undefined && !Array.isArray(initConfiguration.excludedActivityUrls)) {
        display.error('Excluded Activity Urls should be an array');
        return;
    }
    const allowedTracingUrls = validateAndBuildTracingOptions(initConfiguration);
    if (!allowedTracingUrls) {
        return;
    }
    const baseConfiguration = validateAndBuildConfiguration(initConfiguration);
    if (!baseConfiguration) {
        return;
    }
    const sessionReplaySampleRate = (_a = initConfiguration.sessionReplaySampleRate) !== null && _a !== void 0 ? _a : 0;
    return Object.assign({ applicationId: initConfiguration.applicationId, version: initConfiguration.version || undefined, actionNameAttribute: initConfiguration.actionNameAttribute, sessionReplaySampleRate, startSessionReplayRecordingManually: initConfiguration.startSessionReplayRecordingManually !== undefined
            ? !!initConfiguration.startSessionReplayRecordingManually
            : sessionReplaySampleRate === 0, traceSampleRate: (_b = initConfiguration.traceSampleRate) !== null && _b !== void 0 ? _b : 100, rulePsr: isNumber(initConfiguration.traceSampleRate) ? initConfiguration.traceSampleRate / 100 : undefined, allowedTracingUrls, excludedActivityUrls: (_c = initConfiguration.excludedActivityUrls) !== null && _c !== void 0 ? _c : [], workerUrl: initConfiguration.workerUrl, compressIntakeRequests: !!initConfiguration.compressIntakeRequests, trackUserInteractions: !!((_d = initConfiguration.trackUserInteractions) !== null && _d !== void 0 ? _d : true), trackViewsManually: !!initConfiguration.trackViewsManually, trackResources: !!((_e = initConfiguration.trackResources) !== null && _e !== void 0 ? _e : true), trackLongTasks: !!((_f = initConfiguration.trackLongTasks) !== null && _f !== void 0 ? _f : true), subdomain: initConfiguration.subdomain, defaultPrivacyLevel: objectHasValue(DefaultPrivacyLevel, initConfiguration.defaultPrivacyLevel)
            ? initConfiguration.defaultPrivacyLevel
            : DefaultPrivacyLevel.MASK, enablePrivacyForActionName: !!initConfiguration.enablePrivacyForActionName, customerDataTelemetrySampleRate: 1, traceContextInjection: objectHasValue(TraceContextInjection, initConfiguration.traceContextInjection)
            ? initConfiguration.traceContextInjection
            : TraceContextInjection.SAMPLED, plugins: initConfiguration.plugins || [] }, baseConfiguration);
}
/**
 * Validates allowedTracingUrls and converts match options to tracing options
 */
function validateAndBuildTracingOptions(initConfiguration) {
    if (initConfiguration.allowedTracingUrls === undefined) {
        return [];
    }
    if (!Array.isArray(initConfiguration.allowedTracingUrls)) {
        display.error('Allowed Tracing URLs should be an array');
        return;
    }
    if (initConfiguration.allowedTracingUrls.length !== 0 && initConfiguration.service === undefined) {
        display.error('Service needs to be configured when tracing is enabled');
        return;
    }
    // Convert from (MatchOption | TracingOption) to TracingOption, remove unknown properties
    const tracingOptions = [];
    initConfiguration.allowedTracingUrls.forEach((option) => {
        if (matchOption_isMatchOption(option)) {
            tracingOptions.push({ match: option, propagatorTypes: DEFAULT_PROPAGATOR_TYPES });
        }
        else if (isTracingOption(option)) {
            tracingOptions.push(option);
        }
        else {
            display.warn('Allowed Tracing Urls parameters should be a string, RegExp, function, or an object. Ignoring parameter', option);
        }
    });
    return tracingOptions;
}
/**
 * Combines the selected tracing propagators from the different options in allowedTracingUrls
 */
function getSelectedTracingPropagators(configuration) {
    const usedTracingPropagators = new Set();
    if (Array.isArray(configuration.allowedTracingUrls) && configuration.allowedTracingUrls.length > 0) {
        configuration.allowedTracingUrls.forEach((option) => {
            if (isMatchOption(option)) {
                DEFAULT_PROPAGATOR_TYPES.forEach((propagatorType) => usedTracingPropagators.add(propagatorType));
            }
            else if (getType(option) === 'object' && Array.isArray(option.propagatorTypes)) {
                // Ensure we have an array, as we cannot rely on types yet (configuration is provided by users)
                option.propagatorTypes.forEach((propagatorType) => usedTracingPropagators.add(propagatorType));
            }
        });
    }
    return Array.from(usedTracingPropagators);
}
function serializeRumConfiguration(configuration) {
    var _a;
    const baseSerializedConfiguration = serializeConfiguration(configuration);
    return Object.assign({ session_replay_sample_rate: configuration.sessionReplaySampleRate, start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually, trace_sample_rate: configuration.traceSampleRate, trace_context_injection: configuration.traceContextInjection, action_name_attribute: configuration.actionNameAttribute, use_allowed_tracing_urls: Array.isArray(configuration.allowedTracingUrls) && configuration.allowedTracingUrls.length > 0, selected_tracing_propagators: getSelectedTracingPropagators(configuration), default_privacy_level: configuration.defaultPrivacyLevel, enable_privacy_for_action_name: configuration.enablePrivacyForActionName, use_excluded_activity_urls: Array.isArray(configuration.excludedActivityUrls) && configuration.excludedActivityUrls.length > 0, use_worker_url: !!configuration.workerUrl, compress_intake_requests: configuration.compressIntakeRequests, track_views_manually: configuration.trackViewsManually, track_user_interactions: configuration.trackUserInteractions, track_resources: configuration.trackResources, track_long_task: configuration.trackLongTasks, plugins: (_a = configuration.plugins) === null || _a === void 0 ? void 0 : _a.map((plugin) => {
            var _a;
            return (Object.assign({ name: plugin.name }, (_a = plugin.getConfigurationTelemetry) === null || _a === void 0 ? void 0 : _a.call(plugin)));
        }) }, baseSerializedConfiguration); /* satisfies RawTelemetryConfiguration */
}

;// ../rum-core/src/domain/plugins.ts
function callPluginsMethod(plugins, methodName, parameter) {
    if (!plugins) {
        return;
    }
    for (const plugin of plugins) {
        const method = plugin[methodName];
        if (method) {
            method(parameter);
        }
    }
}

;// ../rum-core/src/boot/preStartRum.ts




function createPreStartStrategy({ ignoreInitIfSyntheticsWillInjectRum, startDeflateWorker }, getCommonContext, trackingConsentState, customVitalsState, doStartRum) {
    const bufferApiCalls = boundedBuffer_createBoundedBuffer();
    let firstStartViewCall;
    let deflateWorker;
    let cachedInitConfiguration;
    let cachedConfiguration;
    const trackingConsentStateSubscription = trackingConsentState.observable.subscribe(tryStartRum);
    function tryStartRum() {
        if (!cachedInitConfiguration || !cachedConfiguration || !trackingConsentState.isGranted()) {
            return;
        }
        trackingConsentStateSubscription.unsubscribe();
        let initialViewOptions;
        if (cachedConfiguration.trackViewsManually) {
            if (!firstStartViewCall) {
                return;
            }
            // An initial view is always created when starting RUM.
            // When tracking views automatically, any startView call before RUM start creates an extra
            // view.
            // When tracking views manually, we use the ViewOptions from the first startView call as the
            // initial view options, and we remove the actual startView call so we don't create an extra
            // view.
            bufferApiCalls.remove(firstStartViewCall.callback);
            initialViewOptions = firstStartViewCall.options;
        }
        const startRumResult = doStartRum(cachedConfiguration, deflateWorker, initialViewOptions);
        bufferApiCalls.drain(startRumResult);
    }
    function doInit(initConfiguration) {
        // const eventBridgeAvailable = canUseEventBridge()
        // if (eventBridgeAvailable) {
        //   initConfiguration = overrideInitConfigurationForBridge(initConfiguration)
        // }
        // Update the exposed initConfiguration to reflect the bridge and remote configuration overrides
        cachedInitConfiguration = initConfiguration;
        // addTelemetryConfiguration(serializeRumConfiguration(initConfiguration))
        if (cachedConfiguration) {
            displayAlreadyInitializedError('DD_RUM', initConfiguration);
            return;
        }
        const configuration = validateAndBuildRumConfiguration(initConfiguration);
        if (!configuration) {
            return;
        }
        if ( /* !eventBridgeAvailable && */!configuration.sessionStoreStrategyType) {
            display.warn('No storage available for session. We will not send any data.');
            return;
        }
        if (configuration.compressIntakeRequests /* && !eventBridgeAvailable */ && startDeflateWorker) {
            deflateWorker = startDeflateWorker(configuration, 'Datadog RUM', 
            // Worker initialization can fail asynchronously, especially in Firefox where even CSP
            // issues are reported asynchronously. For now, the SDK will continue its execution even if
            // data won't be sent to Datadog. We could improve this behavior in the future.
            functionUtils_noop);
            if (!deflateWorker) {
                // `startDeflateWorker` should have logged an error message explaining the issue
                return;
            }
        }
        cachedConfiguration = configuration;
        // Instrumuent fetch to track network requests
        // This is needed in case the consent is not granted and some cutsomer
        // library (Apollo Client) is storing uninstrumented fetch to be used later
        // The subscrption is needed so that the instrumentation process is completed
        initFetchObservable().subscribe(functionUtils_noop);
        trackingConsentState.tryToInit(configuration.trackingConsent);
        tryStartRum();
    }
    const addDurationVital = (vital) => {
        bufferApiCalls.add((startRumResult) => startRumResult.addDurationVital(vital));
    };
    return {
        init(initConfiguration, publicApi) {
            if (!initConfiguration) {
                display.error('Missing configuration');
                return;
            }
            // Set the experimental feature flags as early as possible, so we can use them in most places
            // initFeatureFlags(initConfiguration.enableExperimentalFeatures)
            // Expose the initial configuration regardless of initialization success.
            cachedInitConfiguration = initConfiguration;
            // If we are in a Synthetics test configured to automatically inject a RUM instance, we want
            // to completely discard the customer application RUM instance by ignoring their init() call.
            // But, we should not ignore the init() call from the Synthetics-injected RUM instance, so the
            // internal `ignoreInitIfSyntheticsWillInjectRum` option is here to bypass this condition.
            if (ignoreInitIfSyntheticsWillInjectRum && willSyntheticsInjectRum()) {
                return;
            }
            callPluginsMethod(initConfiguration.plugins, 'onInit', { initConfiguration, publicApi });
            // if (
            //   initConfiguration.remoteConfigurationId &&
            //   isExperimentalFeatureEnabled(ExperimentalFeature.REMOTE_CONFIGURATION)
            // ) {
            //   fetchAndApplyRemoteConfiguration(initConfiguration, doInit)
            // } else {
            doInit(initConfiguration);
            // }
        },
        get initConfiguration() {
            return cachedInitConfiguration;
        },
        getInternalContext: functionUtils_noop,
        stopSession: functionUtils_noop,
        addTiming(name, time = timeUtils_timeStampNow()) {
            bufferApiCalls.add((startRumResult) => startRumResult.addTiming(name, time));
        },
        startView(options, startClocks = clocksNow()) {
            const callback = (startRumResult) => {
                startRumResult.startView(options, startClocks);
            };
            bufferApiCalls.add(callback);
            if (!firstStartViewCall) {
                firstStartViewCall = { options, callback };
                tryStartRum();
            }
        },
        setViewName(name) {
            bufferApiCalls.add((startRumResult) => startRumResult.setViewName(name));
        },
        setViewContext(context) {
            bufferApiCalls.add((startRumResult) => startRumResult.setViewContext(context));
        },
        setViewContextProperty(key, value) {
            bufferApiCalls.add((startRumResult) => startRumResult.setViewContextProperty(key, value));
        },
        addAction(action, commonContext = getCommonContext()) {
            bufferApiCalls.add((startRumResult) => startRumResult.addAction(action, commonContext));
        },
        addError(providedError, commonContext = getCommonContext()) {
            bufferApiCalls.add((startRumResult) => startRumResult.addError(providedError, commonContext));
        },
        // addFeatureFlagEvaluation(key, value) {
        //   bufferApiCalls.add((startRumResult) => startRumResult.addFeatureFlagEvaluation(key, value))
        // },
        startDurationVital(name, options) {
            return startDurationVital(customVitalsState, name, options);
        },
        stopDurationVital(name, options) {
            stopDurationVital(addDurationVital, customVitalsState, name, options);
        },
        addDurationVital,
    };
}
// function overrideInitConfigurationForBridge(initConfiguration: RumInitConfiguration): RumInitConfiguration {
//   return {
//     ...initConfiguration,
//     applicationId: '00000000-aaaa-0000-aaaa-000000000000',
//     clientToken: 'empty',
//     sessionSampleRate: 100,
//     defaultPrivacyLevel: initConfiguration.defaultPrivacyLevel ?? getEventBridge()?.getPrivacyLevel(),
//   }
// }

;// ../rum-core/src/boot/rumPublicApi.ts




const RUM_STORAGE_KEY = 'rum';
function makeRumPublicApi(startRumImpl, recorderApi, options = {}) {
    const customerDataTrackerManager = createCustomerDataTrackerManager(0 /* CustomerDataCompressionStatus.Unknown */);
    const globalContextManager = createContextManager(customerDataTrackerManager.getOrCreateTracker(2 /* CustomerDataType.GlobalContext */));
    const userContextManager = createContextManager(customerDataTrackerManager.getOrCreateTracker(1 /* CustomerDataType.User */));
    const trackingConsentState = createTrackingConsentState();
    const customVitalsState = createCustomVitalsState();
    function getCommonContext() {
        return buildCommonContext(globalContextManager, userContextManager, recorderApi);
    }
    let strategy = createPreStartStrategy(options, getCommonContext, trackingConsentState, customVitalsState, (configuration, deflateWorker, initialViewOptions) => {
        if (configuration.storeContextsAcrossPages) {
            storeContextManager(configuration, globalContextManager, RUM_STORAGE_KEY, 2 /* CustomerDataType.GlobalContext */);
            storeContextManager(configuration, userContextManager, RUM_STORAGE_KEY, 1 /* CustomerDataType.User */);
        }
        customerDataTrackerManager.setCompressionStatus(deflateWorker ? 1 /* CustomerDataCompressionStatus.Enabled */ : 2 /* CustomerDataCompressionStatus.Disabled */);
        const startRumResult = startRumImpl(configuration, recorderApi, customerDataTrackerManager, getCommonContext, initialViewOptions, deflateWorker && options.createDeflateEncoder
            ? (streamId) => options.createDeflateEncoder(configuration, deflateWorker, streamId)
            : createIdentityEncoder, trackingConsentState, customVitalsState);
        recorderApi.onRumStart(startRumResult.lifeCycle, configuration, startRumResult.session, startRumResult.viewHistory, deflateWorker);
        strategy = createPostStartStrategy(strategy, startRumResult);
        return startRumResult;
    });
    const startView = monitor((options) => {
        const sanitizedOptions = typeof options === 'object' ? options : { name: options };
        if (sanitizedOptions.context) {
            customerDataTrackerManager.getOrCreateTracker(3 /* CustomerDataType.View */).updateCustomerData(sanitizedOptions.context);
        }
        strategy.startView(sanitizedOptions);
        // addTelemetryUsage({ feature: 'start-view' })
    });
    const rumPublicApi = makePublicApi({
        init: monitor((initConfiguration) => {
            strategy.init(initConfiguration, rumPublicApi);
        }),
        setTrackingConsent: monitor((trackingConsent) => {
            trackingConsentState.update(trackingConsent);
            // addTelemetryUsage({ feature: 'set-tracking-consent', tracking_consent: trackingConsent })
        }),
        setViewName: monitor((name) => {
            strategy.setViewName(name);
        }),
        setViewContext: monitor((context) => {
            strategy.setViewContext(context);
        }),
        setViewContextProperty: monitor((key, value) => {
            strategy.setViewContextProperty(key, value);
        }),
        setGlobalContext: monitor((context) => {
            globalContextManager.setContext(context);
            // addTelemetryUsage({ feature: 'set-global-context' })
        }),
        getGlobalContext: monitor(() => globalContextManager.getContext()),
        setGlobalContextProperty: monitor((key, value) => {
            globalContextManager.setContextProperty(key, value);
            // addTelemetryUsage({ feature: 'set-global-context' })
        }),
        removeGlobalContextProperty: monitor((key) => globalContextManager.removeContextProperty(key)),
        clearGlobalContext: monitor(() => globalContextManager.clearContext()),
        getInternalContext: monitor((startTime) => strategy.getInternalContext(startTime)),
        getInitConfiguration: monitor(() => deepClone(strategy.initConfiguration)),
        addAction: (name, context) => {
            const handlingStack = createHandlingStack();
            callMonitored(() => {
                strategy.addAction({
                    name: sanitize(name),
                    context: sanitize(context),
                    startClocks: clocksNow(),
                    type: "custom" /* ActionType.CUSTOM */,
                    handlingStack,
                });
                // addTelemetryUsage({ feature: 'add-action' })
            });
        },
        addError: (error, context) => {
            const handlingStack = createHandlingStack();
            callMonitored(() => {
                strategy.addError({
                    error, // Do not sanitize error here, it is needed unserialized by computeRawError()
                    handlingStack,
                    context: sanitize(context),
                    startClocks: clocksNow(),
                });
                // addTelemetryUsage({ feature: 'add-error' })
            });
        },
        addTiming: monitor((name, time) => {
            // TODO: next major decide to drop relative time support or update its behaviour
            strategy.addTiming(sanitize(name), time);
        }),
        setUser: monitor((newUser) => {
            if (checkUser(newUser)) {
                userContextManager.setContext(sanitizeUser(newUser));
            }
            // addTelemetryUsage({ feature: 'set-user' })
        }),
        getUser: monitor(() => userContextManager.getContext()),
        setUserProperty: monitor((key, property) => {
            const sanitizedProperty = sanitizeUser({ [key]: property })[key];
            userContextManager.setContextProperty(key, sanitizedProperty);
            // addTelemetryUsage({ feature: 'set-user' })
        }),
        removeUserProperty: monitor((key) => userContextManager.removeContextProperty(key)),
        clearUser: monitor(() => userContextManager.clearContext()),
        startView,
        stopSession: monitor(() => {
            strategy.stopSession();
            // addTelemetryUsage({ feature: 'stop-session' })
        }),
        // addFeatureFlagEvaluation: monitor((key, value) => {
        //   strategy.addFeatureFlagEvaluation(sanitize(key)!, sanitize(value))
        //   // addTelemetryUsage({ feature: 'add-feature-flag-evaluation' })
        // }),
        getSessionReplayLink: monitor(() => recorderApi.getSessionReplayLink()),
        startSessionReplayRecording: monitor((options) => {
            recorderApi.start(options);
            // addTelemetryUsage({ feature: 'start-session-replay-recording', force: options && options.force })
        }),
        stopSessionReplayRecording: monitor(() => recorderApi.stop()),
        addDurationVital: monitor((name, options) => {
            // addTelemetryUsage({ feature: 'add-duration-vital' })
            strategy.addDurationVital({
                name: sanitize(name),
                type: "duration" /* VitalType.DURATION */,
                startClocks: timeStampToClocks(options.startTime),
                duration: options.duration,
                context: sanitize(options && options.context),
                description: sanitize(options && options.description),
            });
        }),
        startDurationVital: monitor((name, options) => {
            // addTelemetryUsage({ feature: 'start-duration-vital' })
            return strategy.startDurationVital(sanitize(name), {
                context: sanitize(options && options.context),
                description: sanitize(options && options.description),
            });
        }),
        stopDurationVital: monitor((nameOrRef, options) => {
            // addTelemetryUsage({ feature: 'stop-duration-vital' })
            strategy.stopDurationVital(typeof nameOrRef === 'string' ? sanitize(nameOrRef) : nameOrRef, {
                context: sanitize(options && options.context),
                description: sanitize(options && options.description),
            });
        }),
    });
    return rumPublicApi;
}
function createPostStartStrategy(preStartStrategy, startRumResult) {
    return Object.assign({ init: (initConfiguration) => {
            displayAlreadyInitializedError('DD_RUM', initConfiguration);
        }, initConfiguration: preStartStrategy.initConfiguration }, startRumResult);
}

;// ../core/src/browser/pageExitObservable.ts



const PageExitReason = {
    HIDDEN: 'visibility_hidden',
    UNLOADING: 'before_unload',
    PAGEHIDE: 'page_hide',
    FROZEN: 'page_frozen',
};
function createPageExitObservable(configuration) {
    return new observable_Observable((observable) => {
        const { stop: stopListeners } = addEventListeners(configuration, window, ["visibilitychange" /* DOM_EVENT.VISIBILITY_CHANGE */, "freeze" /* DOM_EVENT.FREEZE */], (event) => {
            if (event.type === "visibilitychange" /* DOM_EVENT.VISIBILITY_CHANGE */ && document.visibilityState === 'hidden') {
                /**
                 * Only event that guarantee to fire on mobile devices when the page transitions to background state
                 * (e.g. when user switches to a different application, goes to homescreen, etc), or is being unloaded.
                 */
                observable.notify({ reason: PageExitReason.HIDDEN });
            }
            else if (event.type === "freeze" /* DOM_EVENT.FREEZE */) {
                /**
                 * After transitioning in background a tab can be freezed to preserve resources. (cf: https://developer.chrome.com/blog/page-lifecycle-api)
                 * Allow to collect events happening between hidden and frozen state.
                 */
                observable.notify({ reason: PageExitReason.FROZEN });
            }
        }, { capture: true });
        const stopBeforeUnloadListener = addEventListener(configuration, window, "beforeunload" /* DOM_EVENT.BEFORE_UNLOAD */, () => {
            observable.notify({ reason: PageExitReason.UNLOADING });
        }).stop;
        return () => {
            stopListeners();
            stopBeforeUnloadListener();
        };
    });
}
function isPageExitReason(reason) {
    return objectValues(PageExitReason).includes(reason);
}

;// ../rum-core/src/browser/domMutationObservable.ts

function createDOMMutationObservable() {
    const MutationObserver = getMutationObserverConstructor();
    return new observable_Observable((observable) => {
        if (!MutationObserver) {
            return;
        }
        const observer = new MutationObserver(monitor(() => observable.notify()));
        observer.observe(document, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        });
        return () => observer.disconnect();
    });
}
function getMutationObserverConstructor() {
    let constructor;
    const browserWindow = window;
    // Angular uses Zone.js to provide a context persisting across async tasks.  Zone.js replaces the
    // global MutationObserver constructor with a patched version to support the context propagation.
    // There is an ongoing issue[1][2] with this setup when using a MutationObserver within a Angular
    // component: on some occasions, the callback is being called in an infinite loop, causing the
    // page to freeze (even if the callback is completely empty).
    //
    // To work around this issue, we try to get the original MutationObserver constructor stored by
    // Zone.js.
    //
    // [1] https://github.com/angular/angular/issues/26948
    // [2] https://github.com/angular/angular/issues/31712
    if (browserWindow.Zone) {
        // Zone.js 0.8.6+ is storing original class constructors into the browser 'window' object[3].
        //
        // [3] https://github.com/angular/angular/blob/6375fa79875c0fe7b815efc45940a6e6f5c9c9eb/packages/zone.js/lib/common/utils.ts#L288
        constructor = getZoneJsOriginalValue(browserWindow, 'MutationObserver');
        if (browserWindow.MutationObserver && constructor === browserWindow.MutationObserver) {
            // Anterior Zone.js versions (used in Angular 2) does not expose the original MutationObserver
            // in the 'window' object. Luckily, the patched MutationObserver class is storing an original
            // instance in its properties[4]. Let's get the original MutationObserver constructor from
            // there.
            //
            // [4] https://github.com/angular/zone.js/blob/v0.8.5/lib/common/utils.ts#L412
            const patchedInstance = new browserWindow.MutationObserver(functionUtils_noop);
            const originalInstance = getZoneJsOriginalValue(patchedInstance, 'originalInstance');
            constructor = originalInstance && originalInstance.constructor;
        }
    }
    if (!constructor) {
        constructor = browserWindow.MutationObserver;
    }
    return constructor;
}

;// ../rum-core/src/browser/windowOpenObservable.ts

function createWindowOpenObservable() {
    const observable = new observable_Observable();
    const { stop } = instrumentMethod(window, 'open', () => observable.notify());
    return { observable, stop };
}

;// ../core/src/domain/error/error.types.ts
const ErrorSource = {
    AGENT: 'agent',
    CONSOLE: 'console',
    CUSTOM: 'custom',
    LOGGER: 'logger',
    NETWORK: 'network',
    SOURCE: 'source',
    REPORT: 'report',
};

;// ../core/src/domain/eventRateLimiter/createEventRateLimiter.ts



function createEventRateLimiter(eventType, limit, onLimitReached) {
    let eventCount = 0;
    let allowNextEvent = false;
    return {
        isLimitReached() {
            if (eventCount === 0) {
                timer_setTimeout(() => {
                    eventCount = 0;
                }, ONE_MINUTE);
            }
            eventCount += 1;
            if (eventCount <= limit || allowNextEvent) {
                allowNextEvent = false;
                return false;
            }
            if (eventCount === limit + 1) {
                allowNextEvent = true;
                try {
                    onLimitReached({
                        message: `Reached max number of ${eventType}s by minute: ${limit}`,
                        source: ErrorSource.AGENT,
                        startClocks: clocksNow(),
                    });
                }
                finally {
                    allowNextEvent = false;
                }
            }
            return true;
        },
    };
}

;// ../core/src/domain/connectivity/connectivity.ts
function connectivity_getConnectivity() {
    var _a;
    const navigator = window.navigator;
    return {
        status: navigator.onLine ? 'connected' : 'not_connected',
        interfaces: navigator.connection && navigator.connection.type ? [navigator.connection.type] : undefined,
        effective_type: (_a = navigator.connection) === null || _a === void 0 ? void 0 : _a.effectiveType,
    };
}

;// ../rum-core/src/domain/contexts/syntheticsContext.ts

function getSyntheticsContext() {
    const testId = getSyntheticsTestId();
    const resultId = getSyntheticsResultId();
    if (testId && resultId) {
        return {
            test_id: testId,
            result_id: resultId,
            injected: willSyntheticsInjectRum(),
        };
    }
}

;// ../rum-core/src/domain/limitModification.ts

/**
 * Current limitation:
 * - field path do not support array, 'a.b.c' only
 */
function limitModification(object, modifiableFieldPaths, modifier) {
    const clone = deepClone(object);
    const result = modifier(clone);
    objectEntries(modifiableFieldPaths).forEach(([fieldPath, fieldType]) => {
        const newValue = get(clone, fieldPath);
        const newType = typeUtils_getType(newValue);
        if (newType === fieldType) {
            set(object, fieldPath, sanitize(newValue));
        }
        else if (fieldType === 'object' && (newType === 'undefined' || newType === 'null')) {
            set(object, fieldPath, {});
        }
    });
    return result;
}
function get(object, path) {
    let current = object;
    for (const field of path.split('.')) {
        if (!isValidObjectContaining(current, field)) {
            return;
        }
        current = current[field];
    }
    return current;
}
function set(object, path, value) {
    let current = object;
    const fields = path.split('.');
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (!isValidObject(current)) {
            return;
        }
        if (i !== fields.length - 1) {
            current = current[field];
        }
        else {
            current[field] = value;
        }
    }
}
function isValidObject(object) {
    return typeUtils_getType(object) === 'object';
}
function isValidObjectContaining(object, field) {
    return isValidObject(object) && Object.prototype.hasOwnProperty.call(object, field);
}

;// ../rum-core/src/domain/assembly.ts



const VIEW_MODIFIABLE_FIELD_PATHS = {
    'view.name': 'string',
    'view.url': 'string',
    'view.referrer': 'string',
};
const USER_CUSTOMIZABLE_FIELD_PATHS = {
    context: 'object',
};
const ROOT_MODIFIABLE_FIELD_PATHS = {
    service: 'string',
    version: 'string',
};
let modifiableFieldPathsByEvent;
function startRumAssembly(configuration, lifeCycle, sessionManager, viewHistory, urlContexts, actionContexts, displayContext, ciVisibilityContext, getCommonContext, reportError) {
    modifiableFieldPathsByEvent = {
        ["view" /* RumEventType.VIEW */]: Object.assign(Object.assign({}, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS),
        ["error" /* RumEventType.ERROR */]: Object.assign(Object.assign(Object.assign({ 'error.message': 'string', 'error.stack': 'string', 'error.resource.url': 'string', 'error.fingerprint': 'string' }, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS), ROOT_MODIFIABLE_FIELD_PATHS),
        ["resource" /* RumEventType.RESOURCE */]: Object.assign(Object.assign(Object.assign({ 'resource.url': 'string' }, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS), ROOT_MODIFIABLE_FIELD_PATHS),
        ["action" /* RumEventType.ACTION */]: Object.assign(Object.assign(Object.assign({ 'action.target.name': 'string' }, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS), ROOT_MODIFIABLE_FIELD_PATHS),
        ["long_task" /* RumEventType.LONG_TASK */]: Object.assign(Object.assign({}, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS),
        ["vital" /* RumEventType.VITAL */]: Object.assign(Object.assign({}, USER_CUSTOMIZABLE_FIELD_PATHS), VIEW_MODIFIABLE_FIELD_PATHS),
    };
    const eventRateLimiters = {
        ["error" /* RumEventType.ERROR */]: createEventRateLimiter("error" /* RumEventType.ERROR */, configuration.eventRateLimiterThreshold, reportError),
        ["action" /* RumEventType.ACTION */]: createEventRateLimiter("action" /* RumEventType.ACTION */, configuration.eventRateLimiterThreshold, reportError),
        ["vital" /* RumEventType.VITAL */]: createEventRateLimiter("vital" /* RumEventType.VITAL */, configuration.eventRateLimiterThreshold, reportError),
    };
    const syntheticsContext = getSyntheticsContext();
    lifeCycle.subscribe(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, ({ startTime, rawRumEvent, domainContext, savedCommonContext, customerContext }) => {
        const viewHistoryEntry = viewHistory.findView(startTime);
        const urlContext = urlContexts.findUrl(startTime);
        const session = sessionManager.findTrackedSession(startTime);
        if (session && viewHistoryEntry && urlContext) {
            const commonContext = savedCommonContext || getCommonContext();
            const actionId = actionContexts.findActionId(startTime);
            const rumContext = {
                _dd: {
                    format_version: 2,
                    drift: currentDrift(),
                    configuration: {
                        session_sample_rate: round(configuration.sessionSampleRate, 3),
                        session_replay_sample_rate: round(configuration.sessionReplaySampleRate, 3),
                    },
                    browser_sdk_version: "6.0.0", // canUseEventBridge() ? __BUILD_ENV__SDK_VERSION__ : undefined,
                },
                application: {
                    id: configuration.applicationId,
                },
                date: timeUtils_timeStampNow(),
                service: viewHistoryEntry.service || configuration.service,
                version: viewHistoryEntry.version || configuration.version,
                source: 'browser',
                session: {
                    id: session.id,
                    type: syntheticsContext
                        ? "synthetics" /* SessionType.SYNTHETICS */
                        : ciVisibilityContext.get()
                            ? "ci_test" /* SessionType.CI_TEST */
                            : "user" /* SessionType.USER */,
                },
                view: {
                    id: viewHistoryEntry.id,
                    name: viewHistoryEntry.name,
                    url: urlContext.url,
                    referrer: urlContext.referrer,
                },
                action: needToAssembleWithAction(rawRumEvent) && actionId ? { id: actionId } : undefined,
                synthetics: syntheticsContext,
                ci_test: ciVisibilityContext.get(),
                display: displayContext.get(),
                connectivity: connectivity_getConnectivity(),
            };
            const serverRumEvent = mergeInto_combine(rumContext, rawRumEvent);
            serverRumEvent.context = mergeInto_combine(commonContext.context, viewHistoryEntry.context, customerContext);
            if (!('has_replay' in serverRumEvent.session)) {
                ;
                serverRumEvent.session.has_replay = commonContext.hasReplay;
            }
            if (serverRumEvent.type === 'view') {
                ;
                serverRumEvent.session.sampled_for_replay =
                    session.sessionReplay === 1 /* SessionReplayState.SAMPLED */;
            }
            if (session.anonymousId && !commonContext.user.anonymous_id && !!configuration.trackAnonymousUser) {
                commonContext.user.anonymous_id = session.anonymousId;
            }
            if (!isEmptyObject(commonContext.user)) {
                ;
                serverRumEvent.usr = commonContext.user;
            }
            if (shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters)) {
                if (isEmptyObject(serverRumEvent.context)) {
                    delete serverRumEvent.context;
                }
                lifeCycle.notify(12 /* LifeCycleEventType.RUM_EVENT_COLLECTED */, serverRumEvent);
            }
        }
    });
}
function shouldSend(event, beforeSend, domainContext, eventRateLimiters) {
    var _a;
    if (beforeSend) {
        const result = limitModification(event, modifiableFieldPathsByEvent[event.type], (event) => beforeSend(event, domainContext));
        if (result === false && event.type !== "view" /* RumEventType.VIEW */) {
            return false;
        }
        if (result === false) {
            display.warn("Can't dismiss view events using beforeSend!");
        }
    }
    const rateLimitReached = (_a = eventRateLimiters[event.type]) === null || _a === void 0 ? void 0 : _a.isLimitReached();
    return !rateLimitReached;
}
function needToAssembleWithAction(event) {
    return ["error" /* RumEventType.ERROR */, "resource" /* RumEventType.RESOURCE */, "long_task" /* RumEventType.LONG_TASK */].indexOf(event.type) !== -1;
}

;// ../rum-core/src/domain/contexts/internalContext.ts
/**
 * Internal context keep returning v1 format
 * to not break compatibility with logs data format
 */
function startInternalContext(applicationId, sessionManager, viewHistory, actionContexts, urlContexts) {
    return {
        get: (startTime) => {
            const viewContext = viewHistory.findView(startTime);
            const urlContext = urlContexts.findUrl(startTime);
            const session = sessionManager.findTrackedSession(startTime);
            if (session && viewContext && urlContext) {
                const actionId = actionContexts.findActionId(startTime);
                return {
                    application_id: applicationId,
                    session_id: session.id,
                    user_action: actionId ? { id: actionId } : undefined,
                    view: { id: viewContext.id, name: viewContext.name, referrer: urlContext.referrer, url: urlContext.url },
                };
            }
        },
    };
}

;// ../core/src/tools/abstractLifeCycle.ts
// eslint-disable-next-line no-restricted-syntax
class AbstractLifeCycle {
    constructor() {
        this.callbacks = {};
    }
    notify(eventType, data) {
        const eventCallbacks = this.callbacks[eventType];
        if (eventCallbacks) {
            eventCallbacks.forEach((callback) => callback(data));
        }
    }
    subscribe(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
        return {
            unsubscribe: () => {
                this.callbacks[eventType] = this.callbacks[eventType].filter((other) => callback !== other);
            },
        };
    }
}

;// ../rum-core/src/domain/lifeCycle.ts

const LifeCycle = (AbstractLifeCycle);

;// ../core/src/tools/valueHistory.ts



const END_OF_TIMES = Infinity;
const CLEAR_OLD_VALUES_INTERVAL = ONE_MINUTE;
function createValueHistory({ expireDelay, maxEntries, }) {
    let entries = [];
    const clearOldValuesInterval = timer_setInterval(() => clearOldValues(), CLEAR_OLD_VALUES_INTERVAL);
    function clearOldValues() {
        const oldTimeThreshold = timeUtils_relativeNow() - expireDelay;
        while (entries.length > 0 && entries[entries.length - 1].endTime < oldTimeThreshold) {
            entries.pop();
        }
    }
    /**
     * Add a value to the history associated with a start time. Returns a reference to this newly
     * added entry that can be removed or closed.
     */
    function add(value, startTime) {
        const entry = {
            value,
            startTime,
            endTime: END_OF_TIMES,
            remove: () => {
                removeItem(entries, entry);
            },
            close: (endTime) => {
                entry.endTime = endTime;
            },
        };
        if (maxEntries && entries.length >= maxEntries) {
            entries.pop();
        }
        entries.unshift(entry);
        return entry;
    }
    /**
     * Return the latest value that was active during `startTime`, or the currently active value
     * if no `startTime` is provided. This method assumes that entries are not overlapping.
     *
     * If `option.returnInactive` is true, returns the value at `startTime` (active or not).
     */
    function find(startTime = END_OF_TIMES, options = { returnInactive: false }) {
        for (const entry of entries) {
            if (entry.startTime <= startTime) {
                if (options.returnInactive || startTime <= entry.endTime) {
                    return entry.value;
                }
                break;
            }
        }
    }
    /**
     * Helper function to close the currently active value, if any. This method assumes that entries
     * are not overlapping.
     */
    function closeActive(endTime) {
        const latestEntry = entries[0];
        if (latestEntry && latestEntry.endTime === END_OF_TIMES) {
            latestEntry.close(endTime);
        }
    }
    /**
     * Return all values with an active period overlapping with the duration,
     * or all values that were active during `startTime` if no duration is provided,
     * or all currently active values if no `startTime` is provided.
     */
    function findAll(startTime = END_OF_TIMES, duration = 0) {
        const endTime = addDuration(startTime, duration);
        return entries
            .filter((entry) => entry.startTime <= endTime && startTime <= entry.endTime)
            .map((entry) => entry.value);
    }
    /**
     * Remove all entries from this collection.
     */
    function reset() {
        entries = [];
    }
    /**
     * Stop internal garbage collection of past entries.
     */
    function stop() {
        timer_clearInterval(clearOldValuesInterval);
    }
    return { add, find, closeActive, findAll, reset, stop };
}

;// ../rum-core/src/domain/contexts/viewHistory.ts

const VIEW_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startViewHistory(lifeCycle) {
    const viewValueHistory = createValueHistory({ expireDelay: VIEW_CONTEXT_TIME_OUT_DELAY });
    lifeCycle.subscribe(1 /* LifeCycleEventType.BEFORE_VIEW_CREATED */, (view) => {
        viewValueHistory.add(buildViewHistoryEntry(view), view.startClocks.relative);
    });
    lifeCycle.subscribe(5 /* LifeCycleEventType.AFTER_VIEW_ENDED */, ({ endClocks }) => {
        viewValueHistory.closeActive(endClocks.relative);
    });
    lifeCycle.subscribe(3 /* LifeCycleEventType.VIEW_UPDATED */, (viewUpdate) => {
        const currentView = viewValueHistory.find(viewUpdate.startClocks.relative);
        if (currentView && viewUpdate.name) {
            currentView.name = viewUpdate.name;
        }
        if (currentView && viewUpdate.context) {
            currentView.context = viewUpdate.context;
        }
    });
    lifeCycle.subscribe(9 /* LifeCycleEventType.SESSION_RENEWED */, () => {
        viewValueHistory.reset();
    });
    function buildViewHistoryEntry(view) {
        return {
            service: view.service,
            version: view.version,
            context: view.context,
            id: view.id,
            name: view.name,
            startClocks: view.startClocks,
        };
    }
    return {
        findView: (startTime) => viewValueHistory.find(startTime),
        stop: () => {
            viewValueHistory.stop();
        },
    };
}

;// ../core/src/browser/xhrObservable.ts






let xhrObservable;
const xhrContexts = new WeakMap();
function initXhrObservable(configuration) {
    if (!xhrObservable) {
        xhrObservable = createXhrObservable(configuration);
    }
    return xhrObservable;
}
function createXhrObservable(configuration) {
    return new observable_Observable((observable) => {
        const { stop: stopInstrumentingStart } = instrumentMethod(XMLHttpRequest.prototype, 'open', openXhr);
        const { stop: stopInstrumentingSend } = instrumentMethod(XMLHttpRequest.prototype, 'send', (call) => {
            sendXhr(call, configuration, observable);
        }, { computeHandlingStack: true });
        const { stop: stopInstrumentingAbort } = instrumentMethod(XMLHttpRequest.prototype, 'abort', abortXhr);
        return () => {
            stopInstrumentingStart();
            stopInstrumentingSend();
            stopInstrumentingAbort();
        };
    });
}
function openXhr({ target: xhr, parameters: [method, url] }) {
    xhrContexts.set(xhr, {
        state: 'open',
        method: String(method).toUpperCase(),
        url: normalizeUrl(String(url)),
    });
}
function sendXhr({ target: xhr, handlingStack }, configuration, observable) {
    const context = xhrContexts.get(xhr);
    if (!context) {
        return;
    }
    const startContext = context;
    startContext.state = 'start';
    startContext.startClocks = clocksNow();
    startContext.isAborted = false;
    startContext.xhr = xhr;
    startContext.handlingStack = handlingStack;
    let hasBeenReported = false;
    const { stop: stopInstrumentingOnReadyStateChange } = instrumentMethod(xhr, 'onreadystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            // Try to report the XHR as soon as possible, because the XHR may be mutated by the
            // application during a future event. For example, Angular is calling .abort() on
            // completed requests during an onreadystatechange event, so the status becomes '0'
            // before the request is collected.
            onEnd();
        }
    });
    const onEnd = () => {
        unsubscribeLoadEndListener();
        stopInstrumentingOnReadyStateChange();
        if (hasBeenReported) {
            return;
        }
        hasBeenReported = true;
        const completeContext = context;
        completeContext.state = 'complete';
        completeContext.duration = timeUtils_elapsed(startContext.startClocks.timeStamp, timeUtils_timeStampNow());
        completeContext.status = xhr.status;
        observable.notify(shallowClone(completeContext));
    };
    const { stop: unsubscribeLoadEndListener } = addEventListener(configuration, xhr, 'loadend', onEnd);
    observable.notify(startContext);
}
function abortXhr({ target: xhr }) {
    const context = xhrContexts.get(xhr);
    if (context) {
        context.isAborted = true;
    }
}

;// ../core/src/tools/utils/responseUtils.ts
function isServerError(status) {
    return status >= 500;
}
function tryToClone(response) {
    try {
        return response.clone();
    }
    catch (_a) {
        // clone can throw if the response has already been used by another instrumentation or is disturbed
        return;
    }
}

;// ../core/src/tools/readBytesFromStream.ts


/**
 * Read bytes from a ReadableStream until at least `limit` bytes have been read (or until the end of
 * the stream). The callback is invoked with the at most `limit` bytes, and indicates that the limit
 * has been exceeded if more bytes were available.
 */
function readBytesFromStream(stream, callback, options) {
    const reader = stream.getReader();
    const chunks = [];
    let readBytesCount = 0;
    readMore();
    function readMore() {
        reader.read().then(monitor((result) => {
            if (result.done) {
                onDone();
                return;
            }
            if (options.collectStreamBody) {
                chunks.push(result.value);
            }
            readBytesCount += result.value.length;
            if (readBytesCount > options.bytesLimit) {
                onDone();
            }
            else {
                readMore();
            }
        }), monitor((error) => callback(error)));
    }
    function onDone() {
        reader.cancel().catch(
        // we don't care if cancel fails, but we still need to catch the error to avoid reporting it
        // as an unhandled rejection
        functionUtils_noop);
        let bytes;
        let limitExceeded;
        if (options.collectStreamBody) {
            let completeBuffer;
            if (chunks.length === 1) {
                // optimization: if the response is small enough to fit in a single buffer (provided by the browser), just
                // use it directly.
                completeBuffer = chunks[0];
            }
            else {
                // else, we need to copy buffers into a larger buffer to concatenate them.
                completeBuffer = new Uint8Array(readBytesCount);
                let offset = 0;
                chunks.forEach((chunk) => {
                    completeBuffer.set(chunk, offset);
                    offset += chunk.length;
                });
            }
            bytes = completeBuffer.slice(0, options.bytesLimit);
            limitExceeded = completeBuffer.length > options.bytesLimit;
        }
        callback(undefined, bytes, limitExceeded);
    }
}

;// ../rum-core/src/domain/resource/resourceUtils.ts

const FAKE_INITIAL_DOCUMENT = 'initial_document';
const RESOURCE_TYPES = [
    ["document" /* ResourceType.DOCUMENT */, (initiatorType) => FAKE_INITIAL_DOCUMENT === initiatorType],
    ["xhr" /* ResourceType.XHR */, (initiatorType) => 'xmlhttprequest' === initiatorType],
    ["fetch" /* ResourceType.FETCH */, (initiatorType) => 'fetch' === initiatorType],
    ["beacon" /* ResourceType.BEACON */, (initiatorType) => 'beacon' === initiatorType],
    ["css" /* ResourceType.CSS */, (_, path) => /\.css$/i.test(path)],
    ["js" /* ResourceType.JS */, (_, path) => /\.js$/i.test(path)],
    [
        "image" /* ResourceType.IMAGE */,
        (initiatorType, path) => ['image', 'img', 'icon'].includes(initiatorType) || /\.(gif|jpg|jpeg|tiff|png|svg|ico)$/i.exec(path) !== null,
    ],
    ["font" /* ResourceType.FONT */, (_, path) => /\.(woff|eot|woff2|ttf)$/i.exec(path) !== null],
    [
        "media" /* ResourceType.MEDIA */,
        (initiatorType, path) => ['audio', 'video'].includes(initiatorType) || /\.(mp3|mp4)$/i.exec(path) !== null,
    ],
];
function computeResourceEntryType(entry) {
    const url = entry.name;
    if (!isValidUrl(url)) {
        // addTelemetryDebug(`Failed to construct URL for "${entry.name}"`)
        return "other" /* ResourceType.OTHER */;
    }
    const path = getPathName(url);
    for (const [type, isType] of RESOURCE_TYPES) {
        if (isType(entry.initiatorType, path)) {
            return type;
        }
    }
    return "other" /* ResourceType.OTHER */;
}
function areInOrder(...numbers) {
    for (let i = 1; i < numbers.length; i += 1) {
        if (numbers[i - 1] > numbers[i]) {
            return false;
        }
    }
    return true;
}
function isResourceEntryRequestType(entry) {
    return entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch';
}
function computeResourceEntryDuration(entry) {
    const { duration, startTime, responseEnd } = entry;
    // Safari duration is always 0 on timings blocked by cross origin policies.
    if (duration === 0 && startTime < responseEnd) {
        return toServerDuration(timeUtils_elapsed(startTime, responseEnd));
    }
    return toServerDuration(duration);
}
function computeResourceEntryDetails(entry) {
    if (!hasValidResourceEntryTimings(entry)) {
        return undefined;
    }
    const { startTime, fetchStart, workerStart, redirectStart, redirectEnd, domainLookupStart, domainLookupEnd, connectStart, secureConnectionStart, connectEnd, requestStart, responseStart, responseEnd, } = entry;
    const details = {
        download: formatTiming(startTime, responseStart, responseEnd),
        first_byte: formatTiming(startTime, requestStart, responseStart),
    };
    // Make sure a worker processing time is recorded
    if (0 < workerStart && workerStart < fetchStart) {
        details.worker = formatTiming(startTime, workerStart, fetchStart);
    }
    // Make sure a connection occurred
    if (fetchStart < connectEnd) {
        details.connect = formatTiming(startTime, connectStart, connectEnd);
        // Make sure a secure connection occurred
        if (connectStart <= secureConnectionStart && secureConnectionStart <= connectEnd) {
            details.ssl = formatTiming(startTime, secureConnectionStart, connectEnd);
        }
    }
    // Make sure a domain lookup occurred
    if (fetchStart < domainLookupEnd) {
        details.dns = formatTiming(startTime, domainLookupStart, domainLookupEnd);
    }
    // Make sure a redirection occurred
    if (startTime < redirectEnd) {
        details.redirect = formatTiming(startTime, redirectStart, redirectEnd);
    }
    return details;
}
/**
 * Entries with negative duration are unexpected and should be dismissed. The intake will ignore RUM
 * Resource events with negative durations anyway.
 * Since Chromium 128, more entries have unexpected negative durations, see
 * https://issues.chromium.org/issues/363031537
 */
function hasValidResourceEntryDuration(entry) {
    return entry.duration >= 0;
}
function hasValidResourceEntryTimings(entry) {
    // Ensure timings are in the right order. On top of filtering out potential invalid
    // RumPerformanceResourceTiming, it will ignore entries from requests where timings cannot be
    // collected, for example cross origin requests without a "Timing-Allow-Origin" header allowing
    // it.
    const areCommonTimingsInOrder = areInOrder(entry.startTime, entry.fetchStart, entry.domainLookupStart, entry.domainLookupEnd, entry.connectStart, entry.connectEnd, entry.requestStart, entry.responseStart, entry.responseEnd);
    const areRedirectionTimingsInOrder = hasRedirection(entry)
        ? areInOrder(entry.startTime, entry.redirectStart, entry.redirectEnd, entry.fetchStart)
        : true;
    return areCommonTimingsInOrder && areRedirectionTimingsInOrder;
}
function hasRedirection(entry) {
    return entry.redirectEnd > entry.startTime;
}
function formatTiming(origin, start, end) {
    if (origin <= start && start <= end) {
        return {
            duration: toServerDuration(timeUtils_elapsed(start, end)),
            start: toServerDuration(timeUtils_elapsed(origin, start)),
        };
    }
}
/**
 * The 'nextHopProtocol' is an empty string for cross-origin resources without CORS headers,
 * meaning the protocol is unknown, and we shouldn't report it.
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/nextHopProtocol#cross-origin_resources
 */
function computeResourceEntryProtocol(entry) {
    return entry.nextHopProtocol === '' ? undefined : entry.nextHopProtocol;
}
/**
 * Handles the 'deliveryType' property to distinguish between supported values ('cache', 'navigational-prefetch'),
 * undefined (unsupported in some browsers), and other cases ('other' for unknown or unrecognized values).
 * see: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/deliveryType
 */
function computeResourceEntryDeliveryType(entry) {
    return entry.deliveryType === '' ? 'other' : entry.deliveryType;
}
function computeResourceEntrySize(entry) {
    // Make sure a request actually occurred
    if (entry.startTime < entry.responseStart) {
        const { encodedBodySize, decodedBodySize, transferSize } = entry;
        return {
            size: decodedBodySize,
            encoded_body_size: encodedBodySize,
            decoded_body_size: decodedBodySize,
            transfer_size: transferSize,
        };
    }
    return {
        size: undefined,
        encoded_body_size: undefined,
        decoded_body_size: undefined,
        transfer_size: undefined,
    };
}
function isAllowedRequestUrl(url) {
    return url && !isIntakeUrl(url);
}
const DATA_URL_REGEX = /data:(.+)?(;base64)?,/g;
const MAX_ATTRIBUTE_VALUE_CHAR_LENGTH = 24000;
function isLongDataUrl(url) {
    if (url.length <= MAX_ATTRIBUTE_VALUE_CHAR_LENGTH) {
        return false;
    }
    else if (url.substring(0, 5) === 'data:') {
        // Avoid String.match RangeError: Maximum call stack size exceeded
        url = url.substring(0, MAX_ATTRIBUTE_VALUE_CHAR_LENGTH);
        return true;
    }
    return false;
}
function sanitizeDataUrl(url) {
    return `${url.match(DATA_URL_REGEX)[0]}[...]`;
}

;// ../rum-core/src/domain/requestCollection.ts



let nextRequestIndex = 1;
function startRequestCollection(lifeCycle, configuration, sessionManager) {
    const tracer = startTracer(configuration, sessionManager);
    trackXhr(lifeCycle, configuration, tracer);
    trackFetch(lifeCycle, tracer);
}
function trackXhr(lifeCycle, configuration, tracer) {
    const subscription = initXhrObservable(configuration).subscribe((rawContext) => {
        const context = rawContext;
        if (!isAllowedRequestUrl(context.url)) {
            return;
        }
        switch (context.state) {
            case 'start':
                tracer.traceXhr(context, context.xhr);
                context.requestIndex = getNextRequestIndex();
                lifeCycle.notify(6 /* LifeCycleEventType.REQUEST_STARTED */, {
                    requestIndex: context.requestIndex,
                    url: context.url,
                });
                break;
            case 'complete':
                tracer.clearTracingIfNeeded(context);
                lifeCycle.notify(7 /* LifeCycleEventType.REQUEST_COMPLETED */, {
                    duration: context.duration,
                    method: context.method,
                    requestIndex: context.requestIndex,
                    spanId: context.spanId,
                    startClocks: context.startClocks,
                    status: context.status,
                    traceId: context.traceId,
                    traceSampled: context.traceSampled,
                    type: "xhr" /* RequestType.XHR */,
                    url: context.url,
                    xhr: context.xhr,
                    isAborted: context.isAborted,
                    handlingStack: context.handlingStack,
                });
                break;
        }
    });
    return { stop: () => subscription.unsubscribe() };
}
function trackFetch(lifeCycle, tracer) {
    const subscription = initFetchObservable().subscribe((rawContext) => {
        const context = rawContext;
        if (!isAllowedRequestUrl(context.url)) {
            return;
        }
        switch (context.state) {
            case 'start':
                tracer.traceFetch(context);
                context.requestIndex = getNextRequestIndex();
                lifeCycle.notify(6 /* LifeCycleEventType.REQUEST_STARTED */, {
                    requestIndex: context.requestIndex,
                    url: context.url,
                });
                break;
            case 'resolve':
                waitForResponseToComplete(context, (duration) => {
                    tracer.clearTracingIfNeeded(context);
                    lifeCycle.notify(7 /* LifeCycleEventType.REQUEST_COMPLETED */, {
                        duration,
                        method: context.method,
                        requestIndex: context.requestIndex,
                        responseType: context.responseType,
                        spanId: context.spanId,
                        startClocks: context.startClocks,
                        status: context.status,
                        traceId: context.traceId,
                        traceSampled: context.traceSampled,
                        type: "fetch" /* RequestType.FETCH */,
                        url: context.url,
                        response: context.response,
                        init: context.init,
                        input: context.input,
                        isAborted: context.isAborted,
                        handlingStack: context.handlingStack,
                    });
                });
                break;
        }
    });
    return { stop: () => subscription.unsubscribe() };
}
function getNextRequestIndex() {
    const result = nextRequestIndex;
    nextRequestIndex += 1;
    return result;
}
function waitForResponseToComplete(context, callback) {
    const clonedResponse = context.response && tryToClone(context.response);
    if (!clonedResponse || !clonedResponse.body) {
        // do not try to wait for the response if the clone failed, fetch error or null body
        callback(timeUtils_elapsed(context.startClocks.timeStamp, timeUtils_timeStampNow()));
    }
    else {
        readBytesFromStream(clonedResponse.body, () => {
            callback(timeUtils_elapsed(context.startClocks.timeStamp, timeUtils_timeStampNow()));
        }, {
            bytesLimit: Number.POSITIVE_INFINITY,
            collectStreamBody: false,
        });
    }
}

;// ../rum-core/src/domain/discardNegativeDuration.ts

function discardNegativeDuration(duration) {
    return isNumber(duration) && duration < 0 ? undefined : duration;
}

;// ../rum-core/src/domain/action/actionCollection.ts


function startActionCollection(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageStateHistory) {
    lifeCycle.subscribe(0 /* LifeCycleEventType.AUTO_ACTION_COMPLETED */, (action) => lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, processAction(action, pageStateHistory)));
    let actionContexts = { findActionId: functionUtils_noop };
    let stop = functionUtils_noop;
    // if (configuration.trackUserInteractions) {
    //   ;({ actionContexts, stop } = trackClickActions(
    //     lifeCycle,
    //     domMutationObservable,
    //     windowOpenObservable,
    //     configuration
    //   ))
    // }
    return {
        addAction: (action, savedCommonContext) => {
            lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, Object.assign({ savedCommonContext }, processAction(action, pageStateHistory)));
        },
        actionContexts,
        stop,
    };
}
function processAction(action, pageStateHistory) {
    const autoActionProperties = isAutoAction(action)
        ? {
            action: {
                id: action.id,
                loading_time: discardNegativeDuration(toServerDuration(action.duration)),
                frustration: {
                    type: action.frustrationTypes,
                },
                error: {
                    count: action.counts.errorCount,
                },
                long_task: {
                    count: action.counts.longTaskCount,
                },
                resource: {
                    count: action.counts.resourceCount,
                },
            },
            _dd: {
                action: {
                    target: action.target,
                    position: action.position,
                    // name_source: isExperimentalFeatureEnabled(ExperimentalFeature.ACTION_NAME_MASKING)
                    //   ? action.nameSource
                    //   : undefined,
                    name_source: undefined,
                },
            },
        }
        : undefined;
    const customerContext = !isAutoAction(action) ? action.context : undefined;
    const actionEvent = mergeInto_combine({
        action: {
            id: generateUUID(),
            target: {
                name: action.name,
            },
            type: action.type,
        },
        date: action.startClocks.timeStamp,
        type: "action" /* RumEventType.ACTION */,
        view: { in_foreground: pageStateHistory.wasInPageStateAt("active" /* PageState.ACTIVE */, action.startClocks.relative) },
    }, autoActionProperties);
    const domainContext = isAutoAction(action) ? { events: action.events } : {};
    if (!isAutoAction(action) && action.handlingStack) {
        domainContext.handlingStack = action.handlingStack;
    }
    return {
        customerContext,
        rawRumEvent: actionEvent,
        startTime: action.startClocks.relative,
        domainContext,
    };
}
function isAutoAction(action) {
    return action.type !== "custom" /* ActionType.CUSTOM */;
}

;// ../core/src/domain/error/error.ts




const NO_ERROR_STACK_PRESENT_MESSAGE = 'No stack, consider using an instance of Error';
function computeRawError({ stackTrace, originalError, handlingStack, startClocks, nonErrorPrefix, source, handling, }) {
    const isErrorInstance = isError(originalError);
    const message = computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError);
    const stack = hasUsableStack(isErrorInstance, stackTrace)
        ? toStackTraceString(stackTrace)
        : NO_ERROR_STACK_PRESENT_MESSAGE;
    const causes = isErrorInstance ? flattenErrorCauses(originalError, source) : undefined;
    const type = stackTrace ? stackTrace.name : undefined;
    const fingerprint = tryToGetFingerprint(originalError);
    return {
        startClocks,
        source,
        handling,
        handlingStack,
        originalError,
        type,
        message,
        stack,
        causes,
        fingerprint,
    };
}
function computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError) {
    // Favor stackTrace message only if tracekit has really been able to extract something meaningful (message + name)
    // TODO rework tracekit integration to avoid scattering error building logic
    return (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.message) && (stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.name)
        ? stackTrace.message
        : !isErrorInstance
            ? `${nonErrorPrefix} ${jsonStringify_jsonStringify(sanitize(originalError))}`
            : 'Empty message';
}
function hasUsableStack(isErrorInstance, stackTrace) {
    if (stackTrace === undefined) {
        return false;
    }
    if (isErrorInstance) {
        return true;
    }
    // handle cases where tracekit return stack = [] or stack = [{url: undefined, line: undefined, column: undefined}]
    // TODO rework tracekit integration to avoid generating those unusable stack
    return stackTrace.stack.length > 0 && (stackTrace.stack.length > 1 || stackTrace.stack[0].url !== undefined);
}
function tryToGetFingerprint(originalError) {
    return isError(originalError) && 'dd_fingerprint' in originalError ? String(originalError.dd_fingerprint) : undefined;
}
function getFileFromStackTraceString(stack) {
    var _a;
    return (_a = /@ (.+)/.exec(stack)) === null || _a === void 0 ? void 0 : _a[1];
}
function isError(error) {
    return error instanceof Error || Object.prototype.toString.call(error) === '[object Error]';
}
function flattenErrorCauses(error, parentSource) {
    let currentError = error;
    const causes = [];
    while (isError(currentError === null || currentError === void 0 ? void 0 : currentError.cause) && causes.length < 10) {
        const stackTrace = computeStackTrace(currentError.cause);
        causes.push({
            message: currentError.cause.message,
            source: parentSource,
            type: stackTrace === null || stackTrace === void 0 ? void 0 : stackTrace.name,
            stack: stackTrace && toStackTraceString(stackTrace),
        });
        currentError = currentError.cause;
    }
    return causes.length ? causes : undefined;
}

;// ../core/src/domain/error/trackRuntimeError.ts





function trackRuntimeError(errorObservable) {
    const handleRuntimeError = (stackTrace, originalError) => {
        const rawError = computeRawError({
            stackTrace,
            originalError,
            startClocks: clocksNow(),
            nonErrorPrefix: "Uncaught" /* NonErrorPrefix.UNCAUGHT */,
            source: ErrorSource.SOURCE,
            handling: "unhandled" /* ErrorHandling.UNHANDLED */,
        });
        errorObservable.notify(rawError);
    };
    const { stop: stopInstrumentingOnError } = instrumentOnError(handleRuntimeError);
    const { stop: stopInstrumentingOnUnhandledRejection } = instrumentUnhandledRejection(handleRuntimeError);
    return {
        stop: () => {
            stopInstrumentingOnError();
            stopInstrumentingOnUnhandledRejection();
        },
    };
}
function instrumentOnError(callback) {
    return instrumentMethod(window, 'onerror', ({ parameters: [messageObj, url, line, column, errorObj] }) => {
        let stackTrace;
        if (isError(errorObj)) {
            stackTrace = computeStackTrace(errorObj);
        }
        else {
            stackTrace = computeStackTraceFromOnErrorMessage(messageObj, url, line, column);
        }
        callback(stackTrace, errorObj !== null && errorObj !== void 0 ? errorObj : messageObj);
    });
}
function instrumentUnhandledRejection(callback) {
    return instrumentMethod(window, 'onunhandledrejection', ({ parameters: [e] }) => {
        const reason = e.reason || 'Empty reason';
        const stack = computeStackTrace(reason);
        callback(stack, reason);
    });
}

;// ../core/src/domain/console/consoleObservable.ts










let consoleObservablesByApi = {};
function initConsoleObservable(apis) {
    const consoleObservables = apis.map((api) => {
        if (!consoleObservablesByApi[api]) {
            consoleObservablesByApi[api] = createConsoleObservable(api); // we are sure that the observable created for this api will yield the expected ConsoleLog type
        }
        return consoleObservablesByApi[api];
    });
    return mergeObservables(...consoleObservables);
}
function resetConsoleObservable() {
    consoleObservablesByApi = {};
}
function createConsoleObservable(api) {
    return new observable_Observable((observable) => {
        const originalConsoleApi = globalConsole[api];
        globalConsole[api] = (...params) => {
            originalConsoleApi.apply(console, params);
            const handlingStack = createHandlingStack();
            callMonitored(() => {
                observable.notify(buildConsoleLog(params, api, handlingStack));
            });
        };
        return () => {
            globalConsole[api] = originalConsoleApi;
        };
    });
}
function buildConsoleLog(params, api, handlingStack) {
    const message = params.map((param) => formatConsoleParameters(param)).join(' ');
    let error;
    if (api === display_ConsoleApiName.error) {
        const firstErrorParam = params.find(isError);
        error = {
            stack: firstErrorParam ? toStackTraceString(computeStackTrace(firstErrorParam)) : undefined,
            fingerprint: tryToGetFingerprint(firstErrorParam),
            causes: firstErrorParam ? flattenErrorCauses(firstErrorParam, 'console') : undefined,
            startClocks: clocksNow(),
            message,
            source: ErrorSource.CONSOLE,
            handling: "handled" /* ErrorHandling.HANDLED */,
            handlingStack,
        };
    }
    return {
        api,
        message,
        error,
        handlingStack,
    };
}
function formatConsoleParameters(param) {
    if (typeof param === 'string') {
        return sanitize(param);
    }
    if (isError(param)) {
        return formatErrorMessage(computeStackTrace(param));
    }
    return jsonStringify_jsonStringify(sanitize(param), undefined, 2);
}

;// ../rum-core/src/domain/error/trackConsoleError.ts

function trackConsoleError(errorObservable) {
    const subscription = initConsoleObservable([display_ConsoleApiName.error]).subscribe((consoleLog) => errorObservable.notify(consoleLog.error));
    return {
        stop: () => {
            subscription.unsubscribe();
        },
    };
}

;// ../core/src/domain/report/reportObservable.ts







const RawReportType = {
    intervention: 'intervention',
    deprecation: 'deprecation',
    cspViolation: 'csp_violation',
};
function initReportObservable(configuration, apis) {
    const observables = [];
    if (apis.includes(RawReportType.cspViolation)) {
        observables.push(createCspViolationReportObservable(configuration));
    }
    const reportTypes = apis.filter((api) => api !== RawReportType.cspViolation);
    if (reportTypes.length) {
        observables.push(createReportObservable(reportTypes));
    }
    return mergeObservables(...observables);
}
function createReportObservable(reportTypes) {
    return new observable_Observable((observable) => {
        if (!window.ReportingObserver) {
            return;
        }
        const handleReports = monitor((reports, _) => reports.forEach((report) => observable.notify(buildRawReportErrorFromReport(report))));
        const observer = new window.ReportingObserver(handleReports, {
            types: reportTypes,
            buffered: true,
        });
        observer.observe();
        return () => {
            observer.disconnect();
        };
    });
}
function createCspViolationReportObservable(configuration) {
    return new observable_Observable((observable) => {
        const { stop } = addEventListener(configuration, document, "securitypolicyviolation" /* DOM_EVENT.SECURITY_POLICY_VIOLATION */, (event) => {
            observable.notify(buildRawReportErrorFromCspViolation(event));
        });
        return stop;
    });
}
function buildRawReportErrorFromReport(report) {
    const { type, body } = report;
    return buildRawReportError({
        type: body.id,
        message: `${type}: ${body.message}`,
        originalError: report,
        stack: buildStack(body.id, body.message, body.sourceFile, body.lineNumber, body.columnNumber),
    });
}
function buildRawReportErrorFromCspViolation(event) {
    const message = `'${event.blockedURI}' blocked by '${event.effectiveDirective}' directive`;
    return buildRawReportError({
        type: event.effectiveDirective,
        message: `${RawReportType.cspViolation}: ${message}`,
        originalError: event,
        csp: {
            disposition: event.disposition,
        },
        stack: buildStack(event.effectiveDirective, event.originalPolicy
            ? `${message} of the policy "${stringUtils_safeTruncate(event.originalPolicy, 100, '...')}"`
            : 'no policy', event.sourceFile, event.lineNumber, event.columnNumber),
    });
}
function buildRawReportError(partial) {
    return Object.assign({ startClocks: clocksNow(), source: ErrorSource.REPORT, handling: "unhandled" /* ErrorHandling.UNHANDLED */ }, partial);
}
function buildStack(name, message, sourceFile, lineNumber, columnNumber) {
    return sourceFile
        ? toStackTraceString({
            name,
            message,
            stack: [
                {
                    func: '?',
                    url: sourceFile,
                    line: lineNumber !== null && lineNumber !== void 0 ? lineNumber : undefined,
                    column: columnNumber !== null && columnNumber !== void 0 ? columnNumber : undefined,
                },
            ],
        })
        : undefined;
}

;// ../rum-core/src/domain/error/trackReportError.ts

function trackReportError(configuration, errorObservable) {
    const subscription = initReportObservable(configuration, [
        RawReportType.cspViolation,
        RawReportType.intervention,
    ]).subscribe((rawError) => errorObservable.notify(rawError));
    return {
        stop: () => {
            subscription.unsubscribe();
        },
    };
}

;// ../rum-core/src/domain/error/errorCollection.ts



function startErrorCollection(lifeCycle, configuration, pageStateHistory, featureFlagContexts) {
    const errorObservable = new observable_Observable();
    trackConsoleError(errorObservable);
    trackRuntimeError(errorObservable);
    trackReportError(configuration, errorObservable);
    errorObservable.subscribe((error) => lifeCycle.notify(13 /* LifeCycleEventType.RAW_ERROR_COLLECTED */, { error }));
    return doStartErrorCollection(lifeCycle, pageStateHistory, 'featureFlagContexts');
}
function doStartErrorCollection(lifeCycle, pageStateHistory, featureFlagContexts) {
    lifeCycle.subscribe(13 /* LifeCycleEventType.RAW_ERROR_COLLECTED */, ({ error, customerContext, savedCommonContext }) => {
        lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, Object.assign({ customerContext,
            savedCommonContext }, processError(error, pageStateHistory, featureFlagContexts)));
    });
    return {
        addError: ({ error, handlingStack, startClocks, context: customerContext }, savedCommonContext) => {
            const stackTrace = isError(error) ? computeStackTrace(error) : undefined;
            const rawError = computeRawError({
                stackTrace,
                originalError: error,
                handlingStack,
                startClocks,
                nonErrorPrefix: "Provided" /* NonErrorPrefix.PROVIDED */,
                source: ErrorSource.CUSTOM,
                handling: "handled" /* ErrorHandling.HANDLED */,
            });
            lifeCycle.notify(13 /* LifeCycleEventType.RAW_ERROR_COLLECTED */, {
                customerContext,
                savedCommonContext,
                error: rawError,
            });
        },
    };
}
function processError(error, pageStateHistory, featureFlagContexts) {
    const rawRumEvent = {
        date: error.startClocks.timeStamp,
        error: {
            id: generateUUID(),
            message: error.message,
            source: error.source,
            stack: error.stack,
            handling_stack: error.handlingStack,
            type: error.type,
            handling: error.handling,
            causes: error.causes,
            source_type: 'browser',
            fingerprint: error.fingerprint,
            csp: error.csp,
        },
        type: "error" /* RumEventType.ERROR */,
        view: { in_foreground: pageStateHistory.wasInPageStateAt("active" /* PageState.ACTIVE */, error.startClocks.relative) },
    };
    // const featureFlagContext = featureFlagContexts.findFeatureFlagEvaluations(error.startClocks.relative)
    // if (featureFlagContext && !isEmptyObject(featureFlagContext)) {
    //   rawRumEvent.feature_flags = featureFlagContext
    // }
    const domainContext = {
        error: error.originalError,
        handlingStack: error.handlingStack,
    };
    return {
        rawRumEvent,
        startTime: error.startClocks.relative,
        domainContext,
    };
}

;// ../core/src/tools/requestIdleCallback.ts



/**
 * 'requestIdleCallback' with a shim.
 */
function requestIdleCallback(callback, opts) {
    // Note: check both 'requestIdleCallback' and 'cancelIdleCallback' existence because some polyfills only implement 'requestIdleCallback'.
    if (window.requestIdleCallback && window.cancelIdleCallback) {
        const id = window.requestIdleCallback(monitor(callback), opts);
        return () => window.cancelIdleCallback(id);
    }
    return requestIdleCallbackShim(callback);
}
const MAX_TASK_TIME = 50;
/*
 * Shim from https://developer.chrome.com/blog/using-requestidlecallback#checking_for_requestidlecallback
 * Note: there is no simple way to support the "timeout" option, so we ignore it.
 */
function requestIdleCallbackShim(callback) {
    const start = dateNow();
    const timeoutId = timer_setTimeout(() => {
        callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, MAX_TASK_TIME - (dateNow() - start)),
        });
    }, 0);
    return () => timer_clearTimeout(timeoutId);
}

;// ../core/src/tools/taskQueue.ts


/**
 * Maximum delay before starting to execute tasks in the queue. We don't want to wait too long
 * before running tasks, as it might hurt reliability (ex: if the user navigates away, we might lose
 * the opportunity to send some data). We also don't want to run tasks too often, as it might hurt
 * performance.
 */
const IDLE_CALLBACK_TIMEOUT = ONE_SECOND;
/**
 * Maximum amount of time allocated to running tasks when a timeout (`IDLE_CALLBACK_TIMEOUT`) is
 * reached. We should not run tasks for too long as it will hurt performance, but we should still
 * run some tasks to avoid postponing them forever.
 *
 * Rational: Running tasks for 30ms every second (IDLE_CALLBACK_TIMEOUT) should be acceptable.
 */
const MAX_EXECUTION_TIME_ON_TIMEOUT = 30;
function createTaskQueue() {
    const pendingTasks = [];
    function run(deadline) {
        let executionTimeRemaining;
        if (deadline.didTimeout) {
            const start = performance.now();
            executionTimeRemaining = () => MAX_EXECUTION_TIME_ON_TIMEOUT - (performance.now() - start);
        }
        else {
            executionTimeRemaining = deadline.timeRemaining.bind(deadline);
        }
        while (executionTimeRemaining() > 0 && pendingTasks.length) {
            pendingTasks.shift()();
        }
        if (pendingTasks.length) {
            scheduleNextRun();
        }
    }
    function scheduleNextRun() {
        requestIdleCallback(run, { timeout: IDLE_CALLBACK_TIMEOUT });
    }
    return {
        push(task) {
            if (pendingTasks.push(task) === 1) {
                scheduleNextRun();
            }
        },
    };
}

;// ../rum-core/src/browser/firstInputPolyfill.ts

/**
 * first-input timing entry polyfill based on
 * https://github.com/GoogleChrome/web-vitals/blob/master/src/lib/polyfills/firstInputPolyfill.ts
 */
function retrieveFirstInputTiming(configuration, callback) {
    const startTimeStamp = dateNow();
    let timingSent = false;
    const { stop: removeEventListeners } = addEventListeners(configuration, window, ["click" /* DOM_EVENT.CLICK */, "mousedown" /* DOM_EVENT.MOUSE_DOWN */, "keydown" /* DOM_EVENT.KEY_DOWN */, "touchstart" /* DOM_EVENT.TOUCH_START */, "pointerdown" /* DOM_EVENT.POINTER_DOWN */], (evt) => {
        // Only count cancelable events, which should trigger behavior important to the user.
        if (!evt.cancelable) {
            return;
        }
        // This timing will be used to compute the "first Input delay", which is the delta between
        // when the system received the event (e.g. evt.timeStamp) and when it could run the callback
        // (e.g. performance.now()).
        const timing = {
            entryType: 'first-input',
            processingStart: timeUtils_relativeNow(),
            processingEnd: timeUtils_relativeNow(),
            startTime: evt.timeStamp,
            duration: 0, // arbitrary value to avoid nullable duration and simplify INP logic
            name: '',
            cancelable: false,
            target: null,
            toJSON: () => ({}),
        };
        if (evt.type === "pointerdown" /* DOM_EVENT.POINTER_DOWN */) {
            sendTimingIfPointerIsNotCancelled(configuration, timing);
        }
        else {
            sendTiming(timing);
        }
    }, { passive: true, capture: true });
    return { stop: removeEventListeners };
    /**
     * Pointer events are a special case, because they can trigger main or compositor thread behavior.
     * We differentiate these cases based on whether or not we see a pointercancel event, which are
     * fired when we scroll. If we're scrolling we don't need to report input delay since FID excludes
     * scrolling and pinch/zooming.
     */
    function sendTimingIfPointerIsNotCancelled(configuration, timing) {
        addEventListeners(configuration, window, ["pointerup" /* DOM_EVENT.POINTER_UP */, "pointercancel" /* DOM_EVENT.POINTER_CANCEL */], (event) => {
            if (event.type === "pointerup" /* DOM_EVENT.POINTER_UP */) {
                sendTiming(timing);
            }
        }, { once: true });
    }
    function sendTiming(timing) {
        if (!timingSent) {
            timingSent = true;
            removeEventListeners();
            // In some cases the recorded delay is clearly wrong, e.g. it's negative or it's larger than
            // the time between now and when the page was loaded.
            // - https://github.com/GoogleChromeLabs/first-input-delay/issues/4
            // - https://github.com/GoogleChromeLabs/first-input-delay/issues/6
            // - https://github.com/GoogleChromeLabs/first-input-delay/issues/7
            const delay = timing.processingStart - timing.startTime;
            if (delay >= 0 && delay < dateNow() - startTimeStamp) {
                callback(timing);
            }
        }
    }
}

;// ../rum-core/src/browser/performanceObservable.ts



// We want to use a real enum (i.e. not a const enum) here, to be able to check whether an arbitrary
// string is an expected performance entry
// eslint-disable-next-line no-restricted-syntax
var RumPerformanceEntryType;
(function (RumPerformanceEntryType) {
    RumPerformanceEntryType["EVENT"] = "event";
    RumPerformanceEntryType["FIRST_INPUT"] = "first-input";
    RumPerformanceEntryType["LARGEST_CONTENTFUL_PAINT"] = "largest-contentful-paint";
    RumPerformanceEntryType["LAYOUT_SHIFT"] = "layout-shift";
    RumPerformanceEntryType["LONG_TASK"] = "longtask";
    RumPerformanceEntryType["LONG_ANIMATION_FRAME"] = "long-animation-frame";
    RumPerformanceEntryType["NAVIGATION"] = "navigation";
    RumPerformanceEntryType["PAINT"] = "paint";
    RumPerformanceEntryType["RESOURCE"] = "resource";
})(RumPerformanceEntryType || (RumPerformanceEntryType = {}));
function createPerformanceObservable(configuration, options) {
    return new observable_Observable((observable) => {
        if (!window.PerformanceObserver) {
            return;
        }
        const handlePerformanceEntries = (entries) => {
            const rumPerformanceEntries = filterRumPerformanceEntries(entries);
            if (rumPerformanceEntries.length > 0) {
                observable.notify(rumPerformanceEntries);
            }
        };
        let timeoutId;
        let isObserverInitializing = true;
        const observer = new PerformanceObserver(monitor((entries) => {
            // In Safari the performance observer callback is synchronous.
            // Because the buffered performance entry list can be quite large we delay the computation to prevent the SDK from blocking the main thread on init
            if (isObserverInitializing) {
                timeoutId = timer_setTimeout(() => handlePerformanceEntries(entries.getEntries()));
            }
            else {
                handlePerformanceEntries(entries.getEntries());
            }
        }));
        try {
            observer.observe(options);
        }
        catch (_a) {
            // Some old browser versions (<= chrome 74 ) don't support the PerformanceObserver type and buffered options
            // In these cases, fallback to getEntriesByType and PerformanceObserver with entryTypes
            // TODO: remove this fallback in the next major version
            const fallbackSupportedEntryTypes = [
                RumPerformanceEntryType.RESOURCE,
                RumPerformanceEntryType.NAVIGATION,
                RumPerformanceEntryType.LONG_TASK,
                RumPerformanceEntryType.PAINT,
            ];
            if (fallbackSupportedEntryTypes.includes(options.type)) {
                if (options.buffered) {
                    timeoutId = timer_setTimeout(() => handlePerformanceEntries(performance.getEntriesByType(options.type)));
                }
                try {
                    observer.observe({ entryTypes: [options.type] });
                }
                catch (_b) {
                    // Old versions of Safari are throwing "entryTypes contained only unsupported types"
                    // errors when observing only unsupported entry types.
                    //
                    // We could use `supportPerformanceTimingEvent` to make sure we don't invoke
                    // `observer.observe` with an unsupported entry type, but Safari 11 and 12 don't support
                    // `Performance.supportedEntryTypes`, so doing so would lose support for these versions
                    // even if they do support the entry type.
                    return;
                }
            }
        }
        isObserverInitializing = false;
        manageResourceTimingBufferFull(configuration);
        let stopFirstInputTiming;
        if (!supportPerformanceTimingEvent(RumPerformanceEntryType.FIRST_INPUT) &&
            options.type === RumPerformanceEntryType.FIRST_INPUT) {
            ;
            ({ stop: stopFirstInputTiming } = retrieveFirstInputTiming(configuration, (timing) => {
                handlePerformanceEntries([timing]);
            }));
        }
        return () => {
            observer.disconnect();
            if (stopFirstInputTiming) {
                stopFirstInputTiming();
            }
            timer_clearTimeout(timeoutId);
        };
    });
}
let resourceTimingBufferFullListener;
function manageResourceTimingBufferFull(configuration) {
    if (!resourceTimingBufferFullListener && supportPerformanceObject() && 'addEventListener' in performance) {
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1559377
        resourceTimingBufferFullListener = addEventListener(configuration, performance, 'resourcetimingbufferfull', () => {
            performance.clearResourceTimings();
        });
    }
    return () => {
        resourceTimingBufferFullListener === null || resourceTimingBufferFullListener === void 0 ? void 0 : resourceTimingBufferFullListener.stop();
    };
}
function supportPerformanceObject() {
    return window.performance !== undefined && 'getEntries' in performance;
}
function supportPerformanceTimingEvent(entryType) {
    return (window.PerformanceObserver &&
        PerformanceObserver.supportedEntryTypes !== undefined &&
        PerformanceObserver.supportedEntryTypes.includes(entryType));
}
function filterRumPerformanceEntries(entries) {
    return entries.filter((entry) => !isForbiddenResource(entry));
}
function isForbiddenResource(entry) {
    return (entry.entryType === RumPerformanceEntryType.RESOURCE &&
        (!isAllowedRequestUrl(entry.name) || !hasValidResourceEntryDuration(entry)));
}

;// ../rum-core/src/browser/crypto.ts
function getCrypto() {
    // TODO: remove msCrypto when IE11 support is dropped
    return window.crypto || window.msCrypto;
}

;// ../rum-core/src/domain/tracing/identifier.ts
// import { ExperimentalFeature, isExperimentalFeatureEnabled } from '@datadog/browser-core'

function createTraceIdentifier() {
    return createIdentifier(64);
}
function createSpanIdentifier() {
    return createIdentifier(63);
}
let createIdentifierImplementationCache;
function createIdentifier(bits) {
    if (!createIdentifierImplementationCache) {
        createIdentifierImplementationCache =
            // isExperimentalFeatureEnabled(ExperimentalFeature.CONSISTENT_TRACE_SAMPLING) && areBigIntIdentifiersSupported()
            //   ? createIdentifierUsingBigInt
            //   : createIdentifierUsingUint32Array
            createIdentifierUsingUint32Array;
    }
    return createIdentifierImplementationCache(bits);
}
function areBigIntIdentifiersSupported() {
    try {
        crypto.getRandomValues(new BigUint64Array(1));
        return true;
    }
    catch (_a) {
        return false;
    }
}
function createIdentifierUsingBigInt(bits) {
    let id = crypto.getRandomValues(new BigUint64Array(1))[0];
    if (bits === 63) {
        // eslint-disable-next-line no-bitwise
        id >>= BigInt('1');
    }
    return id;
}
// TODO: remove this when all browser we support have BigInt support
function createIdentifierUsingUint32Array(bits) {
    const buffer = getCrypto().getRandomValues(new Uint32Array(2));
    if (bits === 63) {
        // eslint-disable-next-line no-bitwise
        buffer[buffer.length - 1] >>>= 1; // force 63-bit
    }
    return {
        toString(radix = 10) {
            let high = buffer[1];
            let low = buffer[0];
            let str = '';
            do {
                const mod = (high % radix) * 4294967296 + low;
                high = Math.floor(high / radix);
                low = Math.floor(mod / radix);
                str = (mod % radix).toString(radix) + str;
            } while (high || low);
            return str;
        },
    };
}
function toPaddedHexadecimalString(id) {
    const traceId = id.toString(16);
    // TODO: replace with String.prototype.padStart when we drop IE11 support
    return Array(17 - traceId.length).join('0') + traceId;
}

;// ../rum-core/src/domain/resource/matchRequestResourceEntry.ts


const alreadyMatchedEntries = new WeakSet();
/**
 * Look for corresponding timing in resource timing buffer
 *
 * Observations:
 * - Timing (start, end) are nested inside the request (start, end)
 * - Some timing can be not exactly nested, being off by < 1 ms
 *
 * Strategy:
 * - from valid nested entries (with 1 ms error margin)
 * - filter out timing that were already matched to a request
 * - then, if a single timing match, return the timing
 * - otherwise we can't decide, return undefined
 */
function matchRequestResourceEntry(request) {
    if (!performance || !('getEntriesByName' in performance)) {
        return;
    }
    const sameNameEntries = performance.getEntriesByName(request.url, 'resource');
    if (!sameNameEntries.length || !('toJSON' in sameNameEntries[0])) {
        return;
    }
    const candidates = sameNameEntries
        .filter((entry) => !alreadyMatchedEntries.has(entry))
        .filter((entry) => hasValidResourceEntryDuration(entry) && hasValidResourceEntryTimings(entry))
        .filter((entry) => isBetween(entry, request.startClocks.relative, endTime({ startTime: request.startClocks.relative, duration: request.duration })));
    if (candidates.length === 1) {
        alreadyMatchedEntries.add(candidates[0]);
        return candidates[0].toJSON();
    }
    return;
}
function endTime(timing) {
    return addDuration(timing.startTime, timing.duration);
}
function isBetween(timing, start, end) {
    const errorMargin = 1;
    return timing.startTime >= start - errorMargin && endTime(timing) <= addDuration(end, errorMargin);
}

;// ../core/src/browser/runOnReadyState.ts


function runOnReadyState(configuration, expectedReadyState, callback) {
    if (document.readyState === expectedReadyState || document.readyState === 'complete') {
        callback();
        return { stop: functionUtils_noop };
    }
    const eventName = expectedReadyState === 'complete' ? "load" /* DOM_EVENT.LOAD */ : "DOMContentLoaded" /* DOM_EVENT.DOM_CONTENT_LOADED */;
    return addEventListener(configuration, window, eventName, callback, { once: true });
}
function asyncRunOnReadyState(configuration, expectedReadyState) {
    return new Promise((resolve) => {
        runOnReadyState(configuration, expectedReadyState, resolve);
    });
}

;// ../rum-core/src/browser/htmlDomUtils.ts
function htmlDomUtils_isTextNode(node) {
    return node.nodeType === Node.TEXT_NODE;
}
function isCommentNode(node) {
    return node.nodeType === Node.COMMENT_NODE;
}
function htmlDomUtils_isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
function isNodeShadowHost(node) {
    return htmlDomUtils_isElementNode(node) && Boolean(node.shadowRoot);
}
function isNodeShadowRoot(node) {
    const shadowRoot = node;
    return !!shadowRoot.host && shadowRoot.nodeType === Node.DOCUMENT_FRAGMENT_NODE && htmlDomUtils_isElementNode(shadowRoot.host);
}
function hasChildNodes(node) {
    return node.childNodes.length > 0 || isNodeShadowHost(node);
}
function forEachChildNodes(node, callback) {
    let child = node.firstChild;
    while (child) {
        callback(child);
        child = child.nextSibling;
    }
    if (isNodeShadowHost(node)) {
        callback(node.shadowRoot);
    }
}
/**
 * Return `host` in case if the current node is a shadow root otherwise will return the `parentNode`
 */
function htmlDomUtils_getParentNode(node) {
    return isNodeShadowRoot(node) ? node.host : node.parentNode;
}

;// ../rum-core/src/domain/tracing/getDocumentTraceId.ts


const INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD = 2 * ONE_MINUTE;
function getDocumentTraceId(document) {
    const data = getDocumentTraceDataFromMeta(document) || getDocumentTraceDataFromComment(document);
    if (!data || data.traceTime <= dateNow() - INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD) {
        return undefined;
    }
    return data.traceId;
}
function getDocumentTraceDataFromMeta(document) {
    const traceIdMeta = document.querySelector('meta[name=dd-trace-id]');
    const traceTimeMeta = document.querySelector('meta[name=dd-trace-time]');
    return createDocumentTraceData(traceIdMeta && traceIdMeta.content, traceTimeMeta && traceTimeMeta.content);
}
function getDocumentTraceDataFromComment(document) {
    const comment = findTraceComment(document);
    if (!comment) {
        return undefined;
    }
    return createDocumentTraceData(findCommaSeparatedValue(comment, 'trace-id'), findCommaSeparatedValue(comment, 'trace-time'));
}
function createDocumentTraceData(traceId, rawTraceTime) {
    const traceTime = rawTraceTime && Number(rawTraceTime);
    if (!traceId || !traceTime) {
        return undefined;
    }
    return {
        traceId,
        traceTime,
    };
}
function findTraceComment(document) {
    // 1. Try to find the comment as a direct child of the document
    // Note: TSLint advises to use a 'for of', but TS doesn't allow to use 'for of' if the iterated
    // value is not an array or string (here, a NodeList).
    for (let i = 0; i < document.childNodes.length; i += 1) {
        const comment = getTraceCommentFromNode(document.childNodes[i]);
        if (comment) {
            return comment;
        }
    }
    // 2. If the comment is placed after the </html> tag, but have some space or new lines before or
    // after, the DOM parser will lift it (and the surrounding text) at the end of the <body> tag.
    // Try to look for the comment at the end of the <body> by by iterating over its child nodes in
    // reverse order, stopping if we come across a non-text node.
    if (document.body) {
        for (let i = document.body.childNodes.length - 1; i >= 0; i -= 1) {
            const node = document.body.childNodes[i];
            const comment = getTraceCommentFromNode(node);
            if (comment) {
                return comment;
            }
            if (!htmlDomUtils_isTextNode(node)) {
                break;
            }
        }
    }
}
function getTraceCommentFromNode(node) {
    if (node && isCommentNode(node)) {
        const match = /^\s*DATADOG;(.*?)\s*$/.exec(node.data);
        if (match) {
            return match[1];
        }
    }
}

;// ../rum-core/src/browser/performanceUtils.ts


function getNavigationEntry() {
    if (supportPerformanceTimingEvent(RumPerformanceEntryType.NAVIGATION)) {
        const navigationEntry = performance.getEntriesByType(RumPerformanceEntryType.NAVIGATION)[0];
        if (navigationEntry) {
            return navigationEntry;
        }
    }
    const timings = computeTimingsFromDeprecatedPerformanceTiming();
    const entry = Object.assign({ entryType: RumPerformanceEntryType.NAVIGATION, initiatorType: 'navigation', name: window.location.href, startTime: 0, duration: timings.responseEnd, decodedBodySize: 0, encodedBodySize: 0, transferSize: 0, workerStart: 0, toJSON: () => (Object.assign(Object.assign({}, entry), { toJSON: undefined })) }, timings);
    return entry;
}
function computeTimingsFromDeprecatedPerformanceTiming() {
    const result = {};
    const timing = performance.timing;
    for (const key in timing) {
        if (isNumber(timing[key])) {
            const numberKey = key;
            const timingElement = timing[numberKey];
            result[numberKey] = timingElement === 0 ? 0 : getRelativeTime(timingElement);
        }
    }
    return result;
}

;// ../rum-core/src/domain/resource/retrieveInitialDocumentResourceTiming.ts





function retrieveInitialDocumentResourceTiming(configuration, callback) {
    runOnReadyState(configuration, 'interactive', () => {
        const entry = Object.assign(getNavigationEntry().toJSON(), {
            entryType: RumPerformanceEntryType.RESOURCE,
            initiatorType: FAKE_INITIAL_DOCUMENT,
            traceId: getDocumentTraceId(document),
            toJSON: () => (Object.assign(Object.assign({}, entry), { toJSON: undefined })),
        });
        callback(entry);
    });
}

;// ../rum-core/src/domain/resource/resourceCollection.ts






function startResourceCollection(lifeCycle, configuration, pageStateHistory, taskQueue = createTaskQueue(), retrieveInitialDocumentResourceTimingImpl = retrieveInitialDocumentResourceTiming) {
    lifeCycle.subscribe(7 /* LifeCycleEventType.REQUEST_COMPLETED */, (request) => {
        handleResource(() => processRequest(request, configuration, pageStateHistory));
    });
    const performanceResourceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.RESOURCE,
        buffered: true,
    }).subscribe((entries) => {
        for (const entry of entries) {
            if (!isResourceEntryRequestType(entry)) {
                handleResource(() => processResourceEntry(entry, configuration));
            }
        }
    });
    retrieveInitialDocumentResourceTimingImpl(configuration, (timing) => {
        handleResource(() => processResourceEntry(timing, configuration));
    });
    function handleResource(computeRawEvent) {
        taskQueue.push(() => {
            const rawEvent = computeRawEvent();
            if (rawEvent) {
                lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, rawEvent);
            }
        });
    }
    return {
        stop: () => {
            performanceResourceSubscription.unsubscribe();
        },
    };
}
function processRequest(request, configuration, pageStateHistory) {
    const matchingTiming = matchRequestResourceEntry(request);
    const startClocks = matchingTiming ? relativeToClocks(matchingTiming.startTime) : request.startClocks;
    const tracingInfo = computeRequestTracingInfo(request, configuration);
    if (!configuration.trackResources && !tracingInfo) {
        return;
    }
    const type = request.type === "xhr" /* RequestType.XHR */ ? "xhr" /* ResourceType.XHR */ : "fetch" /* ResourceType.FETCH */;
    const correspondingTimingOverrides = matchingTiming ? computeResourceEntryMetrics(matchingTiming) : undefined;
    const duration = computeRequestDuration(pageStateHistory, startClocks, request.duration);
    const resourceEvent = mergeInto_combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type,
            duration,
            method: request.method,
            status_code: request.status,
            protocol: matchingTiming && computeResourceEntryProtocol(matchingTiming),
            url: isLongDataUrl(request.url) ? sanitizeDataUrl(request.url) : request.url,
            delivery_type: matchingTiming && computeResourceEntryDeliveryType(matchingTiming),
        },
        type: "resource" /* RumEventType.RESOURCE */,
        _dd: {
            discarded: !configuration.trackResources,
        },
    }, tracingInfo, correspondingTimingOverrides);
    return {
        startTime: startClocks.relative,
        rawRumEvent: resourceEvent,
        domainContext: {
            performanceEntry: matchingTiming,
            xhr: request.xhr,
            response: request.response,
            requestInput: request.input,
            requestInit: request.init,
            error: request.error,
            isAborted: request.isAborted,
            handlingStack: request.handlingStack,
        },
    };
}
function processResourceEntry(entry, configuration) {
    const startClocks = relativeToClocks(entry.startTime);
    const tracingInfo = computeResourceEntryTracingInfo(entry, configuration);
    if (!configuration.trackResources && !tracingInfo) {
        return;
    }
    const type = computeResourceEntryType(entry);
    const entryMetrics = computeResourceEntryMetrics(entry);
    const resourceEvent = mergeInto_combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type,
            url: entry.name,
            status_code: discardZeroStatus(entry.responseStatus),
            protocol: computeResourceEntryProtocol(entry),
            delivery_type: computeResourceEntryDeliveryType(entry),
        },
        type: "resource" /* RumEventType.RESOURCE */,
        _dd: {
            discarded: !configuration.trackResources,
        },
    }, tracingInfo, entryMetrics);
    return {
        startTime: startClocks.relative,
        rawRumEvent: resourceEvent,
        domainContext: {
            performanceEntry: entry,
        },
    };
}
function computeResourceEntryMetrics(entry) {
    const { renderBlockingStatus } = entry;
    return {
        resource: Object.assign(Object.assign({ duration: computeResourceEntryDuration(entry), render_blocking_status: renderBlockingStatus }, computeResourceEntrySize(entry)), computeResourceEntryDetails(entry)),
    };
}
function computeRequestTracingInfo(request, configuration) {
    const hasBeenTraced = request.traceSampled && request.traceId && request.spanId;
    if (!hasBeenTraced) {
        return undefined;
    }
    return {
        _dd: {
            span_id: request.spanId.toString(),
            trace_id: request.traceId.toString(),
            rule_psr: configuration.rulePsr,
        },
    };
}
function computeResourceEntryTracingInfo(entry, configuration) {
    const hasBeenTraced = entry.traceId;
    if (!hasBeenTraced) {
        return undefined;
    }
    return {
        _dd: {
            trace_id: entry.traceId,
            span_id: createSpanIdentifier().toString(),
            rule_psr: configuration.rulePsr,
        },
    };
}
function computeRequestDuration(pageStateHistory, startClocks, duration) {
    return !pageStateHistory.wasInPageStateDuringPeriod("frozen" /* PageState.FROZEN */, startClocks.relative, duration)
        ? toServerDuration(duration)
        : undefined;
}
/**
 * The status is 0 for cross-origin resources without CORS headers, so the status is meaningless, and we shouldn't report it
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus#cross-origin_response_status_codes
 */
function discardZeroStatus(statusCode) {
    return statusCode === 0 ? undefined : statusCode;
}

;// ../rum-core/src/domain/trackEventCounts.ts

function trackEventCounts({ lifeCycle, isChildEvent, onChange: callback = functionUtils_noop, }) {
    const eventCounts = {
        errorCount: 0,
        longTaskCount: 0,
        resourceCount: 0,
        actionCount: 0,
        frustrationCount: 0,
    };
    const subscription = lifeCycle.subscribe(12 /* LifeCycleEventType.RUM_EVENT_COLLECTED */, (event) => {
        var _a;
        if (event.type === 'view' || event.type === 'vital' || !isChildEvent(event)) {
            return;
        }
        switch (event.type) {
            case "error" /* RumEventType.ERROR */:
                eventCounts.errorCount += 1;
                callback();
                break;
            case "action" /* RumEventType.ACTION */:
                eventCounts.actionCount += 1;
                if (event.action.frustration) {
                    eventCounts.frustrationCount += event.action.frustration.type.length;
                }
                callback();
                break;
            case "long_task" /* RumEventType.LONG_TASK */:
                eventCounts.longTaskCount += 1;
                callback();
                break;
            case "resource" /* RumEventType.RESOURCE */:
                if (!((_a = event._dd) === null || _a === void 0 ? void 0 : _a.discarded)) {
                    eventCounts.resourceCount += 1;
                    callback();
                }
                break;
        }
    });
    return {
        stop: () => {
            subscription.unsubscribe();
        },
        eventCounts,
    };
}

;// ../rum-core/src/domain/view/trackViewEventCounts.ts

function trackViewEventCounts(lifeCycle, viewId, onChange) {
    const { stop, eventCounts } = trackEventCounts({
        lifeCycle,
        isChildEvent: (event) => event.view.id === viewId,
        onChange,
    });
    return {
        stop,
        eventCounts,
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackFirstContentfulPaint.ts


// Discard FCP timings above a certain delay to avoid incorrect data
// It happens in some cases like sleep mode or some browser implementations
const FCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
function trackFirstContentfulPaint(configuration, firstHidden, callback) {
    const performanceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.PAINT,
        buffered: true,
    }).subscribe((entries) => {
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint' &&
            entry.startTime < firstHidden.timeStamp &&
            entry.startTime < FCP_MAXIMUM_DELAY);
        if (fcpEntry) {
            callback(fcpEntry.startTime);
        }
    });
    return {
        stop: performanceSubscription.unsubscribe,
    };
}

;// ../rum-core/src/domain/privacy.ts


const privacy_NodePrivacyLevel = {
    IGNORE: 'ignore',
    HIDDEN: 'hidden',
    ALLOW: DefaultPrivacyLevel.ALLOW,
    MASK: DefaultPrivacyLevel.MASK,
    MASK_USER_INPUT: DefaultPrivacyLevel.MASK_USER_INPUT,
};
const PRIVACY_ATTR_NAME = 'data-dd-privacy';
// Privacy Attrs
const PRIVACY_ATTR_VALUE_ALLOW = 'allow';
const PRIVACY_ATTR_VALUE_MASK = 'mask';
const PRIVACY_ATTR_VALUE_MASK_USER_INPUT = 'mask-user-input';
const PRIVACY_ATTR_VALUE_HIDDEN = 'hidden';
// Privacy Classes - not all customers can set plain HTML attributes, so support classes too
const PRIVACY_CLASS_PREFIX = 'dd-privacy-';
// Private Replacement Templates
const CENSORED_STRING_MARK = '***';
const CENSORED_IMG_MARK = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
const FORM_PRIVATE_TAG_NAMES = {
    INPUT: true,
    OUTPUT: true,
    TEXTAREA: true,
    SELECT: true,
    OPTION: true,
    DATALIST: true,
    OPTGROUP: true,
};
const TEXT_MASKING_CHAR = 'x';
/**
 * Get node privacy level by iterating over its ancestors. When the direct parent privacy level is
 * know, it is best to use something like:
 *
 * derivePrivacyLevelGivenParent(getNodeSelfPrivacyLevel(node), parentNodePrivacyLevel)
 */
function getNodePrivacyLevel(node, defaultPrivacyLevel, cache) {
    if (cache && cache.has(node)) {
        return cache.get(node);
    }
    const parentNode = getParentNode(node);
    const parentNodePrivacyLevel = parentNode
        ? getNodePrivacyLevel(parentNode, defaultPrivacyLevel, cache)
        : defaultPrivacyLevel;
    const selfNodePrivacyLevel = getNodeSelfPrivacyLevel(node);
    const nodePrivacyLevel = reducePrivacyLevel(selfNodePrivacyLevel, parentNodePrivacyLevel);
    if (cache) {
        cache.set(node, nodePrivacyLevel);
    }
    return nodePrivacyLevel;
}
/**
 * Reduces the next privacy level based on self + parent privacy levels
 */
function reducePrivacyLevel(childPrivacyLevel, parentNodePrivacyLevel) {
    switch (parentNodePrivacyLevel) {
        // These values cannot be overridden
        case privacy_NodePrivacyLevel.HIDDEN:
        case privacy_NodePrivacyLevel.IGNORE:
            return parentNodePrivacyLevel;
    }
    switch (childPrivacyLevel) {
        case privacy_NodePrivacyLevel.ALLOW:
        case privacy_NodePrivacyLevel.MASK:
        case privacy_NodePrivacyLevel.MASK_USER_INPUT:
        case privacy_NodePrivacyLevel.HIDDEN:
        case privacy_NodePrivacyLevel.IGNORE:
            return childPrivacyLevel;
        default:
            return parentNodePrivacyLevel;
    }
}
/**
 * Determines the node's own privacy level without checking for ancestors.
 */
function getNodeSelfPrivacyLevel(node) {
    // Only Element types can have a privacy level set
    if (!isElementNode(node)) {
        return;
    }
    // Overrules for replay purpose
    if (node.tagName === 'BASE') {
        return privacy_NodePrivacyLevel.ALLOW;
    }
    // Overrules to enforce end-user protection
    if (node.tagName === 'INPUT') {
        const inputElement = node;
        if (inputElement.type === 'password' || inputElement.type === 'email' || inputElement.type === 'tel') {
            return privacy_NodePrivacyLevel.MASK;
        }
        if (inputElement.type === 'hidden') {
            return privacy_NodePrivacyLevel.MASK;
        }
        const autocomplete = inputElement.getAttribute('autocomplete');
        // Handle input[autocomplete=cc-number/cc-csc/cc-exp/cc-exp-month/cc-exp-year/new-password/current-password]
        if (autocomplete && (autocomplete.startsWith('cc-') || autocomplete.endsWith('-password'))) {
            return privacy_NodePrivacyLevel.MASK;
        }
    }
    // Check HTML privacy attributes and classes
    if (node.matches(getPrivacySelector(privacy_NodePrivacyLevel.HIDDEN))) {
        return privacy_NodePrivacyLevel.HIDDEN;
    }
    if (node.matches(getPrivacySelector(privacy_NodePrivacyLevel.MASK))) {
        return privacy_NodePrivacyLevel.MASK;
    }
    if (node.matches(getPrivacySelector(privacy_NodePrivacyLevel.MASK_USER_INPUT))) {
        return privacy_NodePrivacyLevel.MASK_USER_INPUT;
    }
    if (node.matches(getPrivacySelector(privacy_NodePrivacyLevel.ALLOW))) {
        return privacy_NodePrivacyLevel.ALLOW;
    }
    if (shouldIgnoreElement(node)) {
        return privacy_NodePrivacyLevel.IGNORE;
    }
}
/**
 * Helper aiming to unify `mask` and `mask-user-input` privacy levels:
 *
 * In the `mask` case, it is trivial: we should mask the element.
 *
 * In the `mask-user-input` case, we should mask the element only if it is a "form" element or the
 * direct parent is a form element for text nodes).
 *
 * Other `shouldMaskNode` cases are edge cases that should not matter too much (ex: should we mask a
 * node if it is ignored or hidden? it doesn't matter since it won't be serialized).
 */
function shouldMaskNode(node, privacyLevel) {
    switch (privacyLevel) {
        case privacy_NodePrivacyLevel.MASK:
        case privacy_NodePrivacyLevel.HIDDEN:
        case privacy_NodePrivacyLevel.IGNORE:
            return true;
        case privacy_NodePrivacyLevel.MASK_USER_INPUT:
            return isTextNode(node) ? isFormElement(node.parentNode) : isFormElement(node);
        default:
            return false;
    }
}
function isFormElement(node) {
    if (!node || node.nodeType !== node.ELEMENT_NODE) {
        return false;
    }
    const element = node;
    if (element.tagName === 'INPUT') {
        switch (element.type) {
            case 'button':
            case 'color':
            case 'reset':
            case 'submit':
                return false;
        }
    }
    return !!FORM_PRIVATE_TAG_NAMES[element.tagName];
}
/**
 * Text censoring non-destructively maintains whitespace characters in order to preserve text shape
 * during replay.
 */
const censorText = (text) => text.replace(/\S/g, TEXT_MASKING_CHAR);
function getTextContent(textNode, ignoreWhiteSpace, parentNodePrivacyLevel) {
    var _a;
    // The parent node may not be a html element which has a tagName attribute.
    // So just let it be undefined which is ok in this use case.
    const parentTagName = (_a = textNode.parentElement) === null || _a === void 0 ? void 0 : _a.tagName;
    let textContent = textNode.textContent || '';
    if (ignoreWhiteSpace && !textContent.trim()) {
        return;
    }
    const nodePrivacyLevel = parentNodePrivacyLevel;
    const isScript = parentTagName === 'SCRIPT';
    if (isScript) {
        // For perf reasons, we don't record script (heuristic)
        textContent = CENSORED_STRING_MARK;
    }
    else if (nodePrivacyLevel === privacy_NodePrivacyLevel.HIDDEN) {
        // Should never occur, but just in case, we set to CENSORED_MARK.
        textContent = CENSORED_STRING_MARK;
    }
    else if (shouldMaskNode(textNode, nodePrivacyLevel)) {
        if (
        // Scrambling the child list breaks text nodes for DATALIST/SELECT/OPTGROUP
        parentTagName === 'DATALIST' ||
            parentTagName === 'SELECT' ||
            parentTagName === 'OPTGROUP') {
            if (!textContent.trim()) {
                return;
            }
        }
        else if (parentTagName === 'OPTION') {
            // <Option> has low entropy in charset + text length, so use `CENSORED_STRING_MARK` when masked
            textContent = CENSORED_STRING_MARK;
        }
        else {
            textContent = censorText(textContent);
        }
    }
    return textContent;
}
/**
 * TODO: Preserve CSS element order, and record the presence of the tag, just don't render
 * We don't need this logic on the recorder side.
 * For security related meta's, customer can mask themmanually given they
 * are easy to identify in the HEAD tag.
 */
function shouldIgnoreElement(element) {
    if (element.nodeName === 'SCRIPT') {
        return true;
    }
    if (element.nodeName === 'LINK') {
        const relAttribute = getLowerCaseAttribute('rel');
        return (
        // Link as script - Ignore only when rel=preload, modulepreload or prefetch
        (/preload|prefetch/i.test(relAttribute) && getLowerCaseAttribute('as') === 'script') ||
            // Favicons
            relAttribute === 'shortcut icon' ||
            relAttribute === 'icon');
    }
    if (element.nodeName === 'META') {
        const nameAttribute = getLowerCaseAttribute('name');
        const relAttribute = getLowerCaseAttribute('rel');
        const propertyAttribute = getLowerCaseAttribute('property');
        return (
        // Favicons
        /^msapplication-tile(image|color)$/.test(nameAttribute) ||
            nameAttribute === 'application-name' ||
            relAttribute === 'icon' ||
            relAttribute === 'apple-touch-icon' ||
            relAttribute === 'shortcut icon' ||
            // Description
            nameAttribute === 'keywords' ||
            nameAttribute === 'description' ||
            // Social
            /^(og|twitter|fb):/.test(propertyAttribute) ||
            /^(og|twitter):/.test(nameAttribute) ||
            nameAttribute === 'pinterest' ||
            // Robots
            nameAttribute === 'robots' ||
            nameAttribute === 'googlebot' ||
            nameAttribute === 'bingbot' ||
            // Http headers. Ex: X-UA-Compatible, Content-Type, Content-Language, cache-control,
            // X-Translated-By
            element.hasAttribute('http-equiv') ||
            // Authorship
            nameAttribute === 'author' ||
            nameAttribute === 'generator' ||
            nameAttribute === 'framework' ||
            nameAttribute === 'publisher' ||
            nameAttribute === 'progid' ||
            /^article:/.test(propertyAttribute) ||
            /^product:/.test(propertyAttribute) ||
            // Verification
            nameAttribute === 'google-site-verification' ||
            nameAttribute === 'yandex-verification' ||
            nameAttribute === 'csrf-token' ||
            nameAttribute === 'p:domain_verify' ||
            nameAttribute === 'verify-v1' ||
            nameAttribute === 'verification' ||
            nameAttribute === 'shopify-checkout-api-token');
    }
    function getLowerCaseAttribute(name) {
        return (element.getAttribute(name) || '').toLowerCase();
    }
    return false;
}
function getPrivacySelector(privacyLevel) {
    return `[${PRIVACY_ATTR_NAME}="${privacyLevel}"], .${PRIVACY_CLASS_PREFIX}${privacyLevel}`;
}

;// ../rum-core/src/domain/action/getActionNameFromElement.ts


/**
 * Get the action name from the attribute 'data-dd-action-name' on the element or any of its parent.
 * It can also be retrieved from a user defined attribute.
 */
const DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE = 'data-dd-action-name';
const ACTION_NAME_PLACEHOLDER = 'Masked Element';
function getActionNameFromElement(element, { enablePrivacyForActionName, actionNameAttribute: userProgrammaticAttribute }, nodePrivacyLevel) {
    // Proceed to get the action name in two steps:
    // * first, get the name programmatically, explicitly defined by the user.
    // * then, if privacy is set to mask, return a placeholder for the undefined.
    // * if privacy is not set to mask, use strategies that are known to return good results.
    //   Those strategies will be used on the element and a few parents, but it's likely that they won't succeed at all.
    // * if no name is found this way, use strategies returning less accurate names as a fallback.
    //   Those are much likely to succeed.
    const defaultActionName = getActionNameFromElementProgrammatically(element, DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE) ||
        (userProgrammaticAttribute && getActionNameFromElementProgrammatically(element, userProgrammaticAttribute));
    if (defaultActionName) {
        return { name: defaultActionName, nameSource: "custom_attribute" /* ActionNameSource.CUSTOM_ATTRIBUTE */ };
    }
    else if (nodePrivacyLevel === NodePrivacyLevel.MASK) {
        return { name: ACTION_NAME_PLACEHOLDER, nameSource: "mask_placeholder" /* ActionNameSource.MASK_PLACEHOLDER */ };
    }
    return (getActionNameFromElementForStrategies(element, userProgrammaticAttribute, priorityStrategies, enablePrivacyForActionName) ||
        getActionNameFromElementForStrategies(element, userProgrammaticAttribute, fallbackStrategies, enablePrivacyForActionName) || { name: '', nameSource: "blank" /* ActionNameSource.BLANK */ });
}
function getActionNameFromElementProgrammatically(targetElement, programmaticAttribute) {
    // We don't use getActionNameFromElementForStrategies here, because we want to consider all parents,
    // without limit. It is up to the user to declare a relevant naming strategy.
    const elementWithAttribute = targetElement.closest(`[${programmaticAttribute}]`);
    if (!elementWithAttribute) {
        return;
    }
    const name = elementWithAttribute.getAttribute(programmaticAttribute);
    return truncate(normalizeWhitespace(name.trim()));
}
const priorityStrategies = [
    // associated LABEL text
    (element, userProgrammaticAttribute) => {
        if ('labels' in element && element.labels && element.labels.length > 0) {
            return getActionNameFromTextualContent(element.labels[0], userProgrammaticAttribute);
        }
    },
    // INPUT button (and associated) value
    (element) => {
        if (element.nodeName === 'INPUT') {
            const input = element;
            const type = input.getAttribute('type');
            if (type === 'button' || type === 'submit' || type === 'reset') {
                return { name: input.value, nameSource: "text_content" /* ActionNameSource.TEXT_CONTENT */ };
            }
        }
    },
    // BUTTON, LABEL or button-like element text
    (element, userProgrammaticAttribute, privacyEnabledActionName) => {
        if (element.nodeName === 'BUTTON' || element.nodeName === 'LABEL' || element.getAttribute('role') === 'button') {
            return getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName);
        }
    },
    (element) => getActionNameFromStandardAttribute(element, 'aria-label'),
    // associated element text designated by the aria-labelledby attribute
    (element, userProgrammaticAttribute, privacyEnabledActionName) => {
        const labelledByAttribute = element.getAttribute('aria-labelledby');
        if (labelledByAttribute) {
            return {
                name: labelledByAttribute
                    .split(/\s+/)
                    .map((id) => getElementById(element, id))
                    .filter((label) => Boolean(label))
                    .map((element) => getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName))
                    .join(' '),
                nameSource: "text_content" /* ActionNameSource.TEXT_CONTENT */,
            };
        }
    },
    (element) => getActionNameFromStandardAttribute(element, 'alt'),
    (element) => getActionNameFromStandardAttribute(element, 'name'),
    (element) => getActionNameFromStandardAttribute(element, 'title'),
    (element) => getActionNameFromStandardAttribute(element, 'placeholder'),
    // SELECT first OPTION text
    (element, userProgrammaticAttribute) => {
        if ('options' in element && element.options.length > 0) {
            return getActionNameFromTextualContent(element.options[0], userProgrammaticAttribute);
        }
    },
];
const fallbackStrategies = [
    (element, userProgrammaticAttribute, privacyEnabledActionName) => getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName),
];
/**
 * Iterates over the target element and its parent, using the strategies list to get an action name.
 * Each strategies are applied on each element, stopping as soon as a non-empty value is returned.
 */
const MAX_PARENTS_TO_CONSIDER = 10;
function getActionNameFromElementForStrategies(targetElement, userProgrammaticAttribute, strategies, privacyEnabledActionName) {
    let element = targetElement;
    let recursionCounter = 0;
    while (recursionCounter <= MAX_PARENTS_TO_CONSIDER &&
        element &&
        element.nodeName !== 'BODY' &&
        element.nodeName !== 'HTML' &&
        element.nodeName !== 'HEAD') {
        for (const strategy of strategies) {
            const actionName = strategy(element, userProgrammaticAttribute, privacyEnabledActionName);
            if (actionName) {
                const { name, nameSource } = actionName;
                const trimmedName = name && name.trim();
                if (trimmedName) {
                    return { name: truncate(normalizeWhitespace(trimmedName)), nameSource };
                }
            }
        }
        // Consider a FORM as a contextual limit to get the action name.  This is experimental and may
        // be reconsidered in the future.
        if (element.nodeName === 'FORM') {
            break;
        }
        element = element.parentElement;
        recursionCounter += 1;
    }
}
function normalizeWhitespace(s) {
    return s.replace(/\s+/g, ' ');
}
function truncate(s) {
    return s.length > 100 ? `${safeTruncate(s, 100)} [...]` : s;
}
function getElementById(refElement, id) {
    // Use the element ownerDocument here, because tests are executed in an iframe, so
    // document.getElementById won't work.
    return refElement.ownerDocument ? refElement.ownerDocument.getElementById(id) : null;
}
function getActionNameFromStandardAttribute(element, attribute) {
    return {
        name: element.getAttribute(attribute) || '',
        nameSource: "standard_attribute" /* ActionNameSource.STANDARD_ATTRIBUTE */,
    };
}
function getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) {
    return {
        name: getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) || '',
        nameSource: "text_content" /* ActionNameSource.TEXT_CONTENT */,
    };
}
function getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) {
    if (element.isContentEditable) {
        return;
    }
    if ('innerText' in element) {
        let text = element.innerText;
        const removeTextFromElements = (query) => {
            const list = element.querySelectorAll(query);
            for (let index = 0; index < list.length; index += 1) {
                const element = list[index];
                if ('innerText' in element) {
                    const textToReplace = element.innerText;
                    if (textToReplace && textToReplace.trim().length > 0) {
                        text = text.replace(textToReplace, '');
                    }
                }
            }
        };
        // remove the text of elements with programmatic attribute value
        removeTextFromElements(`[${DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE}]`);
        if (userProgrammaticAttribute) {
            removeTextFromElements(`[${userProgrammaticAttribute}]`);
        }
        if (privacyEnabledActionName) {
            // remove the text of elements with privacy override
            removeTextFromElements(`${getPrivacySelector(privacy_NodePrivacyLevel.HIDDEN)}, ${getPrivacySelector(privacy_NodePrivacyLevel.MASK)}`);
        }
        return text;
    }
    return element.textContent;
}

;// ../rum-core/src/domain/getSelectorFromElement.ts

/**
 * Stable attributes are attributes that are commonly used to identify parts of a UI (ex:
 * component). Those attribute values should not be generated randomly (hardcoded most of the time)
 * and stay the same across deploys. They are not necessarily unique across the document.
 */
const STABLE_ATTRIBUTES = [
    DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE,
    // Common test attributes (list provided by google recorder)
    'data-testid',
    'data-test',
    'data-qa',
    'data-cy',
    'data-test-id',
    'data-qa-id',
    'data-testing',
    // FullStory decorator attributes:
    'data-component',
    'data-element',
    'data-source-file',
];
// Selectors to use if they target a single element on the whole document. Those selectors are
// considered as "stable" and uniquely identify an element regardless of the page state. If we find
// one, we should consider the selector "complete" and stop iterating over ancestors.
const GLOBALLY_UNIQUE_SELECTOR_GETTERS = [getStableAttributeSelector, getIDSelector];
// Selectors to use if they target a single element among an element descendants. Those selectors
// are more brittle than "globally unique" selectors and should be combined with ancestor selectors
// to improve specificity.
const UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS = [
    getStableAttributeSelector,
    getClassSelector,
    getTagNameSelector,
];
function getSelectorFromElement(targetElement, actionNameAttribute) {
    if (!isConnected(targetElement)) {
        // We cannot compute a selector for a detached element, as we don't have access to all of its
        // parents, and we cannot determine if it's unique in the document.
        return;
    }
    let targetElementSelector;
    let currentElement = targetElement;
    while (currentElement && currentElement.nodeName !== 'HTML') {
        const globallyUniqueSelector = findSelector(currentElement, GLOBALLY_UNIQUE_SELECTOR_GETTERS, isSelectorUniqueGlobally, actionNameAttribute, targetElementSelector);
        if (globallyUniqueSelector) {
            return globallyUniqueSelector;
        }
        const uniqueSelectorAmongChildren = findSelector(currentElement, UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS, isSelectorUniqueAmongSiblings, actionNameAttribute, targetElementSelector);
        targetElementSelector =
            uniqueSelectorAmongChildren || combineSelector(getPositionSelector(currentElement), targetElementSelector);
        currentElement = currentElement.parentElement;
    }
    return targetElementSelector;
}
function isGeneratedValue(value) {
    // To compute the "URL path group", the backend replaces every URL path parts as a question mark
    // if it thinks the part is an identifier. The condition it uses is to checks whether a digit is
    // present.
    //
    // Here, we use the same strategy: if the value contains a digit, we consider it generated. This
    // strategy might be a bit naive and fail in some cases, but there are many fallbacks to generate
    // CSS selectors so it should be fine most of the time.
    return /[0-9]/.test(value);
}
function getIDSelector(element) {
    if (element.id && !isGeneratedValue(element.id)) {
        return `#${CSS.escape(element.id)}`;
    }
}
function getClassSelector(element) {
    if (element.tagName === 'BODY') {
        return;
    }
    const classList = element.classList;
    for (let i = 0; i < classList.length; i += 1) {
        const className = classList[i];
        if (isGeneratedValue(className)) {
            continue;
        }
        return `${CSS.escape(element.tagName)}.${CSS.escape(className)}`;
    }
}
function getTagNameSelector(element) {
    return CSS.escape(element.tagName);
}
function getStableAttributeSelector(element, actionNameAttribute) {
    if (actionNameAttribute) {
        const selector = getAttributeSelector(actionNameAttribute);
        if (selector) {
            return selector;
        }
    }
    for (const attributeName of STABLE_ATTRIBUTES) {
        const selector = getAttributeSelector(attributeName);
        if (selector) {
            return selector;
        }
    }
    function getAttributeSelector(attributeName) {
        if (element.hasAttribute(attributeName)) {
            return `${CSS.escape(element.tagName)}[${attributeName}="${CSS.escape(element.getAttribute(attributeName))}"]`;
        }
    }
}
function getPositionSelector(element) {
    let sibling = element.parentElement.firstElementChild;
    let elementIndex = 1;
    while (sibling && sibling !== element) {
        if (sibling.tagName === element.tagName) {
            elementIndex += 1;
        }
        sibling = sibling.nextElementSibling;
    }
    return `${CSS.escape(element.tagName)}:nth-of-type(${elementIndex})`;
}
function findSelector(element, selectorGetters, predicate, actionNameAttribute, childSelector) {
    for (const selectorGetter of selectorGetters) {
        const elementSelector = selectorGetter(element, actionNameAttribute);
        if (!elementSelector) {
            continue;
        }
        if (predicate(element, elementSelector, childSelector)) {
            return combineSelector(elementSelector, childSelector);
        }
    }
}
/**
 * Check whether the selector is unique among the whole document.
 */
function isSelectorUniqueGlobally(element, elementSelector, childSelector) {
    return element.ownerDocument.querySelectorAll(combineSelector(elementSelector, childSelector)).length === 1;
}
/**
 * Check whether the selector is unique among the element siblings. In other words, it returns true
 * if "ELEMENT_PARENT > CHILD_SELECTOR" returns a single element.
 *
 * @param {Element} currentElement - the element being considered while iterating over the target
 * element ancestors.
 *
 * @param {string} currentElementSelector - a selector that matches the current element. That
 * selector is not a composed selector (i.e. it might be a single tag name, class name...).
 *
 * @param {string|undefined} childSelector - child selector is a selector that targets a descendant
 * of the current element. When undefined, the current element is the target element.
 *
 * # Scope selector usage
 *
 * When composed together, the final selector will be joined with `>` operators to make sure we
 * target direct descendants at each level. In this function, we'll use `querySelector` to check if
 * a selector matches descendants of the current element. But by default, the query selector match
 * elements at any level. Example:
 *
 * ```html
 * <main>
 *   <div>
 *     <span></span>
 *   </div>
 *   <marquee>
 *     <div>
 *       <span></span>
 *     </div>
 *   </marquee>
 * </main>
 * ```
 *
 * `sibling.querySelector('DIV > SPAN')` will match both span elements, so we would consider the
 * selector to be not unique, even if it is unique when we'll compose it with the parent with a `>`
 * operator (`MAIN > DIV > SPAN`).
 *
 * To avoid this, we can use the `:scope` selector to make sure the selector starts from the current
 * sibling (i.e. `sibling.querySelector('DIV:scope > SPAN')` will only match the first span).
 *
 * The result will be less accurate on browsers that don't support :scope (i. e. IE): it will check
 * for any element matching the selector contained in the parent (in other words,
 * "ELEMENT_PARENT CHILD_SELECTOR" returns a single element), regardless of whether the selector is
 * a direct descendant of the element parent. This should not impact results too much: if it
 * inaccurately returns false, we'll just fall back to another strategy.
 *
 * [1]: https://developer.mozilla.org/fr/docs/Web/CSS/:scope
 *
 * # Performance considerations
 *
 * We compute selectors in performance-critical operations (ex: during a click), so we need to make
 * sure the function is as fast as possible. We observed that naively using `querySelectorAll` to
 * check if the selector matches more than 1 element is quite expensive, so we want to avoid it.
 *
 * Because we are iterating the DOM upward and we use that function at every level, we know the
 * child selector is already unique among the current element children, so we don't need to check
 * for the current element subtree.
 *
 * Instead, we can focus on the current element siblings. If we find a single element matching the
 * selector within a sibling, we know that it's not unique. This allows us to use `querySelector`
 * (or `matches`, when the current element is the target element) instead of `querySelectorAll`.
 */
function isSelectorUniqueAmongSiblings(currentElement, currentElementSelector, childSelector) {
    let isSiblingMatching;
    if (childSelector === undefined) {
        // If the child selector is undefined (meaning `currentElement` is the target element, not one
        // of its ancestor), we need to use `matches` to check if the sibling is matching the selector,
        // as `querySelector` only returns a descendant of the element.
        isSiblingMatching = (sibling) => sibling.matches(currentElementSelector);
    }
    else {
        const scopedSelector = supportScopeSelector()
            ? combineSelector(`${currentElementSelector}:scope`, childSelector)
            : combineSelector(currentElementSelector, childSelector);
        isSiblingMatching = (sibling) => sibling.querySelector(scopedSelector) !== null;
    }
    const parent = currentElement.parentElement;
    let sibling = parent.firstElementChild;
    while (sibling) {
        if (sibling !== currentElement && isSiblingMatching(sibling)) {
            return false;
        }
        sibling = sibling.nextElementSibling;
    }
    return true;
}
function combineSelector(parent, child) {
    return child ? `${parent}>${child}` : parent;
}
let supportScopeSelectorCache;
function supportScopeSelector() {
    if (supportScopeSelectorCache === undefined) {
        try {
            document.querySelector(':scope');
            supportScopeSelectorCache = true;
        }
        catch (_a) {
            supportScopeSelectorCache = false;
        }
    }
    return supportScopeSelectorCache;
}
/**
 * Polyfill-utility for the `isConnected` property not supported in Edge <=18
 */
function isConnected(element) {
    if ('isConnected' in
        // cast is to make sure `element` is not inferred as `never` after the check
        element) {
        return element.isConnected;
    }
    return element.ownerDocument.documentElement.contains(element);
}

;// ../rum-core/src/domain/view/viewMetrics/trackFirstInput.ts




/**
 * Track the first input occurring during the initial View to return:
 * - First Input Delay
 * - First Input Time
 * Callback is called at most one time.
 * Documentation: https://web.dev/fid/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/master/src/getFID.ts
 */
function trackFirstInput(configuration, firstHidden, callback) {
    const performanceFirstInputSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.FIRST_INPUT,
        buffered: true,
    }).subscribe((entries) => {
        const firstInputEntry = entries.find((entry) => entry.startTime < firstHidden.timeStamp);
        if (firstInputEntry) {
            const firstInputDelay = timeUtils_elapsed(firstInputEntry.startTime, firstInputEntry.processingStart);
            let firstInputTargetSelector;
            if (firstInputEntry.target && htmlDomUtils_isElementNode(firstInputEntry.target)) {
                firstInputTargetSelector = getSelectorFromElement(firstInputEntry.target, configuration.actionNameAttribute);
            }
            callback({
                // Ensure firstInputDelay to be positive, see
                // https://bugs.chromium.org/p/chromium/issues/detail?id=1185815
                delay: firstInputDelay >= 0 ? firstInputDelay : 0,
                time: firstInputEntry.startTime,
                targetSelector: firstInputTargetSelector,
            });
        }
    });
    return {
        stop: () => {
            performanceFirstInputSubscription.unsubscribe();
        },
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackNavigationTimings.ts


function trackNavigationTimings(configuration, callback, getNavigationEntryImpl = getNavigationEntry) {
    return waitAfterLoadEvent(configuration, () => {
        const entry = getNavigationEntryImpl();
        if (!isIncompleteNavigation(entry)) {
            callback(processNavigationEntry(entry));
        }
    });
}
function processNavigationEntry(entry) {
    return {
        domComplete: entry.domComplete,
        domContentLoaded: entry.domContentLoadedEventEnd,
        domInteractive: entry.domInteractive,
        loadEvent: entry.loadEventEnd,
        // In some cases the value reported is negative or is larger
        // than the current page time. Ignore these cases:
        // https://github.com/GoogleChrome/web-vitals/issues/137
        // https://github.com/GoogleChrome/web-vitals/issues/162
        firstByte: entry.responseStart >= 0 && entry.responseStart <= timeUtils_relativeNow() ? entry.responseStart : undefined,
    };
}
function isIncompleteNavigation(entry) {
    return entry.loadEventEnd <= 0;
}
function waitAfterLoadEvent(configuration, callback) {
    let timeoutId;
    const { stop: stopOnReadyState } = runOnReadyState(configuration, 'complete', () => {
        // Invoke the callback a bit after the actual load event, so the "loadEventEnd" timing is accurate
        timeoutId = timer_setTimeout(() => callback());
    });
    return {
        stop: () => {
            stopOnReadyState();
            timer_clearTimeout(timeoutId);
        },
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackLargestContentfulPaint.ts



// Discard LCP timings above a certain delay to avoid incorrect data
// It happens in some cases like sleep mode or some browser implementations
const LCP_MAXIMUM_DELAY = 10 * ONE_MINUTE;
/**
 * Track the largest contentful paint (LCP) occurring during the initial View.  This can yield
 * multiple values, only the most recent one should be used.
 * Documentation: https://web.dev/lcp/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/master/src/onLCP.ts
 */
function trackLargestContentfulPaint(configuration, firstHidden, eventTarget, callback) {
    // Ignore entries that come after the first user interaction. According to the documentation, the
    // browser should not send largest-contentful-paint entries after a user interact with the page,
    // but the web-vitals reference implementation uses this as a safeguard.
    let firstInteractionTimestamp = Infinity;
    const { stop: stopEventListener } = addEventListeners(configuration, eventTarget, ["pointerdown" /* DOM_EVENT.POINTER_DOWN */, "keydown" /* DOM_EVENT.KEY_DOWN */], (event) => {
        firstInteractionTimestamp = event.timeStamp;
    }, { capture: true, once: true });
    let biggestLcpSize = 0;
    const performanceLcpSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT,
        buffered: true,
    }).subscribe((entries) => {
        const lcpEntry = findLast(entries, (entry) => entry.entryType === RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT &&
            entry.startTime < firstInteractionTimestamp &&
            entry.startTime < firstHidden.timeStamp &&
            entry.startTime < LCP_MAXIMUM_DELAY &&
            // Ensure to get the LCP entry with the biggest size, see
            // https://bugs.chromium.org/p/chromium/issues/detail?id=1516655
            entry.size > biggestLcpSize);
        if (lcpEntry) {
            let lcpTargetSelector;
            if (lcpEntry.element) {
                lcpTargetSelector = getSelectorFromElement(lcpEntry.element, configuration.actionNameAttribute);
            }
            callback({
                value: lcpEntry.startTime,
                targetSelector: lcpTargetSelector,
            });
            biggestLcpSize = lcpEntry.size;
        }
    });
    return {
        stop: () => {
            stopEventListener();
            performanceLcpSubscription.unsubscribe();
        },
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackFirstHidden.ts

function trackFirstHidden(configuration, eventTarget = window) {
    let timeStamp;
    let stopListeners;
    if (document.visibilityState === 'hidden') {
        timeStamp = 0;
    }
    else {
        timeStamp = Infinity;
        ({ stop: stopListeners } = addEventListeners(configuration, eventTarget, ["pagehide" /* DOM_EVENT.PAGE_HIDE */, "visibilitychange" /* DOM_EVENT.VISIBILITY_CHANGE */], (event) => {
            if (event.type === "pagehide" /* DOM_EVENT.PAGE_HIDE */ || document.visibilityState === 'hidden') {
                timeStamp = event.timeStamp;
                stopListeners();
            }
        }, { capture: true }));
    }
    return {
        get timeStamp() {
            return timeStamp;
        },
        stop() {
            stopListeners === null || stopListeners === void 0 ? void 0 : stopListeners();
        },
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackInitialViewMetrics.ts





function trackInitialViewMetrics(configuration, setLoadEvent, scheduleViewUpdate) {
    const initialViewMetrics = {};
    const { stop: stopNavigationTracking } = trackNavigationTimings(configuration, (navigationTimings) => {
        setLoadEvent(navigationTimings.loadEvent);
        initialViewMetrics.navigationTimings = navigationTimings;
        scheduleViewUpdate();
    });
    const firstHidden = trackFirstHidden(configuration);
    const { stop: stopFCPTracking } = trackFirstContentfulPaint(configuration, firstHidden, (firstContentfulPaint) => {
        initialViewMetrics.firstContentfulPaint = firstContentfulPaint;
        scheduleViewUpdate();
    });
    const { stop: stopLCPTracking } = trackLargestContentfulPaint(configuration, firstHidden, window, (largestContentfulPaint) => {
        initialViewMetrics.largestContentfulPaint = largestContentfulPaint;
        scheduleViewUpdate();
    });
    const { stop: stopFIDTracking } = trackFirstInput(configuration, firstHidden, (firstInput) => {
        initialViewMetrics.firstInput = firstInput;
        scheduleViewUpdate();
    });
    function stop() {
        stopNavigationTracking();
        stopFCPTracking();
        stopLCPTracking();
        stopFIDTracking();
        firstHidden.stop();
    }
    return {
        stop,
        initialViewMetrics,
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackCumulativeLayoutShift.ts




/**
 * Track the cumulative layout shifts (CLS).
 * Layout shifts are grouped into session windows.
 * The minimum gap between session windows is 1 second.
 * The maximum duration of a session window is 5 second.
 * The session window layout shift value is the sum of layout shifts inside it.
 * The CLS value is the max of session windows values.
 *
 * This yields a new value whenever the CLS value is updated (a higher session window value is computed).
 *
 * See isLayoutShiftSupported to check for browser support.
 *
 * Documentation:
 * https://web.dev/cls/
 * https://web.dev/evolving-cls/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/master/src/getCLS.ts
 */
function trackCumulativeLayoutShift(configuration, viewStart, callback) {
    if (!isLayoutShiftSupported()) {
        return {
            stop: functionUtils_noop,
        };
    }
    let maxClsValue = 0;
    let maxClsTarget;
    let maxClsStartTime;
    // if no layout shift happen the value should be reported as 0
    callback({
        value: 0,
    });
    const window = slidingSessionWindow();
    const performanceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LAYOUT_SHIFT,
        buffered: true,
    }).subscribe((entries) => {
        for (const entry of entries) {
            if (entry.hadRecentInput || entry.startTime < viewStart) {
                continue;
            }
            const { cumulatedValue, isMaxValue } = window.update(entry);
            if (isMaxValue) {
                const target = getTargetFromSource(entry.sources);
                maxClsTarget = target ? new WeakRef(target) : undefined;
                maxClsStartTime = timeUtils_elapsed(viewStart, entry.startTime);
            }
            if (cumulatedValue > maxClsValue) {
                maxClsValue = cumulatedValue;
                const target = maxClsTarget === null || maxClsTarget === void 0 ? void 0 : maxClsTarget.deref();
                callback({
                    value: round(maxClsValue, 4),
                    targetSelector: target && getSelectorFromElement(target, configuration.actionNameAttribute),
                    time: maxClsStartTime,
                });
            }
        }
    });
    return {
        stop: () => {
            performanceSubscription.unsubscribe();
        },
    };
}
function getTargetFromSource(sources) {
    var _a;
    if (!sources) {
        return;
    }
    return (_a = sources.find((source) => !!source.node && htmlDomUtils_isElementNode(source.node))) === null || _a === void 0 ? void 0 : _a.node;
}
const MAX_WINDOW_DURATION = 5 * ONE_SECOND;
const MAX_UPDATE_GAP = ONE_SECOND;
function slidingSessionWindow() {
    let cumulatedValue = 0;
    let startTime;
    let endTime;
    let maxValue = 0;
    return {
        update: (entry) => {
            const shouldCreateNewWindow = startTime === undefined ||
                entry.startTime - endTime >= MAX_UPDATE_GAP ||
                entry.startTime - startTime >= MAX_WINDOW_DURATION;
            let isMaxValue;
            if (shouldCreateNewWindow) {
                startTime = endTime = entry.startTime;
                maxValue = cumulatedValue = entry.value;
                isMaxValue = true;
            }
            else {
                cumulatedValue += entry.value;
                endTime = entry.startTime;
                isMaxValue = entry.value > maxValue;
                if (isMaxValue) {
                    maxValue = entry.value;
                }
            }
            return {
                cumulatedValue,
                isMaxValue,
            };
        },
    };
}
/**
 * Check whether `layout-shift` is supported by the browser.
 */
function isLayoutShiftSupported() {
    return supportPerformanceTimingEvent(RumPerformanceEntryType.LAYOUT_SHIFT) && 'WeakRef' in window;
}

;// ../rum-core/src/domain/action/interactionSelectorCache.ts

// Maximum duration for click actions
const CLICK_ACTION_MAX_DURATION = 10 * ONE_SECOND;
const interactionSelectorCache = new Map();
function getInteractionSelector(relativeTimestamp) {
    const selector = interactionSelectorCache.get(relativeTimestamp);
    interactionSelectorCache.delete(relativeTimestamp);
    return selector;
}
function updateInteractionSelector(relativeTimestamp, selector) {
    interactionSelectorCache.set(relativeTimestamp, selector);
    interactionSelectorCache.forEach((_, relativeTimestamp) => {
        if (elapsed(relativeTimestamp, relativeNow()) > CLICK_ACTION_MAX_DURATION) {
            interactionSelectorCache.delete(relativeTimestamp);
        }
    });
}

;// ../rum-core/src/domain/view/viewMetrics/interactionCountPolyfill.ts
/**
 * performance.interactionCount polyfill
 *
 * The interactionCount is an integer which counts the total number of distinct user interactions,
 * for which there was a unique interactionId.
 *
 * The interactionCount polyfill is an estimate based on a convention specific to Chrome. Cf: https://github.com/GoogleChrome/web-vitals/pull/213
 * This is currently not an issue as the polyfill is only used for INP which is currently only supported on Chrome.
 * Hopefully when/if other browsers will support INP, they will also implement performance.interactionCount at the same time, so we won't need that polyfill.
 *
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/polyfills/interactionCountPolyfill.ts
 */

let observer;
let interactionCountEstimate = 0;
let minKnownInteractionId = Infinity;
let maxKnownInteractionId = 0;
function initInteractionCountPolyfill() {
    if ('interactionCount' in performance || observer) {
        return;
    }
    observer = new window.PerformanceObserver(monitor((entries) => {
        entries.getEntries().forEach((e) => {
            const entry = e;
            if (entry.interactionId) {
                minKnownInteractionId = Math.min(minKnownInteractionId, entry.interactionId);
                maxKnownInteractionId = Math.max(maxKnownInteractionId, entry.interactionId);
                interactionCountEstimate = (maxKnownInteractionId - minKnownInteractionId) / 7 + 1;
            }
        });
    }));
    observer.observe({ type: 'event', buffered: true, durationThreshold: 0 });
}
/**
 * Returns the `interactionCount` value using the native API (if available)
 * or the polyfill estimate in this module.
 */
const getInteractionCount = () => observer ? interactionCountEstimate : window.performance.interactionCount || 0;

;// ../rum-core/src/domain/view/viewMetrics/trackInteractionToNextPaint.ts






// Arbitrary value to prevent unnecessary memory usage on views with lots of interactions.
const MAX_INTERACTION_ENTRIES = 10;
// Arbitrary value to cap INP outliers
const MAX_INP_VALUE = (1 * ONE_MINUTE);
/**
 * Track the interaction to next paint (INP).
 * To avoid outliers, return the p98 worst interaction of the view.
 * Documentation: https://web.dev/inp/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/main/src/onINP.ts
 */
function trackInteractionToNextPaint(configuration, viewStart, viewLoadingType) {
    if (!isInteractionToNextPaintSupported()) {
        return {
            getInteractionToNextPaint: () => undefined,
            setViewEnd: functionUtils_noop,
            stop: functionUtils_noop,
        };
    }
    const { getViewInteractionCount, stopViewInteractionCount } = trackViewInteractionCount(viewLoadingType);
    let viewEnd = Infinity;
    const longestInteractions = trackLongestInteractions(getViewInteractionCount);
    let interactionToNextPaint = -1;
    let interactionToNextPaintTargetSelector;
    let interactionToNextPaintStartTime;
    function handleEntries(entries) {
        for (const entry of entries) {
            if (entry.interactionId &&
                // Check the entry start time is inside the view bounds because some view interactions can be reported after the view end (if long duration).
                entry.startTime >= viewStart &&
                entry.startTime <= viewEnd) {
                longestInteractions.process(entry);
            }
        }
        const newInteraction = longestInteractions.estimateP98Interaction();
        if (newInteraction && newInteraction.duration !== interactionToNextPaint) {
            interactionToNextPaint = newInteraction.duration;
            interactionToNextPaintStartTime = timeUtils_elapsed(viewStart, newInteraction.startTime);
            interactionToNextPaintTargetSelector = getInteractionSelector(newInteraction.startTime);
            if (!interactionToNextPaintTargetSelector && newInteraction.target && htmlDomUtils_isElementNode(newInteraction.target)) {
                interactionToNextPaintTargetSelector = getSelectorFromElement(newInteraction.target, configuration.actionNameAttribute);
            }
        }
    }
    const firstInputSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.FIRST_INPUT,
        buffered: true,
    }).subscribe(handleEntries);
    const eventSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.EVENT,
        // durationThreshold only impact PerformanceEventTiming entries used for INP computation which requires a threshold at 40 (default is 104ms)
        // cf: https://github.com/GoogleChrome/web-vitals/blob/3806160ffbc93c3c4abf210a167b81228172b31c/src/onINP.ts#L202-L210
        durationThreshold: 40,
        buffered: true,
    }).subscribe(handleEntries);
    return {
        getInteractionToNextPaint: () => {
            // If no INP duration where captured because of the performanceObserver 40ms threshold
            // but the view interaction count > 0 then report 0
            if (interactionToNextPaint >= 0) {
                return {
                    value: Math.min(interactionToNextPaint, MAX_INP_VALUE),
                    targetSelector: interactionToNextPaintTargetSelector,
                    time: interactionToNextPaintStartTime,
                };
            }
            else if (getViewInteractionCount()) {
                return {
                    value: 0,
                };
            }
        },
        setViewEnd: (viewEndTime) => {
            viewEnd = viewEndTime;
            stopViewInteractionCount();
        },
        stop: () => {
            eventSubscription.unsubscribe();
            firstInputSubscription.unsubscribe();
        },
    };
}
function trackLongestInteractions(getViewInteractionCount) {
    const longestInteractions = [];
    function sortAndTrimLongestInteractions() {
        longestInteractions.sort((a, b) => b.duration - a.duration).splice(MAX_INTERACTION_ENTRIES);
    }
    return {
        /**
         * Process the performance entry:
         * - if its duration is long enough, add the performance entry to the list of worst interactions
         * - if an entry with the same interaction id exists and its duration is lower than the new one, then replace it in the list of worst interactions
         */
        process(entry) {
            const interactionIndex = longestInteractions.findIndex((interaction) => entry.interactionId === interaction.interactionId);
            const minLongestInteraction = longestInteractions[longestInteractions.length - 1];
            if (interactionIndex !== -1) {
                if (entry.duration > longestInteractions[interactionIndex].duration) {
                    longestInteractions[interactionIndex] = entry;
                    sortAndTrimLongestInteractions();
                }
            }
            else if (longestInteractions.length < MAX_INTERACTION_ENTRIES ||
                entry.duration > minLongestInteraction.duration) {
                longestInteractions.push(entry);
                sortAndTrimLongestInteractions();
            }
        },
        /**
         * Compute the p98 longest interaction.
         * For better performance the computation is based on 10 longest interactions and the interaction count of the current view.
         */
        estimateP98Interaction() {
            const interactionIndex = Math.min(longestInteractions.length - 1, Math.floor(getViewInteractionCount() / 50));
            return longestInteractions[interactionIndex];
        },
    };
}
function trackViewInteractionCount(viewLoadingType) {
    initInteractionCountPolyfill();
    const previousInteractionCount = viewLoadingType === "initial_load" /* ViewLoadingType.INITIAL_LOAD */ ? 0 : getInteractionCount();
    let state = { stopped: false };
    function computeViewInteractionCount() {
        return getInteractionCount() - previousInteractionCount;
    }
    return {
        getViewInteractionCount: () => {
            if (state.stopped) {
                return state.interactionCount;
            }
            return computeViewInteractionCount();
        },
        stopViewInteractionCount: () => {
            state = { stopped: true, interactionCount: computeViewInteractionCount() };
        },
    };
}
function isInteractionToNextPaintSupported() {
    return (supportPerformanceTimingEvent(RumPerformanceEntryType.EVENT) &&
        window.PerformanceEventTiming &&
        'interactionId' in PerformanceEventTiming.prototype);
}

;// ../rum-core/src/domain/waitPageActivityEnd.ts


// Delay to wait for a page activity to validate the tracking process
const PAGE_ACTIVITY_VALIDATION_DELAY = 100;
// Delay to wait after a page activity to end the tracking process
const PAGE_ACTIVITY_END_DELAY = 100;
/**
 * Wait for the page activity end
 *
 * Detection lifecycle:
 * ```
 *                        Wait page activity end
 *              .-------------------'--------------------.
 *              v                                        v
 *     [Wait for a page activity ]          [Wait for a maximum duration]
 *     [timeout: VALIDATION_DELAY]          [  timeout: maxDuration     ]
 *          /                  \                           |
 *         v                    v                          |
 *  [No page activity]   [Page activity]                   |
 *         |                   |,----------------------.   |
 *         v                   v                       |   |
 *     (Discard)     [Wait for a page activity]        |   |
 *                   [   timeout: END_DELAY   ]        |   |
 *                       /                \            |   |
 *                      v                  v           |   |
 *             [No page activity]    [Page activity]   |   |
 *                      |                 |            |   |
 *                      |                 '------------'   |
 *                      '-----------. ,--------------------'
 *                                   v
 *                                 (End)
 * ```
 *
 * Note: by assuming that maxDuration is greater than VALIDATION_DELAY, we are sure that if the
 * process is still alive after maxDuration, it has been validated.
 */
function waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageActivityEndCallback, maxDuration) {
    const pageActivityObservable = createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration);
    return doWaitPageActivityEnd(pageActivityObservable, pageActivityEndCallback, maxDuration);
}
function doWaitPageActivityEnd(pageActivityObservable, pageActivityEndCallback, maxDuration) {
    let pageActivityEndTimeoutId;
    let hasCompleted = false;
    const validationTimeoutId = timer_setTimeout(monitor(() => complete({ hadActivity: false })), PAGE_ACTIVITY_VALIDATION_DELAY);
    const maxDurationTimeoutId = maxDuration !== undefined
        ? timer_setTimeout(monitor(() => complete({ hadActivity: true, end: timeUtils_timeStampNow() })), maxDuration)
        : undefined;
    const pageActivitySubscription = pageActivityObservable.subscribe(({ isBusy }) => {
        timer_clearTimeout(validationTimeoutId);
        timer_clearTimeout(pageActivityEndTimeoutId);
        const lastChangeTime = timeUtils_timeStampNow();
        if (!isBusy) {
            pageActivityEndTimeoutId = timer_setTimeout(monitor(() => complete({ hadActivity: true, end: lastChangeTime })), PAGE_ACTIVITY_END_DELAY);
        }
    });
    const stop = () => {
        hasCompleted = true;
        timer_clearTimeout(validationTimeoutId);
        timer_clearTimeout(pageActivityEndTimeoutId);
        timer_clearTimeout(maxDurationTimeoutId);
        pageActivitySubscription.unsubscribe();
    };
    function complete(event) {
        if (hasCompleted) {
            return;
        }
        stop();
        pageActivityEndCallback(event);
    }
    return { stop };
}
function createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
    return new observable_Observable((observable) => {
        const subscriptions = [];
        let firstRequestIndex;
        let pendingRequestsCount = 0;
        subscriptions.push(domMutationObservable.subscribe(notifyPageActivity), windowOpenObservable.subscribe(notifyPageActivity), createPerformanceObservable(configuration, { type: RumPerformanceEntryType.RESOURCE }).subscribe((entries) => {
            if (entries.some((entry) => !isExcludedUrl(configuration, entry.name))) {
                notifyPageActivity();
            }
        }), lifeCycle.subscribe(6 /* LifeCycleEventType.REQUEST_STARTED */, (startEvent) => {
            if (isExcludedUrl(configuration, startEvent.url)) {
                return;
            }
            if (firstRequestIndex === undefined) {
                firstRequestIndex = startEvent.requestIndex;
            }
            pendingRequestsCount += 1;
            notifyPageActivity();
        }), lifeCycle.subscribe(7 /* LifeCycleEventType.REQUEST_COMPLETED */, (request) => {
            if (isExcludedUrl(configuration, request.url) ||
                firstRequestIndex === undefined ||
                // If the request started before the tracking start, ignore it
                request.requestIndex < firstRequestIndex) {
                return;
            }
            pendingRequestsCount -= 1;
            notifyPageActivity();
        }));
        return () => {
            subscriptions.forEach((s) => s.unsubscribe());
        };
        function notifyPageActivity() {
            observable.notify({ isBusy: pendingRequestsCount > 0 });
        }
    });
}
function isExcludedUrl(configuration, requestUrl) {
    return matchList(configuration.excludedActivityUrls, requestUrl);
}

;// ../rum-core/src/domain/view/viewMetrics/trackLoadingTime.ts



function trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadType, viewStart, callback) {
    let isWaitingForLoadEvent = loadType === "initial_load" /* ViewLoadingType.INITIAL_LOAD */;
    let isWaitingForActivityLoadingTime = true;
    const loadingTimeCandidates = [];
    const firstHidden = trackFirstHidden(configuration);
    function invokeCallbackIfAllCandidatesAreReceived() {
        if (!isWaitingForActivityLoadingTime && !isWaitingForLoadEvent && loadingTimeCandidates.length > 0) {
            const loadingTime = Math.max(...loadingTimeCandidates);
            if (loadingTime < firstHidden.timeStamp) {
                callback(loadingTime);
            }
        }
    }
    const { stop } = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (event) => {
        if (isWaitingForActivityLoadingTime) {
            isWaitingForActivityLoadingTime = false;
            if (event.hadActivity) {
                loadingTimeCandidates.push(timeUtils_elapsed(viewStart.timeStamp, event.end));
            }
            invokeCallbackIfAllCandidatesAreReceived();
        }
    });
    return {
        stop: () => {
            stop();
            firstHidden.stop();
        },
        setLoadEvent: (loadEvent) => {
            if (isWaitingForLoadEvent) {
                isWaitingForLoadEvent = false;
                loadingTimeCandidates.push(loadEvent);
                invokeCallbackIfAllCandidatesAreReceived();
            }
        },
    };
}

;// ../rum-core/src/browser/scroll.ts
function getScrollX() {
    let scrollX;
    const visual = window.visualViewport;
    if (visual) {
        scrollX = visual.pageLeft - visual.offsetLeft;
    }
    else if (window.scrollX !== undefined) {
        scrollX = window.scrollX;
    }
    else {
        scrollX = window.pageXOffset || 0;
    }
    return Math.round(scrollX);
}
function getScrollY() {
    let scrollY;
    const visual = window.visualViewport;
    if (visual) {
        scrollY = visual.pageTop - visual.offsetTop;
    }
    else if (window.scrollY !== undefined) {
        scrollY = window.scrollY;
    }
    else {
        scrollY = window.pageYOffset || 0;
    }
    return Math.round(scrollY);
}

;// ../rum-core/src/browser/viewportObservable.ts

let viewportObservable;
function initViewportObservable(configuration) {
    if (!viewportObservable) {
        viewportObservable = createViewportObservable(configuration);
    }
    return viewportObservable;
}
function createViewportObservable(configuration) {
    return new observable_Observable((observable) => {
        const { throttled: updateDimension } = throttle(() => {
            observable.notify(getViewportDimension());
        }, 200);
        return addEventListener(configuration, window, "resize" /* DOM_EVENT.RESIZE */, updateDimension, { capture: true, passive: true })
            .stop;
    });
}
// excludes the width and height of any rendered classic scrollbar that is fixed to the visual viewport
function getViewportDimension() {
    const visual = window.visualViewport;
    if (visual) {
        return {
            width: Number(visual.width * visual.scale),
            height: Number(visual.height * visual.scale),
        };
    }
    return {
        width: Number(window.innerWidth || 0),
        height: Number(window.innerHeight || 0),
    };
}

;// ../rum-core/src/domain/view/viewMetrics/trackScrollMetrics.ts



/** Arbitrary scroll throttle duration */
const THROTTLE_SCROLL_DURATION = ONE_SECOND;
function trackScrollMetrics(configuration, viewStart, callback, scrollValues = createScrollValuesObservable(configuration)) {
    let maxScrollDepth = 0;
    let maxScrollHeight = 0;
    let maxScrollHeightTime = 0;
    const subscription = scrollValues.subscribe(({ scrollDepth, scrollTop, scrollHeight }) => {
        let shouldUpdate = false;
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            shouldUpdate = true;
        }
        if (scrollHeight > maxScrollHeight) {
            maxScrollHeight = scrollHeight;
            const now = timeUtils_relativeNow();
            maxScrollHeightTime = timeUtils_elapsed(viewStart.relative, now);
            shouldUpdate = true;
        }
        if (shouldUpdate) {
            callback({
                maxDepth: Math.min(maxScrollDepth, maxScrollHeight),
                maxDepthScrollTop: scrollTop,
                maxScrollHeight,
                maxScrollHeightTime,
            });
        }
    });
    return {
        stop: () => subscription.unsubscribe(),
    };
}
function computeScrollValues() {
    const scrollTop = getScrollY();
    const { height } = getViewportDimension();
    const scrollHeight = Math.round((document.scrollingElement || document.documentElement).scrollHeight);
    const scrollDepth = Math.round(height + scrollTop);
    return {
        scrollHeight,
        scrollDepth,
        scrollTop,
    };
}
function createScrollValuesObservable(configuration, throttleDuration = THROTTLE_SCROLL_DURATION) {
    return new observable_Observable((observable) => {
        function notify() {
            observable.notify(computeScrollValues());
        }
        if (window.ResizeObserver) {
            const throttledNotify = throttle(notify, throttleDuration, {
                leading: false,
                trailing: true,
            });
            const observerTarget = document.scrollingElement || document.documentElement;
            const resizeObserver = new ResizeObserver(monitor(throttledNotify.throttled));
            if (observerTarget) {
                resizeObserver.observe(observerTarget);
            }
            const eventListener = addEventListener(configuration, window, "scroll" /* DOM_EVENT.SCROLL */, throttledNotify.throttled, {
                passive: true,
            });
            return () => {
                throttledNotify.cancel();
                resizeObserver.disconnect();
                eventListener.stop();
            };
        }
    });
}

;// ../rum-core/src/domain/view/viewMetrics/trackCommonViewMetrics.ts




function trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, viewStart) {
    const commonViewMetrics = {};
    const { stop: stopLoadingTimeTracking, setLoadEvent } = trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, viewStart, (newLoadingTime) => {
        commonViewMetrics.loadingTime = newLoadingTime;
        scheduleViewUpdate();
    });
    const { stop: stopScrollMetricsTracking } = trackScrollMetrics(configuration, viewStart, (newScrollMetrics) => {
        commonViewMetrics.scroll = newScrollMetrics;
    });
    const { stop: stopCLSTracking } = trackCumulativeLayoutShift(configuration, viewStart.relative, (cumulativeLayoutShift) => {
        commonViewMetrics.cumulativeLayoutShift = cumulativeLayoutShift;
        scheduleViewUpdate();
    });
    const { stop: stopINPTracking, getInteractionToNextPaint, setViewEnd, } = trackInteractionToNextPaint(configuration, viewStart.relative, loadingType);
    return {
        stop: () => {
            stopLoadingTimeTracking();
            stopCLSTracking();
            stopScrollMetricsTracking();
        },
        stopINPTracking,
        setLoadEvent,
        setViewEnd,
        getCommonViewMetrics: () => {
            commonViewMetrics.interactionToNextPaint = getInteractionToNextPaint();
            return commonViewMetrics;
        },
    };
}

;// ../rum-core/src/domain/view/trackViews.ts




const THROTTLE_VIEW_UPDATE_PERIOD = 3000;
const SESSION_KEEP_ALIVE_INTERVAL = 5 * ONE_MINUTE;
// Some events or metrics can be captured after the end of the view. To avoid missing those;
// an arbitrary delay is added for stopping their tracking after the view ends.
//
// Ideally, we would not stop and keep tracking events or metrics until the end of the session.
// But this might have a small performance impact if there are many many views.
// So let's have a fairly short delay improving the situation in most cases and avoid impacting performances too much.
const KEEP_TRACKING_AFTER_VIEW_DELAY = 5 * ONE_MINUTE;
function trackViews(location, lifeCycle, domMutationObservable, windowOpenObservable, configuration, locationChangeObservable, areViewsTrackedAutomatically, initialViewOptions) {
    const activeViews = new Set();
    let currentView = startNewView("initial_load" /* ViewLoadingType.INITIAL_LOAD */, clocksOrigin(), initialViewOptions);
    startViewLifeCycle();
    let locationChangeSubscription;
    if (areViewsTrackedAutomatically) {
        locationChangeSubscription = renewViewOnLocationChange(locationChangeObservable);
    }
    function startNewView(loadingType, startClocks, viewOptions) {
        const newlyCreatedView = newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, location, loadingType, startClocks, viewOptions);
        activeViews.add(newlyCreatedView);
        newlyCreatedView.stopObservable.subscribe(() => {
            activeViews.delete(newlyCreatedView);
        });
        return newlyCreatedView;
    }
    function startViewLifeCycle() {
        lifeCycle.subscribe(9 /* LifeCycleEventType.SESSION_RENEWED */, () => {
            // Renew view on session renewal
            currentView = startNewView("route_change" /* ViewLoadingType.ROUTE_CHANGE */, undefined, {
                name: currentView.name,
                service: currentView.service,
                version: currentView.version,
                context: currentView.contextManager.getContext(),
            });
        });
        lifeCycle.subscribe(8 /* LifeCycleEventType.SESSION_EXPIRED */, () => {
            currentView.end({ sessionIsActive: false });
        });
        // End the current view on page unload
        lifeCycle.subscribe(10 /* LifeCycleEventType.PAGE_EXITED */, (pageExitEvent) => {
            if (pageExitEvent.reason === PageExitReason.UNLOADING) {
                currentView.end();
            }
        });
    }
    function renewViewOnLocationChange(locationChangeObservable) {
        return locationChangeObservable.subscribe(({ oldLocation, newLocation }) => {
            if (areDifferentLocation(oldLocation, newLocation)) {
                currentView.end();
                currentView = startNewView("route_change" /* ViewLoadingType.ROUTE_CHANGE */);
            }
        });
    }
    return {
        addTiming: (name, time = timeUtils_timeStampNow()) => {
            currentView.addTiming(name, time);
        },
        startView: (options, startClocks) => {
            currentView.end({ endClocks: startClocks });
            currentView = startNewView("route_change" /* ViewLoadingType.ROUTE_CHANGE */, startClocks, options);
        },
        setViewContext: (context) => {
            currentView.contextManager.setContext(context);
        },
        setViewContextProperty: (key, value) => {
            currentView.contextManager.setContextProperty(key, value);
        },
        setViewName: (name) => {
            currentView.setViewName(name);
        },
        stop: () => {
            if (locationChangeSubscription) {
                locationChangeSubscription.unsubscribe();
            }
            currentView.end();
            activeViews.forEach((view) => view.stop());
        },
    };
}
function newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, initialLocation, loadingType, startClocks = clocksNow(), viewOptions) {
    // Setup initial values
    const id = generateUUID();
    const stopObservable = new observable_Observable();
    const customTimings = {};
    let documentVersion = 0;
    let endClocks;
    const location = shallowClone(initialLocation);
    const contextManager = createContextManager();
    let sessionIsActive = true;
    let name;
    let service;
    let version;
    let context;
    if (viewOptions) {
        name = viewOptions.name;
        service = viewOptions.service || undefined;
        version = viewOptions.version || undefined;
        if (viewOptions.context) {
            context = viewOptions.context;
            // use ContextManager to update the context so we always sanitize it
            contextManager.setContext(context);
        }
    }
    const viewCreatedEvent = {
        id,
        name,
        startClocks,
        service,
        version,
        context,
    };
    lifeCycle.notify(1 /* LifeCycleEventType.BEFORE_VIEW_CREATED */, viewCreatedEvent);
    lifeCycle.notify(2 /* LifeCycleEventType.VIEW_CREATED */, viewCreatedEvent);
    // Update the view every time the measures are changing
    const { throttled: scheduleViewUpdate, cancel: cancelScheduleViewUpdate } = throttle(triggerViewUpdate, THROTTLE_VIEW_UPDATE_PERIOD, {
        leading: false,
    });
    const { setLoadEvent, setViewEnd, stop: stopCommonViewMetricsTracking, stopINPTracking, getCommonViewMetrics, } = trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, startClocks);
    const { stop: stopInitialViewMetricsTracking, initialViewMetrics } = loadingType === "initial_load" /* ViewLoadingType.INITIAL_LOAD */
        ? trackInitialViewMetrics(configuration, setLoadEvent, scheduleViewUpdate)
        : { stop: functionUtils_noop, initialViewMetrics: {} };
    const { stop: stopEventCountsTracking, eventCounts } = trackViewEventCounts(lifeCycle, id, scheduleViewUpdate);
    // Session keep alive
    const keepAliveIntervalId = timer_setInterval(triggerViewUpdate, SESSION_KEEP_ALIVE_INTERVAL);
    // Initial view update
    triggerViewUpdate();
    contextManager.changeObservable.subscribe(triggerViewUpdate);
    function triggerViewUpdate() {
        cancelScheduleViewUpdate();
        documentVersion += 1;
        const currentEnd = endClocks === undefined ? timeUtils_timeStampNow() : endClocks.timeStamp;
        lifeCycle.notify(3 /* LifeCycleEventType.VIEW_UPDATED */, {
            customTimings,
            documentVersion,
            id,
            name,
            service,
            version,
            context: contextManager.getContext(),
            loadingType,
            location,
            startClocks,
            commonViewMetrics: getCommonViewMetrics(),
            initialViewMetrics,
            duration: timeUtils_elapsed(startClocks.timeStamp, currentEnd),
            isActive: endClocks === undefined,
            sessionIsActive,
            eventCounts,
        });
    }
    return {
        get name() {
            return name;
        },
        service,
        version,
        contextManager,
        stopObservable,
        end(options = {}) {
            var _a, _b;
            if (endClocks) {
                // view already ended
                return;
            }
            endClocks = (_a = options.endClocks) !== null && _a !== void 0 ? _a : clocksNow();
            sessionIsActive = (_b = options.sessionIsActive) !== null && _b !== void 0 ? _b : true;
            lifeCycle.notify(4 /* LifeCycleEventType.VIEW_ENDED */, { endClocks });
            lifeCycle.notify(5 /* LifeCycleEventType.AFTER_VIEW_ENDED */, { endClocks });
            timer_clearInterval(keepAliveIntervalId);
            setViewEnd(endClocks.relative);
            stopCommonViewMetricsTracking();
            triggerViewUpdate();
            timer_setTimeout(() => {
                this.stop();
            }, KEEP_TRACKING_AFTER_VIEW_DELAY);
        },
        stop() {
            stopInitialViewMetricsTracking();
            stopEventCountsTracking();
            stopINPTracking();
            stopObservable.notify();
        },
        addTiming(name, time) {
            if (endClocks) {
                return;
            }
            const relativeTime = looksLikeRelativeTime(time) ? time : timeUtils_elapsed(startClocks.timeStamp, time);
            customTimings[sanitizeTiming(name)] = relativeTime;
            scheduleViewUpdate();
        },
        setViewName(updatedName) {
            name = updatedName;
            triggerViewUpdate();
        },
    };
}
/**
 * Timing name is used as facet path that must contain only letters, digits, or the characters - _ . @ $
 */
function sanitizeTiming(name) {
    const sanitized = name.replace(/[^a-zA-Z0-9-_.@$]/g, '_');
    if (sanitized !== name) {
        display.warn(`Invalid timing name: ${name}, sanitized to: ${sanitized}`);
    }
    return sanitized;
}
function areDifferentLocation(currentLocation, otherLocation) {
    return (currentLocation.pathname !== otherLocation.pathname ||
        (!isHashAnAnchor(otherLocation.hash) &&
            getPathFromHash(otherLocation.hash) !== getPathFromHash(currentLocation.hash)));
}
function isHashAnAnchor(hash) {
    const correspondingId = hash.substring(1);
    // check if the correspondingId is empty because on Firefox an empty string passed to getElementById() prints a consol warning
    return correspondingId !== '' && !!document.getElementById(correspondingId);
}
function getPathFromHash(hash) {
    const index = hash.indexOf('?');
    return index < 0 ? hash : hash.slice(0, index);
}

;// ../rum-core/src/domain/view/viewCollection.ts



function startViewCollection(lifeCycle, configuration, location, domMutationObservable, pageOpenObserable, locationChangeObservable, featureFlagContexts, pageStateHistory, recorderApi, initialViewOptions) {
    lifeCycle.subscribe(3 /* LifeCycleEventType.VIEW_UPDATED */, (view) => lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, processViewUpdate(view, configuration, featureFlagContexts, recorderApi, pageStateHistory)));
    return trackViews(location, lifeCycle, domMutationObservable, pageOpenObserable, configuration, locationChangeObservable, !configuration.trackViewsManually, initialViewOptions);
}
function processViewUpdate(view, configuration, featureFlagContexts, recorderApi, pageStateHistory) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const replayStats = recorderApi.getReplayStats(view.id);
    // const featureFlagContext = featureFlagContexts.findFeatureFlagEvaluations(view.startClocks.relative)
    const pageStates = pageStateHistory.findAll(view.startClocks.relative, view.duration);
    const viewEvent = {
        _dd: {
            document_version: view.documentVersion,
            replay_stats: replayStats,
            page_states: pageStates,
            configuration: {
                start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually,
            },
        },
        date: view.startClocks.timeStamp,
        type: "view" /* RumEventType.VIEW */,
        view: {
            action: {
                count: view.eventCounts.actionCount,
            },
            frustration: {
                count: view.eventCounts.frustrationCount,
            },
            cumulative_layout_shift: (_a = view.commonViewMetrics.cumulativeLayoutShift) === null || _a === void 0 ? void 0 : _a.value,
            cumulative_layout_shift_time: toServerDuration((_b = view.commonViewMetrics.cumulativeLayoutShift) === null || _b === void 0 ? void 0 : _b.time),
            cumulative_layout_shift_target_selector: (_c = view.commonViewMetrics.cumulativeLayoutShift) === null || _c === void 0 ? void 0 : _c.targetSelector,
            first_byte: toServerDuration((_d = view.initialViewMetrics.navigationTimings) === null || _d === void 0 ? void 0 : _d.firstByte),
            dom_complete: toServerDuration((_e = view.initialViewMetrics.navigationTimings) === null || _e === void 0 ? void 0 : _e.domComplete),
            dom_content_loaded: toServerDuration((_f = view.initialViewMetrics.navigationTimings) === null || _f === void 0 ? void 0 : _f.domContentLoaded),
            dom_interactive: toServerDuration((_g = view.initialViewMetrics.navigationTimings) === null || _g === void 0 ? void 0 : _g.domInteractive),
            error: {
                count: view.eventCounts.errorCount,
            },
            first_contentful_paint: toServerDuration(view.initialViewMetrics.firstContentfulPaint),
            first_input_delay: toServerDuration((_h = view.initialViewMetrics.firstInput) === null || _h === void 0 ? void 0 : _h.delay),
            first_input_time: toServerDuration((_j = view.initialViewMetrics.firstInput) === null || _j === void 0 ? void 0 : _j.time),
            first_input_target_selector: (_k = view.initialViewMetrics.firstInput) === null || _k === void 0 ? void 0 : _k.targetSelector,
            interaction_to_next_paint: toServerDuration((_l = view.commonViewMetrics.interactionToNextPaint) === null || _l === void 0 ? void 0 : _l.value),
            interaction_to_next_paint_time: toServerDuration((_m = view.commonViewMetrics.interactionToNextPaint) === null || _m === void 0 ? void 0 : _m.time),
            interaction_to_next_paint_target_selector: (_o = view.commonViewMetrics.interactionToNextPaint) === null || _o === void 0 ? void 0 : _o.targetSelector,
            is_active: view.isActive,
            name: view.name,
            largest_contentful_paint: toServerDuration((_p = view.initialViewMetrics.largestContentfulPaint) === null || _p === void 0 ? void 0 : _p.value),
            largest_contentful_paint_target_selector: (_q = view.initialViewMetrics.largestContentfulPaint) === null || _q === void 0 ? void 0 : _q.targetSelector,
            load_event: toServerDuration((_r = view.initialViewMetrics.navigationTimings) === null || _r === void 0 ? void 0 : _r.loadEvent),
            loading_time: discardNegativeDuration(toServerDuration(view.commonViewMetrics.loadingTime)),
            loading_type: view.loadingType,
            long_task: {
                count: view.eventCounts.longTaskCount,
            },
            resource: {
                count: view.eventCounts.resourceCount,
            },
            time_spent: toServerDuration(view.duration),
        },
        // feature_flags: featureFlagContext && !isEmptyObject(featureFlagContext) ? featureFlagContext : undefined,
        display: view.commonViewMetrics.scroll
            ? {
                scroll: {
                    max_depth: view.commonViewMetrics.scroll.maxDepth,
                    max_depth_scroll_top: view.commonViewMetrics.scroll.maxDepthScrollTop,
                    max_scroll_height: view.commonViewMetrics.scroll.maxScrollHeight,
                    max_scroll_height_time: toServerDuration(view.commonViewMetrics.scroll.maxScrollHeightTime),
                },
            }
            : undefined,
        session: {
            has_replay: replayStats ? true : undefined,
            is_active: view.sessionIsActive ? undefined : false,
        },
        privacy: {
            replay_level: configuration.defaultPrivacyLevel,
        },
    };
    if (!isEmptyObject(view.customTimings)) {
        viewEvent.view.custom_timings = mapValues(view.customTimings, toServerDuration);
    }
    return {
        rawRumEvent: viewEvent,
        startTime: view.startClocks.relative,
        domainContext: {
            location: view.location,
        },
    };
}

;// ../core/src/domain/session/sessionManager.ts







const VISIBILITY_CHECK_DELAY = ONE_MINUTE;
const SESSION_CONTEXT_TIMEOUT_DELAY = SESSION_TIME_OUT_DELAY;
let stopCallbacks = [];
function startSessionManager(configuration, productKey, computeSessionState, trackingConsentState) {
    const renewObservable = new observable_Observable();
    const expireObservable = new observable_Observable();
    // TODO - Improve configuration type and remove assertion
    const sessionStore = startSessionStore(configuration.sessionStoreStrategyType, configuration, productKey, computeSessionState);
    stopCallbacks.push(() => sessionStore.stop());
    const sessionContextHistory = createValueHistory({
        expireDelay: SESSION_CONTEXT_TIMEOUT_DELAY,
    });
    stopCallbacks.push(() => sessionContextHistory.stop());
    sessionStore.renewObservable.subscribe(() => {
        sessionContextHistory.add(buildSessionContext(), timeUtils_relativeNow());
        renewObservable.notify();
    });
    sessionStore.expireObservable.subscribe(() => {
        expireObservable.notify();
        sessionContextHistory.closeActive(timeUtils_relativeNow());
    });
    // We expand/renew session unconditionally as tracking consent is always granted when the session
    // manager is started.
    sessionStore.expandOrRenewSession();
    sessionContextHistory.add(buildSessionContext(), clocksOrigin().relative);
    trackingConsentState.observable.subscribe(() => {
        if (trackingConsentState.isGranted()) {
            sessionStore.expandOrRenewSession();
        }
        else {
            sessionStore.expire();
        }
    });
    trackActivity(configuration, () => {
        if (trackingConsentState.isGranted()) {
            sessionStore.expandOrRenewSession();
        }
    });
    trackVisibility(configuration, () => sessionStore.expandSession());
    trackResume(configuration, () => sessionStore.restartSession());
    function buildSessionContext() {
        return {
            id: sessionStore.getSession().id,
            trackingType: sessionStore.getSession()[productKey],
            isReplayForced: !!sessionStore.getSession().forcedReplay,
            anonymousId: sessionStore.getSession().anonymousId,
        };
    }
    return {
        findSession: (startTime, options) => sessionContextHistory.find(startTime, options),
        renewObservable,
        expireObservable,
        sessionStateUpdateObservable: sessionStore.sessionStateUpdateObservable,
        expire: sessionStore.expire,
        updateSessionState: sessionStore.updateSessionState,
    };
}
function stopSessionManager() {
    stopCallbacks.forEach((e) => e());
    stopCallbacks = [];
}
function trackActivity(configuration, expandOrRenewSession) {
    const { stop } = addEventListeners(configuration, window, ["click" /* DOM_EVENT.CLICK */, "touchstart" /* DOM_EVENT.TOUCH_START */, "keydown" /* DOM_EVENT.KEY_DOWN */, "scroll" /* DOM_EVENT.SCROLL */], expandOrRenewSession, { capture: true, passive: true });
    stopCallbacks.push(stop);
}
function trackVisibility(configuration, expandSession) {
    const expandSessionWhenVisible = () => {
        if (document.visibilityState === 'visible') {
            expandSession();
        }
    };
    const { stop } = addEventListener(configuration, document, "visibilitychange" /* DOM_EVENT.VISIBILITY_CHANGE */, expandSessionWhenVisible);
    stopCallbacks.push(stop);
    const visibilityCheckInterval = timer_setInterval(expandSessionWhenVisible, VISIBILITY_CHECK_DELAY);
    stopCallbacks.push(() => {
        timer_clearInterval(visibilityCheckInterval);
    });
}
function trackResume(configuration, cb) {
    const { stop } = addEventListener(configuration, window, "resume" /* DOM_EVENT.RESUME */, cb, { capture: true });
    stopCallbacks.push(stop);
}

;// ../rum-core/src/domain/rumSessionManager.ts

const RUM_SESSION_KEY = 'rum';
function startRumSessionManager(configuration, lifeCycle, trackingConsentState) {
    const sessionManager = startSessionManager(configuration, RUM_SESSION_KEY, (rawTrackingType) => computeSessionState(configuration, rawTrackingType), trackingConsentState);
    sessionManager.expireObservable.subscribe(() => {
        lifeCycle.notify(8 /* LifeCycleEventType.SESSION_EXPIRED */);
    });
    sessionManager.renewObservable.subscribe(() => {
        lifeCycle.notify(9 /* LifeCycleEventType.SESSION_RENEWED */);
    });
    sessionManager.sessionStateUpdateObservable.subscribe(({ previousState, newState }) => {
        if (!previousState.forcedReplay && newState.forcedReplay) {
            const sessionEntity = sessionManager.findSession();
            if (sessionEntity) {
                sessionEntity.isReplayForced = true;
            }
        }
    });
    return {
        findTrackedSession: (startTime) => {
            const session = sessionManager.findSession(startTime);
            if (!session || !isTypeTracked(session.trackingType)) {
                return;
            }
            return {
                id: session.id,
                sessionReplay: session.trackingType === "1" /* RumTrackingType.TRACKED_WITH_SESSION_REPLAY */
                    ? 1 /* SessionReplayState.SAMPLED */
                    : session.isReplayForced
                        ? 2 /* SessionReplayState.FORCED */
                        : 0 /* SessionReplayState.OFF */,
                anonymousId: session.anonymousId,
            };
        },
        expire: sessionManager.expire,
        expireObservable: sessionManager.expireObservable,
        setForcedReplay: () => sessionManager.updateSessionState({ forcedReplay: '1' }),
    };
}
/**
 * Start a tracked replay session stub
 */
function startRumSessionManagerStub() {
    const session = {
        id: '00000000-aaaa-0000-aaaa-000000000000',
        sessionReplay: bridgeSupports("records" /* BridgeCapability.RECORDS */) ? 1 /* SessionReplayState.SAMPLED */ : 0 /* SessionReplayState.OFF */,
    };
    return {
        findTrackedSession: () => session,
        expire: noop,
        expireObservable: new Observable(),
        setForcedReplay: noop,
    };
}
function computeSessionState(configuration, rawTrackingType) {
    let trackingType;
    if (hasValidRumSession(rawTrackingType)) {
        trackingType = rawTrackingType;
    }
    else if (!numberUtils_performDraw(configuration.sessionSampleRate)) {
        trackingType = "0" /* RumTrackingType.NOT_TRACKED */;
    }
    else if (!numberUtils_performDraw(configuration.sessionReplaySampleRate)) {
        trackingType = "2" /* RumTrackingType.TRACKED_WITHOUT_SESSION_REPLAY */;
    }
    else {
        trackingType = "1" /* RumTrackingType.TRACKED_WITH_SESSION_REPLAY */;
    }
    return {
        trackingType,
        isTracked: isTypeTracked(trackingType),
    };
}
function hasValidRumSession(trackingType) {
    return (trackingType === "0" /* RumTrackingType.NOT_TRACKED */ ||
        trackingType === "1" /* RumTrackingType.TRACKED_WITH_SESSION_REPLAY */ ||
        trackingType === "2" /* RumTrackingType.TRACKED_WITHOUT_SESSION_REPLAY */);
}
function isTypeTracked(rumSessionType) {
    return (rumSessionType === "2" /* RumTrackingType.TRACKED_WITHOUT_SESSION_REPLAY */ ||
        rumSessionType === "1" /* RumTrackingType.TRACKED_WITH_SESSION_REPLAY */);
}

;// ../core/src/transport/batch.ts





function createBatch({ encoder, request, flushController, messageBytesLimit, }) {
    let upsertBuffer = {};
    const flushSubscription = flushController.flushObservable.subscribe((event) => flush(event));
    function push(serializedMessage, estimatedMessageBytesCount, key) {
        flushController.notifyBeforeAddMessage(estimatedMessageBytesCount);
        if (key !== undefined) {
            upsertBuffer[key] = serializedMessage;
            flushController.notifyAfterAddMessage();
        }
        else {
            encoder.write(encoder.isEmpty ? serializedMessage : `\n${serializedMessage}`, (realMessageBytesCount) => {
                flushController.notifyAfterAddMessage(realMessageBytesCount - estimatedMessageBytesCount);
            });
        }
    }
    function hasMessageFor(key) {
        return key !== undefined && upsertBuffer[key] !== undefined;
    }
    function remove(key) {
        const removedMessage = upsertBuffer[key];
        delete upsertBuffer[key];
        const messageBytesCount = encoder.estimateEncodedBytesCount(removedMessage);
        flushController.notifyAfterRemoveMessage(messageBytesCount);
    }
    function addOrUpdate(message, key) {
        const serializedMessage = jsonStringify_jsonStringify(message);
        const estimatedMessageBytesCount = encoder.estimateEncodedBytesCount(serializedMessage);
        if (estimatedMessageBytesCount >= messageBytesLimit) {
            display.warn(`Discarded a message whose size was bigger than the maximum allowed size ${messageBytesLimit}KB. ${MORE_DETAILS} ${DOCS_TROUBLESHOOTING}/#technical-limitations`);
            return;
        }
        if (hasMessageFor(key)) {
            remove(key);
        }
        push(serializedMessage, estimatedMessageBytesCount, key);
    }
    function flush(event) {
        const upsertMessages = objectValues(upsertBuffer).join('\n');
        upsertBuffer = {};
        const isPageExit = isPageExitReason(event.reason);
        const send = isPageExit ? request.sendOnExit : request.send;
        if (isPageExit &&
            // Note: checking that the encoder is async is not strictly needed, but it's an optimization:
            // if the encoder is async we need to send two requests in some cases (one for encoded data
            // and the other for non-encoded data). But if it's not async, we don't have to worry about
            // it and always send a single request.
            encoder.isAsync) {
            const encoderResult = encoder.finishSync();
            // Send encoded messages
            if (encoderResult.outputBytesCount) {
                send(formatPayloadFromEncoder(encoderResult));
            }
            // Send messages that are not yet encoded at this point
            const pendingMessages = [encoderResult.pendingData, upsertMessages].filter(Boolean).join('\n');
            if (pendingMessages) {
                send({
                    data: pendingMessages,
                    bytesCount: computeBytesCount(pendingMessages),
                });
            }
        }
        else {
            if (upsertMessages) {
                encoder.write(encoder.isEmpty ? upsertMessages : `\n${upsertMessages}`);
            }
            encoder.finish((encoderResult) => {
                send(formatPayloadFromEncoder(encoderResult));
            });
        }
    }
    return {
        flushController,
        add: addOrUpdate,
        upsert: addOrUpdate,
        stop: flushSubscription.unsubscribe,
    };
}
function formatPayloadFromEncoder(encoderResult) {
    let data;
    if (typeof encoderResult.output === 'string') {
        data = encoderResult.output;
    }
    else {
        data = new Blob([encoderResult.output], {
            // This will set the 'Content-Type: text/plain' header. Reasoning:
            // * The intake rejects the request if there is no content type.
            // * The browser will issue CORS preflight requests if we set it to 'application/json', which
            // could induce higher intake load (and maybe has other impacts).
            // * Also it's not quite JSON, since we are concatenating multiple JSON objects separated by
            // new lines.
            type: 'text/plain',
        });
    }
    return {
        data,
        bytesCount: encoderResult.outputBytesCount,
        encoding: encoderResult.encoding,
    };
}

;// ../core/src/domain/telemetry/rawTelemetryEvent.types.ts
const rawTelemetryEvent_types_TelemetryType = {
    log: 'log',
    configuration: 'configuration',
    usage: 'usage',
};

;// ../core/src/domain/telemetry/telemetry.ts
















const ALLOWED_FRAME_URLS = [
    'https://www.datadoghq-browser-agent.com',
    'https://www.datad0g-browser-agent.com',
    'https://d3uc069fcn7uxw.cloudfront.net',
    'https://d20xtzwzcl0ceb.cloudfront.net',
    'http://localhost',
    '<anonymous>',
];
const TELEMETRY_EXCLUDED_SITES = [INTAKE_SITE_US1_FED];
// eslint-disable-next-line local-rules/disallow-side-effects
let preStartTelemetryBuffer = boundedBuffer_createBoundedBuffer();
let onRawTelemetryEventCollected = (event) => {
    preStartTelemetryBuffer.add(() => onRawTelemetryEventCollected(event));
};
function startTelemetry(telemetryService, configuration) {
    let contextProvider;
    const observable = new Observable();
    const alreadySentEvents = new Set();
    const telemetryEnabled = !TELEMETRY_EXCLUDED_SITES.includes(configuration.site) && performDraw(configuration.telemetrySampleRate);
    const telemetryEnabledPerType = {
        [TelemetryType.log]: telemetryEnabled,
        [TelemetryType.configuration]: telemetryEnabled && performDraw(configuration.telemetryConfigurationSampleRate),
        [TelemetryType.usage]: telemetryEnabled && performDraw(configuration.telemetryUsageSampleRate),
    };
    const runtimeEnvInfo = getRuntimeEnvInfo();
    onRawTelemetryEventCollected = (rawEvent) => {
        const stringifiedEvent = jsonStringify(rawEvent);
        if (telemetryEnabledPerType[rawEvent.type] &&
            alreadySentEvents.size < configuration.maxTelemetryEventsPerPage &&
            !alreadySentEvents.has(stringifiedEvent)) {
            const event = toTelemetryEvent(telemetryService, rawEvent, runtimeEnvInfo);
            observable.notify(event);
            sendToExtension('telemetry', event);
            alreadySentEvents.add(stringifiedEvent);
        }
    };
    startMonitorErrorCollection(addTelemetryError);
    function toTelemetryEvent(telemetryService, event, runtimeEnvInfo) {
        return combine({
            type: 'telemetry',
            date: timeStampNow(),
            service: telemetryService,
            version: "6.0.0",
            source: 'browser',
            _dd: {
                format_version: 2,
            },
            telemetry: combine(event, {
                runtime_env: runtimeEnvInfo,
                connectivity: getConnectivity(),
                sdk_setup: "cdn",
            }),
            experimental_features: Array.from(getExperimentalFeatures()),
        }, contextProvider !== undefined ? contextProvider() : {});
    }
    return {
        setContextProvider: (provider) => {
            contextProvider = provider;
        },
        observable,
        enabled: telemetryEnabled,
    };
}
function getRuntimeEnvInfo() {
    return {
        is_local_file: window.location.protocol === 'file:',
        is_worker: 'WorkerGlobalScope' in self,
    };
}
function startFakeTelemetry() {
    const events = [];
    onRawTelemetryEventCollected = (event) => {
        events.push(event);
    };
    return events;
}
// need to be called after telemetry context is provided and observers are registered
function drainPreStartTelemetry() {
    preStartTelemetryBuffer.drain();
}
function resetTelemetry() {
    preStartTelemetryBuffer = createBoundedBuffer();
    onRawTelemetryEventCollected = (event) => {
        preStartTelemetryBuffer.add(() => onRawTelemetryEventCollected(event));
    };
}
/**
 * Avoid mixing telemetry events from different data centers
 * but keep replicating staging events for reliability
 */
function isTelemetryReplicationAllowed(configuration) {
    return configuration.site === INTAKE_SITE_STAGING;
}
function addTelemetryDebug(message, context) {
    displayIfDebugEnabled(ConsoleApiName.debug, message, context);
    onRawTelemetryEventCollected(Object.assign({ type: TelemetryType.log, message, status: "debug" /* StatusType.debug */ }, context));
}
function addTelemetryError(e, context) {
    onRawTelemetryEventCollected(Object.assign(Object.assign({ type: rawTelemetryEvent_types_TelemetryType.log, status: "error" /* StatusType.error */ }, formatError(e)), context));
}
function addTelemetryConfiguration(configuration) {
    onRawTelemetryEventCollected({
        type: TelemetryType.configuration,
        configuration,
    });
}
function addTelemetryUsage(usage) {
    onRawTelemetryEventCollected({
        type: TelemetryType.usage,
        usage,
    });
}
function formatError(e) {
    if (isError(e)) {
        const stackTrace = computeStackTrace(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: toStackTraceString(scrubCustomerFrames(stackTrace)),
            },
            message: stackTrace.message,
        };
    }
    return {
        error: {
            stack: NO_ERROR_STACK_PRESENT_MESSAGE,
        },
        message: `${"Uncaught" /* NonErrorPrefix.UNCAUGHT */} ${jsonStringify_jsonStringify(e)}`,
    };
}
function scrubCustomerFrames(stackTrace) {
    stackTrace.stack = stackTrace.stack.filter((frame) => !frame.url || ALLOWED_FRAME_URLS.some((allowedFrameUrl) => frame.url.startsWith(allowedFrameUrl)));
    return stackTrace;
}

;// ../core/src/transport/sendWithRetryStrategy.ts





const MAX_ONGOING_BYTES_COUNT = 80 * ONE_KIBI_BYTE;
const MAX_ONGOING_REQUESTS = 32;
const MAX_QUEUE_BYTES_COUNT = 3 * ONE_MEBI_BYTE;
const MAX_BACKOFF_TIME = ONE_MINUTE;
const INITIAL_BACKOFF_TIME = ONE_SECOND;
function sendWithRetryStrategy(payload, state, sendStrategy, trackType, reportError) {
    if (state.transportStatus === 0 /* TransportStatus.UP */ &&
        state.queuedPayloads.size() === 0 &&
        state.bandwidthMonitor.canHandle(payload)) {
        send(payload, state, sendStrategy, {
            onSuccess: () => retryQueuedPayloads(0 /* RetryReason.AFTER_SUCCESS */, state, sendStrategy, trackType, reportError),
            onFailure: () => {
                state.queuedPayloads.enqueue(payload);
                scheduleRetry(state, sendStrategy, trackType, reportError);
            },
        });
    }
    else {
        state.queuedPayloads.enqueue(payload);
    }
}
function scheduleRetry(state, sendStrategy, trackType, reportError) {
    if (state.transportStatus !== 2 /* TransportStatus.DOWN */) {
        return;
    }
    timer_setTimeout(() => {
        const payload = state.queuedPayloads.first();
        send(payload, state, sendStrategy, {
            onSuccess: () => {
                state.queuedPayloads.dequeue();
                state.currentBackoffTime = INITIAL_BACKOFF_TIME;
                retryQueuedPayloads(1 /* RetryReason.AFTER_RESUME */, state, sendStrategy, trackType, reportError);
            },
            onFailure: () => {
                state.currentBackoffTime = Math.min(MAX_BACKOFF_TIME, state.currentBackoffTime * 2);
                scheduleRetry(state, sendStrategy, trackType, reportError);
            },
        });
    }, state.currentBackoffTime);
}
function send(payload, state, sendStrategy, { onSuccess, onFailure }) {
    state.bandwidthMonitor.add(payload);
    sendStrategy(payload, (response) => {
        state.bandwidthMonitor.remove(payload);
        if (!shouldRetryRequest(response)) {
            state.transportStatus = 0 /* TransportStatus.UP */;
            onSuccess();
        }
        else {
            // do not consider transport down if another ongoing request could succeed
            state.transportStatus =
                state.bandwidthMonitor.ongoingRequestCount > 0 ? 1 /* TransportStatus.FAILURE_DETECTED */ : 2 /* TransportStatus.DOWN */;
            payload.retry = {
                count: payload.retry ? payload.retry.count + 1 : 1,
                lastFailureStatus: response.status,
            };
            onFailure();
        }
    });
}
function retryQueuedPayloads(reason, state, sendStrategy, trackType, reportError) {
    if (reason === 0 /* RetryReason.AFTER_SUCCESS */ && state.queuedPayloads.isFull() && !state.queueFullReported) {
        reportError({
            message: `Reached max ${trackType} events size queued for upload: ${MAX_QUEUE_BYTES_COUNT / ONE_MEBI_BYTE}MiB`,
            source: ErrorSource.AGENT,
            startClocks: clocksNow(),
        });
        state.queueFullReported = true;
    }
    const previousQueue = state.queuedPayloads;
    state.queuedPayloads = newPayloadQueue();
    while (previousQueue.size() > 0) {
        sendWithRetryStrategy(previousQueue.dequeue(), state, sendStrategy, trackType, reportError);
    }
}
function shouldRetryRequest(response) {
    return (response.type !== 'opaque' &&
        ((response.status === 0 && !navigator.onLine) ||
            response.status === 408 ||
            response.status === 429 ||
            isServerError(response.status)));
}
function newRetryState() {
    return {
        transportStatus: 0 /* TransportStatus.UP */,
        currentBackoffTime: INITIAL_BACKOFF_TIME,
        bandwidthMonitor: newBandwidthMonitor(),
        queuedPayloads: newPayloadQueue(),
        queueFullReported: false,
    };
}
function newPayloadQueue() {
    const queue = [];
    return {
        bytesCount: 0,
        enqueue(payload) {
            if (this.isFull()) {
                return;
            }
            queue.push(payload);
            this.bytesCount += payload.bytesCount;
        },
        first() {
            return queue[0];
        },
        dequeue() {
            const payload = queue.shift();
            if (payload) {
                this.bytesCount -= payload.bytesCount;
            }
            return payload;
        },
        size() {
            return queue.length;
        },
        isFull() {
            return this.bytesCount >= MAX_QUEUE_BYTES_COUNT;
        },
    };
}
function newBandwidthMonitor() {
    return {
        ongoingRequestCount: 0,
        ongoingByteCount: 0,
        canHandle(payload) {
            return (this.ongoingRequestCount === 0 ||
                (this.ongoingByteCount + payload.bytesCount <= MAX_ONGOING_BYTES_COUNT &&
                    this.ongoingRequestCount < MAX_ONGOING_REQUESTS));
        },
        add(payload) {
            this.ongoingRequestCount += 1;
            this.ongoingByteCount += payload.bytesCount;
        },
        remove(payload) {
            this.ongoingRequestCount -= 1;
            this.ongoingByteCount -= payload.bytesCount;
        },
    };
}

;// ../core/src/transport/httpRequest.ts




function createHttpRequest(endpointBuilder, bytesLimit, reportError) {
    const retryState = newRetryState();
    const sendStrategyForRetry = (payload, onResponse) => fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload, onResponse);
    return {
        send: (payload) => {
            sendWithRetryStrategy(payload, retryState, sendStrategyForRetry, endpointBuilder.trackType, reportError);
        },
        /**
         * Since fetch keepalive behaves like regular fetch on Firefox,
         * keep using sendBeaconStrategy on exit
         */
        sendOnExit: (payload) => {
            sendBeaconStrategy(endpointBuilder, bytesLimit, payload);
        },
    };
}
function sendBeaconStrategy(endpointBuilder, bytesLimit, payload) {
    const canUseBeacon = !!navigator.sendBeacon && payload.bytesCount < bytesLimit;
    if (canUseBeacon) {
        try {
            const beaconUrl = endpointBuilder.build('beacon', payload);
            const isQueued = navigator.sendBeacon(beaconUrl, payload.data);
            if (isQueued) {
                return;
            }
        }
        catch (e) {
            reportBeaconError(e);
        }
    }
    const xhrUrl = endpointBuilder.build('xhr', payload);
    sendXHR(xhrUrl, payload.data);
}
let hasReportedBeaconError = false;
function reportBeaconError(e) {
    if (!hasReportedBeaconError) {
        hasReportedBeaconError = true;
        addTelemetryError(e);
    }
}
function fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload, onResponse) {
    const canUseKeepAlive = isKeepAliveSupported() && payload.bytesCount < bytesLimit;
    if (canUseKeepAlive) {
        const fetchUrl = endpointBuilder.build('fetch', payload);
        fetch(fetchUrl, { method: 'POST', body: payload.data, keepalive: true, mode: 'cors' }).then(monitor((response) => onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: response.status, type: response.type })), monitor(() => {
            const xhrUrl = endpointBuilder.build('xhr', payload);
            // failed to queue the request
            sendXHR(xhrUrl, payload.data, onResponse);
        }));
    }
    else {
        const xhrUrl = endpointBuilder.build('xhr', payload);
        sendXHR(xhrUrl, payload.data, onResponse);
    }
}
function isKeepAliveSupported() {
    // Request can throw, cf https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#errors
    try {
        return window.Request && 'keepalive' in new Request('http://a');
    }
    catch (_a) {
        return false;
    }
}
function sendXHR(url, data, onResponse) {
    const request = new XMLHttpRequest();
    request.open('POST', url, true);
    if (data instanceof Blob) {
        // When using a Blob instance, IE does not use its 'type' to define the 'Content-Type' header
        // automatically, so the intake request ends up being rejected with an HTTP status 415
        // Defining the header manually fixes this issue.
        request.setRequestHeader('Content-Type', data.type);
    }
    addEventListener(
    // allow untrusted event to acount for synthetic event dispatched by third party xhr wrapper
    { allowUntrustedEvents: true }, request, 'loadend', () => {
        onResponse === null || onResponse === void 0 ? void 0 : onResponse({ status: request.status });
    }, {
        // prevent multiple onResponse callbacks
        // if the xhr instance is reused by a third party
        once: true,
    });
    request.send(data);
}

;// ../core/src/transport/flushController.ts


/**
 * Returns a "flush controller", responsible of notifying when flushing a pool of pending data needs
 * to happen. The implementation is designed to support both synchronous and asynchronous usages,
 * but relies on invariants described in each method documentation to keep a coherent state.
 */
function createFlushController({ messagesLimit, bytesLimit, durationLimit, pageExitObservable, sessionExpireObservable, }) {
    const pageExitSubscription = pageExitObservable.subscribe((event) => flush(event.reason));
    const sessionExpireSubscription = sessionExpireObservable.subscribe(() => flush('session_expire'));
    const flushObservable = new observable_Observable(() => () => {
        pageExitSubscription.unsubscribe();
        sessionExpireSubscription.unsubscribe();
    });
    let currentBytesCount = 0;
    let currentMessagesCount = 0;
    function flush(flushReason) {
        if (currentMessagesCount === 0) {
            return;
        }
        const messagesCount = currentMessagesCount;
        const bytesCount = currentBytesCount;
        currentMessagesCount = 0;
        currentBytesCount = 0;
        cancelDurationLimitTimeout();
        flushObservable.notify({
            reason: flushReason,
            messagesCount,
            bytesCount,
        });
    }
    let durationLimitTimeoutId;
    function scheduleDurationLimitTimeout() {
        if (durationLimitTimeoutId === undefined) {
            durationLimitTimeoutId = timer_setTimeout(() => {
                flush('duration_limit');
            }, durationLimit);
        }
    }
    function cancelDurationLimitTimeout() {
        timer_clearTimeout(durationLimitTimeoutId);
        durationLimitTimeoutId = undefined;
    }
    return {
        flushObservable,
        get messagesCount() {
            return currentMessagesCount;
        },
        /**
         * Notifies that a message will be added to a pool of pending messages waiting to be flushed.
         *
         * This function needs to be called synchronously, right before adding the message, so no flush
         * event can happen after `notifyBeforeAddMessage` and before adding the message.
         *
         * @param estimatedMessageBytesCount: an estimation of the message bytes count once it is
         * actually added.
         */
        notifyBeforeAddMessage(estimatedMessageBytesCount) {
            if (currentBytesCount + estimatedMessageBytesCount >= bytesLimit) {
                flush('bytes_limit');
            }
            // Consider the message to be added now rather than in `notifyAfterAddMessage`, because if no
            // message was added yet and `notifyAfterAddMessage` is called asynchronously, we still want
            // to notify when a flush is needed (for example on page exit).
            currentMessagesCount += 1;
            currentBytesCount += estimatedMessageBytesCount;
            scheduleDurationLimitTimeout();
        },
        /**
         * Notifies that a message *was* added to a pool of pending messages waiting to be flushed.
         *
         * This function can be called asynchronously after the message was added, but in this case it
         * should not be called if a flush event occurred in between.
         *
         * @param messageBytesCountDiff: the difference between the estimated message bytes count and
         * its actual bytes count once added to the pool.
         */
        notifyAfterAddMessage(messageBytesCountDiff = 0) {
            currentBytesCount += messageBytesCountDiff;
            if (currentMessagesCount >= messagesLimit) {
                flush('messages_limit');
            }
            else if (currentBytesCount >= bytesLimit) {
                flush('bytes_limit');
            }
        },
        /**
         * Notifies that a message was removed from a pool of pending messages waiting to be flushed.
         *
         * This function needs to be called synchronously, right after removing the message, so no flush
         * event can happen after removing the message and before `notifyAfterRemoveMessage`.
         *
         * @param messageBytesCount: the message bytes count that was added to the pool. Should
         * correspond to the sum of bytes counts passed to `notifyBeforeAddMessage` and
         * `notifyAfterAddMessage`.
         */
        notifyAfterRemoveMessage(messageBytesCount) {
            currentBytesCount -= messageBytesCount;
            currentMessagesCount -= 1;
            if (currentMessagesCount === 0) {
                cancelDurationLimitTimeout();
            }
        },
    };
}

;// ../core/src/transport/startBatchWithReplica.ts



function startBatchWithReplica(configuration, primary, replica, reportError, pageExitObservable, sessionExpireObservable, batchFactoryImp = createBatch) {
    const primaryBatch = createBatchFromConfig(configuration, primary);
    const replicaBatch = replica && createBatchFromConfig(configuration, replica);
    function createBatchFromConfig(configuration, { endpoint, encoder }) {
        return batchFactoryImp({
            encoder,
            request: createHttpRequest(endpoint, configuration.batchBytesLimit, reportError),
            flushController: createFlushController({
                messagesLimit: configuration.batchMessagesLimit,
                bytesLimit: configuration.batchBytesLimit,
                durationLimit: configuration.flushTimeout,
                pageExitObservable,
                sessionExpireObservable,
            }),
            messageBytesLimit: configuration.messageBytesLimit,
        });
    }
    return {
        flushObservable: primaryBatch.flushController.flushObservable,
        add(message, replicated = true) {
            primaryBatch.add(message);
            if (replicaBatch && replicated) {
                replicaBatch.add(replica.transformMessage ? replica.transformMessage(message) : message);
            }
        },
        upsert: (message, key) => {
            primaryBatch.upsert(message, key);
            if (replicaBatch) {
                replicaBatch.upsert(replica.transformMessage ? replica.transformMessage(message) : message, key);
            }
        },
        stop: () => {
            primaryBatch.stop();
            if (replicaBatch) {
                replicaBatch.stop();
            }
        },
    };
}

;// ../rum-core/src/transport/startRumBatch.ts

function startRumBatch(configuration, lifeCycle, telemetryEventObservable, reportError, pageExitObservable, sessionExpireObservable, createEncoder) {
    const replica = configuration.replica;
    const batch = startBatchWithReplica(configuration, {
        endpoint: configuration.rumEndpointBuilder,
        encoder: createEncoder(2 /* DeflateEncoderStreamId.RUM */),
    }, replica && {
        endpoint: replica.rumEndpointBuilder,
        transformMessage: (message) => mergeInto_combine(message, { application: { id: replica.applicationId } }),
        encoder: createEncoder(3 /* DeflateEncoderStreamId.RUM_REPLICA */),
    }, reportError, pageExitObservable, sessionExpireObservable);
    lifeCycle.subscribe(12 /* LifeCycleEventType.RUM_EVENT_COLLECTED */, (serverRumEvent) => {
        if (serverRumEvent.type === "view" /* RumEventType.VIEW */) {
            batch.upsert(serverRumEvent, serverRumEvent.view.id);
        }
        else {
            batch.add(serverRumEvent);
        }
    });
    // telemetryEventObservable.subscribe((event) => batch.add(event, isTelemetryReplicationAllowed(configuration)))
    return batch;
}

;// ../rum-core/src/domain/contexts/urlContexts.ts

/**
 * We want to attach to an event:
 * - the url corresponding to its start
 * - the referrer corresponding to the previous view url (or document referrer for initial view)
 */
const URL_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startUrlContexts(lifeCycle, locationChangeObservable, location) {
    const urlContextHistory = createValueHistory({ expireDelay: URL_CONTEXT_TIME_OUT_DELAY });
    let previousViewUrl;
    lifeCycle.subscribe(1 /* LifeCycleEventType.BEFORE_VIEW_CREATED */, ({ startClocks }) => {
        const viewUrl = location.href;
        urlContextHistory.add(buildUrlContext({
            url: viewUrl,
            referrer: !previousViewUrl ? document.referrer : previousViewUrl,
        }), startClocks.relative);
        previousViewUrl = viewUrl;
    });
    lifeCycle.subscribe(5 /* LifeCycleEventType.AFTER_VIEW_ENDED */, ({ endClocks }) => {
        urlContextHistory.closeActive(endClocks.relative);
    });
    const locationChangeSubscription = locationChangeObservable.subscribe(({ newLocation }) => {
        const current = urlContextHistory.find();
        if (current) {
            const changeTime = timeUtils_relativeNow();
            urlContextHistory.closeActive(changeTime);
            urlContextHistory.add(buildUrlContext({
                url: newLocation.href,
                referrer: current.referrer,
            }), changeTime);
        }
    });
    function buildUrlContext({ url, referrer }) {
        return {
            url,
            referrer,
        };
    }
    return {
        findUrl: (startTime) => urlContextHistory.find(startTime),
        stop: () => {
            locationChangeSubscription.unsubscribe();
            urlContextHistory.stop();
        },
    };
}

;// ../rum-core/src/browser/locationChangeObservable.ts

function createLocationChangeObservable(configuration, location) {
    let currentLocation = shallowClone(location);
    return new observable_Observable((observable) => {
        const { stop: stopHistoryTracking } = trackHistory(configuration, onLocationChange);
        const { stop: stopHashTracking } = trackHash(configuration, onLocationChange);
        function onLocationChange() {
            if (currentLocation.href === location.href) {
                return;
            }
            const newLocation = shallowClone(location);
            observable.notify({
                newLocation,
                oldLocation: currentLocation,
            });
            currentLocation = newLocation;
        }
        return () => {
            stopHistoryTracking();
            stopHashTracking();
        };
    });
}
function trackHistory(configuration, onHistoryChange) {
    const { stop: stopInstrumentingPushState } = instrumentMethod(getHistoryInstrumentationTarget('pushState'), 'pushState', ({ onPostCall }) => {
        onPostCall(onHistoryChange);
    });
    const { stop: stopInstrumentingReplaceState } = instrumentMethod(getHistoryInstrumentationTarget('replaceState'), 'replaceState', ({ onPostCall }) => {
        onPostCall(onHistoryChange);
    });
    const { stop: removeListener } = addEventListener(configuration, window, "popstate" /* DOM_EVENT.POP_STATE */, onHistoryChange);
    return {
        stop: () => {
            stopInstrumentingPushState();
            stopInstrumentingReplaceState();
            removeListener();
        },
    };
}
function trackHash(configuration, onHashChange) {
    return addEventListener(configuration, window, "hashchange" /* DOM_EVENT.HASH_CHANGE */, onHashChange);
}
function getHistoryInstrumentationTarget(methodName) {
    // Ideally we should always instument the method on the prototype, however some frameworks (e.g [Next.js](https://github.com/vercel/next.js/blob/d3f5532065f3e3bb84fb54bd2dfd1a16d0f03a21/packages/next/src/client/components/app-router.tsx#L429))
    // are wrapping the instance method. In that case we should also wrap the instance method.
    return Object.prototype.hasOwnProperty.call(history, methodName) ? history : History.prototype;
}

;// ../rum-core/src/domain/startCustomerDataTelemetry.ts

const MEASURES_PERIOD_DURATION = 10 * ONE_SECOND;
let currentPeriodMeasures;
let currentBatchMeasures;
let batchHasRumEvent;
function startCustomerDataTelemetry(configuration, telemetry, lifeCycle, customerDataTrackerManager, batchFlushObservable) {
    // const customerDataTelemetryEnabled = telemetry.enabled && performDraw(configuration.customerDataTelemetrySampleRate)
    // if (!customerDataTelemetryEnabled) {
    //   return
    // }
    initCurrentPeriodMeasures();
    initCurrentBatchMeasures();
    // We measure the data of every view updates even if there could only be one per batch due to the upsert
    // It means that contexts bytes count sums can be higher than it really is
    lifeCycle.subscribe(12 /* LifeCycleEventType.RUM_EVENT_COLLECTED */, (event) => {
        batchHasRumEvent = true;
        updateMeasure(currentBatchMeasures.globalContextBytes, customerDataTrackerManager.getOrCreateTracker(2 /* CustomerDataType.GlobalContext */).getBytesCount());
        updateMeasure(currentBatchMeasures.userContextBytes, customerDataTrackerManager.getOrCreateTracker(1 /* CustomerDataType.User */).getBytesCount());
        updateMeasure(currentBatchMeasures.featureFlagBytes, ["view" /* RumEventType.VIEW */, "error" /* RumEventType.ERROR */].includes(event.type)
            ? customerDataTrackerManager.getOrCreateTracker(0 /* CustomerDataType.FeatureFlag */).getBytesCount()
            : 0);
    });
    batchFlushObservable.subscribe(({ bytesCount, messagesCount }) => {
        // Don't measure batch that only contains telemetry events to avoid batch sending loop
        // It could happen because after each batch we are adding a customer data measures telemetry event to the next one
        if (!batchHasRumEvent) {
            return;
        }
        currentPeriodMeasures.batchCount += 1;
        updateMeasure(currentPeriodMeasures.batchBytesCount, bytesCount);
        updateMeasure(currentPeriodMeasures.batchMessagesCount, messagesCount);
        mergeMeasure(currentPeriodMeasures.globalContextBytes, currentBatchMeasures.globalContextBytes);
        mergeMeasure(currentPeriodMeasures.userContextBytes, currentBatchMeasures.userContextBytes);
        mergeMeasure(currentPeriodMeasures.featureFlagBytes, currentBatchMeasures.featureFlagBytes);
        initCurrentBatchMeasures();
    });
    timer_setInterval(sendCurrentPeriodMeasures, MEASURES_PERIOD_DURATION);
}
function sendCurrentPeriodMeasures() {
    if (currentPeriodMeasures.batchCount === 0) {
        return;
    }
    // addTelemetryDebug('Customer data measures', currentPeriodMeasures)
    initCurrentPeriodMeasures();
}
function createMeasure() {
    return { min: Infinity, max: 0, sum: 0 };
}
function updateMeasure(measure, value) {
    measure.sum += value;
    measure.min = Math.min(measure.min, value);
    measure.max = Math.max(measure.max, value);
}
function mergeMeasure(target, source) {
    target.sum += source.sum;
    target.min = Math.min(target.min, source.min);
    target.max = Math.max(target.max, source.max);
}
function initCurrentPeriodMeasures() {
    currentPeriodMeasures = {
        batchCount: 0,
        batchBytesCount: createMeasure(),
        batchMessagesCount: createMeasure(),
        globalContextBytes: createMeasure(),
        userContextBytes: createMeasure(),
        featureFlagBytes: createMeasure(),
    };
}
function initCurrentBatchMeasures() {
    batchHasRumEvent = false;
    currentBatchMeasures = {
        globalContextBytes: createMeasure(),
        userContextBytes: createMeasure(),
        featureFlagBytes: createMeasure(),
    };
}

;// ../rum-core/src/domain/contexts/pageStateHistory.ts

// Arbitrary value to cap number of element for memory consumption in the browser
const MAX_PAGE_STATE_ENTRIES = 4000;
// Arbitrary value to cap number of element for backend & to save bandwidth
const MAX_PAGE_STATE_ENTRIES_SELECTABLE = 500;
const PAGE_STATE_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
function startPageStateHistory(configuration, maxPageStateEntriesSelectable = MAX_PAGE_STATE_ENTRIES_SELECTABLE) {
    const pageStateEntryHistory = createValueHistory({
        expireDelay: PAGE_STATE_CONTEXT_TIME_OUT_DELAY,
        maxEntries: MAX_PAGE_STATE_ENTRIES,
    });
    let currentPageState;
    addPageState(getPageState(), timeUtils_relativeNow());
    const { stop: stopEventListeners } = addEventListeners(configuration, window, [
        "pageshow" /* DOM_EVENT.PAGE_SHOW */,
        "focus" /* DOM_EVENT.FOCUS */,
        "blur" /* DOM_EVENT.BLUR */,
        "visibilitychange" /* DOM_EVENT.VISIBILITY_CHANGE */,
        "resume" /* DOM_EVENT.RESUME */,
        "freeze" /* DOM_EVENT.FREEZE */,
        "pagehide" /* DOM_EVENT.PAGE_HIDE */,
    ], (event) => {
        addPageState(computePageState(event), event.timeStamp);
    }, { capture: true });
    function addPageState(nextPageState, startTime = timeUtils_relativeNow()) {
        if (nextPageState === currentPageState) {
            return;
        }
        currentPageState = nextPageState;
        pageStateEntryHistory.closeActive(startTime);
        pageStateEntryHistory.add({ state: currentPageState, startTime }, startTime);
    }
    const pageStateHistory = {
        findAll: (eventStartTime, duration) => {
            const pageStateEntries = pageStateEntryHistory.findAll(eventStartTime, duration);
            if (pageStateEntries.length === 0) {
                return;
            }
            const pageStateServerEntries = [];
            // limit the number of entries to return
            const limit = Math.max(0, pageStateEntries.length - maxPageStateEntriesSelectable);
            // loop page state entries backward to return the selected ones in desc order
            for (let index = pageStateEntries.length - 1; index >= limit; index--) {
                const pageState = pageStateEntries[index];
                // compute the start time relative to the event start time (ex: to be relative to the view start time)
                const relativeStartTime = timeUtils_elapsed(eventStartTime, pageState.startTime);
                pageStateServerEntries.push({
                    state: pageState.state,
                    start: toServerDuration(relativeStartTime),
                });
            }
            return pageStateServerEntries;
        },
        wasInPageStateAt: (state, startTime) => pageStateHistory.wasInPageStateDuringPeriod(state, startTime, 0),
        wasInPageStateDuringPeriod: (state, startTime, duration) => pageStateEntryHistory.findAll(startTime, duration).some((pageState) => pageState.state === state),
        addPageState,
        stop: () => {
            stopEventListeners();
            pageStateEntryHistory.stop();
        },
    };
    return pageStateHistory;
}
function computePageState(event) {
    if (event.type === "freeze" /* DOM_EVENT.FREEZE */) {
        return "frozen" /* PageState.FROZEN */;
    }
    else if (event.type === "pagehide" /* DOM_EVENT.PAGE_HIDE */) {
        return event.persisted ? "frozen" /* PageState.FROZEN */ : "terminated" /* PageState.TERMINATED */;
    }
    return getPageState();
}
function getPageState() {
    if (document.visibilityState === 'hidden') {
        return "hidden" /* PageState.HIDDEN */;
    }
    if (document.hasFocus()) {
        return "active" /* PageState.ACTIVE */;
    }
    return "passive" /* PageState.PASSIVE */;
}

;// ../rum-core/src/domain/contexts/displayContext.ts

function startDisplayContext(configuration) {
    let viewport;
    let animationFrameId;
    // if (isExperimentalFeatureEnabled(ExperimentalFeature.DELAY_VIEWPORT_COLLECTION)) {
    //   // Use requestAnimationFrame to delay the calculation of viewport dimensions until after SDK initialization, preventing long tasks.
    //   animationFrameId = requestAnimationFrame(() => {
    //     viewport = getViewportDimension()
    //   })
    // } else {
    viewport = getViewportDimension();
    // }
    const unsubscribeViewport = initViewportObservable(configuration).subscribe((viewportDimension) => {
        viewport = viewportDimension;
    }).unsubscribe;
    return {
        get: () => (viewport ? { viewport } : undefined),
        stop: () => {
            unsubscribeViewport();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        },
    };
}

;// ../rum-core/src/browser/cookieObservable.ts

function createCookieObservable(configuration, cookieName) {
    const detectCookieChangeStrategy = window.cookieStore
        ? listenToCookieStoreChange(configuration)
        : watchCookieFallback;
    return new observable_Observable((observable) => detectCookieChangeStrategy(cookieName, (event) => observable.notify(event)));
}
function listenToCookieStoreChange(configuration) {
    return (cookieName, callback) => {
        const listener = addEventListener(configuration, window.cookieStore, "change" /* DOM_EVENT.CHANGE */, (event) => {
            // Based on our experimentation, we're assuming that entries for the same cookie cannot be in both the 'changed' and 'deleted' arrays.
            // However, due to ambiguity in the specification, we asked for clarification: https://github.com/WICG/cookie-store/issues/226
            const changeEvent = event.changed.find((event) => event.name === cookieName) ||
                event.deleted.find((event) => event.name === cookieName);
            if (changeEvent) {
                callback(changeEvent.value);
            }
        });
        return listener.stop;
    };
}
const WATCH_COOKIE_INTERVAL_DELAY = ONE_SECOND;
function watchCookieFallback(cookieName, callback) {
    const previousCookieValue = findCommaSeparatedValue(document.cookie, cookieName);
    const watchCookieIntervalId = timer_setInterval(() => {
        const cookieValue = findCommaSeparatedValue(document.cookie, cookieName);
        if (cookieValue !== previousCookieValue) {
            callback(cookieValue);
        }
    }, WATCH_COOKIE_INTERVAL_DELAY);
    return () => {
        timer_clearInterval(watchCookieIntervalId);
    };
}

;// ../rum-core/src/domain/contexts/ciVisibilityContext.ts


const CI_VISIBILITY_TEST_ID_COOKIE_NAME = 'datadog-ci-visibility-test-execution-id';
function startCiVisibilityContext(configuration, cookieObservable = createCookieObservable(configuration, CI_VISIBILITY_TEST_ID_COOKIE_NAME)) {
    var _a;
    let testExecutionId = getInitCookie(CI_VISIBILITY_TEST_ID_COOKIE_NAME) || ((_a = window.Cypress) === null || _a === void 0 ? void 0 : _a.env('traceId'));
    const cookieObservableSubscription = cookieObservable.subscribe((value) => {
        testExecutionId = value;
    });
    return {
        get: () => {
            if (typeof testExecutionId === 'string') {
                return {
                    test_execution_id: testExecutionId,
                };
            }
        },
        stop: () => cookieObservableSubscription.unsubscribe(),
    };
}

;// ../rum-core/src/domain/longAnimationFrame/longAnimationFrameCollection.ts


function startLongAnimationFrameCollection(lifeCycle, configuration) {
    const performanceResourceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LONG_ANIMATION_FRAME,
        buffered: true,
    }).subscribe((entries) => {
        for (const entry of entries) {
            const startClocks = relativeToClocks(entry.startTime);
            const rawRumEvent = {
                date: startClocks.timeStamp,
                long_task: {
                    id: generateUUID(),
                    entry_type: "long-animation-frame" /* RumLongTaskEntryType.LONG_ANIMATION_FRAME */,
                    duration: toServerDuration(entry.duration),
                    blocking_duration: toServerDuration(entry.blockingDuration),
                    first_ui_event_timestamp: toServerDuration(entry.firstUIEventTimestamp),
                    render_start: toServerDuration(entry.renderStart),
                    style_and_layout_start: toServerDuration(entry.styleAndLayoutStart),
                    start_time: toServerDuration(entry.startTime),
                    scripts: entry.scripts.map((script) => ({
                        duration: toServerDuration(script.duration),
                        pause_duration: toServerDuration(script.pauseDuration),
                        forced_style_and_layout_duration: toServerDuration(script.forcedStyleAndLayoutDuration),
                        start_time: toServerDuration(script.startTime),
                        execution_start: toServerDuration(script.executionStart),
                        source_url: script.sourceURL,
                        source_function_name: script.sourceFunctionName,
                        source_char_position: script.sourceCharPosition,
                        invoker: script.invoker,
                        invoker_type: script.invokerType,
                        window_attribution: script.windowAttribution,
                    })),
                },
                type: "long_task" /* RumEventType.LONG_TASK */,
                _dd: {
                    discarded: false,
                },
            };
            lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, {
                rawRumEvent,
                startTime: startClocks.relative,
                domainContext: { performanceEntry: entry },
            });
        }
    });
    return {
        stop: () => performanceResourceSubscription.unsubscribe(),
    };
}

;// ../rum-core/src/domain/longTask/longTaskCollection.ts


function startLongTaskCollection(lifeCycle, configuration) {
    const performanceLongTaskSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LONG_TASK,
        buffered: true,
    }).subscribe((entries) => {
        for (const entry of entries) {
            if (entry.entryType !== RumPerformanceEntryType.LONG_TASK) {
                break;
            }
            if (!configuration.trackLongTasks) {
                break;
            }
            const startClocks = relativeToClocks(entry.startTime);
            const rawRumEvent = {
                date: startClocks.timeStamp,
                long_task: {
                    id: generateUUID(),
                    entry_type: "long-task" /* RumLongTaskEntryType.LONG_TASK */,
                    duration: toServerDuration(entry.duration),
                },
                type: "long_task" /* RumEventType.LONG_TASK */,
                _dd: {
                    discarded: false,
                },
            };
            lifeCycle.notify(11 /* LifeCycleEventType.RAW_RUM_EVENT_COLLECTED */, {
                rawRumEvent,
                startTime: startClocks.relative,
                domainContext: { performanceEntry: entry },
            });
        }
    });
    return {
        stop() {
            performanceLongTaskSubscription.unsubscribe();
        },
    };
}

;// ../rum-core/src/boot/startRum.ts














// import { startRumEventBridge } from '../transport/startRumEventBridge'


// import { startFeatureFlagContexts } from '../domain/contexts/featureFlagContext'








function startRum(configuration, recorderApi, customerDataTrackerManager, getCommonContext, initialViewOptions, createEncoder, 
// `startRum` and its subcomponents assume tracking consent is granted initially and starts
// collecting logs unconditionally. As such, `startRum` should be called with a
// `trackingConsentState` set to "granted".
trackingConsentState, customVitalsState) {
    var _a;
    const cleanupTasks = [];
    const lifeCycle = new LifeCycle();
    // lifeCycle.subscribe(LifeCycleEventType.RUM_EVENT_COLLECTED, (event) => sendToExtension('rum', event))
    // const telemetry = startRumTelemetry(configuration)
    // telemetry.setContextProvider(() => ({
    //   application: {
    //     id: configuration.applicationId,
    //   },
    //   session: {
    //     id: session.findTrackedSession()?.id,
    //   },
    //   view: {
    //     id: viewHistory.findView()?.id,
    //   },
    //   action: {
    //     id: actionContexts.findActionId(),
    //   },
    // }))
    const reportError = (error) => {
        lifeCycle.notify(13 /* LifeCycleEventType.RAW_ERROR_COLLECTED */, { error });
        // addTelemetryDebug('Error reported to customer', { 'error.message': error.message })
    };
    // const featureFlagContexts = startFeatureFlagContexts(
    //   lifeCycle,
    //   customerDataTrackerManager.getOrCreateTracker(CustomerDataType.FeatureFlag)
    // )
    const pageExitObservable = createPageExitObservable(configuration);
    const pageExitSubscription = pageExitObservable.subscribe((event) => {
        lifeCycle.notify(10 /* LifeCycleEventType.PAGE_EXITED */, event);
    });
    cleanupTasks.push(() => pageExitSubscription.unsubscribe());
    const session = /* !canUseEventBridge() */ 
    /* ? */ startRumSessionManager(configuration, lifeCycle, trackingConsentState);
    // : startRumSessionManagerStub()
    // if (!canUseEventBridge()) {
    const batch = startRumBatch(configuration, lifeCycle, 'telemetry.observable', reportError, pageExitObservable, session.expireObservable, createEncoder);
    cleanupTasks.push(() => batch.stop());
    startCustomerDataTelemetry(configuration, 'telemetry', lifeCycle, customerDataTrackerManager, batch.flushObservable);
    // } else {
    //   startRumEventBridge(lifeCycle)
    // }
    const domMutationObservable = createDOMMutationObservable();
    const locationChangeObservable = createLocationChangeObservable(configuration, location);
    const pageStateHistory = startPageStateHistory(configuration);
    const { observable: windowOpenObservable, stop: stopWindowOpen } = createWindowOpenObservable();
    cleanupTasks.push(stopWindowOpen);
    const { viewHistory, urlContexts, actionContexts, addAction, stop: stopRumEventCollection, } = startRumEventCollection(lifeCycle, configuration, location, session, pageStateHistory, locationChangeObservable, domMutationObservable, windowOpenObservable, getCommonContext, reportError);
    cleanupTasks.push(stopRumEventCollection);
    // drainPreStartTelemetry()
    const { addTiming, startView, setViewName, setViewContext, setViewContextProperty, stop: stopViewCollection, } = startViewCollection(lifeCycle, configuration, location, domMutationObservable, windowOpenObservable, locationChangeObservable, 'featureFlagContexts', pageStateHistory, recorderApi, initialViewOptions);
    cleanupTasks.push(stopViewCollection);
    const { stop: stopResourceCollection } = startResourceCollection(lifeCycle, configuration, pageStateHistory);
    cleanupTasks.push(stopResourceCollection);
    if (configuration.trackLongTasks) {
        if ((_a = PerformanceObserver.supportedEntryTypes) === null || _a === void 0 ? void 0 : _a.includes(RumPerformanceEntryType.LONG_ANIMATION_FRAME)) {
            const { stop: stopLongAnimationFrameCollection } = startLongAnimationFrameCollection(lifeCycle, configuration);
            cleanupTasks.push(stopLongAnimationFrameCollection);
        }
        else {
            startLongTaskCollection(lifeCycle, configuration);
        }
    }
    const { addError } = startErrorCollection(lifeCycle, configuration, pageStateHistory, 'featureFlagContexts');
    startRequestCollection(lifeCycle, configuration, session);
    const vitalCollection = startVitalCollection(lifeCycle, pageStateHistory, customVitalsState);
    const internalContext = startInternalContext(configuration.applicationId, session, viewHistory, actionContexts, urlContexts);
    return {
        addAction,
        addError,
        addTiming,
        // addFeatureFlagEvaluation: featureFlagContexts.addFeatureFlagEvaluation,
        startView,
        setViewContext,
        setViewContextProperty,
        setViewName,
        lifeCycle,
        viewHistory,
        session,
        stopSession: () => session.expire(),
        getInternalContext: internalContext.get,
        startDurationVital: vitalCollection.startDurationVital,
        stopDurationVital: vitalCollection.stopDurationVital,
        addDurationVital: vitalCollection.addDurationVital,
        stop: () => {
            cleanupTasks.forEach((task) => task());
        },
    };
}
// function startRumTelemetry(configuration: RumConfiguration) {
//   const telemetry = startTelemetry(TelemetryService.RUM, configuration)
//   if (canUseEventBridge()) {
//     const bridge = getEventBridge<'internal_telemetry', TelemetryEvent>()!
//     telemetry.observable.subscribe((event) => bridge.send('internal_telemetry', event))
//   }
//   return telemetry
// }
function startRumEventCollection(lifeCycle, configuration, location, sessionManager, pageStateHistory, locationChangeObservable, domMutationObservable, windowOpenObservable, getCommonContext, reportError) {
    const viewHistory = startViewHistory(lifeCycle);
    const urlContexts = startUrlContexts(lifeCycle, locationChangeObservable, location);
    const actionCollection = startActionCollection(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageStateHistory);
    const displayContext = startDisplayContext(configuration);
    const ciVisibilityContext = startCiVisibilityContext(configuration);
    startRumAssembly(configuration, lifeCycle, sessionManager, viewHistory, urlContexts, actionCollection.actionContexts, displayContext, ciVisibilityContext, getCommonContext, reportError);
    return {
        viewHistory,
        pageStateHistory,
        urlContexts,
        addAction: actionCollection.addAction,
        actionContexts: actionCollection.actionContexts,
        stop: () => {
            actionCollection.stop();
            ciVisibilityContext.stop();
            displayContext.stop();
            urlContexts.stop();
            viewHistory.stop();
            pageStateHistory.stop();
        },
    };
}

;// ../rum-core/src/domain/getSessionReplayUrl.ts

function getSessionReplayUrl(configuration, { session, viewContext, errorType, }) {
    const sessionId = session ? session.id : 'no-session-id';
    const parameters = [];
    if (errorType !== undefined) {
        parameters.push(`error-type=${errorType}`);
    }
    if (viewContext) {
        parameters.push(`seed=${viewContext.id}`);
        parameters.push(`from=${viewContext.startClocks.timeStamp}`);
    }
    const origin = getDatadogSiteUrl(configuration);
    const path = `/rum/replay/sessions/${sessionId}`;
    return `${origin}${path}?${parameters.join('&')}`;
}
function getDatadogSiteUrl(rumConfiguration) {
    const site = rumConfiguration.site;
    const subdomain = rumConfiguration.subdomain || getSiteDefaultSubdomain(rumConfiguration);
    return `https://${subdomain ? `${subdomain}.` : ''}${site}`;
}
function getSiteDefaultSubdomain(configuration) {
    switch (configuration.site) {
        case INTAKE_SITE_US1:
        case INTAKE_SITE_EU1:
            return 'app';
        case intakeSites_INTAKE_SITE_STAGING:
            return 'dd';
        default:
            return undefined;
    }
}

;// ../rum-core/src/index.ts














;// ./src/domain/getSessionReplayLink.ts

function getSessionReplayLink(configuration) {
    return getSessionReplayUrl(configuration, { errorType: 'slim-package' });
}

;// ./src/boot/stubRecorderApi.ts


function makeRecorderApiStub() {
    let getSessionReplayLinkStrategy = functionUtils_noop;
    return {
        start: functionUtils_noop,
        stop: functionUtils_noop,
        onRumStart(_lifeCycle, configuration) {
            getSessionReplayLinkStrategy = () => getSessionReplayLink(configuration);
        },
        isRecording: () => false,
        getReplayStats: () => undefined,
        getSessionReplayLink: () => getSessionReplayLinkStrategy(),
    };
}

;// ./src/entries/main.ts
// Keep the following in sync with packages/rum/src/entries/main.ts




const datadogRum = makeRumPublicApi(startRum, makeRecorderApiStub());
defineGlobal(getGlobalObject(), 'DD_RUM', datadogRum);

var __webpack_exports__DefaultPrivacyLevel = __webpack_exports__.W;
var __webpack_exports__datadogRum = __webpack_exports__.L;
export { __webpack_exports__DefaultPrivacyLevel as DefaultPrivacyLevel, __webpack_exports__datadogRum as datadogRum };
