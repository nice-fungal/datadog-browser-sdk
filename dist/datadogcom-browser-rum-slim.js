var __webpack_require__ = {
    d: function(exports, definition) {
        for (var key in definition) __webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key) && Object.defineProperty(exports, key, {
            enumerable: !0,
            get: definition[key]
        });
    },
    o: function(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
}, __webpack_exports__ = {};

__webpack_require__.d(__webpack_exports__, {
    W: function() {
        return DefaultPrivacyLevel;
    },
    L: function() {
        return datadogRum;
    }
});

const display_ConsoleApiName = {
    log: "log",
    debug: "debug",
    info: "info",
    warn: "warn",
    error: "error"
}, globalConsole = console, originalConsoleMethods = {};

Object.keys(display_ConsoleApiName).forEach((name => {
    originalConsoleMethods[name] = globalConsole[name];
}));

const PREFIX = "Datadog Browser SDK:", display = {
    debug: originalConsoleMethods.debug.bind(globalConsole, PREFIX),
    log: originalConsoleMethods.log.bind(globalConsole, PREFIX),
    info: originalConsoleMethods.info.bind(globalConsole, PREFIX),
    warn: originalConsoleMethods.warn.bind(globalConsole, PREFIX),
    error: originalConsoleMethods.error.bind(globalConsole, PREFIX)
}, DOCS_ORIGIN = "https://docs.datadoghq.com", DOCS_TROUBLESHOOTING = `${DOCS_ORIGIN}/real_user_monitoring/browser/troubleshooting`, MORE_DETAILS = "More details:";

function catchUserErrors(fn, errorMsg) {
    return (...args) => {
        try {
            return fn(...args);
        } catch (err) {
            display.error(errorMsg, err);
        }
    };
}

let onMonitorErrorCollected, debugMode = !1;

function monitor_startMonitorErrorCollection(newOnMonitorErrorCollected) {
    onMonitorErrorCollected = newOnMonitorErrorCollected;
}

function setDebugMode(newDebugMode) {
    debugMode = newDebugMode;
}

function resetMonitor() {
    onMonitorErrorCollected = void 0, debugMode = !1;
}

function monitored(_, __, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
        return (onMonitorErrorCollected ? monitor(originalMethod) : originalMethod).apply(this, args);
    };
}

function monitor(fn) {
    return function() {
        return callMonitored(fn, this, arguments);
    };
}

function callMonitored(fn, context, args) {
    try {
        return fn.apply(context, args);
    } catch (e) {
        if (monitor_displayIfDebugEnabled(e), onMonitorErrorCollected) try {
            onMonitorErrorCollected(e);
        } catch (e) {
            monitor_displayIfDebugEnabled(e);
        }
    }
}

function monitor_displayIfDebugEnabled(...args) {
    debugMode && display.error("[MONITOR]", ...args);
}

function polyfills_includes(candidate, search) {
    return -1 !== candidate.indexOf(search);
}

function polyfills_arrayFrom(arrayLike) {
    if (Array.from) return Array.from(arrayLike);
    const array = [];
    if (arrayLike instanceof Set) arrayLike.forEach((item => array.push(item))); else for (let i = 0; i < arrayLike.length; i++) array.push(arrayLike[i]);
    return array;
}

function find(array, predicate) {
    for (let i = 0; i < array.length; i += 1) {
        const item = array[i];
        if (predicate(item, i)) return item;
    }
}

function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
        const item = array[i];
        if (predicate(item, i, array)) return item;
    }
}

function forEach(list, callback) {
    Array.prototype.forEach.call(list, callback);
}

function objectValues(object) {
    return Object.keys(object).map((key => object[key]));
}

function objectEntries(object) {
    return Object.keys(object).map((key => [ key, object[key] ]));
}

function startsWith(candidate, search) {
    return candidate.slice(0, search.length) === search;
}

function endsWith(candidate, search) {
    return candidate.slice(-search.length) === search;
}

function polyfills_assign(target, ...toAssign) {
    return toAssign.forEach((source => {
        for (const key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
    })), target;
}

function makePublicApi(stub) {
    const publicApi = polyfills_assign({
        version: "5.35.0",
        onReady(callback) {
            callback();
        }
    }, stub);
    return Object.defineProperty(publicApi, "_setDebug", {
        get: () => setDebugMode,
        enumerable: !1
    }), publicApi;
}

function defineGlobal(global, name, api) {
    const existingGlobalVariable = global[name];
    existingGlobalVariable && !existingGlobalVariable.q && existingGlobalVariable.version && display.warn("SDK is loaded more than once. This is unsupported and might have unexpected behavior."), 
    global[name] = api, existingGlobalVariable && existingGlobalVariable.q && existingGlobalVariable.q.forEach((fn => catchUserErrors(fn, "onReady callback threw an error:")()));
}

function getGlobalObject() {
    if ("object" == typeof globalThis) return globalThis;
    Object.defineProperty(Object.prototype, "_dd_temp_", {
        get() {
            return this;
        },
        configurable: !0
    });
    let globalObject = _dd_temp_;
    return delete Object.prototype._dd_temp_, "object" != typeof globalObject && (globalObject = "object" == typeof self ? self : "object" == typeof window ? window : {}), 
    globalObject;
}

const ONE_KIBI_BYTE = 1024, ONE_MEBI_BYTE = 1048576, HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/;

function computeBytesCount(candidate) {
    return HAS_MULTI_BYTES_CHARACTERS.test(candidate) ? void 0 !== window.TextEncoder ? (new TextEncoder).encode(candidate).length : new Blob([ candidate ]).size : candidate.length;
}

function concatBuffers(buffers) {
    const length = buffers.reduce(((total, buffer) => total + buffer.length), 0), result = new Uint8Array(length);
    let offset = 0;
    for (const buffer of buffers) result.set(buffer, offset), offset += buffer.length;
    return result;
}

function getZoneJsOriginalValue(target, name) {
    const browserWindow = getGlobalObject();
    let original;
    return browserWindow.Zone && "function" == typeof browserWindow.Zone.__symbol__ && (original = target[browserWindow.Zone.__symbol__(name)]), 
    original || (original = target[name]), original;
}

function timer_setTimeout(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), "setTimeout")(monitor(callback), delay);
}

function timer_clearTimeout(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), "clearTimeout")(timeoutId);
}

function timer_setInterval(callback, delay) {
    return getZoneJsOriginalValue(getGlobalObject(), "setInterval")(monitor(callback), delay);
}

function timer_clearInterval(timeoutId) {
    getZoneJsOriginalValue(getGlobalObject(), "clearInterval")(timeoutId);
}

function throttle(fn, wait, options) {
    const needLeadingExecution = !options || void 0 === options.leading || options.leading, needTrailingExecution = !options || void 0 === options.trailing || options.trailing;
    let pendingExecutionWithParameters, pendingTimeoutId, inWaitPeriod = !1;
    return {
        throttled: (...parameters) => {
            inWaitPeriod ? pendingExecutionWithParameters = parameters : (needLeadingExecution ? fn(...parameters) : pendingExecutionWithParameters = parameters, 
            inWaitPeriod = !0, pendingTimeoutId = timer_setTimeout((() => {
                needTrailingExecution && pendingExecutionWithParameters && fn(...pendingExecutionWithParameters), 
                inWaitPeriod = !1, pendingExecutionWithParameters = void 0;
            }), wait));
        },
        cancel: () => {
            timer_clearTimeout(pendingTimeoutId), inWaitPeriod = !1, pendingExecutionWithParameters = void 0;
        }
    };
}

function functionUtils_noop() {}

function jsonStringify_jsonStringify(value, replacer, space) {
    if ("object" != typeof value || null === value) return JSON.stringify(value);
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype), restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype), restoreValuePrototypeToJson = detachToJsonMethod(Object.getPrototypeOf(value)), restoreValueToJson = detachToJsonMethod(value);
    try {
        return JSON.stringify(value, replacer, space);
    } catch (_a) {
        return "<error: unable to serialize object>";
    } finally {
        restoreObjectPrototypeToJson(), restoreArrayPrototypeToJson(), restoreValuePrototypeToJson(), 
        restoreValueToJson();
    }
}

function detachToJsonMethod(value) {
    const object = value, objectToJson = object.toJSON;
    return objectToJson ? (delete object.toJSON, () => {
        object.toJSON = objectToJson;
    }) : functionUtils_noop;
}

function shallowClone(object) {
    return polyfills_assign({}, object);
}

function objectHasValue(object, value) {
    return Object.keys(object).some((key => object[key] === value));
}

function isEmptyObject(object) {
    return 0 === Object.keys(object).length;
}

function mapValues(object, fn) {
    const newObject = {};
    for (const key of Object.keys(object)) newObject[key] = fn(object[key]);
    return newObject;
}

const CUSTOMER_DATA_BYTES_LIMIT = 3072, CUSTOMER_COMPRESSED_DATA_BYTES_LIMIT = 16384, BYTES_COMPUTATION_THROTTLING_DELAY = 200;

function createCustomerDataTrackerManager(compressionStatus = 2) {
    const customerDataTrackers = new Map;
    let alreadyWarned = !1;
    function checkCustomerDataLimit(initialBytesCount = 0) {
        if (alreadyWarned || 0 === compressionStatus) return;
        const bytesCountLimit = 2 === compressionStatus ? 3072 : 16384;
        let bytesCount = initialBytesCount;
        customerDataTrackers.forEach((tracker => {
            bytesCount += tracker.getBytesCount();
        })), bytesCount > bytesCountLimit && (displayCustomerDataLimitReachedWarning(bytesCountLimit), 
        alreadyWarned = !0);
    }
    return {
        createDetachedTracker: () => {
            const tracker = createCustomerDataTracker((() => checkCustomerDataLimit(tracker.getBytesCount())));
            return tracker;
        },
        getOrCreateTracker: type => (customerDataTrackers.has(type) || customerDataTrackers.set(type, createCustomerDataTracker(checkCustomerDataLimit)), 
        customerDataTrackers.get(type)),
        setCompressionStatus: newCompressionStatus => {
            0 === compressionStatus && (compressionStatus = newCompressionStatus, checkCustomerDataLimit());
        },
        getCompressionStatus: () => compressionStatus,
        stop: () => {
            customerDataTrackers.forEach((tracker => tracker.stop())), customerDataTrackers.clear();
        }
    };
}

function createCustomerDataTracker(checkCustomerDataLimit) {
    let bytesCountCache = 0;
    const {throttled: computeBytesCountThrottled, cancel: cancelComputeBytesCount} = throttle((context => {
        bytesCountCache = computeBytesCount(jsonStringify_jsonStringify(context)), checkCustomerDataLimit();
    }), 200), resetBytesCount = () => {
        cancelComputeBytesCount(), bytesCountCache = 0;
    };
    return {
        updateCustomerData: context => {
            isEmptyObject(context) ? resetBytesCount() : computeBytesCountThrottled(context);
        },
        resetCustomerData: resetBytesCount,
        getBytesCount: () => bytesCountCache,
        stop: () => {
            cancelComputeBytesCount();
        }
    };
}

function displayCustomerDataLimitReachedWarning(bytesCountLimit) {
    display.warn(`Customer data exceeds the recommended ${bytesCountLimit / 1024}KiB threshold. More details: ${DOCS_TROUBLESHOOTING}/#customer-data-exceeds-the-recommended-threshold-warning`);
}

function typeUtils_getType(value) {
    return null === value ? "null" : Array.isArray(value) ? "array" : typeof value;
}

function mergeInto(destination, source, circularReferenceChecker = createCircularReferenceChecker()) {
    if (void 0 === source) return destination;
    if ("object" != typeof source || null === source) return source;
    if (source instanceof Date) return new Date(source.getTime());
    if (source instanceof RegExp) {
        const flags = source.flags || [ source.global ? "g" : "", source.ignoreCase ? "i" : "", source.multiline ? "m" : "", source.sticky ? "y" : "", source.unicode ? "u" : "" ].join("");
        return new RegExp(source.source, flags);
    }
    if (circularReferenceChecker.hasAlreadyBeenSeen(source)) return;
    if (Array.isArray(source)) {
        const merged = Array.isArray(destination) ? destination : [];
        for (let i = 0; i < source.length; ++i) merged[i] = mergeInto(merged[i], source[i], circularReferenceChecker);
        return merged;
    }
    const merged = "object" === typeUtils_getType(destination) ? destination : {};
    for (const key in source) Object.prototype.hasOwnProperty.call(source, key) && (merged[key] = mergeInto(merged[key], source[key], circularReferenceChecker));
    return merged;
}

function deepClone(value) {
    return mergeInto(void 0, value);
}

function mergeInto_combine(...sources) {
    let destination;
    for (const source of sources) null != source && (destination = mergeInto(destination, source));
    return destination;
}

function createCircularReferenceChecker() {
    if ("undefined" != typeof WeakSet) {
        const set = new WeakSet;
        return {
            hasAlreadyBeenSeen(value) {
                const has = set.has(value);
                return has || set.add(value), has;
            }
        };
    }
    const array = [];
    return {
        hasAlreadyBeenSeen(value) {
            const has = array.indexOf(value) >= 0;
            return has || array.push(value), has;
        }
    };
}

const SANITIZE_DEFAULT_MAX_CHARACTER_COUNT = 225280, JSON_PATH_ROOT_ELEMENT = "$", KEY_DECORATION_LENGTH = 3;

function sanitize(source, maxCharacterCount = 225280) {
    const restoreObjectPrototypeToJson = detachToJsonMethod(Object.prototype), restoreArrayPrototypeToJson = detachToJsonMethod(Array.prototype), containerQueue = [], visitedObjectsWithPath = new WeakMap, sanitizedData = sanitizeProcessor(source, "$", void 0, containerQueue, visitedObjectsWithPath), serializedSanitizedData = JSON.stringify(sanitizedData);
    let accumulatedCharacterCount = serializedSanitizedData ? serializedSanitizedData.length : 0;
    if (!(accumulatedCharacterCount > maxCharacterCount)) {
        for (;containerQueue.length > 0 && accumulatedCharacterCount < maxCharacterCount; ) {
            const containerToProcess = containerQueue.shift();
            let separatorLength = 0;
            if (Array.isArray(containerToProcess.source)) for (let key = 0; key < containerToProcess.source.length; key++) {
                const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
                if (accumulatedCharacterCount += void 0 !== targetData ? JSON.stringify(targetData).length : 4, 
                accumulatedCharacterCount += separatorLength, separatorLength = 1, accumulatedCharacterCount > maxCharacterCount) {
                    warnOverCharacterLimit(maxCharacterCount, "truncated", source);
                    break;
                }
                containerToProcess.target[key] = targetData;
            } else for (const key in containerToProcess.source) if (Object.prototype.hasOwnProperty.call(containerToProcess.source, key)) {
                const targetData = sanitizeProcessor(containerToProcess.source[key], containerToProcess.path, key, containerQueue, visitedObjectsWithPath);
                if (void 0 !== targetData && (accumulatedCharacterCount += JSON.stringify(targetData).length + separatorLength + key.length + 3, 
                separatorLength = 1), accumulatedCharacterCount > maxCharacterCount) {
                    warnOverCharacterLimit(maxCharacterCount, "truncated", source);
                    break;
                }
                containerToProcess.target[key] = targetData;
            }
        }
        return restoreObjectPrototypeToJson(), restoreArrayPrototypeToJson(), sanitizedData;
    }
    warnOverCharacterLimit(maxCharacterCount, "discarded", source);
}

function sanitizeProcessor(source, parentPath, key, queue, visitedObjectsWithPath) {
    const sourceToSanitize = tryToApplyToJSON(source);
    if (!sourceToSanitize || "object" != typeof sourceToSanitize) return sanitizePrimitivesAndFunctions(sourceToSanitize);
    const sanitizedSource = sanitizeObjects(sourceToSanitize);
    if ("[Object]" !== sanitizedSource && "[Array]" !== sanitizedSource && "[Error]" !== sanitizedSource) return sanitizedSource;
    const sourceAsObject = source;
    if (visitedObjectsWithPath.has(sourceAsObject)) return `[Reference seen at ${visitedObjectsWithPath.get(sourceAsObject)}]`;
    const currentPath = void 0 !== key ? `${parentPath}.${key}` : parentPath, target = Array.isArray(sourceToSanitize) ? [] : {};
    return visitedObjectsWithPath.set(sourceAsObject, currentPath), queue.push({
        source: sourceToSanitize,
        target: target,
        path: currentPath
    }), target;
}

function sanitizePrimitivesAndFunctions(value) {
    return "bigint" == typeof value ? `[BigInt] ${value.toString()}` : "function" == typeof value ? `[Function] ${value.name || "unknown"}` : "symbol" == typeof value ? `[Symbol] ${value.description || value.toString()}` : value;
}

function sanitizeObjects(value) {
    try {
        if (value instanceof Event) return {
            isTrusted: value.isTrusted
        };
        const match = Object.prototype.toString.call(value).match(/\[object (.*)\]/);
        if (match && match[1]) return `[${match[1]}]`;
    } catch (_a) {}
    return "[Unserializable]";
}

function tryToApplyToJSON(value) {
    const object = value;
    if (object && "function" == typeof object.toJSON) try {
        return object.toJSON();
    } catch (_a) {}
    return value;
}

function warnOverCharacterLimit(maxCharacterCount, changeType, source) {
    display.warn(`The data provided has been ${changeType} as it is over the limit of ${maxCharacterCount} characters:`, source);
}

class observable_Observable {
    constructor(onFirstSubscribe) {
        this.onFirstSubscribe = onFirstSubscribe, this.observers = [];
    }
    subscribe(f) {
        return this.observers.push(f), 1 === this.observers.length && this.onFirstSubscribe && (this.onLastUnsubscribe = this.onFirstSubscribe(this) || void 0), 
        {
            unsubscribe: () => {
                this.observers = this.observers.filter((other => f !== other)), !this.observers.length && this.onLastUnsubscribe && this.onLastUnsubscribe();
            }
        };
    }
    notify(data) {
        this.observers.forEach((observer => observer(data)));
    }
}

function mergeObservables(...observables) {
    return new observable_Observable((globalObservable => {
        const subscriptions = observables.map((observable => observable.subscribe((data => globalObservable.notify(data)))));
        return () => subscriptions.forEach((subscription => subscription.unsubscribe()));
    }));
}

function createContextManager(customerDataTracker) {
    let context = {};
    const changeObservable = new observable_Observable, contextManager = {
        getContext: () => deepClone(context),
        setContext: newContext => {
            "object" === typeUtils_getType(newContext) ? (context = sanitize(newContext), null == customerDataTracker || customerDataTracker.updateCustomerData(context)) : contextManager.clearContext(), 
            changeObservable.notify();
        },
        setContextProperty: (key, property) => {
            context[key] = sanitize(property), null == customerDataTracker || customerDataTracker.updateCustomerData(context), 
            changeObservable.notify();
        },
        removeContextProperty: key => {
            delete context[key], null == customerDataTracker || customerDataTracker.updateCustomerData(context), 
            changeObservable.notify();
        },
        clearContext: () => {
            context = {}, null == customerDataTracker || customerDataTracker.resetCustomerData(), 
            changeObservable.notify();
        },
        changeObservable: changeObservable
    };
    return contextManager;
}

const TrackingConsent = {
    GRANTED: "granted",
    NOT_GRANTED: "not-granted"
};

function createTrackingConsentState(currentConsent) {
    const observable = new observable_Observable;
    return {
        tryToInit(trackingConsent) {
            currentConsent || (currentConsent = trackingConsent);
        },
        update(trackingConsent) {
            currentConsent = trackingConsent, observable.notify();
        },
        isGranted: () => currentConsent === TrackingConsent.GRANTED,
        observable: observable
    };
}

function addEventListener(configuration, eventTarget, eventName, listener, options) {
    return addEventListeners(configuration, eventTarget, [ eventName ], listener, options);
}

function addEventListeners(configuration, eventTarget, eventNames, listener, {once: once, capture: capture, passive: passive} = {}) {
    const listenerWithMonitor = monitor((event => {
        (event.isTrusted || event.__ddIsTrusted || configuration.allowUntrustedEvents) && (once && stop(), 
        listener(event));
    })), options = passive ? {
        capture: capture,
        passive: passive
    } : capture, listenerTarget = window.EventTarget && eventTarget instanceof EventTarget ? window.EventTarget.prototype : eventTarget, add = getZoneJsOriginalValue(listenerTarget, "addEventListener");
    function stop() {
        const remove = getZoneJsOriginalValue(listenerTarget, "removeEventListener");
        eventNames.forEach((eventName => remove.call(eventTarget, eventName, listenerWithMonitor, options)));
    }
    return eventNames.forEach((eventName => add.call(eventTarget, eventName, listenerWithMonitor, options))), 
    {
        stop: stop
    };
}

const CONTEXT_STORE_KEY_PREFIX = "_dd_c", storageListeners = [];

function storeContextManager(configuration, contextManager, productKey, customerDataType) {
    const storageKey = buildStorageKey(productKey, customerDataType);
    function getFromStorage() {
        const rawContext = localStorage.getItem(storageKey);
        return null !== rawContext ? JSON.parse(rawContext) : {};
    }
    storageListeners.push(addEventListener(configuration, window, "storage", (({key: key}) => {
        storageKey === key && contextManager.setContext(getFromStorage());
    }))), contextManager.changeObservable.subscribe((function() {
        localStorage.setItem(storageKey, JSON.stringify(contextManager.getContext()));
    })), contextManager.setContext(mergeInto_combine(getFromStorage(), contextManager.getContext()));
}

function buildStorageKey(productKey, customerDataType) {
    return `_dd_c_${productKey}_${customerDataType}`;
}

function removeStorageListeners() {
    storageListeners.map((listener => listener.stop()));
}

function createIdentityEncoder() {
    let output = "", outputBytesCount = 0;
    return {
        isAsync: !1,
        get isEmpty() {
            return !output;
        },
        write(data, callback) {
            const additionalEncodedBytesCount = computeBytesCount(data);
            outputBytesCount += additionalEncodedBytesCount, output += data, callback && callback(additionalEncodedBytesCount);
        },
        finish(callback) {
            callback(this.finishSync());
        },
        finishSync() {
            const result = {
                output: output,
                outputBytesCount: outputBytesCount,
                rawBytesCount: outputBytesCount,
                pendingData: ""
            };
            return output = "", outputBytesCount = 0, result;
        },
        estimateEncodedBytesCount: data => data.length
    };
}

const UNKNOWN_FUNCTION = "?";

function computeStackTrace(ex) {
    const stack = [];
    let stackProperty = tryToGetString(ex, "stack");
    const exString = String(ex);
    return stackProperty && startsWith(stackProperty, exString) && (stackProperty = stackProperty.slice(exString.length)), 
    stackProperty && stackProperty.split("\n").forEach((line => {
        const stackFrame = parseChromeLine(line) || parseChromeAnonymousLine(line) || parseWinLine(line) || parseGeckoLine(line);
        stackFrame && (!stackFrame.func && stackFrame.line && (stackFrame.func = "?"), stack.push(stackFrame));
    })), {
        message: tryToGetString(ex, "message"),
        name: tryToGetString(ex, "name"),
        stack: stack
    };
}

const fileUrl = "((?:file|https?|blob|chrome-extension|electron|native|eval|webpack|snippet|<anonymous>|\\w+\\.|\\/).*?)", filePosition = "(?::(\\d+))", CHROME_LINE_RE = new RegExp(`^\\s*at (.*?) ?\\(${fileUrl}(?::(\\d+))?(?::(\\d+))?\\)?\\s*$`, "i"), CHROME_EVAL_RE = new RegExp("\\((\\S*)(?::(\\d+))(?::(\\d+))\\)");

function parseChromeLine(line) {
    const parts = CHROME_LINE_RE.exec(line);
    if (!parts) return;
    const isNative = parts[2] && 0 === parts[2].indexOf("native"), isEval = parts[2] && 0 === parts[2].indexOf("eval"), submatch = CHROME_EVAL_RE.exec(parts[2]);
    return isEval && submatch && (parts[2] = submatch[1], parts[3] = submatch[2], parts[4] = submatch[3]), 
    {
        args: isNative ? [ parts[2] ] : [],
        column: parts[4] ? +parts[4] : void 0,
        func: parts[1] || "?",
        line: parts[3] ? +parts[3] : void 0,
        url: isNative ? void 0 : parts[2]
    };
}

const CHROME_ANONYMOUS_FUNCTION_RE = new RegExp(`^\\s*at ?${fileUrl}(?::(\\d+))?(?::(\\d+))??\\s*$`, "i");

function parseChromeAnonymousLine(line) {
    const parts = CHROME_ANONYMOUS_FUNCTION_RE.exec(line);
    if (parts) return {
        args: [],
        column: parts[3] ? +parts[3] : void 0,
        func: "?",
        line: parts[2] ? +parts[2] : void 0,
        url: parts[1]
    };
}

const WINJS_LINE_RE = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;

function parseWinLine(line) {
    const parts = WINJS_LINE_RE.exec(line);
    if (parts) return {
        args: [],
        column: parts[4] ? +parts[4] : void 0,
        func: parts[1] || "?",
        line: +parts[3],
        url: parts[2]
    };
}

const GECKO_LINE_RE = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|capacitor|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i, GECKO_EVAL_RE = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;

function parseGeckoLine(line) {
    const parts = GECKO_LINE_RE.exec(line);
    if (!parts) return;
    const isEval = parts[3] && parts[3].indexOf(" > eval") > -1, submatch = GECKO_EVAL_RE.exec(parts[3]);
    return isEval && submatch && (parts[3] = submatch[1], parts[4] = submatch[2], parts[5] = void 0), 
    {
        args: parts[2] ? parts[2].split(",") : [],
        column: parts[5] ? +parts[5] : void 0,
        func: parts[1] || "?",
        line: parts[4] ? +parts[4] : void 0,
        url: parts[3]
    };
}

function tryToGetString(candidate, property) {
    if ("object" != typeof candidate || !candidate || !(property in candidate)) return;
    const value = candidate[property];
    return "string" == typeof value ? value : void 0;
}

function computeStackTraceFromOnErrorMessage(messageObj, url, line, column) {
    const stack = [ {
        url: url,
        column: column,
        line: line
    } ], {name: name, message: message} = tryToParseMessage(messageObj);
    return {
        name: name,
        message: message,
        stack: stack
    };
}

const ERROR_TYPES_RE = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?([\s\S]*)$/;

function tryToParseMessage(messageObj) {
    let name, message;
    return "[object String]" === {}.toString.call(messageObj) && ([, name, message] = ERROR_TYPES_RE.exec(messageObj)), 
    {
        name: name,
        message: message
    };
}

function createHandlingStack() {
    const error = new Error;
    let formattedStack;
    if (!error.stack) try {
        throw error;
    } catch (_a) {
        functionUtils_noop();
    }
    return callMonitored((() => {
        const stackTrace = computeStackTrace(error);
        stackTrace.stack = stackTrace.stack.slice(2), formattedStack = toStackTraceString(stackTrace);
    })), formattedStack;
}

function toStackTraceString(stack) {
    let result = formatErrorMessage(stack);
    return stack.stack.forEach((frame => {
        const func = "?" === frame.func ? "<anonymous>" : frame.func, args = frame.args && frame.args.length > 0 ? `(${frame.args.join(", ")})` : "", line = frame.line ? `:${frame.line}` : "", column = frame.line && frame.column ? `:${frame.column}` : "";
        result += `\n  at ${func}${args} @ ${frame.url}${line}${column}`;
    })), result;
}

function formatErrorMessage(stack) {
    return `${stack.name || "Error"}: ${stack.message}`;
}

function numberUtils_performDraw(threshold) {
    return 0 !== threshold && 100 * Math.random() <= threshold;
}

function round(num, decimals) {
    return +num.toFixed(decimals);
}

function isPercentage(value) {
    return isNumber(value) && value >= 0 && value <= 100;
}

function isNumber(value) {
    return "number" == typeof value;
}

const ONE_SECOND = 1e3, ONE_MINUTE = 6e4, ONE_HOUR = 36e5, ONE_DAY = 864e5, timeUtils_ONE_YEAR = 31536e6;

function relativeToClocks(relative) {
    return {
        relative: relative,
        timeStamp: getCorrectedTimeStamp(relative)
    };
}

function timeStampToClocks(timeStamp) {
    return {
        relative: getRelativeTime(timeStamp),
        timeStamp: timeStamp
    };
}

function getCorrectedTimeStamp(relativeTime) {
    const correctedOrigin = dateNow() - performance.now();
    return correctedOrigin > getNavigationStart() ? Math.round(addDuration(correctedOrigin, relativeTime)) : getTimeStamp(relativeTime);
}

function currentDrift() {
    return Math.round(dateNow() - addDuration(getNavigationStart(), performance.now()));
}

function toServerDuration(duration) {
    return isNumber(duration) ? round(1e6 * duration, 0) : duration;
}

function dateNow() {
    return (new Date).getTime();
}

function timeUtils_timeStampNow() {
    return dateNow();
}

function timeUtils_relativeNow() {
    return performance.now();
}

function clocksNow() {
    return {
        relative: timeUtils_relativeNow(),
        timeStamp: timeUtils_timeStampNow()
    };
}

function clocksOrigin() {
    return {
        relative: 0,
        timeStamp: getNavigationStart()
    };
}

function timeUtils_elapsed(start, end) {
    return end - start;
}

function addDuration(a, b) {
    return a + b;
}

function getRelativeTime(timestamp) {
    return timestamp - getNavigationStart();
}

function getTimeStamp(relativeTime) {
    return Math.round(addDuration(getNavigationStart(), relativeTime));
}

function looksLikeRelativeTime(time) {
    return time < 31536e6;
}

let navigationStart;

function getNavigationStart() {
    return void 0 === navigationStart && (navigationStart = performance.timing.navigationStart), 
    navigationStart;
}

function sanitizeUser(newUser) {
    const user = polyfills_assign({}, newUser);
    return [ "id", "name", "email" ].forEach((key => {
        key in user && (user[key] = String(user[key]));
    })), user;
}

function checkUser(newUser) {
    const isValid = "object" === typeUtils_getType(newUser);
    return isValid || display.error("Unsupported user:", newUser), isValid;
}

function generateAnonymousId() {
    return Math.floor(Math.random() * Math.pow(2, 53)).toString(36);
}

function displayAlreadyInitializedError(sdkName, initConfiguration) {
    initConfiguration.silentMultipleInit || display.error(`${sdkName} is already initialized.`);
}

function buildCommonContext(globalContextManager, userContextManager, recorderApi) {
    return {
        context: globalContextManager.getContext(),
        user: userContextManager.getContext(),
        hasReplay: !!recorderApi.isRecording() || void 0
    };
}

function generateUUID(placeholder) {
    return placeholder ? (parseInt(placeholder, 10) ^ 16 * Math.random() >> parseInt(placeholder, 10) / 4).toString(16) : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, generateUUID);
}

const COMMA_SEPARATED_KEY_VALUE = /([\w-]+)\s*=\s*([^;]+)/g;

function findCommaSeparatedValue(rawString, name) {
    for (COMMA_SEPARATED_KEY_VALUE.lastIndex = 0; ;) {
        const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
        if (!match) break;
        if (match[1] === name) return match[2];
    }
}

function findCommaSeparatedValues(rawString) {
    const result = new Map;
    for (COMMA_SEPARATED_KEY_VALUE.lastIndex = 0; ;) {
        const match = COMMA_SEPARATED_KEY_VALUE.exec(rawString);
        if (!match) break;
        result.set(match[1], match[2]);
    }
    return result;
}

function stringUtils_safeTruncate(candidate, length, suffix = "") {
    const lastChar = candidate.charCodeAt(length - 1), correctedLength = lastChar >= 55296 && lastChar <= 56319 ? length + 1 : length;
    return candidate.length <= correctedLength ? candidate : `${candidate.slice(0, correctedLength)}${suffix}`;
}

function createCustomVitalsState() {
    return {
        vitalsByName: new Map,
        vitalsByReference: new WeakMap
    };
}

function startVitalCollection(lifeCycle, pageStateHistory, customVitalsState) {
    function addDurationVital(vital) {
        (function(vital) {
            return !pageStateHistory.wasInPageStateDuringPeriod("frozen", vital.startClocks.relative, vital.duration);
        })(vital) && lifeCycle.notify(11, processVital(vital, !0));
    }
    return {
        addDurationVital: addDurationVital,
        startDurationVital: (name, options = {}) => startDurationVital(customVitalsState, name, options),
        stopDurationVital: (nameOrRef, options = {}) => {
            stopDurationVital(addDurationVital, customVitalsState, nameOrRef, options);
        }
    };
}

function startDurationVital({vitalsByName: vitalsByName, vitalsByReference: vitalsByReference}, name, options = {}) {
    const vital = {
        name: name,
        startClocks: clocksNow(),
        context: options.context,
        description: options.description
    }, reference = {
        __dd_vital_reference: !0
    };
    return vitalsByName.set(name, vital), vitalsByReference.set(reference, vital), reference;
}

function stopDurationVital(stopCallback, {vitalsByName: vitalsByName, vitalsByReference: vitalsByReference}, nameOrRef, options = {}) {
    const vitalStart = "string" == typeof nameOrRef ? vitalsByName.get(nameOrRef) : vitalsByReference.get(nameOrRef);
    vitalStart && (stopCallback(buildDurationVital(vitalStart, vitalStart.startClocks, options, clocksNow())), 
    "string" == typeof nameOrRef ? vitalsByName.delete(nameOrRef) : vitalsByReference.delete(nameOrRef));
}

function buildDurationVital(vitalStart, startClocks, stopOptions, stopClocks) {
    var _a;
    return {
        name: vitalStart.name,
        type: "duration",
        startClocks: startClocks,
        duration: timeUtils_elapsed(startClocks.timeStamp, stopClocks.timeStamp),
        context: mergeInto_combine(vitalStart.context, stopOptions.context),
        description: null !== (_a = stopOptions.description) && void 0 !== _a ? _a : vitalStart.description
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
            description: vital.description
        },
        type: "vital"
    };
    return valueComputedBySdk && (rawRumEvent._dd = {
        vital: {
            computed_value: !0
        }
    }), {
        rawRumEvent: rawRumEvent,
        startTime: vital.startClocks.relative,
        customerContext: vital.context,
        domainContext: {}
    };
}

function removeDuplicates(array) {
    const set = new Set;
    return array.forEach((item => set.add(item))), arrayFrom(set);
}

function removeItem(array, item) {
    const index = array.indexOf(item);
    index >= 0 && array.splice(index, 1);
}

const BUFFER_LIMIT = 500;

function boundedBuffer_createBoundedBuffer() {
    const buffer = [];
    return {
        add: callback => {
            buffer.push(callback) > 500 && buffer.splice(0, 1);
        },
        remove: callback => {
            removeItem(buffer, callback);
        },
        drain: arg => {
            buffer.forEach((callback => callback(arg))), buffer.length = 0;
        }
    };
}

function instrumentMethod(targetPrototype, method, onPreCall, {computeHandlingStack: computeHandlingStack} = {}) {
    let original = targetPrototype[method];
    if ("function" != typeof original) {
        if (!(method in targetPrototype) || !startsWith(method, "on")) return {
            stop: functionUtils_noop
        };
        original = functionUtils_noop;
    }
    let stopped = !1;
    const instrumentation = function() {
        if (stopped) return original.apply(this, arguments);
        const parameters = polyfills_arrayFrom(arguments);
        let postCallCallback;
        callMonitored(onPreCall, null, [ {
            target: this,
            parameters: parameters,
            onPostCall: callback => {
                postCallCallback = callback;
            },
            handlingStack: computeHandlingStack ? createHandlingStack() : void 0
        } ]);
        const result = original.apply(this, parameters);
        return postCallCallback && callMonitored(postCallCallback, null, [ result ]), result;
    };
    return targetPrototype[method] = instrumentation, {
        stop: () => {
            stopped = !0, targetPrototype[method] === instrumentation && (targetPrototype[method] = original);
        }
    };
}

function instrumentSetter(targetPrototype, property, after) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, property);
    if (!originalDescriptor || !originalDescriptor.set || !originalDescriptor.configurable) return {
        stop: noop
    };
    const stoppedInstrumentation = noop;
    let instrumentation = (target, value) => {
        setTimeout((() => {
            instrumentation !== stoppedInstrumentation && after(target, value);
        }), 0);
    };
    const instrumentationWrapper = function(value) {
        originalDescriptor.set.call(this, value), instrumentation(this, value);
    };
    return Object.defineProperty(targetPrototype, property, {
        set: instrumentationWrapper
    }), {
        stop: () => {
            var _a;
            (null === (_a = Object.getOwnPropertyDescriptor(targetPrototype, property)) || void 0 === _a ? void 0 : _a.set) === instrumentationWrapper && Object.defineProperty(targetPrototype, property, originalDescriptor), 
            instrumentation = stoppedInstrumentation;
        }
    };
}

function normalizeUrl(url) {
    return buildUrl(url, location.href).href;
}

function isValidUrl(url) {
    try {
        return !!buildUrl(url);
    } catch (_a) {
        return !1;
    }
}

function getPathName(url) {
    const pathname = buildUrl(url).pathname;
    return "/" === pathname[0] ? pathname : `/${pathname}`;
}

function buildUrl(url, base) {
    const supportedURL = getSupportedUrl();
    if (supportedURL) try {
        return void 0 !== base ? new supportedURL(url, base) : new supportedURL(url);
    } catch (error) {
        throw new Error(`Failed to construct URL: ${String(error)} ${jsonStringify_jsonStringify({
            url: url,
            base: base
        })}`);
    }
    if (void 0 === base && !/:/.test(url)) throw new Error(`Invalid URL: '${url}'`);
    let doc = document;
    const anchorElement = doc.createElement("a");
    if (void 0 !== base) {
        doc = document.implementation.createHTMLDocument("");
        const baseElement = doc.createElement("base");
        baseElement.href = base, doc.head.appendChild(baseElement), doc.body.appendChild(anchorElement);
    }
    return anchorElement.href = url, anchorElement;
}

const originalURL = URL;

let isURLSupported, fetchObservable, initCookieParsed, getCurrentSiteCache;

function getSupportedUrl() {
    if (void 0 === isURLSupported) try {
        const url = new originalURL("http://test/path");
        isURLSupported = "http://test/path" === url.href;
    } catch (_a) {
        isURLSupported = !1;
    }
    return isURLSupported ? originalURL : void 0;
}

function initFetchObservable() {
    return fetchObservable || (fetchObservable = createFetchObservable()), fetchObservable;
}

function resetFetchObservable() {
    fetchObservable = void 0;
}

function createFetchObservable() {
    return new observable_Observable((observable => {
        if (!window.fetch) return;
        const {stop: stop} = instrumentMethod(window, "fetch", (call => beforeSend(call, observable)), {
            computeHandlingStack: !0
        });
        return stop;
    }));
}

function beforeSend({parameters: parameters, onPostCall: onPostCall, handlingStack: handlingStack}, observable) {
    const [input, init] = parameters;
    let methodFromParams = init && init.method;
    void 0 === methodFromParams && input instanceof Request && (methodFromParams = input.method);
    const method = void 0 !== methodFromParams ? String(methodFromParams).toUpperCase() : "GET", url = input instanceof Request ? input.url : normalizeUrl(String(input)), context = {
        state: "start",
        init: init,
        input: input,
        method: method,
        startClocks: clocksNow(),
        url: url,
        handlingStack: handlingStack
    };
    observable.notify(context), parameters[0] = context.input, parameters[1] = context.init, 
    onPostCall((responsePromise => afterSend(observable, responsePromise, context)));
}

function afterSend(observable, responsePromise, startContext) {
    const context = startContext;
    function reportFetch(partialContext) {
        context.state = "resolve", polyfills_assign(context, partialContext), observable.notify(context);
    }
    responsePromise.then(monitor((response => {
        reportFetch({
            response: response,
            responseType: response.type,
            status: response.status,
            isAborted: !1
        });
    })), monitor((error => {
        var _a, _b;
        reportFetch({
            status: 0,
            isAborted: (null === (_b = null === (_a = context.init) || void 0 === _a ? void 0 : _a.signal) || void 0 === _b ? void 0 : _b.aborted) || error instanceof DOMException && error.code === DOMException.ABORT_ERR,
            error: error
        });
    })));
}

function setCookie(name, value, expireDelay = 0, options) {
    const date = new Date;
    date.setTime(date.getTime() + expireDelay);
    const expires = `expires=${date.toUTCString()}`, sameSite = options && options.crossSite ? "none" : "strict", domain = options && options.domain ? `;domain=${options.domain}` : "", secure = options && options.secure ? ";secure" : "", partitioned = options && options.partitioned ? ";partitioned" : "";
    document.cookie = `${name}=${value};${expires};path=/;samesite=${sameSite}${domain}${secure}${partitioned}`;
}

function getCookie(name) {
    return findCommaSeparatedValue(document.cookie, name);
}

function getInitCookie(name) {
    return initCookieParsed || (initCookieParsed = findCommaSeparatedValues(document.cookie)), 
    initCookieParsed.get(name);
}

function resetInitCookies() {
    initCookieParsed = void 0;
}

function deleteCookie(name, options) {
    setCookie(name, "", 0, options);
}

function areCookiesAuthorized(options) {
    if (void 0 === document.cookie || null === document.cookie) return !1;
    try {
        const testCookieName = `dd_cookie_test_${generateUUID()}`, testCookieValue = "test";
        setCookie(testCookieName, testCookieValue, 6e4, options);
        const isCookieCorrectlySet = getCookie(testCookieName) === testCookieValue;
        return deleteCookie(testCookieName, options), isCookieCorrectlySet;
    } catch (error) {
        return display.error(error), !1;
    }
}

function getCurrentSite() {
    if (void 0 === getCurrentSiteCache) {
        const testCookieName = `dd_site_test_${generateUUID()}`, testCookieValue = "test", domainLevels = window.location.hostname.split(".");
        let candidateDomain = domainLevels.pop();
        for (;domainLevels.length && !getCookie(testCookieName); ) candidateDomain = `${domainLevels.pop()}.${candidateDomain}`, 
        setCookie(testCookieName, testCookieValue, 1e3, {
            domain: candidateDomain
        });
        deleteCookie(testCookieName, {
            domain: candidateDomain
        }), getCurrentSiteCache = candidateDomain;
    }
    return getCurrentSiteCache;
}

const SYNTHETICS_TEST_ID_COOKIE_NAME = "datadog-synthetics-public-id", SYNTHETICS_RESULT_ID_COOKIE_NAME = "datadog-synthetics-result-id", SYNTHETICS_INJECTS_RUM_COOKIE_NAME = "datadog-synthetics-injects-rum";

function willSyntheticsInjectRum() {
    return Boolean(window._DATADOG_SYNTHETICS_INJECTS_RUM || getInitCookie("datadog-synthetics-injects-rum"));
}

function getSyntheticsTestId() {
    const value = window._DATADOG_SYNTHETICS_PUBLIC_ID || getInitCookie("datadog-synthetics-public-id");
    return "string" == typeof value ? value : void 0;
}

function getSyntheticsResultId() {
    const value = window._DATADOG_SYNTHETICS_RESULT_ID || getInitCookie("datadog-synthetics-result-id");
    return "string" == typeof value ? value : void 0;
}

function isIE() {
    return 0 === detectBrowserCached();
}

function isChromium() {
    return 1 === detectBrowserCached();
}

function isSafari() {
    return 2 === detectBrowserCached();
}

let browserCache;

function detectBrowserCached() {
    return null != browserCache ? browserCache : browserCache = detectBrowser();
}

function detectBrowser(browserWindow = window) {
    var _a;
    const userAgent = browserWindow.navigator.userAgent;
    return browserWindow.chrome || /HeadlessChrome/.test(userAgent) ? 1 : 0 === (null === (_a = browserWindow.navigator.vendor) || void 0 === _a ? void 0 : _a.indexOf("Apple")) || /safari/i.test(userAgent) && !/chrome|android/i.test(userAgent) ? 2 : browserWindow.document.documentMode ? 0 : 3;
}

const SESSION_TIME_OUT_DELAY = 144e5, SESSION_EXPIRATION_DELAY = 9e5, SESSION_COOKIE_EXPIRATION_DELAY = null, SessionPersistence = {
    COOKIE: "cookie",
    LOCAL_STORAGE: "local-storage"
}, SESSION_ENTRY_REGEXP = /^([a-zA-Z]+)=([a-z0-9-]+)$/, SESSION_ENTRY_SEPARATOR = "&";

function isValidSessionString(sessionString) {
    return !!sessionString && (-1 !== sessionString.indexOf("&") || SESSION_ENTRY_REGEXP.test(sessionString));
}

const EXPIRED = "1";

function getExpiredSessionState(previousSessionState) {
    return {
        isExpired: "1"
    };
}

function isSessionInNotStartedState(session) {
    return isEmptyObject(session);
}

function isSessionStarted(session) {
    return !isSessionInNotStartedState(session);
}

function isSessionInExpiredState(session) {
    return void 0 !== session.isExpired || !isActiveSession(session);
}

function isActiveSession(sessionState) {
    return (void 0 === sessionState.created || dateNow() - Number(sessionState.created) < 144e5) && (void 0 === sessionState.expire || dateNow() < Number(sessionState.expire));
}

function expandSessionState(session) {
    session.expire = String(dateNow() + 9e5);
}

function toSessionString(session) {
    return objectEntries(session).map((([key, value]) => "anonymousId" === key ? `aid=${value}` : `${key}=${value}`)).join("&");
}

function toSessionState(sessionString) {
    const session = {};
    return isValidSessionString(sessionString) && sessionString.split("&").forEach((entry => {
        const matches = SESSION_ENTRY_REGEXP.exec(entry);
        if (null !== matches) {
            const [, key, value] = matches;
            "aid" === key ? session.anonymousId = value : session[key] = value;
        }
    })), session;
}

const SESSION_STORE_KEY = "_dd_s";

function selectCookieStrategy(initConfiguration) {
    const cookieOptions = buildCookieOptions(initConfiguration);
    return areCookiesAuthorized(cookieOptions) ? {
        type: SessionPersistence.COOKIE,
        cookieOptions: cookieOptions
    } : void 0;
}

function initCookieStrategy(cookieOptions) {
    return {
        isLockEnabled: isChromium(),
        persistSession: persistSessionCookie(cookieOptions),
        retrieveSession: retrieveSessionCookie,
        expireSession: sessionState => expireSessionCookie(cookieOptions, sessionState)
    };
}

function persistSessionCookie(options) {
    return session => {
        setCookie("_dd_s", toSessionString(session), 9e5, options);
    };
}

function expireSessionCookie(options, sessionState) {
    setCookie("_dd_s", toSessionString(getExpiredSessionState(sessionState)), 144e5, options);
}

function retrieveSessionCookie() {
    return toSessionState(getCookie("_dd_s"));
}

function buildCookieOptions(initConfiguration) {
    const cookieOptions = {};
    return cookieOptions.secure = !!initConfiguration.useSecureSessionCookie || !!initConfiguration.usePartitionedCrossSiteSessionCookie, 
    cookieOptions.crossSite = !!initConfiguration.usePartitionedCrossSiteSessionCookie, 
    cookieOptions.partitioned = !!initConfiguration.usePartitionedCrossSiteSessionCookie, 
    initConfiguration.trackSessionAcrossSubdomains && (cookieOptions.domain = getCurrentSite()), 
    cookieOptions;
}

const LOCAL_STORAGE_TEST_KEY = "_dd_test_";

function selectLocalStorageStrategy() {
    try {
        const id = generateUUID(), testKey = `_dd_test_${id}`;
        localStorage.setItem(testKey, id);
        const retrievedId = localStorage.getItem(testKey);
        return localStorage.removeItem(testKey), id === retrievedId ? {
            type: SessionPersistence.LOCAL_STORAGE
        } : void 0;
    } catch (_a) {
        return;
    }
}

function initLocalStorageStrategy() {
    return {
        isLockEnabled: !1,
        persistSession: persistInLocalStorage,
        retrieveSession: retrieveSessionFromLocalStorage,
        expireSession: expireSessionFromLocalStorage
    };
}

function persistInLocalStorage(sessionState) {
    localStorage.setItem("_dd_s", toSessionString(sessionState));
}

function retrieveSessionFromLocalStorage() {
    return toSessionState(localStorage.getItem("_dd_s"));
}

function expireSessionFromLocalStorage(previousSessionState) {
    persistInLocalStorage(getExpiredSessionState(previousSessionState));
}

const LOCK_RETRY_DELAY = 10, LOCK_MAX_TRIES = 100, bufferedOperations = [];

let ongoingOperations;

function processSessionStoreOperations(operations, sessionStoreStrategy, numberOfRetries = 0) {
    var _a;
    const {isLockEnabled: isLockEnabled, persistSession: persistSession, expireSession: expireSession} = sessionStoreStrategy, persistWithLock = session => persistSession(polyfills_assign({}, session, {
        lock: currentLock
    })), retrieveStore = () => {
        const session = sessionStoreStrategy.retrieveSession(), lock = session.lock;
        return session.lock && delete session.lock, {
            session: session,
            lock: lock
        };
    };
    if (ongoingOperations || (ongoingOperations = operations), operations !== ongoingOperations) return void bufferedOperations.push(operations);
    if (isLockEnabled && numberOfRetries >= 100) return void next(sessionStoreStrategy);
    let currentLock, currentStore = retrieveStore();
    if (isLockEnabled) {
        if (currentStore.lock) return void retryLater(operations, sessionStoreStrategy, numberOfRetries);
        if (currentLock = generateUUID(), persistWithLock(currentStore.session), currentStore = retrieveStore(), 
        currentStore.lock !== currentLock) return void retryLater(operations, sessionStoreStrategy, numberOfRetries);
    }
    let processedSession = operations.process(currentStore.session);
    if (isLockEnabled && (currentStore = retrieveStore(), currentStore.lock !== currentLock)) retryLater(operations, sessionStoreStrategy, numberOfRetries); else {
        if (processedSession && (isSessionInExpiredState(processedSession) ? expireSession(processedSession) : (expandSessionState(processedSession), 
        isLockEnabled ? persistWithLock(processedSession) : persistSession(processedSession))), 
        isLockEnabled && (!processedSession || !isSessionInExpiredState(processedSession))) {
            if (currentStore = retrieveStore(), currentStore.lock !== currentLock) return void retryLater(operations, sessionStoreStrategy, numberOfRetries);
            persistSession(currentStore.session), processedSession = currentStore.session;
        }
        null === (_a = operations.after) || void 0 === _a || _a.call(operations, processedSession || currentStore.session), 
        next(sessionStoreStrategy);
    }
}

function retryLater(operations, sessionStore, currentNumberOfRetries) {
    timer_setTimeout((() => {
        processSessionStoreOperations(operations, sessionStore, currentNumberOfRetries + 1);
    }), 10);
}

function next(sessionStore) {
    ongoingOperations = void 0;
    const nextOperations = bufferedOperations.shift();
    nextOperations && processSessionStoreOperations(nextOperations, sessionStore);
}

const STORAGE_POLL_DELAY = 1e3;

function selectSessionStoreStrategyType(initConfiguration) {
    switch (initConfiguration.sessionPersistence) {
      case SessionPersistence.COOKIE:
        return selectCookieStrategy(initConfiguration);

      case SessionPersistence.LOCAL_STORAGE:
        return selectLocalStorageStrategy();

      case void 0:
        {
            let sessionStoreStrategyType = selectCookieStrategy(initConfiguration);
            return sessionStoreStrategyType || (sessionStoreStrategyType = selectLocalStorageStrategy()), 
            sessionStoreStrategyType;
        }

      default:
        display.error(`Invalid session persistence '${String(initConfiguration.sessionPersistence)}'`);
    }
}

function startSessionStore(sessionStoreStrategyType, productKey, computeSessionState) {
    const renewObservable = new observable_Observable, expireObservable = new observable_Observable, sessionStateUpdateObservable = new observable_Observable, sessionStoreStrategy = sessionStoreStrategyType.type === SessionPersistence.COOKIE ? initCookieStrategy(sessionStoreStrategyType.cookieOptions) : initLocalStorageStrategy(), {expireSession: expireSession} = sessionStoreStrategy, watchSessionTimeoutId = timer_setInterval((function() {
        processSessionStoreOperations({
            process: sessionState => isSessionInExpiredState(sessionState) ? getExpiredSessionState(sessionState) : void 0,
            after: synchronizeSession
        }, sessionStoreStrategy);
    }), 1e3);
    let sessionCache;
    startSession();
    const {throttled: throttledExpandOrRenewSession, cancel: cancelExpandOrRenewSession} = throttle((() => {
        processSessionStoreOperations({
            process: sessionState => {
                if (isSessionInNotStartedState(sessionState)) return;
                const synchronizedSession = synchronizeSession(sessionState);
                return function(sessionState) {
                    if (isSessionInNotStartedState(sessionState)) return !1;
                    const {trackingType: trackingType, isTracked: isTracked} = computeSessionState(sessionState[productKey]);
                    sessionState[productKey] = trackingType, delete sessionState.isExpired, isTracked && !sessionState.id && (sessionState.id = generateUUID(), 
                    sessionState.created = String(dateNow()));
                }(synchronizedSession), synchronizedSession;
            },
            after: sessionState => {
                isSessionStarted(sessionState) && !hasSessionInCache() && function(sessionState) {
                    sessionCache = sessionState, renewObservable.notify();
                }(sessionState), sessionCache = sessionState;
            }
        }, sessionStoreStrategy);
    }), 1e3);
    function synchronizeSession(sessionState) {
        return isSessionInExpiredState(sessionState) && (sessionState = getExpiredSessionState(sessionState)), 
        hasSessionInCache() && (!function(sessionState) {
            return sessionCache.id !== sessionState.id || sessionCache[productKey] !== sessionState[productKey];
        }(sessionState) ? (sessionStateUpdateObservable.notify({
            previousState: sessionCache,
            newState: sessionState
        }), sessionCache = sessionState) : (sessionCache = getExpiredSessionState(sessionCache), 
        expireObservable.notify())), sessionState;
    }
    function startSession() {
        processSessionStoreOperations({
            process: sessionState => {
                if (isSessionInNotStartedState(sessionState)) return getExpiredSessionState(sessionState);
            },
            after: sessionState => {
                sessionCache = sessionState;
            }
        }, sessionStoreStrategy);
    }
    function hasSessionInCache() {
        return void 0 !== sessionCache[productKey];
    }
    return {
        expandOrRenewSession: throttledExpandOrRenewSession,
        expandSession: function() {
            processSessionStoreOperations({
                process: sessionState => hasSessionInCache() ? synchronizeSession(sessionState) : void 0
            }, sessionStoreStrategy);
        },
        getSession: () => sessionCache,
        renewObservable: renewObservable,
        expireObservable: expireObservable,
        sessionStateUpdateObservable: sessionStateUpdateObservable,
        restartSession: startSession,
        expire: () => {
            cancelExpandOrRenewSession(), expireSession(sessionCache), synchronizeSession(getExpiredSessionState(sessionCache));
        },
        stop: () => {
            timer_clearInterval(watchSessionTimeoutId);
        },
        updateSessionState: function(partialSessionState) {
            processSessionStoreOperations({
                process: sessionState => polyfills_assign({}, sessionState, partialSessionState),
                after: synchronizeSession
            }, sessionStoreStrategy);
        }
    };
}

const intakeSites_INTAKE_SITE_STAGING = "datad0g.com", INTAKE_SITE_FED_STAGING = "dd0g-gov.com", INTAKE_SITE_US1 = "datadoghq.com", INTAKE_SITE_EU1 = "datadoghq.eu", INTAKE_SITE_US1_FED = "ddog-gov.com", PCI_INTAKE_HOST_US1 = "pci.browser-intake-datadoghq.com", INTAKE_URL_PARAMETERS = [ "ddsource", "ddtags" ];

function createEndpointBuilder(initConfiguration, trackType, configurationTags) {
    const buildUrlWithParameters = createEndpointUrlWithParametersBuilder(initConfiguration, trackType);
    return {
        build(api, payload) {
            const parameters = buildEndpointParameters(initConfiguration, trackType, configurationTags, api, payload);
            return buildUrlWithParameters(parameters);
        },
        urlPrefix: buildUrlWithParameters(""),
        trackType: trackType
    };
}

function createEndpointUrlWithParametersBuilder(initConfiguration, trackType) {
    const path = `/api/v2/${trackType}`, proxy = initConfiguration.proxy;
    if ("string" == typeof proxy) {
        const normalizedProxyUrl = normalizeUrl(proxy);
        return parameters => `${normalizedProxyUrl}?ddforward=${encodeURIComponent(`${path}?${parameters}`)}`;
    }
    if ("function" == typeof proxy) return parameters => proxy({
        path: path,
        parameters: parameters
    });
    const host = buildEndpointHost(trackType, initConfiguration);
    return parameters => `https://${host}${path}?${parameters}`;
}

function buildEndpointHost(trackType, initConfiguration) {
    const {site: site = INTAKE_SITE_US1, internalAnalyticsSubdomain: internalAnalyticsSubdomain} = initConfiguration;
    if ("logs" === trackType && initConfiguration.usePciIntake && site === INTAKE_SITE_US1) return PCI_INTAKE_HOST_US1;
    if (internalAnalyticsSubdomain && site === INTAKE_SITE_US1) return `${internalAnalyticsSubdomain}.${INTAKE_SITE_US1}`;
    if ("dd0g-gov.com" === site) return `http-intake.logs.${site}`;
    const domainParts = site.split("."), extension = domainParts.pop();
    return `browser-intake-${domainParts.join("-")}.${extension}`;
}

function buildEndpointParameters({clientToken: clientToken, internalAnalyticsSubdomain: internalAnalyticsSubdomain}, trackType, configurationTags, api, {retry: retry, encoding: encoding}) {
    const tags = [ "sdk_version:5.35.0", `api:${api}` ].concat(configurationTags);
    retry && tags.push(`retry_count:${retry.count}`, `retry_after:${retry.lastFailureStatus}`);
    const parameters = [ "ddsource=browser", `ddtags=${encodeURIComponent(tags.join(","))}`, `dd-api-key=${clientToken}`, `dd-evp-origin-version=${encodeURIComponent("5.35.0")}`, "dd-evp-origin=browser", `dd-request-id=${generateUUID()}` ];
    return encoding && parameters.push(`dd-evp-encoding=${encoding}`), "rum" === trackType && parameters.push(`batch_time=${timeUtils_timeStampNow()}`), 
    internalAnalyticsSubdomain && parameters.reverse(), parameters.join("&");
}

const TAG_SIZE_LIMIT = 200;

function buildTags(configuration) {
    const {env: env, service: service, version: version, datacenter: datacenter} = configuration, tags = [];
    return env && tags.push(buildTag("env", env)), service && tags.push(buildTag("service", service)), 
    version && tags.push(buildTag("version", version)), datacenter && tags.push(buildTag("datacenter", datacenter)), 
    tags;
}

function buildTag(key, rawValue) {
    const valueSizeLimit = 200 - key.length - 1;
    (rawValue.length > valueSizeLimit || hasForbiddenCharacters(rawValue)) && display.warn(`${key} value doesn't meet tag requirements and will be sanitized. More details: ${DOCS_ORIGIN}/getting_started/tagging/#defining-tags`);
    return `${key}:${rawValue.replace(/,/g, "_")}`;
}

function hasForbiddenCharacters(rawValue) {
    return !!supportUnicodePropertyEscapes() && new RegExp("[^\\p{Ll}\\p{Lo}0-9_:./-]", "u").test(rawValue);
}

function supportUnicodePropertyEscapes() {
    try {
        return new RegExp("[\\p{Ll}]", "u"), !0;
    } catch (_a) {
        return !1;
    }
}

function computeTransportConfiguration(initConfiguration) {
    const site = initConfiguration.site || INTAKE_SITE_US1, tags = buildTags(initConfiguration), endpointBuilders = computeEndpointBuilders(initConfiguration, tags);
    return polyfills_assign({
        replica: computeReplicaConfiguration(initConfiguration, tags),
        site: site
    }, endpointBuilders);
}

function computeEndpointBuilders(initConfiguration, tags) {
    return {
        logsEndpointBuilder: createEndpointBuilder(initConfiguration, "logs", tags),
        rumEndpointBuilder: createEndpointBuilder(initConfiguration, "rum", tags),
        sessionReplayEndpointBuilder: createEndpointBuilder(initConfiguration, "replay", tags)
    };
}

function computeReplicaConfiguration(initConfiguration, tags) {
    if (!initConfiguration.replica) return;
    const replicaConfiguration = polyfills_assign({}, initConfiguration, {
        site: INTAKE_SITE_US1,
        clientToken: initConfiguration.replica.clientToken
    }), replicaEndpointBuilders = {
        logsEndpointBuilder: createEndpointBuilder(replicaConfiguration, "logs", tags),
        rumEndpointBuilder: createEndpointBuilder(replicaConfiguration, "rum", tags)
    };
    return polyfills_assign({
        applicationId: initConfiguration.replica.applicationId
    }, replicaEndpointBuilders);
}

function isIntakeUrl(url) {
    return INTAKE_URL_PARAMETERS.every((param => polyfills_includes(url, param)));
}

const DefaultPrivacyLevel = {
    ALLOW: "allow",
    MASK: "mask",
    MASK_USER_INPUT: "mask-user-input"
}, TraceContextInjection = {
    ALL: "all",
    SAMPLED: "sampled"
};

function isString(tag, tagName) {
    return null == tag || "string" == typeof tag || (display.error(`${tagName} must be defined as a string`), 
    !1);
}

function isDatadogSite(site) {
    return !(site && "string" == typeof site && !/(datadog|ddog|datad0g|dd0g)/.test(site)) || (display.error(`Site should be a valid Datadog site. More details: ${DOCS_ORIGIN}/getting_started/site/.`), 
    !1);
}

function isSampleRate(sampleRate, name) {
    return !(void 0 !== sampleRate && !isPercentage(sampleRate)) || (display.error(`${name} Sample Rate should be a number between 0 and 100`), 
    !1);
}

function validateAndBuildConfiguration(initConfiguration) {
    var _a, _b, _c, _d, _e;
    if (initConfiguration && initConfiguration.clientToken) {
        if (isDatadogSite(initConfiguration.site) && isSampleRate(initConfiguration.sessionSampleRate, "Session") && isSampleRate(initConfiguration.telemetrySampleRate, "Telemetry") && isSampleRate(initConfiguration.telemetryConfigurationSampleRate, "Telemetry Configuration") && isSampleRate(initConfiguration.telemetryUsageSampleRate, "Telemetry Usage") && isString(initConfiguration.version, "Version") && isString(initConfiguration.env, "Env") && isString(initConfiguration.service, "Service")) {
            if (void 0 === initConfiguration.trackingConsent || objectHasValue(TrackingConsent, initConfiguration.trackingConsent)) return polyfills_assign({
                beforeSend: initConfiguration.beforeSend && catchUserErrors(initConfiguration.beforeSend, "beforeSend threw an error:"),
                sessionStoreStrategyType: selectSessionStoreStrategyType(initConfiguration),
                sessionSampleRate: null !== (_a = initConfiguration.sessionSampleRate) && void 0 !== _a ? _a : 100,
                telemetrySampleRate: null !== (_b = initConfiguration.telemetrySampleRate) && void 0 !== _b ? _b : 20,
                telemetryConfigurationSampleRate: null !== (_c = initConfiguration.telemetryConfigurationSampleRate) && void 0 !== _c ? _c : 5,
                telemetryUsageSampleRate: null !== (_d = initConfiguration.telemetryUsageSampleRate) && void 0 !== _d ? _d : 5,
                service: initConfiguration.service || void 0,
                silentMultipleInit: !!initConfiguration.silentMultipleInit,
                allowUntrustedEvents: !!initConfiguration.allowUntrustedEvents,
                trackingConsent: null !== (_e = initConfiguration.trackingConsent) && void 0 !== _e ? _e : TrackingConsent.GRANTED,
                storeContextsAcrossPages: !!initConfiguration.storeContextsAcrossPages,
                batchBytesLimit: 16384,
                eventRateLimiterThreshold: 3e3,
                maxTelemetryEventsPerPage: 15,
                flushTimeout: 3e4,
                batchMessagesLimit: 50,
                messageBytesLimit: 262144
            }, computeTransportConfiguration(initConfiguration));
            display.error('Tracking Consent should be either "granted" or "not-granted"');
        }
    } else display.error("Client Token is not configured, we will not send any data.");
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
        session_persistence: initConfiguration.sessionPersistence,
        store_contexts_across_pages: !!initConfiguration.storeContextsAcrossPages,
        allow_untrusted_events: !!initConfiguration.allowUntrustedEvents,
        tracking_consent: initConfiguration.trackingConsent
    };
}

function matchOption_isMatchOption(item) {
    const itemType = typeUtils_getType(item);
    return "string" === itemType || "function" === itemType || item instanceof RegExp;
}

function matchList(list, value, useStartsWith = !1) {
    return list.some((item => {
        try {
            if ("function" == typeof item) return item(value);
            if (item instanceof RegExp) return item.test(value);
            if ("string" == typeof item) return useStartsWith ? startsWith(value, item) : item === value;
        } catch (e) {
            display.error(e);
        }
        return !1;
    }));
}

function isTracingOption(item) {
    const expectedItem = item;
    return "object" === typeUtils_getType(expectedItem) && matchOption_isMatchOption(expectedItem.match) && Array.isArray(expectedItem.propagatorTypes);
}

function clearTracingIfNeeded(context) {
    0 !== context.status || context.isAborted || (context.traceId = void 0, context.spanId = void 0, 
    context.traceSampled = void 0);
}

function startTracer(configuration, sessionManager) {
    return {
        clearTracingIfNeeded: clearTracingIfNeeded,
        traceFetch: context => injectHeadersIfTracingAllowed(configuration, context, sessionManager, (tracingHeaders => {
            var _a;
            if (context.input instanceof Request && !(null === (_a = context.init) || void 0 === _a ? void 0 : _a.headers)) context.input = new Request(context.input), 
            Object.keys(tracingHeaders).forEach((key => {
                context.input.headers.append(key, tracingHeaders[key]);
            })); else {
                context.init = shallowClone(context.init);
                const headers = [];
                context.init.headers instanceof Headers ? context.init.headers.forEach(((value, key) => {
                    headers.push([ key, value ]);
                })) : Array.isArray(context.init.headers) ? context.init.headers.forEach((header => {
                    headers.push(header);
                })) : context.init.headers && Object.keys(context.init.headers).forEach((key => {
                    headers.push([ key, context.init.headers[key] ]);
                })), context.init.headers = headers.concat(objectEntries(tracingHeaders));
            }
        })),
        traceXhr: (context, xhr) => injectHeadersIfTracingAllowed(configuration, context, sessionManager, (tracingHeaders => {
            Object.keys(tracingHeaders).forEach((name => {
                xhr.setRequestHeader(name, tracingHeaders[name]);
            }));
        }))
    };
}

function injectHeadersIfTracingAllowed(configuration, context, sessionManager, inject) {
    isTracingSupported() && sessionManager.findTrackedSession();
}

function isTracingSupported() {
    return !1;
}

const DEFAULT_PROPAGATOR_TYPES = [ "tracecontext", "datadog" ];

function validateAndBuildRumConfiguration(initConfiguration) {
    var _a, _b, _c;
    if (!initConfiguration.applicationId) return void display.error("Application ID is not configured, no RUM data will be collected.");
    if (!isSampleRate(initConfiguration.sessionReplaySampleRate, "Session Replay") || !isSampleRate(initConfiguration.traceSampleRate, "Trace")) return;
    if (void 0 !== initConfiguration.excludedActivityUrls && !Array.isArray(initConfiguration.excludedActivityUrls)) return void display.error("Excluded Activity Urls should be an array");
    const allowedTracingUrls = validateAndBuildTracingOptions(initConfiguration);
    if (!allowedTracingUrls) return;
    const baseConfiguration = validateAndBuildConfiguration(initConfiguration);
    if (!baseConfiguration) return;
    const sessionReplaySampleRate = null !== (_a = initConfiguration.sessionReplaySampleRate) && void 0 !== _a ? _a : 0;
    return polyfills_assign({
        applicationId: initConfiguration.applicationId,
        version: initConfiguration.version || void 0,
        actionNameAttribute: initConfiguration.actionNameAttribute,
        sessionReplaySampleRate: sessionReplaySampleRate,
        startSessionReplayRecordingManually: void 0 !== initConfiguration.startSessionReplayRecordingManually ? !!initConfiguration.startSessionReplayRecordingManually : 0 === sessionReplaySampleRate,
        traceSampleRate: null !== (_b = initConfiguration.traceSampleRate) && void 0 !== _b ? _b : 100,
        rulePsr: isNumber(initConfiguration.traceSampleRate) ? initConfiguration.traceSampleRate / 100 : void 0,
        allowedTracingUrls: allowedTracingUrls,
        excludedActivityUrls: null !== (_c = initConfiguration.excludedActivityUrls) && void 0 !== _c ? _c : [],
        workerUrl: initConfiguration.workerUrl,
        compressIntakeRequests: !!initConfiguration.compressIntakeRequests,
        trackUserInteractions: !!initConfiguration.trackUserInteractions,
        trackViewsManually: !!initConfiguration.trackViewsManually,
        trackResources: !!initConfiguration.trackResources,
        trackLongTasks: !!initConfiguration.trackLongTasks,
        subdomain: initConfiguration.subdomain,
        defaultPrivacyLevel: objectHasValue(DefaultPrivacyLevel, initConfiguration.defaultPrivacyLevel) ? initConfiguration.defaultPrivacyLevel : DefaultPrivacyLevel.MASK,
        enablePrivacyForActionName: !!initConfiguration.enablePrivacyForActionName,
        customerDataTelemetrySampleRate: 1,
        traceContextInjection: objectHasValue(TraceContextInjection, initConfiguration.traceContextInjection) ? initConfiguration.traceContextInjection : TraceContextInjection.ALL,
        plugins: initConfiguration.plugins || []
    }, baseConfiguration);
}

function validateAndBuildTracingOptions(initConfiguration) {
    if (void 0 === initConfiguration.allowedTracingUrls) return [];
    if (!Array.isArray(initConfiguration.allowedTracingUrls)) return void display.error("Allowed Tracing URLs should be an array");
    if (0 !== initConfiguration.allowedTracingUrls.length && void 0 === initConfiguration.service) return void display.error("Service needs to be configured when tracing is enabled");
    const tracingOptions = [];
    return initConfiguration.allowedTracingUrls.forEach((option => {
        matchOption_isMatchOption(option) ? tracingOptions.push({
            match: option,
            propagatorTypes: DEFAULT_PROPAGATOR_TYPES
        }) : isTracingOption(option) ? tracingOptions.push(option) : display.warn("Allowed Tracing Urls parameters should be a string, RegExp, function, or an object. Ignoring parameter", option);
    })), tracingOptions;
}

function getSelectedTracingPropagators(configuration) {
    const usedTracingPropagators = new Set;
    return Array.isArray(configuration.allowedTracingUrls) && configuration.allowedTracingUrls.length > 0 && configuration.allowedTracingUrls.forEach((option => {
        isMatchOption(option) ? DEFAULT_PROPAGATOR_TYPES.forEach((propagatorType => usedTracingPropagators.add(propagatorType))) : "object" === getType(option) && Array.isArray(option.propagatorTypes) && option.propagatorTypes.forEach((propagatorType => usedTracingPropagators.add(propagatorType)));
    })), arrayFrom(usedTracingPropagators);
}

function serializeRumConfiguration(configuration) {
    var _a;
    const baseSerializedConfiguration = serializeConfiguration(configuration);
    return assign({
        session_replay_sample_rate: configuration.sessionReplaySampleRate,
        start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually,
        trace_sample_rate: configuration.traceSampleRate,
        trace_context_injection: configuration.traceContextInjection,
        action_name_attribute: configuration.actionNameAttribute,
        use_allowed_tracing_urls: Array.isArray(configuration.allowedTracingUrls) && configuration.allowedTracingUrls.length > 0,
        selected_tracing_propagators: getSelectedTracingPropagators(configuration),
        default_privacy_level: configuration.defaultPrivacyLevel,
        enable_privacy_for_action_name: configuration.enablePrivacyForActionName,
        use_excluded_activity_urls: Array.isArray(configuration.excludedActivityUrls) && configuration.excludedActivityUrls.length > 0,
        use_worker_url: !!configuration.workerUrl,
        compress_intake_requests: configuration.compressIntakeRequests,
        track_views_manually: configuration.trackViewsManually,
        track_user_interactions: configuration.trackUserInteractions,
        track_resources: configuration.trackResources,
        track_long_task: configuration.trackLongTasks,
        plugins: null === (_a = configuration.plugins) || void 0 === _a ? void 0 : _a.map((plugin => {
            var _a;
            return assign({
                name: plugin.name
            }, null === (_a = plugin.getConfigurationTelemetry) || void 0 === _a ? void 0 : _a.call(plugin));
        }))
    }, baseSerializedConfiguration);
}

function callPluginsMethod(plugins, methodName, parameter) {
    if (plugins) for (const plugin of plugins) {
        const method = plugin[methodName];
        method && method(parameter);
    }
}

function createPreStartStrategy({ignoreInitIfSyntheticsWillInjectRum: ignoreInitIfSyntheticsWillInjectRum, startDeflateWorker: startDeflateWorker}, getCommonContext, trackingConsentState, customVitalsState, doStartRum) {
    const bufferApiCalls = boundedBuffer_createBoundedBuffer();
    let firstStartViewCall, deflateWorker, cachedInitConfiguration, cachedConfiguration;
    const trackingConsentStateSubscription = trackingConsentState.observable.subscribe(tryStartRum);
    function tryStartRum() {
        if (!cachedInitConfiguration || !cachedConfiguration || !trackingConsentState.isGranted()) return;
        let initialViewOptions;
        if (trackingConsentStateSubscription.unsubscribe(), cachedConfiguration.trackViewsManually) {
            if (!firstStartViewCall) return;
            bufferApiCalls.remove(firstStartViewCall.callback), initialViewOptions = firstStartViewCall.options;
        }
        const startRumResult = doStartRum(cachedConfiguration, deflateWorker, initialViewOptions);
        bufferApiCalls.drain(startRumResult);
    }
    const addDurationVital = vital => {
        bufferApiCalls.add((startRumResult => startRumResult.addDurationVital(vital)));
    };
    return {
        init(initConfiguration, publicApi) {
            initConfiguration ? (cachedInitConfiguration = initConfiguration, ignoreInitIfSyntheticsWillInjectRum && willSyntheticsInjectRum() || (callPluginsMethod(initConfiguration.plugins, "onInit", {
                initConfiguration: initConfiguration,
                publicApi: publicApi
            }), function(initConfiguration) {
                if (cachedInitConfiguration = initConfiguration, cachedConfiguration) return void displayAlreadyInitializedError("DD_RUM", initConfiguration);
                const configuration = validateAndBuildRumConfiguration(initConfiguration);
                configuration && (configuration.sessionStoreStrategyType ? configuration.compressIntakeRequests && startDeflateWorker && (deflateWorker = startDeflateWorker(configuration, "Datadog RUM", functionUtils_noop), 
                !deflateWorker) || (cachedConfiguration = configuration, initFetchObservable().subscribe(functionUtils_noop), 
                trackingConsentState.tryToInit(configuration.trackingConsent), tryStartRum()) : display.warn("No storage available for session. We will not send any data."));
            }(initConfiguration))) : display.error("Missing configuration");
        },
        get initConfiguration() {
            return cachedInitConfiguration;
        },
        getInternalContext: functionUtils_noop,
        stopSession: functionUtils_noop,
        addTiming(name, time = timeUtils_timeStampNow()) {
            bufferApiCalls.add((startRumResult => startRumResult.addTiming(name, time)));
        },
        startView(options, startClocks = clocksNow()) {
            const callback = startRumResult => {
                startRumResult.startView(options, startClocks);
            };
            bufferApiCalls.add(callback), firstStartViewCall || (firstStartViewCall = {
                options: options,
                callback: callback
            }, tryStartRum());
        },
        setViewName(name) {
            bufferApiCalls.add((startRumResult => startRumResult.setViewName(name)));
        },
        setViewContext(context) {
            bufferApiCalls.add((startRumResult => startRumResult.setViewContext(context)));
        },
        setViewContextProperty(key, value) {
            bufferApiCalls.add((startRumResult => startRumResult.setViewContextProperty(key, value)));
        },
        addAction(action, commonContext = getCommonContext()) {
            bufferApiCalls.add((startRumResult => startRumResult.addAction(action, commonContext)));
        },
        addError(providedError, commonContext = getCommonContext()) {
            bufferApiCalls.add((startRumResult => startRumResult.addError(providedError, commonContext)));
        },
        startDurationVital: (name, options) => startDurationVital(customVitalsState, name, options),
        stopDurationVital(name, options) {
            stopDurationVital(addDurationVital, customVitalsState, name, options);
        },
        addDurationVital: addDurationVital
    };
}

const RUM_STORAGE_KEY = "rum";

function makeRumPublicApi(startRumImpl, recorderApi, options = {}) {
    const customerDataTrackerManager = createCustomerDataTrackerManager(0), globalContextManager = createContextManager(customerDataTrackerManager.getOrCreateTracker(2)), userContextManager = createContextManager(customerDataTrackerManager.getOrCreateTracker(1)), trackingConsentState = createTrackingConsentState(), customVitalsState = createCustomVitalsState();
    function getCommonContext() {
        return buildCommonContext(globalContextManager, userContextManager, recorderApi);
    }
    let strategy = createPreStartStrategy(options, getCommonContext, trackingConsentState, customVitalsState, ((configuration, deflateWorker, initialViewOptions) => {
        configuration.storeContextsAcrossPages && (storeContextManager(configuration, globalContextManager, "rum", 2), 
        storeContextManager(configuration, userContextManager, "rum", 1)), customerDataTrackerManager.setCompressionStatus(deflateWorker ? 1 : 2);
        const startRumResult = startRumImpl(configuration, recorderApi, customerDataTrackerManager, getCommonContext, initialViewOptions, deflateWorker && options.createDeflateEncoder ? streamId => options.createDeflateEncoder(configuration, deflateWorker, streamId) : createIdentityEncoder, trackingConsentState, customVitalsState);
        return recorderApi.onRumStart(startRumResult.lifeCycle, configuration, startRumResult.session, startRumResult.viewHistory, deflateWorker), 
        strategy = createPostStartStrategy(strategy, startRumResult), startRumResult;
    }));
    const startView = monitor((options => {
        const sanitizedOptions = "object" == typeof options ? options : {
            name: options
        };
        sanitizedOptions.context && customerDataTrackerManager.getOrCreateTracker(3).updateCustomerData(sanitizedOptions.context), 
        strategy.startView(sanitizedOptions);
    })), rumPublicApi = makePublicApi({
        init: monitor((initConfiguration => {
            strategy.init(initConfiguration, rumPublicApi);
        })),
        setTrackingConsent: monitor((trackingConsent => {
            trackingConsentState.update(trackingConsent);
        })),
        setViewName: monitor((name => {
            strategy.setViewName(name);
        })),
        setViewContext: monitor((context => {
            strategy.setViewContext(context);
        })),
        setViewContextProperty: monitor(((key, value) => {
            strategy.setViewContextProperty(key, value);
        })),
        setGlobalContext: monitor((context => {
            globalContextManager.setContext(context);
        })),
        getGlobalContext: monitor((() => globalContextManager.getContext())),
        setGlobalContextProperty: monitor(((key, value) => {
            globalContextManager.setContextProperty(key, value);
        })),
        removeGlobalContextProperty: monitor((key => globalContextManager.removeContextProperty(key))),
        clearGlobalContext: monitor((() => globalContextManager.clearContext())),
        getInternalContext: monitor((startTime => strategy.getInternalContext(startTime))),
        getInitConfiguration: monitor((() => deepClone(strategy.initConfiguration))),
        addAction: (name, context) => {
            const handlingStack = createHandlingStack();
            callMonitored((() => {
                strategy.addAction({
                    name: sanitize(name),
                    context: sanitize(context),
                    startClocks: clocksNow(),
                    type: "custom",
                    handlingStack: handlingStack
                });
            }));
        },
        addError: (error, context) => {
            const handlingStack = createHandlingStack();
            callMonitored((() => {
                strategy.addError({
                    error: error,
                    handlingStack: handlingStack,
                    context: sanitize(context),
                    startClocks: clocksNow()
                });
            }));
        },
        addTiming: monitor(((name, time) => {
            strategy.addTiming(sanitize(name), time);
        })),
        setUser: monitor((newUser => {
            checkUser(newUser) && userContextManager.setContext(sanitizeUser(newUser));
        })),
        getUser: monitor((() => userContextManager.getContext())),
        setUserProperty: monitor(((key, property) => {
            const sanitizedProperty = sanitizeUser({
                [key]: property
            })[key];
            userContextManager.setContextProperty(key, sanitizedProperty);
        })),
        removeUserProperty: monitor((key => userContextManager.removeContextProperty(key))),
        clearUser: monitor((() => userContextManager.clearContext())),
        startView: startView,
        stopSession: monitor((() => {
            strategy.stopSession();
        })),
        getSessionReplayLink: monitor((() => recorderApi.getSessionReplayLink())),
        startSessionReplayRecording: monitor((options => {
            recorderApi.start(options);
        })),
        stopSessionReplayRecording: monitor((() => recorderApi.stop())),
        addDurationVital: monitor(((name, options) => {
            strategy.addDurationVital({
                name: sanitize(name),
                type: "duration",
                startClocks: timeStampToClocks(options.startTime),
                duration: options.duration,
                context: sanitize(options && options.context),
                description: sanitize(options && options.description)
            });
        })),
        startDurationVital: monitor(((name, options) => strategy.startDurationVital(sanitize(name), {
            context: sanitize(options && options.context),
            description: sanitize(options && options.description)
        }))),
        stopDurationVital: monitor(((nameOrRef, options) => {
            strategy.stopDurationVital("string" == typeof nameOrRef ? sanitize(nameOrRef) : nameOrRef, {
                context: sanitize(options && options.context),
                description: sanitize(options && options.description)
            });
        }))
    });
    return rumPublicApi;
}

function createPostStartStrategy(preStartStrategy, startRumResult) {
    return polyfills_assign({
        init: initConfiguration => {
            displayAlreadyInitializedError("DD_RUM", initConfiguration);
        },
        initConfiguration: preStartStrategy.initConfiguration
    }, startRumResult);
}

const PageExitReason = {
    HIDDEN: "visibility_hidden",
    UNLOADING: "before_unload",
    PAGEHIDE: "page_hide",
    FROZEN: "page_frozen"
};

function createPageExitObservable(configuration) {
    return new observable_Observable((observable => {
        const {stop: stopListeners} = addEventListeners(configuration, window, [ "visibilitychange", "freeze" ], (event => {
            "visibilitychange" === event.type && "hidden" === document.visibilityState ? observable.notify({
                reason: PageExitReason.HIDDEN
            }) : "freeze" === event.type && observable.notify({
                reason: PageExitReason.FROZEN
            });
        }), {
            capture: !0
        }), stopBeforeUnloadListener = addEventListener(configuration, window, "beforeunload", (() => {
            observable.notify({
                reason: PageExitReason.UNLOADING
            });
        })).stop;
        return () => {
            stopListeners(), stopBeforeUnloadListener();
        };
    }));
}

function isPageExitReason(reason) {
    return polyfills_includes(objectValues(PageExitReason), reason);
}

function createDOMMutationObservable() {
    const MutationObserver = getMutationObserverConstructor();
    return new observable_Observable((observable => {
        if (!MutationObserver) return;
        const observer = new MutationObserver(monitor((() => observable.notify())));
        return observer.observe(document, {
            attributes: !0,
            characterData: !0,
            childList: !0,
            subtree: !0
        }), () => observer.disconnect();
    }));
}

function getMutationObserverConstructor() {
    let constructor;
    const browserWindow = window;
    if (browserWindow.Zone && (constructor = getZoneJsOriginalValue(browserWindow, "MutationObserver"), 
    browserWindow.MutationObserver && constructor === browserWindow.MutationObserver)) {
        const originalInstance = getZoneJsOriginalValue(new browserWindow.MutationObserver(functionUtils_noop), "originalInstance");
        constructor = originalInstance && originalInstance.constructor;
    }
    return constructor || (constructor = browserWindow.MutationObserver), constructor;
}

function createWindowOpenObservable() {
    const observable = new observable_Observable, {stop: stop} = instrumentMethod(window, "open", (() => observable.notify()));
    return {
        observable: observable,
        stop: stop
    };
}

const ErrorSource = {
    AGENT: "agent",
    CONSOLE: "console",
    CUSTOM: "custom",
    LOGGER: "logger",
    NETWORK: "network",
    SOURCE: "source",
    REPORT: "report"
};

function createEventRateLimiter(eventType, limit, onLimitReached) {
    let eventCount = 0, allowNextEvent = !1;
    return {
        isLimitReached() {
            if (0 === eventCount && timer_setTimeout((() => {
                eventCount = 0;
            }), 6e4), eventCount += 1, eventCount <= limit || allowNextEvent) return allowNextEvent = !1, 
            !1;
            if (eventCount === limit + 1) {
                allowNextEvent = !0;
                try {
                    onLimitReached({
                        message: `Reached max number of ${eventType}s by minute: ${limit}`,
                        source: ErrorSource.AGENT,
                        startClocks: clocksNow()
                    });
                } finally {
                    allowNextEvent = !1;
                }
            }
            return !0;
        }
    };
}

function connectivity_getConnectivity() {
    var _a;
    const navigator = window.navigator;
    return {
        status: navigator.onLine ? "connected" : "not_connected",
        interfaces: navigator.connection && navigator.connection.type ? [ navigator.connection.type ] : void 0,
        effective_type: null === (_a = navigator.connection) || void 0 === _a ? void 0 : _a.effectiveType
    };
}

function getSyntheticsContext() {
    const testId = getSyntheticsTestId(), resultId = getSyntheticsResultId();
    if (testId && resultId) return {
        test_id: testId,
        result_id: resultId,
        injected: willSyntheticsInjectRum()
    };
}

function limitModification(object, modifiableFieldPaths, modifier) {
    const clone = deepClone(object), result = modifier(clone);
    return objectEntries(modifiableFieldPaths).forEach((([fieldPath, fieldType]) => {
        const newValue = get(clone, fieldPath), newType = typeUtils_getType(newValue);
        newType === fieldType ? set(object, fieldPath, sanitize(newValue)) : "object" !== fieldType || "undefined" !== newType && "null" !== newType || set(object, fieldPath, {});
    })), result;
}

function get(object, path) {
    let current = object;
    for (const field of path.split(".")) {
        if (!isValidObjectContaining(current, field)) return;
        current = current[field];
    }
    return current;
}

function set(object, path, value) {
    let current = object;
    const fields = path.split(".");
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (!isValidObject(current)) return;
        i !== fields.length - 1 ? current = current[field] : current[field] = value;
    }
}

function isValidObject(object) {
    return "object" === typeUtils_getType(object);
}

function isValidObjectContaining(object, field) {
    return isValidObject(object) && Object.prototype.hasOwnProperty.call(object, field);
}

const VIEW_MODIFIABLE_FIELD_PATHS = {
    "view.name": "string",
    "view.url": "string",
    "view.referrer": "string"
}, USER_CUSTOMIZABLE_FIELD_PATHS = {
    context: "object"
}, ROOT_MODIFIABLE_FIELD_PATHS = {
    service: "string",
    version: "string"
};

let modifiableFieldPathsByEvent;

function startRumAssembly(configuration, lifeCycle, sessionManager, viewHistory, urlContexts, actionContexts, displayContext, ciVisibilityContext, getCommonContext, reportError) {
    modifiableFieldPathsByEvent = {
        view: polyfills_assign({}, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS),
        error: polyfills_assign({
            "error.message": "string",
            "error.stack": "string",
            "error.resource.url": "string",
            "error.fingerprint": "string"
        }, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS, ROOT_MODIFIABLE_FIELD_PATHS),
        resource: polyfills_assign({
            "resource.url": "string"
        }, {}, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS, ROOT_MODIFIABLE_FIELD_PATHS),
        action: polyfills_assign({
            "action.target.name": "string"
        }, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS, ROOT_MODIFIABLE_FIELD_PATHS),
        long_task: polyfills_assign({}, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS),
        vital: polyfills_assign({}, USER_CUSTOMIZABLE_FIELD_PATHS, VIEW_MODIFIABLE_FIELD_PATHS)
    };
    const eventRateLimiters = {
        error: createEventRateLimiter("error", configuration.eventRateLimiterThreshold, reportError),
        action: createEventRateLimiter("action", configuration.eventRateLimiterThreshold, reportError),
        vital: createEventRateLimiter("vital", configuration.eventRateLimiterThreshold, reportError)
    }, syntheticsContext = getSyntheticsContext();
    lifeCycle.subscribe(11, (({startTime: startTime, rawRumEvent: rawRumEvent, domainContext: domainContext, savedCommonContext: savedCommonContext, customerContext: customerContext}) => {
        const viewHistoryEntry = viewHistory.findView(startTime), urlContext = urlContexts.findUrl(startTime), session = sessionManager.findTrackedSession(startTime);
        if (session && viewHistoryEntry && urlContext) {
            const commonContext = savedCommonContext || getCommonContext(), actionId = actionContexts.findActionId(startTime), serverRumEvent = mergeInto_combine({
                _dd: {
                    format_version: 2,
                    drift: currentDrift(),
                    configuration: {
                        session_sample_rate: round(configuration.sessionSampleRate, 3),
                        session_replay_sample_rate: round(configuration.sessionReplaySampleRate, 3)
                    },
                    browser_sdk_version: "5.35.0"
                },
                application: {
                    id: configuration.applicationId
                },
                date: timeUtils_timeStampNow(),
                service: viewHistoryEntry.service || configuration.service,
                version: viewHistoryEntry.version || configuration.version,
                source: "browser",
                session: {
                    id: session.id,
                    type: syntheticsContext ? "synthetics" : ciVisibilityContext.get() ? "ci_test" : "user"
                },
                view: {
                    id: viewHistoryEntry.id,
                    name: viewHistoryEntry.name,
                    url: urlContext.url,
                    referrer: urlContext.referrer
                },
                action: needToAssembleWithAction(rawRumEvent) && actionId ? {
                    id: actionId
                } : void 0,
                synthetics: syntheticsContext,
                ci_test: ciVisibilityContext.get(),
                display: displayContext.get(),
                connectivity: connectivity_getConnectivity()
            }, rawRumEvent);
            serverRumEvent.context = mergeInto_combine(commonContext.context, viewHistoryEntry.context, customerContext), 
            "has_replay" in serverRumEvent.session || (serverRumEvent.session.has_replay = commonContext.hasReplay), 
            "view" === serverRumEvent.type && (serverRumEvent.session.sampled_for_replay = 1 === session.sessionReplay), 
            isEmptyObject(commonContext.user) || (serverRumEvent.usr = commonContext.user), 
            shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters) && (isEmptyObject(serverRumEvent.context) && delete serverRumEvent.context, 
            lifeCycle.notify(12, serverRumEvent));
        }
    }));
}

function shouldSend(event, beforeSend, domainContext, eventRateLimiters) {
    var _a;
    if (beforeSend) {
        const result = limitModification(event, modifiableFieldPathsByEvent[event.type], (event => beforeSend(event, domainContext)));
        if (!1 === result && "view" !== event.type) return !1;
        !1 === result && display.warn("Can't dismiss view events using beforeSend!");
    }
    return !(null === (_a = eventRateLimiters[event.type]) || void 0 === _a ? void 0 : _a.isLimitReached());
}

function needToAssembleWithAction(event) {
    return -1 !== [ "error", "resource", "long_task" ].indexOf(event.type);
}

function startInternalContext(applicationId, sessionManager, viewHistory, actionContexts, urlContexts) {
    return {
        get: startTime => {
            const viewContext = viewHistory.findView(startTime), urlContext = urlContexts.findUrl(startTime), session = sessionManager.findTrackedSession(startTime);
            if (session && viewContext && urlContext) {
                const actionId = actionContexts.findActionId(startTime);
                return {
                    application_id: applicationId,
                    session_id: session.id,
                    user_action: actionId ? {
                        id: actionId
                    } : void 0,
                    view: {
                        id: viewContext.id,
                        name: viewContext.name,
                        referrer: urlContext.referrer,
                        url: urlContext.url
                    }
                };
            }
        }
    };
}

class AbstractLifeCycle {
    constructor() {
        this.callbacks = {};
    }
    notify(eventType, data) {
        const eventCallbacks = this.callbacks[eventType];
        eventCallbacks && eventCallbacks.forEach((callback => callback(data)));
    }
    subscribe(eventType, callback) {
        return this.callbacks[eventType] || (this.callbacks[eventType] = []), this.callbacks[eventType].push(callback), 
        {
            unsubscribe: () => {
                this.callbacks[eventType] = this.callbacks[eventType].filter((other => callback !== other));
            }
        };
    }
}

const LifeCycle = AbstractLifeCycle, END_OF_TIMES = 1 / 0, CLEAR_OLD_VALUES_INTERVAL = 6e4;

function createValueHistory({expireDelay: expireDelay, maxEntries: maxEntries}) {
    let entries = [];
    const clearOldValuesInterval = timer_setInterval((() => function() {
        const oldTimeThreshold = timeUtils_relativeNow() - expireDelay;
        for (;entries.length > 0 && entries[entries.length - 1].endTime < oldTimeThreshold; ) entries.pop();
    }()), 6e4);
    return {
        add: function(value, startTime) {
            const entry = {
                value: value,
                startTime: startTime,
                endTime: Infinity,
                remove: () => {
                    removeItem(entries, entry);
                },
                close: endTime => {
                    entry.endTime = endTime;
                }
            };
            return maxEntries && entries.length >= maxEntries && entries.pop(), entries.unshift(entry), 
            entry;
        },
        find: function(startTime = Infinity, options = {
            returnInactive: !1
        }) {
            for (const entry of entries) if (entry.startTime <= startTime) {
                if (options.returnInactive || startTime <= entry.endTime) return entry.value;
                break;
            }
        },
        closeActive: function(endTime) {
            const latestEntry = entries[0];
            latestEntry && Infinity === latestEntry.endTime && latestEntry.close(endTime);
        },
        findAll: function(startTime = Infinity, duration = 0) {
            const endTime = addDuration(startTime, duration);
            return entries.filter((entry => entry.startTime <= endTime && startTime <= entry.endTime)).map((entry => entry.value));
        },
        reset: function() {
            entries = [];
        },
        stop: function() {
            timer_clearInterval(clearOldValuesInterval);
        }
    };
}

const VIEW_CONTEXT_TIME_OUT_DELAY = 144e5;

function startViewHistory(lifeCycle) {
    const viewValueHistory = createValueHistory({
        expireDelay: 144e5
    });
    return lifeCycle.subscribe(1, (view => {
        viewValueHistory.add(function(view) {
            return {
                service: view.service,
                version: view.version,
                context: view.context,
                id: view.id,
                name: view.name,
                startClocks: view.startClocks
            };
        }(view), view.startClocks.relative);
    })), lifeCycle.subscribe(5, (({endClocks: endClocks}) => {
        viewValueHistory.closeActive(endClocks.relative);
    })), lifeCycle.subscribe(3, (viewUpdate => {
        const currentView = viewValueHistory.find(viewUpdate.startClocks.relative);
        currentView && viewUpdate.name && (currentView.name = viewUpdate.name), currentView && viewUpdate.context && (currentView.context = viewUpdate.context);
    })), lifeCycle.subscribe(9, (() => {
        viewValueHistory.reset();
    })), {
        findView: startTime => viewValueHistory.find(startTime),
        stop: () => {
            viewValueHistory.stop();
        }
    };
}

let xhrObservable;

const xhrContexts = new WeakMap;

function initXhrObservable(configuration) {
    return xhrObservable || (xhrObservable = createXhrObservable(configuration)), xhrObservable;
}

function createXhrObservable(configuration) {
    return new observable_Observable((observable => {
        const {stop: stopInstrumentingStart} = instrumentMethod(XMLHttpRequest.prototype, "open", openXhr), {stop: stopInstrumentingSend} = instrumentMethod(XMLHttpRequest.prototype, "send", (call => {
            sendXhr(call, configuration, observable);
        }), {
            computeHandlingStack: !0
        }), {stop: stopInstrumentingAbort} = instrumentMethod(XMLHttpRequest.prototype, "abort", abortXhr);
        return () => {
            stopInstrumentingStart(), stopInstrumentingSend(), stopInstrumentingAbort();
        };
    }));
}

function openXhr({target: xhr, parameters: [method, url]}) {
    xhrContexts.set(xhr, {
        state: "open",
        method: String(method).toUpperCase(),
        url: normalizeUrl(String(url))
    });
}

function sendXhr({target: xhr, handlingStack: handlingStack}, configuration, observable) {
    const context = xhrContexts.get(xhr);
    if (!context) return;
    const startContext = context;
    startContext.state = "start", startContext.startClocks = clocksNow(), startContext.isAborted = !1, 
    startContext.xhr = xhr, startContext.handlingStack = handlingStack;
    let hasBeenReported = !1;
    const {stop: stopInstrumentingOnReadyStateChange} = instrumentMethod(xhr, "onreadystatechange", (() => {
        xhr.readyState === XMLHttpRequest.DONE && onEnd();
    })), onEnd = () => {
        if (unsubscribeLoadEndListener(), stopInstrumentingOnReadyStateChange(), hasBeenReported) return;
        hasBeenReported = !0;
        const completeContext = context;
        completeContext.state = "complete", completeContext.duration = timeUtils_elapsed(startContext.startClocks.timeStamp, timeUtils_timeStampNow()), 
        completeContext.status = xhr.status, observable.notify(shallowClone(completeContext));
    }, {stop: unsubscribeLoadEndListener} = addEventListener(configuration, xhr, "loadend", onEnd);
    observable.notify(startContext);
}

function abortXhr({target: xhr}) {
    const context = xhrContexts.get(xhr);
    context && (context.isAborted = !0);
}

function isServerError(status) {
    return status >= 500;
}

function tryToClone(response) {
    try {
        return response.clone();
    } catch (_a) {
        return;
    }
}

function readBytesFromStream(stream, callback, options) {
    const reader = stream.getReader(), chunks = [];
    let readBytesCount = 0;
    function onDone() {
        let bytes, limitExceeded;
        if (reader.cancel().catch(functionUtils_noop), options.collectStreamBody) {
            let completeBuffer;
            if (1 === chunks.length) completeBuffer = chunks[0]; else {
                completeBuffer = new Uint8Array(readBytesCount);
                let offset = 0;
                chunks.forEach((chunk => {
                    completeBuffer.set(chunk, offset), offset += chunk.length;
                }));
            }
            bytes = completeBuffer.slice(0, options.bytesLimit), limitExceeded = completeBuffer.length > options.bytesLimit;
        }
        callback(void 0, bytes, limitExceeded);
    }
    !function readMore() {
        reader.read().then(monitor((result => {
            result.done ? onDone() : (options.collectStreamBody && chunks.push(result.value), 
            readBytesCount += result.value.length, readBytesCount > options.bytesLimit ? onDone() : readMore());
        })), monitor((error => callback(error))));
    }();
}

const FAKE_INITIAL_DOCUMENT = "initial_document", RESOURCE_TYPES = [ [ "document", initiatorType => "initial_document" === initiatorType ], [ "xhr", initiatorType => "xmlhttprequest" === initiatorType ], [ "fetch", initiatorType => "fetch" === initiatorType ], [ "beacon", initiatorType => "beacon" === initiatorType ], [ "css", (_, path) => /\.css$/i.test(path) ], [ "js", (_, path) => /\.js$/i.test(path) ], [ "image", (initiatorType, path) => polyfills_includes([ "image", "img", "icon" ], initiatorType) || null !== /\.(gif|jpg|jpeg|tiff|png|svg|ico)$/i.exec(path) ], [ "font", (_, path) => null !== /\.(woff|eot|woff2|ttf)$/i.exec(path) ], [ "media", (initiatorType, path) => polyfills_includes([ "audio", "video" ], initiatorType) || null !== /\.(mp3|mp4)$/i.exec(path) ] ];

function computeResourceEntryType(entry) {
    const url = entry.name;
    if (!isValidUrl(url)) return "other";
    const path = getPathName(url);
    for (const [type, isType] of RESOURCE_TYPES) if (isType(entry.initiatorType, path)) return type;
    return "other";
}

function areInOrder(...numbers) {
    for (let i = 1; i < numbers.length; i += 1) if (numbers[i - 1] > numbers[i]) return !1;
    return !0;
}

function isResourceEntryRequestType(entry) {
    return "xmlhttprequest" === entry.initiatorType || "fetch" === entry.initiatorType;
}

function computeResourceEntryDuration(entry) {
    const {duration: duration, startTime: startTime, responseEnd: responseEnd} = entry;
    return toServerDuration(0 === duration && startTime < responseEnd ? timeUtils_elapsed(startTime, responseEnd) : duration);
}

function computeResourceEntryDetails(entry) {
    if (!hasValidResourceEntryTimings(entry)) return;
    const {startTime: startTime, fetchStart: fetchStart, workerStart: workerStart, redirectStart: redirectStart, redirectEnd: redirectEnd, domainLookupStart: domainLookupStart, domainLookupEnd: domainLookupEnd, connectStart: connectStart, secureConnectionStart: secureConnectionStart, connectEnd: connectEnd, requestStart: requestStart, responseStart: responseStart, responseEnd: responseEnd} = entry, details = {
        download: formatTiming(startTime, responseStart, responseEnd),
        first_byte: formatTiming(startTime, requestStart, responseStart)
    };
    return 0 < workerStart && workerStart < fetchStart && (details.worker = formatTiming(startTime, workerStart, fetchStart)), 
    fetchStart < connectEnd && (details.connect = formatTiming(startTime, connectStart, connectEnd), 
    connectStart <= secureConnectionStart && secureConnectionStart <= connectEnd && (details.ssl = formatTiming(startTime, secureConnectionStart, connectEnd))), 
    fetchStart < domainLookupEnd && (details.dns = formatTiming(startTime, domainLookupStart, domainLookupEnd)), 
    startTime < redirectEnd && (details.redirect = formatTiming(startTime, redirectStart, redirectEnd)), 
    details;
}

function hasValidResourceEntryDuration(entry) {
    return entry.duration >= 0;
}

function hasValidResourceEntryTimings(entry) {
    const areCommonTimingsInOrder = areInOrder(entry.startTime, entry.fetchStart, entry.domainLookupStart, entry.domainLookupEnd, entry.connectStart, entry.connectEnd, entry.requestStart, entry.responseStart, entry.responseEnd), areRedirectionTimingsInOrder = !hasRedirection(entry) || areInOrder(entry.startTime, entry.redirectStart, entry.redirectEnd, entry.fetchStart);
    return areCommonTimingsInOrder && areRedirectionTimingsInOrder;
}

function hasRedirection(entry) {
    return entry.redirectEnd > entry.startTime;
}

function formatTiming(origin, start, end) {
    if (origin <= start && start <= end) return {
        duration: toServerDuration(timeUtils_elapsed(start, end)),
        start: toServerDuration(timeUtils_elapsed(origin, start))
    };
}

function computeResourceEntryProtocol(entry) {
    return "" === entry.nextHopProtocol ? void 0 : entry.nextHopProtocol;
}

function computeResourceEntryDeliveryType(entry) {
    return "" === entry.deliveryType ? "other" : entry.deliveryType;
}

function computeResourceEntrySize(entry) {
    if (entry.startTime < entry.responseStart) {
        const {encodedBodySize: encodedBodySize, decodedBodySize: decodedBodySize, transferSize: transferSize} = entry;
        return {
            size: decodedBodySize,
            encoded_body_size: encodedBodySize,
            decoded_body_size: decodedBodySize,
            transfer_size: transferSize
        };
    }
    return {
        size: void 0,
        encoded_body_size: void 0,
        decoded_body_size: void 0,
        transfer_size: void 0
    };
}

function isAllowedRequestUrl(url) {
    return url && !isIntakeUrl(url);
}

const DATA_URL_REGEX = /data:(.+)?(;base64)?,/g, MAX_ATTRIBUTE_VALUE_CHAR_LENGTH = 24e3;

function isLongDataUrl(url) {
    return !(url.length <= 24e3) && ("data:" === url.substring(0, 5) && (url = url.substring(0, 24e3), 
    !0));
}

function sanitizeDataUrl(url) {
    return `${url.match(DATA_URL_REGEX)[0]}[...]`;
}

let nextRequestIndex = 1;

function startRequestCollection(lifeCycle, configuration, sessionManager) {
    const tracer = startTracer(configuration, sessionManager);
    trackXhr(lifeCycle, configuration, tracer), trackFetch(lifeCycle, tracer);
}

function trackXhr(lifeCycle, configuration, tracer) {
    const subscription = initXhrObservable(configuration).subscribe((rawContext => {
        const context = rawContext;
        if (isAllowedRequestUrl(context.url)) switch (context.state) {
          case "start":
            tracer.traceXhr(context, context.xhr), context.requestIndex = getNextRequestIndex(), 
            lifeCycle.notify(6, {
                requestIndex: context.requestIndex,
                url: context.url
            });
            break;

          case "complete":
            tracer.clearTracingIfNeeded(context), lifeCycle.notify(7, {
                duration: context.duration,
                method: context.method,
                requestIndex: context.requestIndex,
                spanId: context.spanId,
                startClocks: context.startClocks,
                status: context.status,
                traceId: context.traceId,
                traceSampled: context.traceSampled,
                type: "xhr",
                url: context.url,
                xhr: context.xhr,
                isAborted: context.isAborted,
                handlingStack: context.handlingStack
            });
        }
    }));
    return {
        stop: () => subscription.unsubscribe()
    };
}

function trackFetch(lifeCycle, tracer) {
    const subscription = initFetchObservable().subscribe((rawContext => {
        const context = rawContext;
        if (isAllowedRequestUrl(context.url)) switch (context.state) {
          case "start":
            tracer.traceFetch(context), context.requestIndex = getNextRequestIndex(), lifeCycle.notify(6, {
                requestIndex: context.requestIndex,
                url: context.url
            });
            break;

          case "resolve":
            waitForResponseToComplete(context, (duration => {
                tracer.clearTracingIfNeeded(context), lifeCycle.notify(7, {
                    duration: duration,
                    method: context.method,
                    requestIndex: context.requestIndex,
                    responseType: context.responseType,
                    spanId: context.spanId,
                    startClocks: context.startClocks,
                    status: context.status,
                    traceId: context.traceId,
                    traceSampled: context.traceSampled,
                    type: "fetch",
                    url: context.url,
                    response: context.response,
                    init: context.init,
                    input: context.input,
                    isAborted: context.isAborted,
                    handlingStack: context.handlingStack
                });
            }));
        }
    }));
    return {
        stop: () => subscription.unsubscribe()
    };
}

function getNextRequestIndex() {
    const result = nextRequestIndex;
    return nextRequestIndex += 1, result;
}

function waitForResponseToComplete(context, callback) {
    const clonedResponse = context.response && tryToClone(context.response);
    clonedResponse && clonedResponse.body ? readBytesFromStream(clonedResponse.body, (() => {
        callback(timeUtils_elapsed(context.startClocks.timeStamp, timeUtils_timeStampNow()));
    }), {
        bytesLimit: Number.POSITIVE_INFINITY,
        collectStreamBody: !1
    }) : callback(timeUtils_elapsed(context.startClocks.timeStamp, timeUtils_timeStampNow()));
}

function discardNegativeDuration(duration) {
    return isNumber(duration) && duration < 0 ? void 0 : duration;
}

function startActionCollection(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageStateHistory) {
    return lifeCycle.subscribe(0, (action => lifeCycle.notify(11, processAction(action, pageStateHistory)))), 
    {
        addAction: (action, savedCommonContext) => {
            lifeCycle.notify(11, polyfills_assign({
                savedCommonContext: savedCommonContext
            }, processAction(action, pageStateHistory)));
        },
        actionContexts: {
            findActionId: functionUtils_noop
        },
        stop: functionUtils_noop
    };
}

function processAction(action, pageStateHistory) {
    const autoActionProperties = isAutoAction(action) ? {
        action: {
            id: action.id,
            loading_time: discardNegativeDuration(toServerDuration(action.duration)),
            frustration: {
                type: action.frustrationTypes
            },
            error: {
                count: action.counts.errorCount
            },
            long_task: {
                count: action.counts.longTaskCount
            },
            resource: {
                count: action.counts.resourceCount
            }
        },
        _dd: {
            action: {
                target: action.target,
                position: action.position,
                name_source: void 0
            }
        }
    } : void 0, customerContext = isAutoAction(action) ? void 0 : action.context, actionEvent = mergeInto_combine({
        action: {
            id: generateUUID(),
            target: {
                name: action.name
            },
            type: action.type
        },
        date: action.startClocks.timeStamp,
        type: "action",
        view: {
            in_foreground: pageStateHistory.wasInPageStateAt("active", action.startClocks.relative)
        }
    }, autoActionProperties), domainContext = isAutoAction(action) ? {
        events: action.events
    } : {};
    return !isAutoAction(action) && action.handlingStack && (domainContext.handlingStack = action.handlingStack), 
    {
        customerContext: customerContext,
        rawRumEvent: actionEvent,
        startTime: action.startClocks.relative,
        domainContext: domainContext
    };
}

function isAutoAction(action) {
    return "custom" !== action.type;
}

const NO_ERROR_STACK_PRESENT_MESSAGE = "No stack, consider using an instance of Error";

function computeRawError({stackTrace: stackTrace, originalError: originalError, handlingStack: handlingStack, startClocks: startClocks, nonErrorPrefix: nonErrorPrefix, source: source, handling: handling}) {
    const isErrorInstance = isError(originalError), message = computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError), stack = hasUsableStack(isErrorInstance, stackTrace) ? toStackTraceString(stackTrace) : NO_ERROR_STACK_PRESENT_MESSAGE, causes = isErrorInstance ? flattenErrorCauses(originalError, source) : void 0;
    return {
        startClocks: startClocks,
        source: source,
        handling: handling,
        handlingStack: handlingStack,
        originalError: originalError,
        type: stackTrace ? stackTrace.name : void 0,
        message: message,
        stack: stack,
        causes: causes,
        fingerprint: tryToGetFingerprint(originalError)
    };
}

function computeMessage(stackTrace, isErrorInstance, nonErrorPrefix, originalError) {
    return (null == stackTrace ? void 0 : stackTrace.message) && (null == stackTrace ? void 0 : stackTrace.name) ? stackTrace.message : isErrorInstance ? "Empty message" : `${nonErrorPrefix} ${jsonStringify_jsonStringify(sanitize(originalError))}`;
}

function hasUsableStack(isErrorInstance, stackTrace) {
    return void 0 !== stackTrace && (!!isErrorInstance || stackTrace.stack.length > 0 && (stackTrace.stack.length > 1 || void 0 !== stackTrace.stack[0].url));
}

function tryToGetFingerprint(originalError) {
    return isError(originalError) && "dd_fingerprint" in originalError ? String(originalError.dd_fingerprint) : void 0;
}

function getFileFromStackTraceString(stack) {
    var _a;
    return null === (_a = /@ (.+)/.exec(stack)) || void 0 === _a ? void 0 : _a[1];
}

function isError(error) {
    return error instanceof Error || "[object Error]" === Object.prototype.toString.call(error);
}

function flattenErrorCauses(error, parentSource) {
    let currentError = error;
    const causes = [];
    for (;isError(null == currentError ? void 0 : currentError.cause) && causes.length < 10; ) {
        const stackTrace = computeStackTrace(currentError.cause);
        causes.push({
            message: currentError.cause.message,
            source: parentSource,
            type: null == stackTrace ? void 0 : stackTrace.name,
            stack: stackTrace && toStackTraceString(stackTrace)
        }), currentError = currentError.cause;
    }
    return causes.length ? causes : void 0;
}

function trackRuntimeError(errorObservable) {
    const handleRuntimeError = (stackTrace, originalError) => {
        const rawError = computeRawError({
            stackTrace: stackTrace,
            originalError: originalError,
            startClocks: clocksNow(),
            nonErrorPrefix: "Uncaught",
            source: ErrorSource.SOURCE,
            handling: "unhandled"
        });
        errorObservable.notify(rawError);
    }, {stop: stopInstrumentingOnError} = instrumentOnError(handleRuntimeError), {stop: stopInstrumentingOnUnhandledRejection} = instrumentUnhandledRejection(handleRuntimeError);
    return {
        stop: () => {
            stopInstrumentingOnError(), stopInstrumentingOnUnhandledRejection();
        }
    };
}

function instrumentOnError(callback) {
    return instrumentMethod(window, "onerror", (({parameters: [messageObj, url, line, column, errorObj]}) => {
        let stackTrace;
        stackTrace = isError(errorObj) ? computeStackTrace(errorObj) : computeStackTraceFromOnErrorMessage(messageObj, url, line, column), 
        callback(stackTrace, null != errorObj ? errorObj : messageObj);
    }));
}

function instrumentUnhandledRejection(callback) {
    return instrumentMethod(window, "onunhandledrejection", (({parameters: [e]}) => {
        const reason = e.reason || "Empty reason", stack = computeStackTrace(reason);
        callback(stack, reason);
    }));
}

let consoleObservablesByApi = {};

function initConsoleObservable(apis) {
    return mergeObservables(...apis.map((api => (consoleObservablesByApi[api] || (consoleObservablesByApi[api] = createConsoleObservable(api)), 
    consoleObservablesByApi[api]))));
}

function resetConsoleObservable() {
    consoleObservablesByApi = {};
}

function createConsoleObservable(api) {
    return new observable_Observable((observable => {
        const originalConsoleApi = globalConsole[api];
        return globalConsole[api] = (...params) => {
            originalConsoleApi.apply(console, params);
            const handlingStack = createHandlingStack();
            callMonitored((() => {
                observable.notify(buildConsoleLog(params, api, handlingStack));
            }));
        }, () => {
            globalConsole[api] = originalConsoleApi;
        };
    }));
}

function buildConsoleLog(params, api, handlingStack) {
    const message = params.map((param => formatConsoleParameters(param))).join(" ");
    let error;
    if (api === display_ConsoleApiName.error) {
        const firstErrorParam = find(params, isError);
        error = {
            stack: firstErrorParam ? toStackTraceString(computeStackTrace(firstErrorParam)) : void 0,
            fingerprint: tryToGetFingerprint(firstErrorParam),
            causes: firstErrorParam ? flattenErrorCauses(firstErrorParam, "console") : void 0,
            startClocks: clocksNow(),
            message: message,
            source: ErrorSource.CONSOLE,
            handling: "handled",
            handlingStack: handlingStack
        };
    }
    return {
        api: api,
        message: message,
        error: error,
        handlingStack: handlingStack
    };
}

function formatConsoleParameters(param) {
    return "string" == typeof param ? sanitize(param) : isError(param) ? formatErrorMessage(computeStackTrace(param)) : jsonStringify_jsonStringify(sanitize(param), void 0, 2);
}

function trackConsoleError(errorObservable) {
    const subscription = initConsoleObservable([ display_ConsoleApiName.error ]).subscribe((consoleLog => errorObservable.notify(consoleLog.error)));
    return {
        stop: () => {
            subscription.unsubscribe();
        }
    };
}

const RawReportType = {
    intervention: "intervention",
    deprecation: "deprecation",
    cspViolation: "csp_violation"
};

function initReportObservable(configuration, apis) {
    const observables = [];
    polyfills_includes(apis, RawReportType.cspViolation) && observables.push(createCspViolationReportObservable(configuration));
    const reportTypes = apis.filter((api => api !== RawReportType.cspViolation));
    return reportTypes.length && observables.push(createReportObservable(reportTypes)), 
    mergeObservables(...observables);
}

function createReportObservable(reportTypes) {
    return new observable_Observable((observable => {
        if (!window.ReportingObserver) return;
        const handleReports = monitor(((reports, _) => reports.forEach((report => observable.notify(buildRawReportErrorFromReport(report)))))), observer = new window.ReportingObserver(handleReports, {
            types: reportTypes,
            buffered: !0
        });
        return observer.observe(), () => {
            observer.disconnect();
        };
    }));
}

function createCspViolationReportObservable(configuration) {
    return new observable_Observable((observable => {
        const {stop: stop} = addEventListener(configuration, document, "securitypolicyviolation", (event => {
            observable.notify(buildRawReportErrorFromCspViolation(event));
        }));
        return stop;
    }));
}

function buildRawReportErrorFromReport(report) {
    const {type: type, body: body} = report;
    return buildRawReportError({
        type: body.id,
        message: `${type}: ${body.message}`,
        originalError: report,
        stack: buildStack(body.id, body.message, body.sourceFile, body.lineNumber, body.columnNumber)
    });
}

function buildRawReportErrorFromCspViolation(event) {
    const message = `'${event.blockedURI}' blocked by '${event.effectiveDirective}' directive`;
    return buildRawReportError({
        type: event.effectiveDirective,
        message: `${RawReportType.cspViolation}: ${message}`,
        originalError: event,
        csp: {
            disposition: event.disposition
        },
        stack: buildStack(event.effectiveDirective, event.originalPolicy ? `${message} of the policy "${stringUtils_safeTruncate(event.originalPolicy, 100, "...")}"` : "no policy", event.sourceFile, event.lineNumber, event.columnNumber)
    });
}

function buildRawReportError(partial) {
    return polyfills_assign({
        startClocks: clocksNow(),
        source: ErrorSource.REPORT,
        handling: "unhandled"
    }, partial);
}

function buildStack(name, message, sourceFile, lineNumber, columnNumber) {
    return sourceFile ? toStackTraceString({
        name: name,
        message: message,
        stack: [ {
            func: "?",
            url: sourceFile,
            line: null != lineNumber ? lineNumber : void 0,
            column: null != columnNumber ? columnNumber : void 0
        } ]
    }) : void 0;
}

function trackReportError(configuration, errorObservable) {
    const subscription = initReportObservable(configuration, [ RawReportType.cspViolation, RawReportType.intervention ]).subscribe((rawError => errorObservable.notify(rawError)));
    return {
        stop: () => {
            subscription.unsubscribe();
        }
    };
}

function startErrorCollection(lifeCycle, configuration, pageStateHistory, featureFlagContexts) {
    const errorObservable = new observable_Observable;
    return trackConsoleError(errorObservable), trackRuntimeError(errorObservable), trackReportError(configuration, errorObservable), 
    errorObservable.subscribe((error => lifeCycle.notify(13, {
        error: error
    }))), doStartErrorCollection(lifeCycle, pageStateHistory, "featureFlagContexts");
}

function doStartErrorCollection(lifeCycle, pageStateHistory, featureFlagContexts) {
    return lifeCycle.subscribe(13, (({error: error, customerContext: customerContext, savedCommonContext: savedCommonContext}) => {
        lifeCycle.notify(11, polyfills_assign({
            customerContext: customerContext,
            savedCommonContext: savedCommonContext
        }, processError(error, pageStateHistory, "featureFlagContexts")));
    })), {
        addError: ({error: error, handlingStack: handlingStack, startClocks: startClocks, context: customerContext}, savedCommonContext) => {
            const rawError = computeRawError({
                stackTrace: isError(error) ? computeStackTrace(error) : void 0,
                originalError: error,
                handlingStack: handlingStack,
                startClocks: startClocks,
                nonErrorPrefix: "Provided",
                source: ErrorSource.CUSTOM,
                handling: "handled"
            });
            lifeCycle.notify(13, {
                customerContext: customerContext,
                savedCommonContext: savedCommonContext,
                error: rawError
            });
        }
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
            source_type: "browser",
            fingerprint: error.fingerprint,
            csp: error.csp
        },
        type: "error",
        view: {
            in_foreground: pageStateHistory.wasInPageStateAt("active", error.startClocks.relative)
        }
    }, domainContext = {
        error: error.originalError,
        handlingStack: error.handlingStack
    };
    return {
        rawRumEvent: rawRumEvent,
        startTime: error.startClocks.relative,
        domainContext: domainContext
    };
}

function retrieveFirstInputTiming(configuration, callback) {
    const startTimeStamp = dateNow();
    let timingSent = !1;
    const {stop: removeEventListeners} = addEventListeners(configuration, window, [ "click", "mousedown", "keydown", "touchstart", "pointerdown" ], (evt => {
        if (!evt.cancelable) return;
        const timing = {
            entryType: "first-input",
            processingStart: timeUtils_relativeNow(),
            processingEnd: timeUtils_relativeNow(),
            startTime: evt.timeStamp,
            duration: 0,
            name: "",
            cancelable: !1,
            target: null,
            toJSON: () => ({})
        };
        "pointerdown" === evt.type ? function(configuration, timing) {
            addEventListeners(configuration, window, [ "pointerup", "pointercancel" ], (event => {
                "pointerup" === event.type && sendTiming(timing);
            }), {
                once: !0
            });
        }(configuration, timing) : sendTiming(timing);
    }), {
        passive: !0,
        capture: !0
    });
    return {
        stop: removeEventListeners
    };
    function sendTiming(timing) {
        if (!timingSent) {
            timingSent = !0, removeEventListeners();
            const delay = timing.processingStart - timing.startTime;
            delay >= 0 && delay < dateNow() - startTimeStamp && callback(timing);
        }
    }
}

var RumPerformanceEntryType;

function createPerformanceObservable(configuration, options) {
    return new observable_Observable((observable => {
        if (!window.PerformanceObserver) return;
        const handlePerformanceEntries = entries => {
            const rumPerformanceEntries = filterRumPerformanceEntries(entries);
            rumPerformanceEntries.length > 0 && observable.notify(rumPerformanceEntries);
        };
        let timeoutId, isObserverInitializing = !0;
        const observer = new PerformanceObserver(monitor((entries => {
            isObserverInitializing ? timeoutId = timer_setTimeout((() => handlePerformanceEntries(entries.getEntries()))) : handlePerformanceEntries(entries.getEntries());
        })));
        try {
            observer.observe(options);
        } catch (_a) {
            if (polyfills_includes([ RumPerformanceEntryType.RESOURCE, RumPerformanceEntryType.NAVIGATION, RumPerformanceEntryType.LONG_TASK, RumPerformanceEntryType.PAINT ], options.type)) {
                options.buffered && (timeoutId = timer_setTimeout((() => handlePerformanceEntries(performance.getEntriesByType(options.type)))));
                try {
                    observer.observe({
                        entryTypes: [ options.type ]
                    });
                } catch (_b) {
                    return;
                }
            }
        }
        let stopFirstInputTiming;
        return isObserverInitializing = !1, manageResourceTimingBufferFull(configuration), 
        supportPerformanceTimingEvent(RumPerformanceEntryType.FIRST_INPUT) || options.type !== RumPerformanceEntryType.FIRST_INPUT || ({stop: stopFirstInputTiming} = retrieveFirstInputTiming(configuration, (timing => {
            handlePerformanceEntries([ timing ]);
        }))), () => {
            observer.disconnect(), stopFirstInputTiming && stopFirstInputTiming(), timer_clearTimeout(timeoutId);
        };
    }));
}

let resourceTimingBufferFullListener;

function manageResourceTimingBufferFull(configuration) {
    return !resourceTimingBufferFullListener && supportPerformanceObject() && "addEventListener" in performance && (resourceTimingBufferFullListener = addEventListener(configuration, performance, "resourcetimingbufferfull", (() => {
        performance.clearResourceTimings();
    }))), () => {
        null == resourceTimingBufferFullListener || resourceTimingBufferFullListener.stop();
    };
}

function supportPerformanceObject() {
    return void 0 !== window.performance && "getEntries" in performance;
}

function supportPerformanceTimingEvent(entryType) {
    return window.PerformanceObserver && void 0 !== PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes(entryType);
}

function filterRumPerformanceEntries(entries) {
    return entries.filter((entry => !isForbiddenResource(entry)));
}

function isForbiddenResource(entry) {
    return !(entry.entryType !== RumPerformanceEntryType.RESOURCE || isAllowedRequestUrl(entry.name) && hasValidResourceEntryDuration(entry));
}

function startLongTaskCollection(lifeCycle, configuration) {
    const performanceLongTaskSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LONG_TASK,
        buffered: !0
    }).subscribe((entries => {
        for (const entry of entries) {
            if (entry.entryType !== RumPerformanceEntryType.LONG_TASK) break;
            if (!configuration.trackLongTasks) break;
            const startClocks = relativeToClocks(entry.startTime), rawRumEvent = {
                date: startClocks.timeStamp,
                long_task: {
                    id: generateUUID(),
                    entry_type: "long-task",
                    duration: toServerDuration(entry.duration)
                },
                type: "long_task",
                _dd: {
                    discarded: !1
                }
            };
            lifeCycle.notify(11, {
                rawRumEvent: rawRumEvent,
                startTime: startClocks.relative,
                domainContext: {
                    performanceEntry: entry
                }
            });
        }
    }));
    return {
        stop() {
            performanceLongTaskSubscription.unsubscribe();
        }
    };
}

function requestIdleCallback(callback, opts) {
    if (window.requestIdleCallback && window.cancelIdleCallback) {
        const id = window.requestIdleCallback(monitor(callback), opts);
        return () => window.cancelIdleCallback(id);
    }
    return requestIdleCallbackShim(callback);
}

!function(RumPerformanceEntryType) {
    RumPerformanceEntryType.EVENT = "event", RumPerformanceEntryType.FIRST_INPUT = "first-input", 
    RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT = "largest-contentful-paint", RumPerformanceEntryType.LAYOUT_SHIFT = "layout-shift", 
    RumPerformanceEntryType.LONG_TASK = "longtask", RumPerformanceEntryType.LONG_ANIMATION_FRAME = "long-animation-frame", 
    RumPerformanceEntryType.NAVIGATION = "navigation", RumPerformanceEntryType.PAINT = "paint", 
    RumPerformanceEntryType.RESOURCE = "resource";
}(RumPerformanceEntryType || (RumPerformanceEntryType = {}));

const MAX_TASK_TIME = 50;

function requestIdleCallbackShim(callback) {
    const start = dateNow(), timeoutId = timer_setTimeout((() => {
        callback({
            didTimeout: !1,
            timeRemaining: () => Math.max(0, 50 - (dateNow() - start))
        });
    }), 0);
    return () => timer_clearTimeout(timeoutId);
}

const IDLE_CALLBACK_TIMEOUT = 1e3, MAX_EXECUTION_TIME_ON_TIMEOUT = 30;

function createTaskQueue() {
    const pendingTasks = [];
    function run(deadline) {
        let executionTimeRemaining;
        if (deadline.didTimeout) {
            const start = performance.now();
            executionTimeRemaining = () => 30 - (performance.now() - start);
        } else executionTimeRemaining = deadline.timeRemaining.bind(deadline);
        for (;executionTimeRemaining() > 0 && pendingTasks.length; ) pendingTasks.shift()();
        pendingTasks.length && scheduleNextRun();
    }
    function scheduleNextRun() {
        requestIdleCallback(run, {
            timeout: 1e3
        });
    }
    return {
        push(task) {
            1 === pendingTasks.push(task) && scheduleNextRun();
        }
    };
}

function getCrypto() {
    return window.crypto || window.msCrypto;
}

function createTraceIdentifier() {
    return createIdentifier(64);
}

function createSpanIdentifier() {
    return createIdentifier(63);
}

let createIdentifierImplementationCache;

function createIdentifier(bits) {
    return createIdentifierImplementationCache || (createIdentifierImplementationCache = createIdentifierUsingUint32Array), 
    createIdentifierImplementationCache(bits);
}

function areBigIntIdentifiersSupported() {
    try {
        return crypto.getRandomValues(new BigUint64Array(1)), !0;
    } catch (_a) {
        return !1;
    }
}

function createIdentifierUsingBigInt(bits) {
    let id = crypto.getRandomValues(new BigUint64Array(1))[0];
    return 63 === bits && (id >>= BigInt("1")), id;
}

function createIdentifierUsingUint32Array(bits) {
    const buffer = getCrypto().getRandomValues(new Uint32Array(2));
    return 63 === bits && (buffer[buffer.length - 1] >>>= 1), {
        toString(radix = 10) {
            let high = buffer[1], low = buffer[0], str = "";
            do {
                const mod = high % radix * 4294967296 + low;
                high = Math.floor(high / radix), low = Math.floor(mod / radix), str = (mod % radix).toString(radix) + str;
            } while (high || low);
            return str;
        }
    };
}

function toPaddedHexadecimalString(id) {
    const traceId = id.toString(16);
    return Array(17 - traceId.length).join("0") + traceId;
}

function cssEscape(str) {
    return window.CSS && window.CSS.escape ? window.CSS.escape(str) : str.replace(/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g, (function(ch, asCodePoint) {
        return asCodePoint ? "\0" === ch ? "�" : `${ch.slice(0, -1)}\\${ch.charCodeAt(ch.length - 1).toString(16)} ` : `\\${ch}`;
    }));
}

function polyfills_elementMatches(element, selector) {
    return element.matches ? element.matches(selector) : !!element.msMatchesSelector && element.msMatchesSelector(selector);
}

function polyfills_getParentElement(node) {
    if (node.parentElement) return node.parentElement;
    for (;node.parentNode; ) {
        if (node.parentNode.nodeType === Node.ELEMENT_NODE) return node.parentNode;
        node = node.parentNode;
    }
    return null;
}

function getClassList(element) {
    if (element.classList) return element.classList;
    const classes = (element.getAttribute("class") || "").trim();
    return classes ? classes.split(/\s+/) : [];
}

const PLACEHOLDER = 1;

class polyfills_WeakSet {
    constructor(initialValues) {
        this.map = new WeakMap, initialValues && initialValues.forEach((value => this.map.set(value, 1)));
    }
    add(value) {
        return this.map.set(value, 1), this;
    }
    delete(value) {
        return this.map.delete(value);
    }
    has(value) {
        return this.map.has(value);
    }
}

const alreadyMatchedEntries = new polyfills_WeakSet;

function matchRequestResourceEntry(request) {
    if (!performance || !("getEntriesByName" in performance)) return;
    const sameNameEntries = performance.getEntriesByName(request.url, "resource");
    if (!sameNameEntries.length || !("toJSON" in sameNameEntries[0])) return;
    const candidates = sameNameEntries.filter((entry => !alreadyMatchedEntries.has(entry))).filter((entry => hasValidResourceEntryDuration(entry) && hasValidResourceEntryTimings(entry))).filter((entry => isBetween(entry, request.startClocks.relative, endTime({
        startTime: request.startClocks.relative,
        duration: request.duration
    }))));
    return 1 === candidates.length ? (alreadyMatchedEntries.add(candidates[0]), candidates[0].toJSON()) : void 0;
}

function endTime(timing) {
    return addDuration(timing.startTime, timing.duration);
}

function isBetween(timing, start, end) {
    return timing.startTime >= start - 1 && endTime(timing) <= addDuration(end, 1);
}

function runOnReadyState(configuration, expectedReadyState, callback) {
    if (document.readyState === expectedReadyState || "complete" === document.readyState) return callback(), 
    {
        stop: functionUtils_noop
    };
    return addEventListener(configuration, window, "complete" === expectedReadyState ? "load" : "DOMContentLoaded", callback, {
        once: !0
    });
}

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
    for (;child; ) callback(child), child = child.nextSibling;
    isNodeShadowHost(node) && callback(node.shadowRoot);
}

function htmlDomUtils_getParentNode(node) {
    return isNodeShadowRoot(node) ? node.host : node.parentNode;
}

const INITIAL_DOCUMENT_OUTDATED_TRACE_ID_THRESHOLD = 12e4;

function getDocumentTraceId(document) {
    const data = getDocumentTraceDataFromMeta(document) || getDocumentTraceDataFromComment(document);
    if (data && !(data.traceTime <= dateNow() - 12e4)) return data.traceId;
}

function getDocumentTraceDataFromMeta(document) {
    const traceIdMeta = document.querySelector("meta[name=dd-trace-id]"), traceTimeMeta = document.querySelector("meta[name=dd-trace-time]");
    return createDocumentTraceData(traceIdMeta && traceIdMeta.content, traceTimeMeta && traceTimeMeta.content);
}

function getDocumentTraceDataFromComment(document) {
    const comment = findTraceComment(document);
    if (comment) return createDocumentTraceData(findCommaSeparatedValue(comment, "trace-id"), findCommaSeparatedValue(comment, "trace-time"));
}

function createDocumentTraceData(traceId, rawTraceTime) {
    const traceTime = rawTraceTime && Number(rawTraceTime);
    if (traceId && traceTime) return {
        traceId: traceId,
        traceTime: traceTime
    };
}

function findTraceComment(document) {
    for (let i = 0; i < document.childNodes.length; i += 1) {
        const comment = getTraceCommentFromNode(document.childNodes[i]);
        if (comment) return comment;
    }
    if (document.body) for (let i = document.body.childNodes.length - 1; i >= 0; i -= 1) {
        const node = document.body.childNodes[i], comment = getTraceCommentFromNode(node);
        if (comment) return comment;
        if (!htmlDomUtils_isTextNode(node)) break;
    }
}

function getTraceCommentFromNode(node) {
    if (node && isCommentNode(node)) {
        const match = /^\s*DATADOG;(.*?)\s*$/.exec(node.data);
        if (match) return match[1];
    }
}

function getNavigationEntry() {
    if (supportPerformanceTimingEvent(RumPerformanceEntryType.NAVIGATION)) {
        const navigationEntry = performance.getEntriesByType(RumPerformanceEntryType.NAVIGATION)[0];
        if (navigationEntry) return navigationEntry;
    }
    const timings = computeTimingsFromDeprecatedPerformanceTiming(), entry = polyfills_assign({
        entryType: RumPerformanceEntryType.NAVIGATION,
        initiatorType: "navigation",
        name: window.location.href,
        startTime: 0,
        duration: timings.responseEnd,
        decodedBodySize: 0,
        encodedBodySize: 0,
        transferSize: 0,
        workerStart: 0,
        toJSON: () => polyfills_assign({}, entry, {
            toJSON: void 0
        })
    }, timings);
    return entry;
}

function computeTimingsFromDeprecatedPerformanceTiming() {
    const result = {}, timing = performance.timing;
    for (const key in timing) if (isNumber(timing[key])) {
        const numberKey = key, timingElement = timing[numberKey];
        result[numberKey] = 0 === timingElement ? 0 : getRelativeTime(timingElement);
    }
    return result;
}

function retrieveInitialDocumentResourceTiming(configuration, callback) {
    runOnReadyState(configuration, "interactive", (() => {
        const entry = polyfills_assign(getNavigationEntry().toJSON(), {
            entryType: RumPerformanceEntryType.RESOURCE,
            initiatorType: "initial_document",
            traceId: getDocumentTraceId(document),
            toJSON: () => polyfills_assign({}, entry, {
                toJSON: void 0
            })
        });
        callback(entry);
    }));
}

function startResourceCollection(lifeCycle, configuration, pageStateHistory, taskQueue = createTaskQueue(), retrieveInitialDocumentResourceTimingImpl = retrieveInitialDocumentResourceTiming) {
    lifeCycle.subscribe(7, (request => {
        handleResource((() => processRequest(request, configuration, pageStateHistory)));
    }));
    const performanceResourceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.RESOURCE,
        buffered: !0
    }).subscribe((entries => {
        for (const entry of entries) isResourceEntryRequestType(entry) || handleResource((() => processResourceEntry(entry, configuration)));
    }));
    function handleResource(computeRawEvent) {
        taskQueue.push((() => {
            const rawEvent = computeRawEvent();
            rawEvent && lifeCycle.notify(11, rawEvent);
        }));
    }
    return retrieveInitialDocumentResourceTimingImpl(configuration, (timing => {
        handleResource((() => processResourceEntry(timing, configuration)));
    })), {
        stop: () => {
            performanceResourceSubscription.unsubscribe();
        }
    };
}

function processRequest(request, configuration, pageStateHistory) {
    const matchingTiming = matchRequestResourceEntry(request), startClocks = matchingTiming ? relativeToClocks(matchingTiming.startTime) : request.startClocks, tracingInfo = computeRequestTracingInfo(request, configuration);
    if (!configuration.trackResources && !tracingInfo) return;
    const type = "xhr" === request.type ? "xhr" : "fetch", correspondingTimingOverrides = matchingTiming ? computeResourceEntryMetrics(matchingTiming) : void 0, duration = computeRequestDuration(pageStateHistory, startClocks, request.duration), resourceEvent = mergeInto_combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type: type,
            duration: duration,
            method: request.method,
            status_code: request.status,
            protocol: matchingTiming && computeResourceEntryProtocol(matchingTiming),
            url: isLongDataUrl(request.url) ? sanitizeDataUrl(request.url) : request.url,
            delivery_type: matchingTiming && computeResourceEntryDeliveryType(matchingTiming)
        },
        type: "resource",
        _dd: {
            discarded: !configuration.trackResources
        }
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
            handlingStack: request.handlingStack
        }
    };
}

function processResourceEntry(entry, configuration) {
    const startClocks = relativeToClocks(entry.startTime), tracingInfo = computeResourceEntryTracingInfo(entry, configuration);
    if (!configuration.trackResources && !tracingInfo) return;
    const type = computeResourceEntryType(entry), entryMetrics = computeResourceEntryMetrics(entry), resourceEvent = mergeInto_combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type: type,
            url: entry.name,
            status_code: discardZeroStatus(entry.responseStatus),
            protocol: computeResourceEntryProtocol(entry),
            delivery_type: computeResourceEntryDeliveryType(entry)
        },
        type: "resource",
        _dd: {
            discarded: !configuration.trackResources
        }
    }, tracingInfo, entryMetrics);
    return {
        startTime: startClocks.relative,
        rawRumEvent: resourceEvent,
        domainContext: {
            performanceEntry: entry
        }
    };
}

function computeResourceEntryMetrics(entry) {
    const {renderBlockingStatus: renderBlockingStatus} = entry;
    return {
        resource: polyfills_assign({
            duration: computeResourceEntryDuration(entry),
            render_blocking_status: renderBlockingStatus
        }, computeResourceEntrySize(entry), computeResourceEntryDetails(entry))
    };
}

function computeRequestTracingInfo(request, configuration) {
    if (request.traceSampled && request.traceId && request.spanId) return {
        _dd: {
            span_id: request.spanId.toString(),
            trace_id: request.traceId.toString(),
            rule_psr: configuration.rulePsr
        }
    };
}

function computeResourceEntryTracingInfo(entry, configuration) {
    if (entry.traceId) return {
        _dd: {
            trace_id: entry.traceId,
            span_id: createSpanIdentifier().toString(),
            rule_psr: configuration.rulePsr
        }
    };
}

function computeRequestDuration(pageStateHistory, startClocks, duration) {
    return pageStateHistory.wasInPageStateDuringPeriod("frozen", startClocks.relative, duration) ? void 0 : toServerDuration(duration);
}

function discardZeroStatus(statusCode) {
    return 0 === statusCode ? void 0 : statusCode;
}

function trackEventCounts({lifeCycle: lifeCycle, isChildEvent: isChildEvent, onChange: callback = functionUtils_noop}) {
    const eventCounts = {
        errorCount: 0,
        longTaskCount: 0,
        resourceCount: 0,
        actionCount: 0,
        frustrationCount: 0
    }, subscription = lifeCycle.subscribe(12, (event => {
        var _a;
        if ("view" !== event.type && "vital" !== event.type && isChildEvent(event)) switch (event.type) {
          case "error":
            eventCounts.errorCount += 1, callback();
            break;

          case "action":
            eventCounts.actionCount += 1, event.action.frustration && (eventCounts.frustrationCount += event.action.frustration.type.length), 
            callback();
            break;

          case "long_task":
            eventCounts.longTaskCount += 1, callback();
            break;

          case "resource":
            (null === (_a = event._dd) || void 0 === _a ? void 0 : _a.discarded) || (eventCounts.resourceCount += 1, 
            callback());
        }
    }));
    return {
        stop: () => {
            subscription.unsubscribe();
        },
        eventCounts: eventCounts
    };
}

function trackViewEventCounts(lifeCycle, viewId, onChange) {
    const {stop: stop, eventCounts: eventCounts} = trackEventCounts({
        lifeCycle: lifeCycle,
        isChildEvent: event => event.view.id === viewId,
        onChange: onChange
    });
    return {
        stop: stop,
        eventCounts: eventCounts
    };
}

const FCP_MAXIMUM_DELAY = 6e5;

function trackFirstContentfulPaint(configuration, firstHidden, callback) {
    return {
        stop: createPerformanceObservable(configuration, {
            type: RumPerformanceEntryType.PAINT,
            buffered: !0
        }).subscribe((entries => {
            const fcpEntry = find(entries, (entry => "first-contentful-paint" === entry.name && entry.startTime < firstHidden.timeStamp && entry.startTime < 6e5));
            fcpEntry && callback(fcpEntry.startTime);
        })).unsubscribe
    };
}

const privacy_NodePrivacyLevel = {
    IGNORE: "ignore",
    HIDDEN: "hidden",
    ALLOW: DefaultPrivacyLevel.ALLOW,
    MASK: DefaultPrivacyLevel.MASK,
    MASK_USER_INPUT: DefaultPrivacyLevel.MASK_USER_INPUT
}, PRIVACY_ATTR_NAME = "data-dd-privacy", PRIVACY_ATTR_VALUE_ALLOW = "allow", PRIVACY_ATTR_VALUE_MASK = "mask", PRIVACY_ATTR_VALUE_MASK_USER_INPUT = "mask-user-input", PRIVACY_ATTR_VALUE_HIDDEN = "hidden", PRIVACY_CLASS_PREFIX = "dd-privacy-", CENSORED_STRING_MARK = "***", CENSORED_IMG_MARK = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", FORM_PRIVATE_TAG_NAMES = {
    INPUT: !0,
    OUTPUT: !0,
    TEXTAREA: !0,
    SELECT: !0,
    OPTION: !0,
    DATALIST: !0,
    OPTGROUP: !0
}, TEXT_MASKING_CHAR = "x";

function getNodePrivacyLevel(node, defaultPrivacyLevel, cache) {
    if (cache && cache.has(node)) return cache.get(node);
    const parentNode = getParentNode(node), parentNodePrivacyLevel = parentNode ? getNodePrivacyLevel(parentNode, defaultPrivacyLevel, cache) : defaultPrivacyLevel, nodePrivacyLevel = reducePrivacyLevel(getNodeSelfPrivacyLevel(node), parentNodePrivacyLevel);
    return cache && cache.set(node, nodePrivacyLevel), nodePrivacyLevel;
}

function reducePrivacyLevel(childPrivacyLevel, parentNodePrivacyLevel) {
    switch (parentNodePrivacyLevel) {
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

function getNodeSelfPrivacyLevel(node) {
    if (isElementNode(node)) {
        if ("BASE" === node.tagName) return privacy_NodePrivacyLevel.ALLOW;
        if ("INPUT" === node.tagName) {
            const inputElement = node;
            if ("password" === inputElement.type || "email" === inputElement.type || "tel" === inputElement.type) return privacy_NodePrivacyLevel.MASK;
            if ("hidden" === inputElement.type) return privacy_NodePrivacyLevel.MASK;
            const autocomplete = inputElement.getAttribute("autocomplete");
            if (autocomplete && (autocomplete.startsWith("cc-") || autocomplete.endsWith("-password"))) return privacy_NodePrivacyLevel.MASK;
        }
        return elementMatches(node, getPrivacySelector(privacy_NodePrivacyLevel.HIDDEN)) ? privacy_NodePrivacyLevel.HIDDEN : elementMatches(node, getPrivacySelector(privacy_NodePrivacyLevel.MASK)) ? privacy_NodePrivacyLevel.MASK : elementMatches(node, getPrivacySelector(privacy_NodePrivacyLevel.MASK_USER_INPUT)) ? privacy_NodePrivacyLevel.MASK_USER_INPUT : elementMatches(node, getPrivacySelector(privacy_NodePrivacyLevel.ALLOW)) ? privacy_NodePrivacyLevel.ALLOW : shouldIgnoreElement(node) ? privacy_NodePrivacyLevel.IGNORE : void 0;
    }
}

function shouldMaskNode(node, privacyLevel) {
    switch (privacyLevel) {
      case privacy_NodePrivacyLevel.MASK:
      case privacy_NodePrivacyLevel.HIDDEN:
      case privacy_NodePrivacyLevel.IGNORE:
        return !0;

      case privacy_NodePrivacyLevel.MASK_USER_INPUT:
        return isTextNode(node) ? isFormElement(node.parentNode) : isFormElement(node);

      default:
        return !1;
    }
}

function isFormElement(node) {
    if (!node || node.nodeType !== node.ELEMENT_NODE) return !1;
    const element = node;
    if ("INPUT" === element.tagName) switch (element.type) {
      case "button":
      case "color":
      case "reset":
      case "submit":
        return !1;
    }
    return !!FORM_PRIVATE_TAG_NAMES[element.tagName];
}

const censorText = text => text.replace(/\S/g, "x");

function getTextContent(textNode, ignoreWhiteSpace, parentNodePrivacyLevel) {
    var _a;
    const parentTagName = null === (_a = textNode.parentElement) || void 0 === _a ? void 0 : _a.tagName;
    let textContent = textNode.textContent || "";
    if (ignoreWhiteSpace && !textContent.trim()) return;
    if ("SCRIPT" === parentTagName) textContent = "***"; else if (parentNodePrivacyLevel === privacy_NodePrivacyLevel.HIDDEN) textContent = "***"; else if (shouldMaskNode(textNode, parentNodePrivacyLevel)) if ("DATALIST" === parentTagName || "SELECT" === parentTagName || "OPTGROUP" === parentTagName) {
        if (!textContent.trim()) return;
    } else textContent = "OPTION" === parentTagName ? "***" : textContent.replace(/\S/g, "x");
    return textContent;
}

function shouldIgnoreElement(element) {
    if ("SCRIPT" === element.nodeName) return !0;
    if ("LINK" === element.nodeName) {
        const relAttribute = getLowerCaseAttribute("rel");
        return /preload|prefetch/i.test(relAttribute) && "script" === getLowerCaseAttribute("as") || "shortcut icon" === relAttribute || "icon" === relAttribute;
    }
    if ("META" === element.nodeName) {
        const nameAttribute = getLowerCaseAttribute("name"), relAttribute = getLowerCaseAttribute("rel"), propertyAttribute = getLowerCaseAttribute("property");
        return /^msapplication-tile(image|color)$/.test(nameAttribute) || "application-name" === nameAttribute || "icon" === relAttribute || "apple-touch-icon" === relAttribute || "shortcut icon" === relAttribute || "keywords" === nameAttribute || "description" === nameAttribute || /^(og|twitter|fb):/.test(propertyAttribute) || /^(og|twitter):/.test(nameAttribute) || "pinterest" === nameAttribute || "robots" === nameAttribute || "googlebot" === nameAttribute || "bingbot" === nameAttribute || element.hasAttribute("http-equiv") || "author" === nameAttribute || "generator" === nameAttribute || "framework" === nameAttribute || "publisher" === nameAttribute || "progid" === nameAttribute || /^article:/.test(propertyAttribute) || /^product:/.test(propertyAttribute) || "google-site-verification" === nameAttribute || "yandex-verification" === nameAttribute || "csrf-token" === nameAttribute || "p:domain_verify" === nameAttribute || "verify-v1" === nameAttribute || "verification" === nameAttribute || "shopify-checkout-api-token" === nameAttribute;
    }
    function getLowerCaseAttribute(name) {
        return (element.getAttribute(name) || "").toLowerCase();
    }
    return !1;
}

function getPrivacySelector(privacyLevel) {
    return `[data-dd-privacy="${privacyLevel}"], .dd-privacy-${privacyLevel}`;
}

const DEFAULT_PROGRAMMATIC_ACTION_NAME_ATTRIBUTE = "data-dd-action-name", ACTION_NAME_PLACEHOLDER = "Masked Element";

function getActionNameFromElement(element, {enablePrivacyForActionName: enablePrivacyForActionName, actionNameAttribute: userProgrammaticAttribute}, nodePrivacyLevel) {
    const defaultActionName = getActionNameFromElementProgrammatically(element, "data-dd-action-name") || userProgrammaticAttribute && getActionNameFromElementProgrammatically(element, userProgrammaticAttribute);
    return defaultActionName ? {
        name: defaultActionName,
        nameSource: "custom_attribute"
    } : nodePrivacyLevel === NodePrivacyLevel.MASK ? {
        name: "Masked Element",
        nameSource: "mask_placeholder"
    } : getActionNameFromElementForStrategies(element, userProgrammaticAttribute, priorityStrategies, enablePrivacyForActionName) || getActionNameFromElementForStrategies(element, userProgrammaticAttribute, fallbackStrategies, enablePrivacyForActionName) || {
        name: "",
        nameSource: "blank"
    };
}

function getActionNameFromElementProgrammatically(targetElement, programmaticAttribute) {
    let elementWithAttribute;
    if (supportsElementClosest()) elementWithAttribute = targetElement.closest(`[${programmaticAttribute}]`); else {
        let element = targetElement;
        for (;element; ) {
            if (element.hasAttribute(programmaticAttribute)) {
                elementWithAttribute = element;
                break;
            }
            element = getParentElement(element);
        }
    }
    if (!elementWithAttribute) return;
    return truncate(normalizeWhitespace(elementWithAttribute.getAttribute(programmaticAttribute).trim()));
}

const priorityStrategies = [ (element, userProgrammaticAttribute, privacy) => {
    if (supportsLabelProperty()) {
        if ("labels" in element && element.labels && element.labels.length > 0) return getActionNameFromTextualContent(element.labels[0], userProgrammaticAttribute);
    } else if (element.id) {
        const label = element.ownerDocument && find(element.ownerDocument.querySelectorAll("label"), (label => label.htmlFor === element.id));
        return label && getActionNameFromTextualContent(label, userProgrammaticAttribute, privacy);
    }
}, element => {
    if ("INPUT" === element.nodeName) {
        const input = element, type = input.getAttribute("type");
        if ("button" === type || "submit" === type || "reset" === type) return {
            name: input.value,
            nameSource: "text_content"
        };
    }
}, (element, userProgrammaticAttribute, privacyEnabledActionName) => {
    if ("BUTTON" === element.nodeName || "LABEL" === element.nodeName || "button" === element.getAttribute("role")) return getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName);
}, element => getActionNameFromStandardAttribute(element, "aria-label"), (element, userProgrammaticAttribute, privacyEnabledActionName) => {
    const labelledByAttribute = element.getAttribute("aria-labelledby");
    if (labelledByAttribute) return {
        name: labelledByAttribute.split(/\s+/).map((id => getElementById(element, id))).filter((label => Boolean(label))).map((element => getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName))).join(" "),
        nameSource: "text_content"
    };
}, element => getActionNameFromStandardAttribute(element, "alt"), element => getActionNameFromStandardAttribute(element, "name"), element => getActionNameFromStandardAttribute(element, "title"), element => getActionNameFromStandardAttribute(element, "placeholder"), (element, userProgrammaticAttribute) => {
    if ("options" in element && element.options.length > 0) return getActionNameFromTextualContent(element.options[0], userProgrammaticAttribute);
} ], fallbackStrategies = [ (element, userProgrammaticAttribute, privacyEnabledActionName) => getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) ], MAX_PARENTS_TO_CONSIDER = 10;

function getActionNameFromElementForStrategies(targetElement, userProgrammaticAttribute, strategies, privacyEnabledActionName) {
    let element = targetElement, recursionCounter = 0;
    for (;recursionCounter <= 10 && element && "BODY" !== element.nodeName && "HTML" !== element.nodeName && "HEAD" !== element.nodeName; ) {
        for (const strategy of strategies) {
            const actionName = strategy(element, userProgrammaticAttribute, privacyEnabledActionName);
            if (actionName) {
                const {name: name, nameSource: nameSource} = actionName, trimmedName = name && name.trim();
                if (trimmedName) return {
                    name: truncate(normalizeWhitespace(trimmedName)),
                    nameSource: nameSource
                };
            }
        }
        if ("FORM" === element.nodeName) break;
        element = getParentElement(element), recursionCounter += 1;
    }
}

function normalizeWhitespace(s) {
    return s.replace(/\s+/g, " ");
}

function truncate(s) {
    return s.length > 100 ? `${safeTruncate(s, 100)} [...]` : s;
}

function getElementById(refElement, id) {
    return refElement.ownerDocument ? refElement.ownerDocument.getElementById(id) : null;
}

function getActionNameFromStandardAttribute(element, attribute) {
    return {
        name: element.getAttribute(attribute) || "",
        nameSource: "standard_attribute"
    };
}

function getActionNameFromTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) {
    return {
        name: getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) || "",
        nameSource: "text_content"
    };
}

function getTextualContent(element, userProgrammaticAttribute, privacyEnabledActionName) {
    if (!element.isContentEditable) {
        if ("innerText" in element) {
            let text = element.innerText;
            const removeTextFromElements = query => {
                const list = element.querySelectorAll(query);
                for (let index = 0; index < list.length; index += 1) {
                    const element = list[index];
                    if ("innerText" in element) {
                        const textToReplace = element.innerText;
                        textToReplace && textToReplace.trim().length > 0 && (text = text.replace(textToReplace, ""));
                    }
                }
            };
            return supportsInnerTextScriptAndStyleRemoval() || removeTextFromElements("script, style"), 
            removeTextFromElements("[data-dd-action-name]"), userProgrammaticAttribute && removeTextFromElements(`[${userProgrammaticAttribute}]`), 
            privacyEnabledActionName && removeTextFromElements(`${getPrivacySelector(privacy_NodePrivacyLevel.HIDDEN)}, ${getPrivacySelector(privacy_NodePrivacyLevel.MASK)}`), 
            text;
        }
        return element.textContent;
    }
}

function supportsInnerTextScriptAndStyleRemoval() {
    return !isIE();
}

let supportsLabelPropertyResult, supportsElementClosestResult;

function supportsLabelProperty() {
    return void 0 === supportsLabelPropertyResult && (supportsLabelPropertyResult = "labels" in HTMLInputElement.prototype), 
    supportsLabelPropertyResult;
}

function supportsElementClosest() {
    return void 0 === supportsElementClosestResult && (supportsElementClosestResult = "closest" in HTMLElement.prototype), 
    supportsElementClosestResult;
}

const STABLE_ATTRIBUTES = [ "data-dd-action-name", "data-testid", "data-test", "data-qa", "data-cy", "data-test-id", "data-qa-id", "data-testing", "data-component", "data-element", "data-source-file" ], GLOBALLY_UNIQUE_SELECTOR_GETTERS = [ getStableAttributeSelector, getIDSelector ], UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS = [ getStableAttributeSelector, getClassSelector, getTagNameSelector ];

function getSelectorFromElement(targetElement, actionNameAttribute) {
    if (!isConnected(targetElement)) return;
    let targetElementSelector, currentElement = targetElement;
    for (;currentElement && "HTML" !== currentElement.nodeName; ) {
        const globallyUniqueSelector = findSelector(currentElement, GLOBALLY_UNIQUE_SELECTOR_GETTERS, isSelectorUniqueGlobally, actionNameAttribute, targetElementSelector);
        if (globallyUniqueSelector) return globallyUniqueSelector;
        targetElementSelector = findSelector(currentElement, UNIQUE_AMONG_CHILDREN_SELECTOR_GETTERS, isSelectorUniqueAmongSiblings, actionNameAttribute, targetElementSelector) || combineSelector(getPositionSelector(currentElement), targetElementSelector), 
        currentElement = polyfills_getParentElement(currentElement);
    }
    return targetElementSelector;
}

function isGeneratedValue(value) {
    return /[0-9]/.test(value);
}

function getIDSelector(element) {
    if (element.id && !isGeneratedValue(element.id)) return `#${cssEscape(element.id)}`;
}

function getClassSelector(element) {
    if ("BODY" === element.tagName) return;
    const classList = getClassList(element);
    for (let i = 0; i < classList.length; i += 1) {
        const className = classList[i];
        if (!isGeneratedValue(className)) return `${cssEscape(element.tagName)}.${cssEscape(className)}`;
    }
}

function getTagNameSelector(element) {
    return cssEscape(element.tagName);
}

function getStableAttributeSelector(element, actionNameAttribute) {
    if (actionNameAttribute) {
        const selector = getAttributeSelector(actionNameAttribute);
        if (selector) return selector;
    }
    for (const attributeName of STABLE_ATTRIBUTES) {
        const selector = getAttributeSelector(attributeName);
        if (selector) return selector;
    }
    function getAttributeSelector(attributeName) {
        if (element.hasAttribute(attributeName)) return `${cssEscape(element.tagName)}[${attributeName}="${cssEscape(element.getAttribute(attributeName))}"]`;
    }
}

function getPositionSelector(element) {
    let sibling = polyfills_getParentElement(element).firstElementChild, elementIndex = 1;
    for (;sibling && sibling !== element; ) sibling.tagName === element.tagName && (elementIndex += 1), 
    sibling = sibling.nextElementSibling;
    return `${cssEscape(element.tagName)}:nth-of-type(${elementIndex})`;
}

function findSelector(element, selectorGetters, predicate, actionNameAttribute, childSelector) {
    for (const selectorGetter of selectorGetters) {
        const elementSelector = selectorGetter(element, actionNameAttribute);
        if (elementSelector && predicate(element, elementSelector, childSelector)) return combineSelector(elementSelector, childSelector);
    }
}

function isSelectorUniqueGlobally(element, elementSelector, childSelector) {
    return 1 === element.ownerDocument.querySelectorAll(combineSelector(elementSelector, childSelector)).length;
}

function isSelectorUniqueAmongSiblings(currentElement, currentElementSelector, childSelector) {
    let isSiblingMatching;
    if (void 0 === childSelector) isSiblingMatching = sibling => polyfills_elementMatches(sibling, currentElementSelector); else {
        const scopedSelector = supportScopeSelector() ? combineSelector(`${currentElementSelector}:scope`, childSelector) : combineSelector(currentElementSelector, childSelector);
        isSiblingMatching = sibling => null !== sibling.querySelector(scopedSelector);
    }
    let sibling = polyfills_getParentElement(currentElement).firstElementChild;
    for (;sibling; ) {
        if (sibling !== currentElement && isSiblingMatching(sibling)) return !1;
        sibling = sibling.nextElementSibling;
    }
    return !0;
}

function combineSelector(parent, child) {
    return child ? `${parent}>${child}` : parent;
}

let supportScopeSelectorCache;

function supportScopeSelector() {
    if (void 0 === supportScopeSelectorCache) try {
        document.querySelector(":scope"), supportScopeSelectorCache = !0;
    } catch (_a) {
        supportScopeSelectorCache = !1;
    }
    return supportScopeSelectorCache;
}

function isConnected(element) {
    return "isConnected" in element ? element.isConnected : element.ownerDocument.documentElement.contains(element);
}

function trackFirstInput(configuration, firstHidden, callback) {
    const performanceFirstInputSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.FIRST_INPUT,
        buffered: !0
    }).subscribe((entries => {
        const firstInputEntry = find(entries, (entry => entry.startTime < firstHidden.timeStamp));
        if (firstInputEntry) {
            const firstInputDelay = timeUtils_elapsed(firstInputEntry.startTime, firstInputEntry.processingStart);
            let firstInputTargetSelector;
            firstInputEntry.target && htmlDomUtils_isElementNode(firstInputEntry.target) && (firstInputTargetSelector = getSelectorFromElement(firstInputEntry.target, configuration.actionNameAttribute)), 
            callback({
                delay: firstInputDelay >= 0 ? firstInputDelay : 0,
                time: firstInputEntry.startTime,
                targetSelector: firstInputTargetSelector
            });
        }
    }));
    return {
        stop: () => {
            performanceFirstInputSubscription.unsubscribe();
        }
    };
}

function trackNavigationTimings(configuration, callback, getNavigationEntryImpl = getNavigationEntry) {
    return waitAfterLoadEvent(configuration, (() => {
        const entry = getNavigationEntryImpl();
        isIncompleteNavigation(entry) || callback(processNavigationEntry(entry));
    }));
}

function processNavigationEntry(entry) {
    return {
        domComplete: entry.domComplete,
        domContentLoaded: entry.domContentLoadedEventEnd,
        domInteractive: entry.domInteractive,
        loadEvent: entry.loadEventEnd,
        firstByte: entry.responseStart >= 0 && entry.responseStart <= timeUtils_relativeNow() ? entry.responseStart : void 0
    };
}

function isIncompleteNavigation(entry) {
    return entry.loadEventEnd <= 0;
}

function waitAfterLoadEvent(configuration, callback) {
    let timeoutId;
    const {stop: stopOnReadyState} = runOnReadyState(configuration, "complete", (() => {
        timeoutId = timer_setTimeout((() => callback()));
    }));
    return {
        stop: () => {
            stopOnReadyState(), timer_clearTimeout(timeoutId);
        }
    };
}

const LCP_MAXIMUM_DELAY = 6e5;

function trackLargestContentfulPaint(configuration, firstHidden, eventTarget, callback) {
    let firstInteractionTimestamp = 1 / 0;
    const {stop: stopEventListener} = addEventListeners(configuration, eventTarget, [ "pointerdown", "keydown" ], (event => {
        firstInteractionTimestamp = event.timeStamp;
    }), {
        capture: !0,
        once: !0
    });
    let biggestLcpSize = 0;
    const performanceLcpSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT,
        buffered: !0
    }).subscribe((entries => {
        const lcpEntry = findLast(entries, (entry => entry.entryType === RumPerformanceEntryType.LARGEST_CONTENTFUL_PAINT && entry.startTime < firstInteractionTimestamp && entry.startTime < firstHidden.timeStamp && entry.startTime < 6e5 && entry.size > biggestLcpSize));
        if (lcpEntry) {
            let lcpTargetSelector;
            lcpEntry.element && (lcpTargetSelector = getSelectorFromElement(lcpEntry.element, configuration.actionNameAttribute)), 
            callback({
                value: lcpEntry.startTime,
                targetSelector: lcpTargetSelector
            }), biggestLcpSize = lcpEntry.size;
        }
    }));
    return {
        stop: () => {
            stopEventListener(), performanceLcpSubscription.unsubscribe();
        }
    };
}

function trackFirstHidden(configuration, eventTarget = window) {
    let timeStamp, stopListeners;
    return "hidden" === document.visibilityState ? timeStamp = 0 : (timeStamp = 1 / 0, 
    ({stop: stopListeners} = addEventListeners(configuration, eventTarget, [ "pagehide", "visibilitychange" ], (event => {
        "pagehide" !== event.type && "hidden" !== document.visibilityState || (timeStamp = event.timeStamp, 
        stopListeners());
    }), {
        capture: !0
    }))), {
        get timeStamp() {
            return timeStamp;
        },
        stop() {
            null == stopListeners || stopListeners();
        }
    };
}

function trackInitialViewMetrics(configuration, setLoadEvent, scheduleViewUpdate) {
    const initialViewMetrics = {}, {stop: stopNavigationTracking} = trackNavigationTimings(configuration, (navigationTimings => {
        setLoadEvent(navigationTimings.loadEvent), initialViewMetrics.navigationTimings = navigationTimings, 
        scheduleViewUpdate();
    })), firstHidden = trackFirstHidden(configuration), {stop: stopFCPTracking} = trackFirstContentfulPaint(configuration, firstHidden, (firstContentfulPaint => {
        initialViewMetrics.firstContentfulPaint = firstContentfulPaint, scheduleViewUpdate();
    })), {stop: stopLCPTracking} = trackLargestContentfulPaint(configuration, firstHidden, window, (largestContentfulPaint => {
        initialViewMetrics.largestContentfulPaint = largestContentfulPaint, scheduleViewUpdate();
    })), {stop: stopFIDTracking} = trackFirstInput(configuration, firstHidden, (firstInput => {
        initialViewMetrics.firstInput = firstInput, scheduleViewUpdate();
    }));
    return {
        stop: function() {
            stopNavigationTracking(), stopFCPTracking(), stopLCPTracking(), stopFIDTracking(), 
            firstHidden.stop();
        },
        initialViewMetrics: initialViewMetrics
    };
}

function trackCumulativeLayoutShift(configuration, viewStart, callback) {
    if (!isLayoutShiftSupported()) return {
        stop: functionUtils_noop
    };
    let maxClsTarget, maxClsStartTime, maxClsValue = 0;
    callback({
        value: 0
    });
    const window = slidingSessionWindow(), performanceSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.LAYOUT_SHIFT,
        buffered: !0
    }).subscribe((entries => {
        for (const entry of entries) {
            if (entry.hadRecentInput || entry.startTime < viewStart) continue;
            const {cumulatedValue: cumulatedValue, isMaxValue: isMaxValue} = window.update(entry);
            if (isMaxValue) {
                const target = getTargetFromSource(entry.sources);
                maxClsTarget = target ? new WeakRef(target) : void 0, maxClsStartTime = timeUtils_elapsed(viewStart, entry.startTime);
            }
            if (cumulatedValue > maxClsValue) {
                maxClsValue = cumulatedValue;
                const target = null == maxClsTarget ? void 0 : maxClsTarget.deref();
                callback({
                    value: round(maxClsValue, 4),
                    targetSelector: target && getSelectorFromElement(target, configuration.actionNameAttribute),
                    time: maxClsStartTime
                });
            }
        }
    }));
    return {
        stop: () => {
            performanceSubscription.unsubscribe();
        }
    };
}

function getTargetFromSource(sources) {
    var _a;
    if (sources) return null === (_a = find(sources, (source => !!source.node && htmlDomUtils_isElementNode(source.node)))) || void 0 === _a ? void 0 : _a.node;
}

const MAX_WINDOW_DURATION = 5e3, MAX_UPDATE_GAP = 1e3;

function slidingSessionWindow() {
    let startTime, endTime, cumulatedValue = 0, maxValue = 0;
    return {
        update: entry => {
            let isMaxValue;
            return void 0 === startTime || entry.startTime - endTime >= 1e3 || entry.startTime - startTime >= 5e3 ? (startTime = endTime = entry.startTime, 
            maxValue = cumulatedValue = entry.value, isMaxValue = !0) : (cumulatedValue += entry.value, 
            endTime = entry.startTime, isMaxValue = entry.value > maxValue, isMaxValue && (maxValue = entry.value)), 
            {
                cumulatedValue: cumulatedValue,
                isMaxValue: isMaxValue
            };
        }
    };
}

function isLayoutShiftSupported() {
    return supportPerformanceTimingEvent(RumPerformanceEntryType.LAYOUT_SHIFT) && "WeakRef" in window;
}

const CLICK_ACTION_MAX_DURATION = 1e4, interactionSelectorCache = new Map;

function getInteractionSelector(relativeTimestamp) {
    const selector = interactionSelectorCache.get(relativeTimestamp);
    return interactionSelectorCache.delete(relativeTimestamp), selector;
}

function updateInteractionSelector(relativeTimestamp, selector) {
    interactionSelectorCache.set(relativeTimestamp, selector), interactionSelectorCache.forEach(((_, relativeTimestamp) => {
        elapsed(relativeTimestamp, relativeNow()) > 1e4 && interactionSelectorCache.delete(relativeTimestamp);
    }));
}

let observer, interactionCountEstimate = 0, minKnownInteractionId = 1 / 0, maxKnownInteractionId = 0;

function initInteractionCountPolyfill() {
    "interactionCount" in performance || observer || (observer = new window.PerformanceObserver(monitor((entries => {
        entries.getEntries().forEach((e => {
            const entry = e;
            entry.interactionId && (minKnownInteractionId = Math.min(minKnownInteractionId, entry.interactionId), 
            maxKnownInteractionId = Math.max(maxKnownInteractionId, entry.interactionId), interactionCountEstimate = (maxKnownInteractionId - minKnownInteractionId) / 7 + 1);
        }));
    }))), observer.observe({
        type: "event",
        buffered: !0,
        durationThreshold: 0
    }));
}

const getInteractionCount = () => observer ? interactionCountEstimate : window.performance.interactionCount || 0, MAX_INTERACTION_ENTRIES = 10, MAX_INP_VALUE = 6e4;

function trackInteractionToNextPaint(configuration, viewStart, viewLoadingType) {
    if (!isInteractionToNextPaintSupported()) return {
        getInteractionToNextPaint: () => {},
        setViewEnd: functionUtils_noop,
        stop: functionUtils_noop
    };
    const {getViewInteractionCount: getViewInteractionCount, stopViewInteractionCount: stopViewInteractionCount} = trackViewInteractionCount(viewLoadingType);
    let viewEnd = 1 / 0;
    const longestInteractions = trackLongestInteractions(getViewInteractionCount);
    let interactionToNextPaintTargetSelector, interactionToNextPaintStartTime, interactionToNextPaint = -1;
    function handleEntries(entries) {
        for (const entry of entries) entry.interactionId && entry.startTime >= viewStart && entry.startTime <= viewEnd && longestInteractions.process(entry);
        const newInteraction = longestInteractions.estimateP98Interaction();
        newInteraction && newInteraction.duration !== interactionToNextPaint && (interactionToNextPaint = newInteraction.duration, 
        interactionToNextPaintStartTime = timeUtils_elapsed(viewStart, newInteraction.startTime), 
        interactionToNextPaintTargetSelector = getInteractionSelector(newInteraction.startTime), 
        !interactionToNextPaintTargetSelector && newInteraction.target && htmlDomUtils_isElementNode(newInteraction.target) && (interactionToNextPaintTargetSelector = getSelectorFromElement(newInteraction.target, configuration.actionNameAttribute)));
    }
    const firstInputSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.FIRST_INPUT,
        buffered: !0
    }).subscribe(handleEntries), eventSubscription = createPerformanceObservable(configuration, {
        type: RumPerformanceEntryType.EVENT,
        durationThreshold: 40,
        buffered: !0
    }).subscribe(handleEntries);
    return {
        getInteractionToNextPaint: () => interactionToNextPaint >= 0 ? {
            value: Math.min(interactionToNextPaint, 6e4),
            targetSelector: interactionToNextPaintTargetSelector,
            time: interactionToNextPaintStartTime
        } : getViewInteractionCount() ? {
            value: 0
        } : void 0,
        setViewEnd: viewEndTime => {
            viewEnd = viewEndTime, stopViewInteractionCount();
        },
        stop: () => {
            eventSubscription.unsubscribe(), firstInputSubscription.unsubscribe();
        }
    };
}

function trackLongestInteractions(getViewInteractionCount) {
    const longestInteractions = [];
    function sortAndTrimLongestInteractions() {
        longestInteractions.sort(((a, b) => b.duration - a.duration)).splice(10);
    }
    return {
        process(entry) {
            const interactionIndex = longestInteractions.findIndex((interaction => entry.interactionId === interaction.interactionId)), minLongestInteraction = longestInteractions[longestInteractions.length - 1];
            -1 !== interactionIndex ? entry.duration > longestInteractions[interactionIndex].duration && (longestInteractions[interactionIndex] = entry, 
            sortAndTrimLongestInteractions()) : (longestInteractions.length < 10 || entry.duration > minLongestInteraction.duration) && (longestInteractions.push(entry), 
            sortAndTrimLongestInteractions());
        },
        estimateP98Interaction() {
            const interactionIndex = Math.min(longestInteractions.length - 1, Math.floor(getViewInteractionCount() / 50));
            return longestInteractions[interactionIndex];
        }
    };
}

function trackViewInteractionCount(viewLoadingType) {
    initInteractionCountPolyfill();
    const previousInteractionCount = "initial_load" === viewLoadingType ? 0 : getInteractionCount();
    let state = {
        stopped: !1
    };
    function computeViewInteractionCount() {
        return getInteractionCount() - previousInteractionCount;
    }
    return {
        getViewInteractionCount: () => state.stopped ? state.interactionCount : computeViewInteractionCount(),
        stopViewInteractionCount: () => {
            state = {
                stopped: !0,
                interactionCount: computeViewInteractionCount()
            };
        }
    };
}

function isInteractionToNextPaintSupported() {
    return supportPerformanceTimingEvent(RumPerformanceEntryType.EVENT) && window.PerformanceEventTiming && "interactionId" in PerformanceEventTiming.prototype;
}

const PAGE_ACTIVITY_VALIDATION_DELAY = 100, PAGE_ACTIVITY_END_DELAY = 100;

function waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageActivityEndCallback, maxDuration) {
    return doWaitPageActivityEnd(createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration), pageActivityEndCallback, maxDuration);
}

function doWaitPageActivityEnd(pageActivityObservable, pageActivityEndCallback, maxDuration) {
    let pageActivityEndTimeoutId, hasCompleted = !1;
    const validationTimeoutId = timer_setTimeout(monitor((() => complete({
        hadActivity: !1
    }))), 100), maxDurationTimeoutId = void 0 !== maxDuration ? timer_setTimeout(monitor((() => complete({
        hadActivity: !0,
        end: timeUtils_timeStampNow()
    }))), maxDuration) : void 0, pageActivitySubscription = pageActivityObservable.subscribe((({isBusy: isBusy}) => {
        timer_clearTimeout(validationTimeoutId), timer_clearTimeout(pageActivityEndTimeoutId);
        const lastChangeTime = timeUtils_timeStampNow();
        isBusy || (pageActivityEndTimeoutId = timer_setTimeout(monitor((() => complete({
            hadActivity: !0,
            end: lastChangeTime
        }))), 100));
    })), stop = () => {
        hasCompleted = !0, timer_clearTimeout(validationTimeoutId), timer_clearTimeout(pageActivityEndTimeoutId), 
        timer_clearTimeout(maxDurationTimeoutId), pageActivitySubscription.unsubscribe();
    };
    function complete(event) {
        hasCompleted || (stop(), pageActivityEndCallback(event));
    }
    return {
        stop: stop
    };
}

function createPageActivityObservable(lifeCycle, domMutationObservable, windowOpenObservable, configuration) {
    return new observable_Observable((observable => {
        const subscriptions = [];
        let firstRequestIndex, pendingRequestsCount = 0;
        return subscriptions.push(domMutationObservable.subscribe(notifyPageActivity), windowOpenObservable.subscribe(notifyPageActivity), createPerformanceObservable(configuration, {
            type: RumPerformanceEntryType.RESOURCE
        }).subscribe((entries => {
            entries.some((entry => !isExcludedUrl(configuration, entry.name))) && notifyPageActivity();
        })), lifeCycle.subscribe(6, (startEvent => {
            isExcludedUrl(configuration, startEvent.url) || (void 0 === firstRequestIndex && (firstRequestIndex = startEvent.requestIndex), 
            pendingRequestsCount += 1, notifyPageActivity());
        })), lifeCycle.subscribe(7, (request => {
            isExcludedUrl(configuration, request.url) || void 0 === firstRequestIndex || request.requestIndex < firstRequestIndex || (pendingRequestsCount -= 1, 
            notifyPageActivity());
        }))), () => {
            subscriptions.forEach((s => s.unsubscribe()));
        };
        function notifyPageActivity() {
            observable.notify({
                isBusy: pendingRequestsCount > 0
            });
        }
    }));
}

function isExcludedUrl(configuration, requestUrl) {
    return matchList(configuration.excludedActivityUrls, requestUrl);
}

function trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadType, viewStart, callback) {
    let isWaitingForLoadEvent = "initial_load" === loadType, isWaitingForActivityLoadingTime = !0;
    const loadingTimeCandidates = [], firstHidden = trackFirstHidden(configuration);
    function invokeCallbackIfAllCandidatesAreReceived() {
        if (!isWaitingForActivityLoadingTime && !isWaitingForLoadEvent && loadingTimeCandidates.length > 0) {
            const loadingTime = Math.max(...loadingTimeCandidates);
            loadingTime < firstHidden.timeStamp && callback(loadingTime);
        }
    }
    const {stop: stop} = waitPageActivityEnd(lifeCycle, domMutationObservable, windowOpenObservable, configuration, (event => {
        isWaitingForActivityLoadingTime && (isWaitingForActivityLoadingTime = !1, event.hadActivity && loadingTimeCandidates.push(timeUtils_elapsed(viewStart.timeStamp, event.end)), 
        invokeCallbackIfAllCandidatesAreReceived());
    }));
    return {
        stop: () => {
            stop(), firstHidden.stop();
        },
        setLoadEvent: loadEvent => {
            isWaitingForLoadEvent && (isWaitingForLoadEvent = !1, loadingTimeCandidates.push(loadEvent), 
            invokeCallbackIfAllCandidatesAreReceived());
        }
    };
}

function getScrollX() {
    let scrollX;
    const visual = window.visualViewport;
    return scrollX = visual ? visual.pageLeft - visual.offsetLeft : void 0 !== window.scrollX ? window.scrollX : window.pageXOffset || 0, 
    Math.round(scrollX);
}

function getScrollY() {
    let scrollY;
    const visual = window.visualViewport;
    return scrollY = visual ? visual.pageTop - visual.offsetTop : void 0 !== window.scrollY ? window.scrollY : window.pageYOffset || 0, 
    Math.round(scrollY);
}

let viewportObservable;

function initViewportObservable(configuration) {
    return viewportObservable || (viewportObservable = createViewportObservable(configuration)), 
    viewportObservable;
}

function createViewportObservable(configuration) {
    return new observable_Observable((observable => {
        const {throttled: updateDimension} = throttle((() => {
            observable.notify(getViewportDimension());
        }), 200);
        return addEventListener(configuration, window, "resize", updateDimension, {
            capture: !0,
            passive: !0
        }).stop;
    }));
}

function getViewportDimension() {
    const visual = window.visualViewport;
    return visual ? {
        width: Number(visual.width * visual.scale),
        height: Number(visual.height * visual.scale)
    } : {
        width: Number(window.innerWidth || 0),
        height: Number(window.innerHeight || 0)
    };
}

const THROTTLE_SCROLL_DURATION = 1e3;

function trackScrollMetrics(configuration, viewStart, callback, scrollValues = createScrollValuesObservable(configuration)) {
    let maxScrollDepth = 0, maxScrollHeight = 0, maxScrollHeightTime = 0;
    const subscription = scrollValues.subscribe((({scrollDepth: scrollDepth, scrollTop: scrollTop, scrollHeight: scrollHeight}) => {
        let shouldUpdate = !1;
        if (scrollDepth > maxScrollDepth && (maxScrollDepth = scrollDepth, shouldUpdate = !0), 
        scrollHeight > maxScrollHeight) {
            maxScrollHeight = scrollHeight;
            const now = timeUtils_relativeNow();
            maxScrollHeightTime = timeUtils_elapsed(viewStart.relative, now), shouldUpdate = !0;
        }
        shouldUpdate && callback({
            maxDepth: Math.min(maxScrollDepth, maxScrollHeight),
            maxDepthScrollTop: scrollTop,
            maxScrollHeight: maxScrollHeight,
            maxScrollHeightTime: maxScrollHeightTime
        });
    }));
    return {
        stop: () => subscription.unsubscribe()
    };
}

function computeScrollValues() {
    const scrollTop = getScrollY(), {height: height} = getViewportDimension();
    return {
        scrollHeight: Math.round((document.scrollingElement || document.documentElement).scrollHeight),
        scrollDepth: Math.round(height + scrollTop),
        scrollTop: scrollTop
    };
}

function createScrollValuesObservable(configuration, throttleDuration = 1e3) {
    return new observable_Observable((observable => {
        if (window.ResizeObserver) {
            const throttledNotify = throttle((function() {
                observable.notify(computeScrollValues());
            }), throttleDuration, {
                leading: !1,
                trailing: !0
            }), observerTarget = document.scrollingElement || document.documentElement, resizeObserver = new ResizeObserver(monitor(throttledNotify.throttled));
            observerTarget && resizeObserver.observe(observerTarget);
            const eventListener = addEventListener(configuration, window, "scroll", throttledNotify.throttled, {
                passive: !0
            });
            return () => {
                throttledNotify.cancel(), resizeObserver.disconnect(), eventListener.stop();
            };
        }
    }));
}

function trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, viewStart) {
    const commonViewMetrics = {}, {stop: stopLoadingTimeTracking, setLoadEvent: setLoadEvent} = trackLoadingTime(lifeCycle, domMutationObservable, windowOpenObservable, configuration, loadingType, viewStart, (newLoadingTime => {
        commonViewMetrics.loadingTime = newLoadingTime, scheduleViewUpdate();
    })), {stop: stopScrollMetricsTracking} = trackScrollMetrics(configuration, viewStart, (newScrollMetrics => {
        commonViewMetrics.scroll = newScrollMetrics;
    })), {stop: stopCLSTracking} = trackCumulativeLayoutShift(configuration, viewStart.relative, (cumulativeLayoutShift => {
        commonViewMetrics.cumulativeLayoutShift = cumulativeLayoutShift, scheduleViewUpdate();
    })), {stop: stopINPTracking, getInteractionToNextPaint: getInteractionToNextPaint, setViewEnd: setViewEnd} = trackInteractionToNextPaint(configuration, viewStart.relative, loadingType);
    return {
        stop: () => {
            stopLoadingTimeTracking(), stopCLSTracking(), stopScrollMetricsTracking();
        },
        stopINPTracking: stopINPTracking,
        setLoadEvent: setLoadEvent,
        setViewEnd: setViewEnd,
        getCommonViewMetrics: () => (commonViewMetrics.interactionToNextPaint = getInteractionToNextPaint(), 
        commonViewMetrics)
    };
}

const THROTTLE_VIEW_UPDATE_PERIOD = 3e3, SESSION_KEEP_ALIVE_INTERVAL = 3e5, KEEP_TRACKING_AFTER_VIEW_DELAY = 3e5;

function trackViews(location, lifeCycle, domMutationObservable, windowOpenObservable, configuration, locationChangeObservable, areViewsTrackedAutomatically, initialViewOptions) {
    const activeViews = new Set;
    let locationChangeSubscription, currentView = startNewView("initial_load", clocksOrigin(), initialViewOptions);
    function startNewView(loadingType, startClocks, viewOptions) {
        const newlyCreatedView = newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, location, loadingType, startClocks, viewOptions);
        return activeViews.add(newlyCreatedView), newlyCreatedView.stopObservable.subscribe((() => {
            activeViews.delete(newlyCreatedView);
        })), newlyCreatedView;
    }
    return lifeCycle.subscribe(9, (() => {
        currentView = startNewView("route_change", void 0, {
            name: currentView.name,
            service: currentView.service,
            version: currentView.version,
            context: currentView.contextManager.getContext()
        });
    })), lifeCycle.subscribe(8, (() => {
        currentView.end({
            sessionIsActive: !1
        });
    })), lifeCycle.subscribe(10, (pageExitEvent => {
        pageExitEvent.reason === PageExitReason.UNLOADING && currentView.end();
    })), areViewsTrackedAutomatically && (locationChangeSubscription = function(locationChangeObservable) {
        return locationChangeObservable.subscribe((({oldLocation: oldLocation, newLocation: newLocation}) => {
            areDifferentLocation(oldLocation, newLocation) && (currentView.end(), currentView = startNewView("route_change"));
        }));
    }(locationChangeObservable)), {
        addTiming: (name, time = timeUtils_timeStampNow()) => {
            currentView.addTiming(name, time);
        },
        startView: (options, startClocks) => {
            currentView.end({
                endClocks: startClocks
            }), currentView = startNewView("route_change", startClocks, options);
        },
        setViewContext: context => {
            currentView.contextManager.setContext(context);
        },
        setViewContextProperty: (key, value) => {
            currentView.contextManager.setContextProperty(key, value);
        },
        setViewName: name => {
            currentView.setViewName(name);
        },
        stop: () => {
            locationChangeSubscription && locationChangeSubscription.unsubscribe(), currentView.end(), 
            activeViews.forEach((view => view.stop()));
        }
    };
}

function newView(lifeCycle, domMutationObservable, windowOpenObservable, configuration, initialLocation, loadingType, startClocks = clocksNow(), viewOptions) {
    const id = generateUUID(), stopObservable = new observable_Observable, customTimings = {};
    let endClocks, documentVersion = 0;
    const location = shallowClone(initialLocation), contextManager = createContextManager();
    let name, service, version, context, sessionIsActive = !0;
    viewOptions && (name = viewOptions.name, service = viewOptions.service || void 0, 
    version = viewOptions.version || void 0, viewOptions.context && (context = viewOptions.context, 
    contextManager.setContext(context)));
    const viewCreatedEvent = {
        id: id,
        name: name,
        startClocks: startClocks,
        service: service,
        version: version,
        context: context
    };
    lifeCycle.notify(1, viewCreatedEvent), lifeCycle.notify(2, viewCreatedEvent);
    const {throttled: scheduleViewUpdate, cancel: cancelScheduleViewUpdate} = throttle(triggerViewUpdate, 3e3, {
        leading: !1
    }), {setLoadEvent: setLoadEvent, setViewEnd: setViewEnd, stop: stopCommonViewMetricsTracking, stopINPTracking: stopINPTracking, getCommonViewMetrics: getCommonViewMetrics} = trackCommonViewMetrics(lifeCycle, domMutationObservable, windowOpenObservable, configuration, scheduleViewUpdate, loadingType, startClocks), {stop: stopInitialViewMetricsTracking, initialViewMetrics: initialViewMetrics} = "initial_load" === loadingType ? trackInitialViewMetrics(configuration, setLoadEvent, scheduleViewUpdate) : {
        stop: functionUtils_noop,
        initialViewMetrics: {}
    }, {stop: stopEventCountsTracking, eventCounts: eventCounts} = trackViewEventCounts(lifeCycle, id, scheduleViewUpdate), keepAliveIntervalId = timer_setInterval(triggerViewUpdate, 3e5);
    function triggerViewUpdate() {
        cancelScheduleViewUpdate(), documentVersion += 1;
        const currentEnd = void 0 === endClocks ? timeUtils_timeStampNow() : endClocks.timeStamp;
        lifeCycle.notify(3, {
            customTimings: customTimings,
            documentVersion: documentVersion,
            id: id,
            name: name,
            service: service,
            version: version,
            context: contextManager.getContext(),
            loadingType: loadingType,
            location: location,
            startClocks: startClocks,
            commonViewMetrics: getCommonViewMetrics(),
            initialViewMetrics: initialViewMetrics,
            duration: timeUtils_elapsed(startClocks.timeStamp, currentEnd),
            isActive: void 0 === endClocks,
            sessionIsActive: sessionIsActive,
            eventCounts: eventCounts
        });
    }
    return triggerViewUpdate(), contextManager.changeObservable.subscribe(triggerViewUpdate), 
    {
        get name() {
            return name;
        },
        service: service,
        version: version,
        contextManager: contextManager,
        stopObservable: stopObservable,
        end(options = {}) {
            var _a, _b;
            endClocks || (endClocks = null !== (_a = options.endClocks) && void 0 !== _a ? _a : clocksNow(), 
            sessionIsActive = null === (_b = options.sessionIsActive) || void 0 === _b || _b, 
            lifeCycle.notify(4, {
                endClocks: endClocks
            }), lifeCycle.notify(5, {
                endClocks: endClocks
            }), timer_clearInterval(keepAliveIntervalId), setViewEnd(endClocks.relative), stopCommonViewMetricsTracking(), 
            triggerViewUpdate(), timer_setTimeout((() => {
                this.stop();
            }), 3e5));
        },
        stop() {
            stopInitialViewMetricsTracking(), stopEventCountsTracking(), stopINPTracking(), 
            stopObservable.notify();
        },
        addTiming(name, time) {
            if (endClocks) return;
            const relativeTime = looksLikeRelativeTime(time) ? time : timeUtils_elapsed(startClocks.timeStamp, time);
            customTimings[sanitizeTiming(name)] = relativeTime, scheduleViewUpdate();
        },
        setViewName(updatedName) {
            name = updatedName, triggerViewUpdate();
        }
    };
}

function sanitizeTiming(name) {
    const sanitized = name.replace(/[^a-zA-Z0-9-_.@$]/g, "_");
    return sanitized !== name && display.warn(`Invalid timing name: ${name}, sanitized to: ${sanitized}`), 
    sanitized;
}

function areDifferentLocation(currentLocation, otherLocation) {
    return currentLocation.pathname !== otherLocation.pathname || !isHashAnAnchor(otherLocation.hash) && getPathFromHash(otherLocation.hash) !== getPathFromHash(currentLocation.hash);
}

function isHashAnAnchor(hash) {
    const correspondingId = hash.substring(1);
    return "" !== correspondingId && !!document.getElementById(correspondingId);
}

function getPathFromHash(hash) {
    const index = hash.indexOf("?");
    return index < 0 ? hash : hash.slice(0, index);
}

function startViewCollection(lifeCycle, configuration, location, domMutationObservable, pageOpenObserable, locationChangeObservable, featureFlagContexts, pageStateHistory, recorderApi, initialViewOptions) {
    return lifeCycle.subscribe(3, (view => lifeCycle.notify(11, processViewUpdate(view, configuration, featureFlagContexts, recorderApi, pageStateHistory)))), 
    trackViews(location, lifeCycle, domMutationObservable, pageOpenObserable, configuration, locationChangeObservable, !configuration.trackViewsManually, initialViewOptions);
}

function processViewUpdate(view, configuration, featureFlagContexts, recorderApi, pageStateHistory) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const replayStats = recorderApi.getReplayStats(view.id), pageStates = pageStateHistory.findAll(view.startClocks.relative, view.duration), viewEvent = {
        _dd: {
            document_version: view.documentVersion,
            replay_stats: replayStats,
            page_states: pageStates,
            configuration: {
                start_session_replay_recording_manually: configuration.startSessionReplayRecordingManually
            }
        },
        date: view.startClocks.timeStamp,
        type: "view",
        view: {
            action: {
                count: view.eventCounts.actionCount
            },
            frustration: {
                count: view.eventCounts.frustrationCount
            },
            cumulative_layout_shift: null === (_a = view.commonViewMetrics.cumulativeLayoutShift) || void 0 === _a ? void 0 : _a.value,
            cumulative_layout_shift_time: toServerDuration(null === (_b = view.commonViewMetrics.cumulativeLayoutShift) || void 0 === _b ? void 0 : _b.time),
            cumulative_layout_shift_target_selector: null === (_c = view.commonViewMetrics.cumulativeLayoutShift) || void 0 === _c ? void 0 : _c.targetSelector,
            first_byte: toServerDuration(null === (_d = view.initialViewMetrics.navigationTimings) || void 0 === _d ? void 0 : _d.firstByte),
            dom_complete: toServerDuration(null === (_e = view.initialViewMetrics.navigationTimings) || void 0 === _e ? void 0 : _e.domComplete),
            dom_content_loaded: toServerDuration(null === (_f = view.initialViewMetrics.navigationTimings) || void 0 === _f ? void 0 : _f.domContentLoaded),
            dom_interactive: toServerDuration(null === (_g = view.initialViewMetrics.navigationTimings) || void 0 === _g ? void 0 : _g.domInteractive),
            error: {
                count: view.eventCounts.errorCount
            },
            first_contentful_paint: toServerDuration(view.initialViewMetrics.firstContentfulPaint),
            first_input_delay: toServerDuration(null === (_h = view.initialViewMetrics.firstInput) || void 0 === _h ? void 0 : _h.delay),
            first_input_time: toServerDuration(null === (_j = view.initialViewMetrics.firstInput) || void 0 === _j ? void 0 : _j.time),
            first_input_target_selector: null === (_k = view.initialViewMetrics.firstInput) || void 0 === _k ? void 0 : _k.targetSelector,
            interaction_to_next_paint: toServerDuration(null === (_l = view.commonViewMetrics.interactionToNextPaint) || void 0 === _l ? void 0 : _l.value),
            interaction_to_next_paint_time: toServerDuration(null === (_m = view.commonViewMetrics.interactionToNextPaint) || void 0 === _m ? void 0 : _m.time),
            interaction_to_next_paint_target_selector: null === (_o = view.commonViewMetrics.interactionToNextPaint) || void 0 === _o ? void 0 : _o.targetSelector,
            is_active: view.isActive,
            name: view.name,
            largest_contentful_paint: toServerDuration(null === (_p = view.initialViewMetrics.largestContentfulPaint) || void 0 === _p ? void 0 : _p.value),
            largest_contentful_paint_target_selector: null === (_q = view.initialViewMetrics.largestContentfulPaint) || void 0 === _q ? void 0 : _q.targetSelector,
            load_event: toServerDuration(null === (_r = view.initialViewMetrics.navigationTimings) || void 0 === _r ? void 0 : _r.loadEvent),
            loading_time: discardNegativeDuration(toServerDuration(view.commonViewMetrics.loadingTime)),
            loading_type: view.loadingType,
            long_task: {
                count: view.eventCounts.longTaskCount
            },
            resource: {
                count: view.eventCounts.resourceCount
            },
            time_spent: toServerDuration(view.duration)
        },
        display: view.commonViewMetrics.scroll ? {
            scroll: {
                max_depth: view.commonViewMetrics.scroll.maxDepth,
                max_depth_scroll_top: view.commonViewMetrics.scroll.maxDepthScrollTop,
                max_scroll_height: view.commonViewMetrics.scroll.maxScrollHeight,
                max_scroll_height_time: toServerDuration(view.commonViewMetrics.scroll.maxScrollHeightTime)
            }
        } : void 0,
        session: {
            has_replay: !!replayStats || void 0,
            is_active: !!view.sessionIsActive && void 0
        },
        privacy: {
            replay_level: configuration.defaultPrivacyLevel
        }
    };
    return isEmptyObject(view.customTimings) || (viewEvent.view.custom_timings = mapValues(view.customTimings, toServerDuration)), 
    {
        rawRumEvent: viewEvent,
        startTime: view.startClocks.relative,
        domainContext: {
            location: view.location
        }
    };
}

const VISIBILITY_CHECK_DELAY = 6e4, SESSION_CONTEXT_TIMEOUT_DELAY = 144e5;

let stopCallbacks = [];

function startSessionManager(configuration, productKey, computeSessionState, trackingConsentState) {
    const renewObservable = new observable_Observable, expireObservable = new observable_Observable, sessionStore = startSessionStore(configuration.sessionStoreStrategyType, productKey, computeSessionState);
    stopCallbacks.push((() => sessionStore.stop()));
    const sessionContextHistory = createValueHistory({
        expireDelay: 144e5
    });
    function buildSessionContext() {
        return {
            id: sessionStore.getSession().id,
            trackingType: sessionStore.getSession()[productKey],
            isReplayForced: !!sessionStore.getSession().forcedReplay,
            anonymousId: sessionStore.getSession().anonymousId
        };
    }
    return stopCallbacks.push((() => sessionContextHistory.stop())), sessionStore.renewObservable.subscribe((() => {
        sessionContextHistory.add(buildSessionContext(), timeUtils_relativeNow()), renewObservable.notify();
    })), sessionStore.expireObservable.subscribe((() => {
        expireObservable.notify(), sessionContextHistory.closeActive(timeUtils_relativeNow());
    })), sessionStore.expandOrRenewSession(), sessionContextHistory.add(buildSessionContext(), clocksOrigin().relative), 
    trackingConsentState.observable.subscribe((() => {
        trackingConsentState.isGranted() ? sessionStore.expandOrRenewSession() : sessionStore.expire();
    })), trackActivity(configuration, (() => {
        trackingConsentState.isGranted() && sessionStore.expandOrRenewSession();
    })), trackVisibility(configuration, (() => sessionStore.expandSession())), trackResume(configuration, (() => sessionStore.restartSession())), 
    {
        findSession: (startTime, options) => sessionContextHistory.find(startTime, options),
        renewObservable: renewObservable,
        expireObservable: expireObservable,
        sessionStateUpdateObservable: sessionStore.sessionStateUpdateObservable,
        expire: sessionStore.expire,
        updateSessionState: sessionStore.updateSessionState
    };
}

function stopSessionManager() {
    stopCallbacks.forEach((e => e())), stopCallbacks = [];
}

function trackActivity(configuration, expandOrRenewSession) {
    const {stop: stop} = addEventListeners(configuration, window, [ "click", "touchstart", "keydown", "scroll" ], expandOrRenewSession, {
        capture: !0,
        passive: !0
    });
    stopCallbacks.push(stop);
}

function trackVisibility(configuration, expandSession) {
    const expandSessionWhenVisible = () => {
        "visible" === document.visibilityState && expandSession();
    }, {stop: stop} = addEventListener(configuration, document, "visibilitychange", expandSessionWhenVisible);
    stopCallbacks.push(stop);
    const visibilityCheckInterval = timer_setInterval(expandSessionWhenVisible, 6e4);
    stopCallbacks.push((() => {
        timer_clearInterval(visibilityCheckInterval);
    }));
}

function trackResume(configuration, cb) {
    const {stop: stop} = addEventListener(configuration, window, "resume", cb, {
        capture: !0
    });
    stopCallbacks.push(stop);
}

const RUM_SESSION_KEY = "rum";

function startRumSessionManager(configuration, lifeCycle, trackingConsentState) {
    const sessionManager = startSessionManager(configuration, "rum", (rawTrackingType => computeSessionState(configuration, rawTrackingType)), trackingConsentState);
    return sessionManager.expireObservable.subscribe((() => {
        lifeCycle.notify(8);
    })), sessionManager.renewObservable.subscribe((() => {
        lifeCycle.notify(9);
    })), sessionManager.sessionStateUpdateObservable.subscribe((({previousState: previousState, newState: newState}) => {
        if (!previousState.forcedReplay && newState.forcedReplay) {
            const sessionEntity = sessionManager.findSession();
            sessionEntity && (sessionEntity.isReplayForced = !0);
        }
    })), {
        findTrackedSession: startTime => {
            const session = sessionManager.findSession(startTime);
            if (session && isTypeTracked(session.trackingType)) return {
                id: session.id,
                sessionReplay: "1" === session.trackingType ? 1 : session.isReplayForced ? 2 : 0,
                anonymousId: session.anonymousId
            };
        },
        expire: sessionManager.expire,
        expireObservable: sessionManager.expireObservable,
        setForcedReplay: () => sessionManager.updateSessionState({
            forcedReplay: "1"
        })
    };
}

function startRumSessionManagerStub() {
    const session = {
        id: "00000000-aaaa-0000-aaaa-000000000000",
        sessionReplay: bridgeSupports("records") ? 1 : 0
    };
    return {
        findTrackedSession: () => session,
        expire: noop,
        expireObservable: new Observable,
        setForcedReplay: noop
    };
}

function computeSessionState(configuration, rawTrackingType) {
    let trackingType;
    return trackingType = hasValidRumSession(rawTrackingType) ? rawTrackingType : numberUtils_performDraw(configuration.sessionSampleRate) ? numberUtils_performDraw(configuration.sessionReplaySampleRate) ? "1" : "2" : "0", 
    {
        trackingType: trackingType,
        isTracked: isTypeTracked(trackingType)
    };
}

function hasValidRumSession(trackingType) {
    return "0" === trackingType || "1" === trackingType || "2" === trackingType;
}

function isTypeTracked(rumSessionType) {
    return "2" === rumSessionType || "1" === rumSessionType;
}

function createBatch({encoder: encoder, request: request, flushController: flushController, messageBytesLimit: messageBytesLimit}) {
    let upsertBuffer = {};
    const flushSubscription = flushController.flushObservable.subscribe((event => function(event) {
        const upsertMessages = objectValues(upsertBuffer).join("\n");
        upsertBuffer = {};
        const isPageExit = isPageExitReason(event.reason), send = isPageExit ? request.sendOnExit : request.send;
        if (isPageExit && encoder.isAsync) {
            const encoderResult = encoder.finishSync();
            encoderResult.outputBytesCount && send(formatPayloadFromEncoder(encoderResult));
            const pendingMessages = [ encoderResult.pendingData, upsertMessages ].filter(Boolean).join("\n");
            pendingMessages && send({
                data: pendingMessages,
                bytesCount: computeBytesCount(pendingMessages)
            });
        } else upsertMessages && encoder.write(encoder.isEmpty ? upsertMessages : `\n${upsertMessages}`), 
        encoder.finish((encoderResult => {
            send(formatPayloadFromEncoder(encoderResult));
        }));
    }(event)));
    function addOrUpdate(message, key) {
        const serializedMessage = jsonStringify_jsonStringify(message), estimatedMessageBytesCount = encoder.estimateEncodedBytesCount(serializedMessage);
        estimatedMessageBytesCount >= messageBytesLimit ? display.warn(`Discarded a message whose size was bigger than the maximum allowed size ${messageBytesLimit}KB. More details: ${DOCS_TROUBLESHOOTING}/#technical-limitations`) : (function(key) {
            return void 0 !== key && void 0 !== upsertBuffer[key];
        }(key) && function(key) {
            const removedMessage = upsertBuffer[key];
            delete upsertBuffer[key];
            const messageBytesCount = encoder.estimateEncodedBytesCount(removedMessage);
            flushController.notifyAfterRemoveMessage(messageBytesCount);
        }(key), function(serializedMessage, estimatedMessageBytesCount, key) {
            flushController.notifyBeforeAddMessage(estimatedMessageBytesCount), void 0 !== key ? (upsertBuffer[key] = serializedMessage, 
            flushController.notifyAfterAddMessage()) : encoder.write(encoder.isEmpty ? serializedMessage : `\n${serializedMessage}`, (realMessageBytesCount => {
                flushController.notifyAfterAddMessage(realMessageBytesCount - estimatedMessageBytesCount);
            }));
        }(serializedMessage, estimatedMessageBytesCount, key));
    }
    return {
        flushController: flushController,
        add: addOrUpdate,
        upsert: addOrUpdate,
        stop: flushSubscription.unsubscribe
    };
}

function formatPayloadFromEncoder(encoderResult) {
    let data;
    return data = "string" == typeof encoderResult.output ? encoderResult.output : new Blob([ encoderResult.output ], {
        type: "text/plain"
    }), {
        data: data,
        bytesCount: encoderResult.outputBytesCount,
        encoding: encoderResult.encoding
    };
}

const rawTelemetryEvent_types_TelemetryType = {
    log: "log",
    configuration: "configuration",
    usage: "usage"
}, ALLOWED_FRAME_URLS = [ "https://www.datadoghq-browser-agent.com", "https://www.datad0g-browser-agent.com", "https://d3uc069fcn7uxw.cloudfront.net", "https://d20xtzwzcl0ceb.cloudfront.net", "http://localhost", "<anonymous>" ], TELEMETRY_EXCLUDED_SITES = [ "ddog-gov.com" ];

let preStartTelemetryBuffer = boundedBuffer_createBoundedBuffer(), onRawTelemetryEventCollected = event => {
    preStartTelemetryBuffer.add((() => onRawTelemetryEventCollected(event)));
};

function startTelemetry(telemetryService, configuration) {
    let contextProvider;
    const observable = new Observable, alreadySentEvents = new Set, telemetryEnabled = !includes(TELEMETRY_EXCLUDED_SITES, configuration.site) && performDraw(configuration.telemetrySampleRate), telemetryEnabledPerType = {
        [TelemetryType.log]: telemetryEnabled,
        [TelemetryType.configuration]: telemetryEnabled && performDraw(configuration.telemetryConfigurationSampleRate),
        [TelemetryType.usage]: telemetryEnabled && performDraw(configuration.telemetryUsageSampleRate)
    }, runtimeEnvInfo = getRuntimeEnvInfo();
    return onRawTelemetryEventCollected = rawEvent => {
        const stringifiedEvent = jsonStringify(rawEvent);
        if (telemetryEnabledPerType[rawEvent.type] && alreadySentEvents.size < configuration.maxTelemetryEventsPerPage && !alreadySentEvents.has(stringifiedEvent)) {
            const event = function(telemetryService, event, runtimeEnvInfo) {
                return combine({
                    type: "telemetry",
                    date: timeStampNow(),
                    service: telemetryService,
                    version: "5.35.0",
                    source: "browser",
                    _dd: {
                        format_version: 2
                    },
                    telemetry: combine(event, {
                        runtime_env: runtimeEnvInfo,
                        connectivity: getConnectivity(),
                        sdk_setup: "cdn"
                    }),
                    experimental_features: arrayFrom(getExperimentalFeatures())
                }, void 0 !== contextProvider ? contextProvider() : {});
            }(telemetryService, rawEvent, runtimeEnvInfo);
            observable.notify(event), sendToExtension("telemetry", event), alreadySentEvents.add(stringifiedEvent);
        }
    }, startMonitorErrorCollection(addTelemetryError), {
        setContextProvider: provider => {
            contextProvider = provider;
        },
        observable: observable,
        enabled: telemetryEnabled
    };
}

function getRuntimeEnvInfo() {
    return {
        is_local_file: "file:" === window.location.protocol,
        is_worker: "WorkerGlobalScope" in self
    };
}

function startFakeTelemetry() {
    const events = [];
    return onRawTelemetryEventCollected = event => {
        events.push(event);
    }, events;
}

function drainPreStartTelemetry() {
    preStartTelemetryBuffer.drain();
}

function resetTelemetry() {
    preStartTelemetryBuffer = createBoundedBuffer(), onRawTelemetryEventCollected = event => {
        preStartTelemetryBuffer.add((() => onRawTelemetryEventCollected(event)));
    };
}

function isTelemetryReplicationAllowed(configuration) {
    return configuration.site === INTAKE_SITE_STAGING;
}

function addTelemetryDebug(message, context) {
    displayIfDebugEnabled(ConsoleApiName.debug, message, context), onRawTelemetryEventCollected(assign({
        type: TelemetryType.log,
        message: message,
        status: "debug"
    }, context));
}

function addTelemetryError(e, context) {
    onRawTelemetryEventCollected(polyfills_assign({
        type: rawTelemetryEvent_types_TelemetryType.log,
        status: "error"
    }, formatError(e), context));
}

function addTelemetryConfiguration(configuration) {
    onRawTelemetryEventCollected({
        type: TelemetryType.configuration,
        configuration: configuration
    });
}

function addTelemetryUsage(usage) {
    onRawTelemetryEventCollected({
        type: TelemetryType.usage,
        usage: usage
    });
}

function formatError(e) {
    if (isError(e)) {
        const stackTrace = computeStackTrace(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: toStackTraceString(scrubCustomerFrames(stackTrace))
            },
            message: stackTrace.message
        };
    }
    return {
        error: {
            stack: NO_ERROR_STACK_PRESENT_MESSAGE
        },
        message: `Uncaught ${jsonStringify_jsonStringify(e)}`
    };
}

function scrubCustomerFrames(stackTrace) {
    return stackTrace.stack = stackTrace.stack.filter((frame => !frame.url || ALLOWED_FRAME_URLS.some((allowedFrameUrl => startsWith(frame.url, allowedFrameUrl))))), 
    stackTrace;
}

const MAX_ONGOING_BYTES_COUNT = 81920, MAX_ONGOING_REQUESTS = 32, MAX_QUEUE_BYTES_COUNT = 3145728, MAX_BACKOFF_TIME = 6e4, INITIAL_BACKOFF_TIME = 1e3;

function sendWithRetryStrategy(payload, state, sendStrategy, trackType, reportError) {
    0 === state.transportStatus && 0 === state.queuedPayloads.size() && state.bandwidthMonitor.canHandle(payload) ? send(payload, state, sendStrategy, {
        onSuccess: () => retryQueuedPayloads(0, state, sendStrategy, trackType, reportError),
        onFailure: () => {
            state.queuedPayloads.enqueue(payload), scheduleRetry(state, sendStrategy, trackType, reportError);
        }
    }) : state.queuedPayloads.enqueue(payload);
}

function scheduleRetry(state, sendStrategy, trackType, reportError) {
    2 === state.transportStatus && timer_setTimeout((() => {
        send(state.queuedPayloads.first(), state, sendStrategy, {
            onSuccess: () => {
                state.queuedPayloads.dequeue(), state.currentBackoffTime = 1e3, retryQueuedPayloads(1, state, sendStrategy, trackType, reportError);
            },
            onFailure: () => {
                state.currentBackoffTime = Math.min(6e4, 2 * state.currentBackoffTime), scheduleRetry(state, sendStrategy, trackType, reportError);
            }
        });
    }), state.currentBackoffTime);
}

function send(payload, state, sendStrategy, {onSuccess: onSuccess, onFailure: onFailure}) {
    state.bandwidthMonitor.add(payload), sendStrategy(payload, (response => {
        state.bandwidthMonitor.remove(payload), shouldRetryRequest(response) ? (state.transportStatus = state.bandwidthMonitor.ongoingRequestCount > 0 ? 1 : 2, 
        payload.retry = {
            count: payload.retry ? payload.retry.count + 1 : 1,
            lastFailureStatus: response.status
        }, onFailure()) : (state.transportStatus = 0, onSuccess());
    }));
}

function retryQueuedPayloads(reason, state, sendStrategy, trackType, reportError) {
    0 === reason && state.queuedPayloads.isFull() && !state.queueFullReported && (reportError({
        message: `Reached max ${trackType} events size queued for upload: 3MiB`,
        source: ErrorSource.AGENT,
        startClocks: clocksNow()
    }), state.queueFullReported = !0);
    const previousQueue = state.queuedPayloads;
    for (state.queuedPayloads = newPayloadQueue(); previousQueue.size() > 0; ) sendWithRetryStrategy(previousQueue.dequeue(), state, sendStrategy, trackType, reportError);
}

function shouldRetryRequest(response) {
    return "opaque" !== response.type && (0 === response.status && !navigator.onLine || 408 === response.status || 429 === response.status || isServerError(response.status));
}

function newRetryState() {
    return {
        transportStatus: 0,
        currentBackoffTime: 1e3,
        bandwidthMonitor: newBandwidthMonitor(),
        queuedPayloads: newPayloadQueue(),
        queueFullReported: !1
    };
}

function newPayloadQueue() {
    const queue = [];
    return {
        bytesCount: 0,
        enqueue(payload) {
            this.isFull() || (queue.push(payload), this.bytesCount += payload.bytesCount);
        },
        first: () => queue[0],
        dequeue() {
            const payload = queue.shift();
            return payload && (this.bytesCount -= payload.bytesCount), payload;
        },
        size: () => queue.length,
        isFull() {
            return this.bytesCount >= 3145728;
        }
    };
}

function newBandwidthMonitor() {
    return {
        ongoingRequestCount: 0,
        ongoingByteCount: 0,
        canHandle(payload) {
            return 0 === this.ongoingRequestCount || this.ongoingByteCount + payload.bytesCount <= 81920 && this.ongoingRequestCount < 32;
        },
        add(payload) {
            this.ongoingRequestCount += 1, this.ongoingByteCount += payload.bytesCount;
        },
        remove(payload) {
            this.ongoingRequestCount -= 1, this.ongoingByteCount -= payload.bytesCount;
        }
    };
}

function createHttpRequest(endpointBuilder, bytesLimit, reportError) {
    const retryState = newRetryState(), sendStrategyForRetry = (payload, onResponse) => fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload, onResponse);
    return {
        send: payload => {
            sendWithRetryStrategy(payload, retryState, sendStrategyForRetry, endpointBuilder.trackType, reportError);
        },
        sendOnExit: payload => {
            sendBeaconStrategy(endpointBuilder, bytesLimit, payload);
        }
    };
}

function sendBeaconStrategy(endpointBuilder, bytesLimit, payload) {
    if (!!navigator.sendBeacon && payload.bytesCount < bytesLimit) try {
        const beaconUrl = endpointBuilder.build("beacon", payload);
        if (navigator.sendBeacon(beaconUrl, payload.data)) return;
    } catch (e) {
        reportBeaconError(e);
    }
    sendXHR(endpointBuilder.build("xhr", payload), payload.data);
}

let hasReportedBeaconError = !1;

function reportBeaconError(e) {
    hasReportedBeaconError || (hasReportedBeaconError = !0, addTelemetryError(e));
}

function fetchKeepAliveStrategy(endpointBuilder, bytesLimit, payload, onResponse) {
    if (isKeepAliveSupported() && payload.bytesCount < bytesLimit) {
        const fetchUrl = endpointBuilder.build("fetch", payload);
        fetch(fetchUrl, {
            method: "POST",
            body: payload.data,
            keepalive: !0,
            mode: "cors"
        }).then(monitor((response => null == onResponse ? void 0 : onResponse({
            status: response.status,
            type: response.type
        }))), monitor((() => {
            sendXHR(endpointBuilder.build("xhr", payload), payload.data, onResponse);
        })));
    } else {
        sendXHR(endpointBuilder.build("xhr", payload), payload.data, onResponse);
    }
}

function isKeepAliveSupported() {
    try {
        return window.Request && "keepalive" in new Request("http://a");
    } catch (_a) {
        return !1;
    }
}

function sendXHR(url, data, onResponse) {
    const request = new XMLHttpRequest;
    request.open("POST", url, !0), data instanceof Blob && request.setRequestHeader("Content-Type", data.type), 
    addEventListener({
        allowUntrustedEvents: !0
    }, request, "loadend", (() => {
        null == onResponse || onResponse({
            status: request.status
        });
    }), {
        once: !0
    }), request.send(data);
}

function createFlushController({messagesLimit: messagesLimit, bytesLimit: bytesLimit, durationLimit: durationLimit, pageExitObservable: pageExitObservable, sessionExpireObservable: sessionExpireObservable}) {
    const pageExitSubscription = pageExitObservable.subscribe((event => flush(event.reason))), sessionExpireSubscription = sessionExpireObservable.subscribe((() => flush("session_expire"))), flushObservable = new observable_Observable((() => () => {
        pageExitSubscription.unsubscribe(), sessionExpireSubscription.unsubscribe();
    }));
    let durationLimitTimeoutId, currentBytesCount = 0, currentMessagesCount = 0;
    function flush(flushReason) {
        if (0 === currentMessagesCount) return;
        const messagesCount = currentMessagesCount, bytesCount = currentBytesCount;
        currentMessagesCount = 0, currentBytesCount = 0, cancelDurationLimitTimeout(), flushObservable.notify({
            reason: flushReason,
            messagesCount: messagesCount,
            bytesCount: bytesCount
        });
    }
    function cancelDurationLimitTimeout() {
        timer_clearTimeout(durationLimitTimeoutId), durationLimitTimeoutId = void 0;
    }
    return {
        flushObservable: flushObservable,
        get messagesCount() {
            return currentMessagesCount;
        },
        notifyBeforeAddMessage(estimatedMessageBytesCount) {
            currentBytesCount + estimatedMessageBytesCount >= bytesLimit && flush("bytes_limit"), 
            currentMessagesCount += 1, currentBytesCount += estimatedMessageBytesCount, void 0 === durationLimitTimeoutId && (durationLimitTimeoutId = timer_setTimeout((() => {
                flush("duration_limit");
            }), durationLimit));
        },
        notifyAfterAddMessage(messageBytesCountDiff = 0) {
            currentBytesCount += messageBytesCountDiff, currentMessagesCount >= messagesLimit ? flush("messages_limit") : currentBytesCount >= bytesLimit && flush("bytes_limit");
        },
        notifyAfterRemoveMessage(messageBytesCount) {
            currentBytesCount -= messageBytesCount, currentMessagesCount -= 1, 0 === currentMessagesCount && cancelDurationLimitTimeout();
        }
    };
}

function startBatchWithReplica(configuration, primary, replica, reportError, pageExitObservable, sessionExpireObservable, batchFactoryImp = createBatch) {
    const primaryBatch = createBatchFromConfig(configuration, primary), replicaBatch = replica && createBatchFromConfig(configuration, replica);
    function createBatchFromConfig(configuration, {endpoint: endpoint, encoder: encoder}) {
        return batchFactoryImp({
            encoder: encoder,
            request: createHttpRequest(endpoint, configuration.batchBytesLimit, reportError),
            flushController: createFlushController({
                messagesLimit: configuration.batchMessagesLimit,
                bytesLimit: configuration.batchBytesLimit,
                durationLimit: configuration.flushTimeout,
                pageExitObservable: pageExitObservable,
                sessionExpireObservable: sessionExpireObservable
            }),
            messageBytesLimit: configuration.messageBytesLimit
        });
    }
    return {
        flushObservable: primaryBatch.flushController.flushObservable,
        add(message, replicated = !0) {
            primaryBatch.add(message), replicaBatch && replicated && replicaBatch.add(replica.transformMessage ? replica.transformMessage(message) : message);
        },
        upsert: (message, key) => {
            primaryBatch.upsert(message, key), replicaBatch && replicaBatch.upsert(replica.transformMessage ? replica.transformMessage(message) : message, key);
        },
        stop: () => {
            primaryBatch.stop(), replicaBatch && replicaBatch.stop();
        }
    };
}

function startRumBatch(configuration, lifeCycle, telemetryEventObservable, reportError, pageExitObservable, sessionExpireObservable, createEncoder) {
    const replica = configuration.replica, batch = startBatchWithReplica(configuration, {
        endpoint: configuration.rumEndpointBuilder,
        encoder: createEncoder(2)
    }, replica && {
        endpoint: replica.rumEndpointBuilder,
        transformMessage: message => mergeInto_combine(message, {
            application: {
                id: replica.applicationId
            }
        }),
        encoder: createEncoder(3)
    }, reportError, pageExitObservable, sessionExpireObservable);
    return lifeCycle.subscribe(12, (serverRumEvent => {
        "view" === serverRumEvent.type ? batch.upsert(serverRumEvent, serverRumEvent.view.id) : batch.add(serverRumEvent);
    })), batch;
}

const URL_CONTEXT_TIME_OUT_DELAY = 144e5;

function startUrlContexts(lifeCycle, locationChangeObservable, location) {
    const urlContextHistory = createValueHistory({
        expireDelay: 144e5
    });
    let previousViewUrl;
    lifeCycle.subscribe(1, (({startClocks: startClocks}) => {
        const viewUrl = location.href;
        urlContextHistory.add(buildUrlContext({
            url: viewUrl,
            referrer: previousViewUrl || document.referrer
        }), startClocks.relative), previousViewUrl = viewUrl;
    })), lifeCycle.subscribe(5, (({endClocks: endClocks}) => {
        urlContextHistory.closeActive(endClocks.relative);
    }));
    const locationChangeSubscription = locationChangeObservable.subscribe((({newLocation: newLocation}) => {
        const current = urlContextHistory.find();
        if (current) {
            const changeTime = timeUtils_relativeNow();
            urlContextHistory.closeActive(changeTime), urlContextHistory.add(buildUrlContext({
                url: newLocation.href,
                referrer: current.referrer
            }), changeTime);
        }
    }));
    function buildUrlContext({url: url, referrer: referrer}) {
        return {
            url: url,
            referrer: referrer
        };
    }
    return {
        findUrl: startTime => urlContextHistory.find(startTime),
        stop: () => {
            locationChangeSubscription.unsubscribe(), urlContextHistory.stop();
        }
    };
}

function createLocationChangeObservable(configuration, location) {
    let currentLocation = shallowClone(location);
    return new observable_Observable((observable => {
        const {stop: stopHistoryTracking} = trackHistory(configuration, onLocationChange), {stop: stopHashTracking} = trackHash(configuration, onLocationChange);
        function onLocationChange() {
            if (currentLocation.href === location.href) return;
            const newLocation = shallowClone(location);
            observable.notify({
                newLocation: newLocation,
                oldLocation: currentLocation
            }), currentLocation = newLocation;
        }
        return () => {
            stopHistoryTracking(), stopHashTracking();
        };
    }));
}

function trackHistory(configuration, onHistoryChange) {
    const {stop: stopInstrumentingPushState} = instrumentMethod(getHistoryInstrumentationTarget("pushState"), "pushState", (({onPostCall: onPostCall}) => {
        onPostCall(onHistoryChange);
    })), {stop: stopInstrumentingReplaceState} = instrumentMethod(getHistoryInstrumentationTarget("replaceState"), "replaceState", (({onPostCall: onPostCall}) => {
        onPostCall(onHistoryChange);
    })), {stop: removeListener} = addEventListener(configuration, window, "popstate", onHistoryChange);
    return {
        stop: () => {
            stopInstrumentingPushState(), stopInstrumentingReplaceState(), removeListener();
        }
    };
}

function trackHash(configuration, onHashChange) {
    return addEventListener(configuration, window, "hashchange", onHashChange);
}

function getHistoryInstrumentationTarget(methodName) {
    return Object.prototype.hasOwnProperty.call(history, methodName) ? history : History.prototype;
}

const MEASURES_PERIOD_DURATION = 1e4;

let currentPeriodMeasures, currentBatchMeasures, batchHasRumEvent;

function startCustomerDataTelemetry(configuration, telemetry, lifeCycle, customerDataTrackerManager, batchFlushObservable) {
    initCurrentPeriodMeasures(), initCurrentBatchMeasures(), lifeCycle.subscribe(12, (event => {
        batchHasRumEvent = !0, updateMeasure(currentBatchMeasures.globalContextBytes, customerDataTrackerManager.getOrCreateTracker(2).getBytesCount()), 
        updateMeasure(currentBatchMeasures.userContextBytes, customerDataTrackerManager.getOrCreateTracker(1).getBytesCount()), 
        updateMeasure(currentBatchMeasures.featureFlagBytes, polyfills_includes([ "view", "error" ], event.type) ? customerDataTrackerManager.getOrCreateTracker(0).getBytesCount() : 0);
    })), batchFlushObservable.subscribe((({bytesCount: bytesCount, messagesCount: messagesCount}) => {
        batchHasRumEvent && (currentPeriodMeasures.batchCount += 1, updateMeasure(currentPeriodMeasures.batchBytesCount, bytesCount), 
        updateMeasure(currentPeriodMeasures.batchMessagesCount, messagesCount), mergeMeasure(currentPeriodMeasures.globalContextBytes, currentBatchMeasures.globalContextBytes), 
        mergeMeasure(currentPeriodMeasures.userContextBytes, currentBatchMeasures.userContextBytes), 
        mergeMeasure(currentPeriodMeasures.featureFlagBytes, currentBatchMeasures.featureFlagBytes), 
        initCurrentBatchMeasures());
    })), timer_setInterval(sendCurrentPeriodMeasures, 1e4);
}

function sendCurrentPeriodMeasures() {
    0 !== currentPeriodMeasures.batchCount && initCurrentPeriodMeasures();
}

function createMeasure() {
    return {
        min: 1 / 0,
        max: 0,
        sum: 0
    };
}

function updateMeasure(measure, value) {
    measure.sum += value, measure.min = Math.min(measure.min, value), measure.max = Math.max(measure.max, value);
}

function mergeMeasure(target, source) {
    target.sum += source.sum, target.min = Math.min(target.min, source.min), target.max = Math.max(target.max, source.max);
}

function initCurrentPeriodMeasures() {
    currentPeriodMeasures = {
        batchCount: 0,
        batchBytesCount: createMeasure(),
        batchMessagesCount: createMeasure(),
        globalContextBytes: createMeasure(),
        userContextBytes: createMeasure(),
        featureFlagBytes: createMeasure()
    };
}

function initCurrentBatchMeasures() {
    batchHasRumEvent = !1, currentBatchMeasures = {
        globalContextBytes: createMeasure(),
        userContextBytes: createMeasure(),
        featureFlagBytes: createMeasure()
    };
}

const MAX_PAGE_STATE_ENTRIES = 4e3, MAX_PAGE_STATE_ENTRIES_SELECTABLE = 500, PAGE_STATE_CONTEXT_TIME_OUT_DELAY = 144e5;

function startPageStateHistory(configuration, maxPageStateEntriesSelectable = 500) {
    const pageStateEntryHistory = createValueHistory({
        expireDelay: 144e5,
        maxEntries: 4e3
    });
    let currentPageState;
    addPageState(getPageState(), timeUtils_relativeNow());
    const {stop: stopEventListeners} = addEventListeners(configuration, window, [ "pageshow", "focus", "blur", "visibilitychange", "resume", "freeze", "pagehide" ], (event => {
        addPageState(computePageState(event), event.timeStamp);
    }), {
        capture: !0
    });
    function addPageState(nextPageState, startTime = timeUtils_relativeNow()) {
        nextPageState !== currentPageState && (currentPageState = nextPageState, pageStateEntryHistory.closeActive(startTime), 
        pageStateEntryHistory.add({
            state: currentPageState,
            startTime: startTime
        }, startTime));
    }
    const pageStateHistory = {
        findAll: (eventStartTime, duration) => {
            const pageStateEntries = pageStateEntryHistory.findAll(eventStartTime, duration);
            if (0 === pageStateEntries.length) return;
            const pageStateServerEntries = [], limit = Math.max(0, pageStateEntries.length - maxPageStateEntriesSelectable);
            for (let index = pageStateEntries.length - 1; index >= limit; index--) {
                const pageState = pageStateEntries[index], relativeStartTime = timeUtils_elapsed(eventStartTime, pageState.startTime);
                pageStateServerEntries.push({
                    state: pageState.state,
                    start: toServerDuration(relativeStartTime)
                });
            }
            return pageStateServerEntries;
        },
        wasInPageStateAt: (state, startTime) => pageStateHistory.wasInPageStateDuringPeriod(state, startTime, 0),
        wasInPageStateDuringPeriod: (state, startTime, duration) => pageStateEntryHistory.findAll(startTime, duration).some((pageState => pageState.state === state)),
        addPageState: addPageState,
        stop: () => {
            stopEventListeners(), pageStateEntryHistory.stop();
        }
    };
    return pageStateHistory;
}

function computePageState(event) {
    return "freeze" === event.type ? "frozen" : "pagehide" === event.type ? event.persisted ? "frozen" : "terminated" : getPageState();
}

function getPageState() {
    return "hidden" === document.visibilityState ? "hidden" : document.hasFocus() ? "active" : "passive";
}

function startDisplayContext(configuration) {
    let viewport;
    viewport = getViewportDimension();
    const unsubscribeViewport = initViewportObservable(configuration).subscribe((viewportDimension => {
        viewport = viewportDimension;
    })).unsubscribe;
    return {
        get: () => viewport ? {
            viewport: viewport
        } : void 0,
        stop: () => {
            unsubscribeViewport();
        }
    };
}

function createCookieObservable(configuration, cookieName) {
    const detectCookieChangeStrategy = window.cookieStore ? listenToCookieStoreChange(configuration) : watchCookieFallback;
    return new observable_Observable((observable => detectCookieChangeStrategy(cookieName, (event => observable.notify(event)))));
}

function listenToCookieStoreChange(configuration) {
    return (cookieName, callback) => addEventListener(configuration, window.cookieStore, "change", (event => {
        const changeEvent = find(event.changed, (event => event.name === cookieName)) || find(event.deleted, (event => event.name === cookieName));
        changeEvent && callback(changeEvent.value);
    })).stop;
}

const WATCH_COOKIE_INTERVAL_DELAY = 1e3;

function watchCookieFallback(cookieName, callback) {
    const previousCookieValue = findCommaSeparatedValue(document.cookie, cookieName), watchCookieIntervalId = timer_setInterval((() => {
        const cookieValue = findCommaSeparatedValue(document.cookie, cookieName);
        cookieValue !== previousCookieValue && callback(cookieValue);
    }), 1e3);
    return () => {
        timer_clearInterval(watchCookieIntervalId);
    };
}

const CI_VISIBILITY_TEST_ID_COOKIE_NAME = "datadog-ci-visibility-test-execution-id";

function startCiVisibilityContext(configuration, cookieObservable = createCookieObservable(configuration, CI_VISIBILITY_TEST_ID_COOKIE_NAME)) {
    var _a;
    let testExecutionId = getInitCookie(CI_VISIBILITY_TEST_ID_COOKIE_NAME) || (null === (_a = window.Cypress) || void 0 === _a ? void 0 : _a.env("traceId"));
    const cookieObservableSubscription = cookieObservable.subscribe((value => {
        testExecutionId = value;
    }));
    return {
        get: () => {
            if ("string" == typeof testExecutionId) return {
                test_execution_id: testExecutionId
            };
        },
        stop: () => cookieObservableSubscription.unsubscribe()
    };
}

function startRum(configuration, recorderApi, customerDataTrackerManager, getCommonContext, initialViewOptions, createEncoder, trackingConsentState, customVitalsState) {
    const cleanupTasks = [], lifeCycle = new LifeCycle, reportError = error => {
        lifeCycle.notify(13, {
            error: error
        });
    }, pageExitObservable = createPageExitObservable(configuration), pageExitSubscription = pageExitObservable.subscribe((event => {
        lifeCycle.notify(10, event);
    }));
    cleanupTasks.push((() => pageExitSubscription.unsubscribe()));
    const session = startRumSessionManager(configuration, lifeCycle, trackingConsentState), batch = startRumBatch(configuration, lifeCycle, "telemetry.observable", reportError, pageExitObservable, session.expireObservable, createEncoder);
    cleanupTasks.push((() => batch.stop())), startCustomerDataTelemetry(configuration, "telemetry", lifeCycle, customerDataTrackerManager, batch.flushObservable);
    const domMutationObservable = createDOMMutationObservable(), locationChangeObservable = createLocationChangeObservable(configuration, location), pageStateHistory = startPageStateHistory(configuration), {observable: windowOpenObservable, stop: stopWindowOpen} = createWindowOpenObservable();
    cleanupTasks.push(stopWindowOpen);
    const {viewHistory: viewHistory, urlContexts: urlContexts, actionContexts: actionContexts, addAction: addAction, stop: stopRumEventCollection} = startRumEventCollection(lifeCycle, configuration, location, session, pageStateHistory, locationChangeObservable, domMutationObservable, windowOpenObservable, getCommonContext, reportError);
    cleanupTasks.push(stopRumEventCollection);
    const {addTiming: addTiming, startView: startView, setViewName: setViewName, setViewContext: setViewContext, setViewContextProperty: setViewContextProperty, stop: stopViewCollection} = startViewCollection(lifeCycle, configuration, location, domMutationObservable, windowOpenObservable, locationChangeObservable, "featureFlagContexts", pageStateHistory, recorderApi, initialViewOptions);
    cleanupTasks.push(stopViewCollection);
    const {stop: stopResourceCollection} = startResourceCollection(lifeCycle, configuration, pageStateHistory);
    cleanupTasks.push(stopResourceCollection), startLongTaskCollection(lifeCycle, configuration);
    const {addError: addError} = startErrorCollection(lifeCycle, configuration, pageStateHistory, "featureFlagContexts");
    startRequestCollection(lifeCycle, configuration, session);
    const vitalCollection = startVitalCollection(lifeCycle, pageStateHistory, customVitalsState), internalContext = startInternalContext(configuration.applicationId, session, viewHistory, actionContexts, urlContexts);
    return {
        addAction: addAction,
        addError: addError,
        addTiming: addTiming,
        startView: startView,
        setViewContext: setViewContext,
        setViewContextProperty: setViewContextProperty,
        setViewName: setViewName,
        lifeCycle: lifeCycle,
        viewHistory: viewHistory,
        session: session,
        stopSession: () => session.expire(),
        getInternalContext: internalContext.get,
        startDurationVital: vitalCollection.startDurationVital,
        stopDurationVital: vitalCollection.stopDurationVital,
        addDurationVital: vitalCollection.addDurationVital,
        stop: () => {
            cleanupTasks.forEach((task => task()));
        }
    };
}

function startRumEventCollection(lifeCycle, configuration, location, sessionManager, pageStateHistory, locationChangeObservable, domMutationObservable, windowOpenObservable, getCommonContext, reportError) {
    const viewHistory = startViewHistory(lifeCycle), urlContexts = startUrlContexts(lifeCycle, locationChangeObservable, location), actionCollection = startActionCollection(lifeCycle, domMutationObservable, windowOpenObservable, configuration, pageStateHistory), displayContext = startDisplayContext(configuration), ciVisibilityContext = startCiVisibilityContext(configuration);
    return startRumAssembly(configuration, lifeCycle, sessionManager, viewHistory, urlContexts, actionCollection.actionContexts, displayContext, ciVisibilityContext, getCommonContext, reportError), 
    {
        viewHistory: viewHistory,
        pageStateHistory: pageStateHistory,
        urlContexts: urlContexts,
        addAction: actionCollection.addAction,
        actionContexts: actionCollection.actionContexts,
        stop: () => {
            actionCollection.stop(), ciVisibilityContext.stop(), displayContext.stop(), urlContexts.stop(), 
            viewHistory.stop(), pageStateHistory.stop();
        }
    };
}

function getSessionReplayUrl(configuration, {session: session, viewContext: viewContext, errorType: errorType}) {
    const sessionId = session ? session.id : "no-session-id", parameters = [];
    void 0 !== errorType && parameters.push(`error-type=${errorType}`), viewContext && (parameters.push(`seed=${viewContext.id}`), 
    parameters.push(`from=${viewContext.startClocks.timeStamp}`));
    return `${getDatadogSiteUrl(configuration)}${`/rum/replay/sessions/${sessionId}`}?${parameters.join("&")}`;
}

function getDatadogSiteUrl(rumConfiguration) {
    const site = rumConfiguration.site, subdomain = rumConfiguration.subdomain || getSiteDefaultSubdomain(rumConfiguration);
    return `https://${subdomain ? `${subdomain}.` : ""}${site}`;
}

function getSiteDefaultSubdomain(configuration) {
    switch (configuration.site) {
      case INTAKE_SITE_US1:
      case "datadoghq.eu":
        return "app";

      case "datad0g.com":
        return "dd";

      default:
        return;
    }
}

function getSessionReplayLink(configuration) {
    return getSessionReplayUrl(configuration, {
        errorType: "slim-package"
    });
}

function makeRecorderApiStub() {
    let getSessionReplayLinkStrategy = functionUtils_noop;
    return {
        start: functionUtils_noop,
        stop: functionUtils_noop,
        onRumStart(_lifeCycle, configuration) {
            getSessionReplayLinkStrategy = () => getSessionReplayLink(configuration);
        },
        isRecording: () => !1,
        getReplayStats: () => {},
        getSessionReplayLink: () => getSessionReplayLinkStrategy()
    };
}

const datadogRum = makeRumPublicApi(startRum, makeRecorderApiStub());

defineGlobal(getGlobalObject(), "DD_RUM", datadogRum);

var __webpack_exports__DefaultPrivacyLevel = __webpack_exports__.W, __webpack_exports__datadogRum = __webpack_exports__.L;

export { __webpack_exports__DefaultPrivacyLevel as DefaultPrivacyLevel, __webpack_exports__datadogRum as datadogRum };