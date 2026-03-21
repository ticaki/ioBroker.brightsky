"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Library = exports.BaseClass = void 0;
const fs_1 = __importDefault(require("fs"));
const definition_1 = require("./definition");
// Generic library module and base classes, do not insert specific adapter code here.
/**
 * Base class with this.log function.
 */
class BaseClass {
    unload = false;
    log;
    adapter;
    library;
    name = ``;
    friendlyName = ``;
    constructor(adapter, name = '', logName = '') {
        this.name = name;
        this.friendlyName = logName ? logName : this.name;
        this.log = new CustomLog(adapter, this.friendlyName);
        this.adapter = adapter;
        this.library = adapter.library;
    }
    async delete() {
        this.unload = true;
    }
}
exports.BaseClass = BaseClass;
class CustomLog {
    #adapter;
    #prefix;
    constructor(adapter, text = '') {
        this.#adapter = adapter;
        this.#prefix = text;
    }
    getName() {
        return this.#prefix;
    }
    debug(log, log2 = '') {
        this.#adapter.log.debug(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    info(log, log2 = '') {
        this.#adapter.log.info(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    warn(log, log2 = '') {
        this.#adapter.log.warn(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    error(log, log2 = '') {
        this.#adapter.log.error(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    setLogPrefix(text) {
        this.#prefix = text;
    }
}
class Library extends BaseClass {
    stateDataBase = {};
    forbiddenDirs = [];
    translation = {};
    //    private unknownTokens: Record<string, string> = {};
    unknownTokensInterval;
    defaults = {
        updateStateOnChangeOnly: false,
    };
    constructor(adapter, _options = null) {
        super(adapter, 'library');
        this.stateDataBase = {};
    }
    async init() {
        await this.checkLanguage();
        /*if (this.adapter.config.logUnknownTokens) {
            this.unknownTokensInterval = this.adapter.setInterval(() => {
                this.log.info(`Unknown tokens: ${JSON.stringify(this.unknownTokens)}`);
            }, 60000);
        }*/
        const states = await this.adapter.getStatesAsync('*');
        await this.initStates(states);
    }
    /**
     * Write/create from a Json with defined keys, the associated states and channels.
     *
     * @param prefix iobroker datapoint prefix where to write
     * @param objNode Entry point into the definition json.
     * @param def the definition json
     * @param data The Json to read
     * @param expandTree expand arrays up to 99
     * @returns  void
     */
    async writeFromJson(
    // provider.dwd.*warncellid*.warnung*1-5*
    prefix, objNode, // the json path to object def for jsonata
    def, data, expandTree = false) {
        if (!def || typeof def !== 'object') {
            return;
        }
        if (data === undefined || ['string', 'number', 'boolean', 'object'].indexOf(typeof data) == -1) {
            return;
        }
        let objectDefinition = objNode ? await this.getObjectDefFromJson(`${objNode}`, def, data) : null;
        if (objectDefinition) {
            objectDefinition.native = {
                ...(objectDefinition.native || {}),
                objectDefinitionReference: objNode,
            };
        }
        if (typeof data === 'object' && data !== null) {
            // handle array
            if (Array.isArray(data)) {
                if (!objectDefinition) {
                    return;
                }
                if (data.length === 0) {
                    return;
                }
                if (objectDefinition.type !== 'state' || expandTree) {
                    let a = 0;
                    for (const k of data) {
                        if (k === undefined) {
                            ++a;
                            continue;
                        }
                        const objectDefinition2 = objNode
                            ? await this.getObjectDefFromJson(`${`${objNode.split('.').slice(0, -1).join('.')}`}`, def, data)
                            : null;
                        const defChannel = this.getChannelObject(objectDefinition2, true);
                        const aName = k._index != null ? k._index : a;
                        const nameCount = k._index != null ? -3 : -2;
                        if (defChannel.common?.name) {
                            defChannel.common.name = `+ ${aName}`;
                        }
                        const newPrefix = prefix.split('.').slice(0, -1).join('.');
                        const n = `000${aName}`.slice(nameCount); // 001, 002, ... 099
                        a += 1;
                        const dp = `${newPrefix}.${n}`;
                        // create folder
                        await this.writedp(dp, null, defChannel);
                        await this.writeFromJson(dp, `${objNode}`, def, k, expandTree);
                    }
                }
                else {
                    await this.writeFromJson(prefix, objNode, def, JSON.stringify(data) || '[]', expandTree);
                }
                //objectDefinition._id = `${this.adapter.name}.${this.adapter.instance}.${prefix}.${key}`;
            }
            else {
                // create folder
                if (objectDefinition) {
                    const defChannel = this.getChannelObject(objectDefinition);
                    await this.writedp(prefix, null, defChannel);
                }
                if (data === null) {
                    return;
                }
                for (const k in data) {
                    if (Array.isArray(data[k])) {
                        const containerDef = await this.getObjectDefFromJson(`${objNode}.${k}`, def, data[k]);
                        const containerChannel = this.getChannelObject(containerDef);
                        await this.writedp(`${prefix}.${k}`, null, containerChannel);
                        await this.writeFromJson(`${prefix}.${k}.r`, `${objNode}.${k}`, def, data[k], expandTree);
                    }
                    else {
                        await this.writeFromJson(`${prefix}.${k}`, `${objNode}.${k}`, def, data[k], expandTree);
                    }
                }
            }
        }
        else {
            if (!objectDefinition || prefix.endsWith('_index')) {
                return;
            }
            if (objectDefinition.type === 'state' &&
                objectDefinition.common.role &&
                objectDefinition.common.role !== 'value' &&
                objectDefinition.common.role !== 'text' &&
                prefix.startsWith('daily')) {
                const d = prefix.split('.');
                if (objectDefinition.common.role !== 'weather.icon.name' &&
                    d.length == 3 &&
                    !isNaN(parseInt(d[1], 10))) {
                    objectDefinition = {
                        ...objectDefinition,
                        common: {
                            ...objectDefinition.common,
                            role: `${objectDefinition.common.role}.forecast.${parseInt(d[1])}`,
                        },
                    };
                }
                else if (d.length == 4 && !isNaN(parseInt(d[1], 10))) {
                    let role = 'state';
                    switch (objectDefinition.common.type) {
                        case 'number':
                            role = 'value';
                            break;
                        case 'string':
                            role = 'text';
                            break;
                        case 'boolean':
                            role = 'indicator';
                            break;
                    }
                    objectDefinition = {
                        ...objectDefinition,
                        common: {
                            ...objectDefinition.common,
                            role: role,
                        },
                    };
                }
            }
            await this.writedp(prefix, data, objectDefinition);
        }
    }
    /**
     * Get the ioBroker.Object out of stateDefinition
     *
     * @param key is the deep linking key to the definition
     * @param def is the definition object
     * @param data  is the definition dataset
     * @returns ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject
     */
    async getObjectDefFromJson(key, def, data) {
        //let result = await jsonata(`${key}`).evaluate(data);
        let result = this.deepJsonValue(key, def);
        if (result === null || result === undefined) {
            const k = key.split('.');
            if (k && k[k.length - 1].startsWith('_')) {
                result = definition_1.genericStateObjects.customString;
                result = this.cloneObject(result);
            }
            else {
                this.log.debug(`No definition for ${key}!`);
                result = definition_1.genericStateObjects.default;
                result = this.cloneObject(result);
                result.common.name = k[k.length - 1];
                switch (typeof data) {
                    case 'number':
                    case 'bigint':
                        {
                            result.common.type = 'number';
                            result.common.role = 'value';
                        }
                        break;
                    case 'boolean':
                        {
                            result.common.type = 'boolean';
                            result.common.role = 'indicator';
                        }
                        break;
                    case 'string':
                    case 'symbol':
                    case 'undefined':
                    case 'object':
                    case 'function':
                        {
                            result.common.type = 'string';
                            result.common.role = 'text';
                        }
                        break;
                }
            }
        }
        else {
            result = this.cloneObject(result);
        }
        return result;
    }
    deepJsonValue(key, data) {
        if (!key || !data || typeof data !== 'object' || typeof key !== 'string') {
            throw new Error(`Error(222) data or key are missing/wrong type!`);
        }
        const k = key.split(`.`);
        let c = 0, s = data;
        while (c < k.length) {
            s = s[k[c++]];
            if (s === undefined) {
                return null;
            }
        }
        return s;
    }
    getChannelObject(definition = null, tryArray = false) {
        const def = tryArray === true
            ? (definition && definition._array) || (definition && definition._channel) || null
            : (definition && definition._channel) || null;
        const result = {
            _id: def ? def._id : '',
            type: def ? (def.type == 'channel' ? 'channel' : def.type === 'device' ? 'device' : 'folder') : 'folder',
            common: {
                name: (def && def.common && def.common.name) || 'no definition',
            },
            native: (def && def.native) || {},
        };
        return result;
    }
    /**
     * Write/Create the specified data point with value, will only be written if val != oldval and obj.type == state or the data point value in the DB is not undefined. Channel and Devices have an undefined value.
     *
     * @param dp Data point to be written. Library.clean() is called with it.
     * @param val Value for this data point. Channel vals (old and new) are undefined so they never will be written.
     * @param obj The object definition for this data point (ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject)
     * @param ack set ack to false if needed - NEVER after u subscript to states)
     * @param forceWrite write the value even if it is the same as the old value
     * @returns void
     */
    async writedp(dp, val, obj = null, ack = true, forceWrite = false) {
        dp = this.cleandp(dp);
        let node = this.readdb(dp);
        const del = !this.isDirAllowed(dp);
        if (node === undefined) {
            if (!obj) {
                throw new Error('writedp try to create a state without object informations.');
            }
            obj._id = `${this.adapter.name}.${this.adapter.instance}.${dp}`;
            if (typeof obj.common.name == 'string') {
                obj.common.name = await this.getTranslationObj(obj.common.name);
            }
            if (!del) {
                if (obj.common.states) {
                    const temp = await this.adapter.getObjectAsync(dp);
                    if (temp) {
                        temp.common.states = obj.common.states;
                        await this.adapter.setObjectAsync(dp, temp);
                    }
                }
                await this.adapter.extendObjectAsync(dp, obj);
            }
            const stateType = obj && obj.common && obj.common.type;
            node = this.setdb(dp, obj.type, undefined, stateType, true, Date.now(), obj);
        }
        else if (node.init && obj) {
            if (typeof obj.common.name == 'string') {
                obj.common.name = await this.getTranslationObj(obj.common.name);
            }
            if (!del) {
                if (obj.common.states) {
                    const temp = await this.adapter.getObjectAsync(dp);
                    if (temp) {
                        temp.common.states = obj.common.states;
                        await this.adapter.setObjectAsync(dp, temp);
                    }
                }
                await this.adapter.extendObjectAsync(dp, obj);
                node.init = false;
            }
        }
        if (obj && obj.type !== 'state') {
            return;
        }
        if (node && !(node.type === 'state' && val === undefined)) {
            this.setdb(dp, node.type, val, node.stateTyp, false, undefined, undefined, node.init);
        }
        if (node &&
            val !== undefined &&
            (!this.defaults.updateStateOnChangeOnly || node.val != val || forceWrite || !node.ack)) {
            const typ = (obj && obj.common && obj.common.type) || node.stateTyp;
            if (typ && typ != typeof val && val !== undefined) {
                val = this.convertToType(val, typ);
            }
            if (!del) {
                await this.adapter.setStateAsync(dp, {
                    val: val,
                    ts: Date.now(),
                    ack: ack,
                });
            }
        }
    }
    setForbiddenDirs(dirs) {
        this.forbiddenDirs = this.forbiddenDirs.concat(dirs);
    }
    isDirAllowed(dp) {
        if (dp && dp.split('.').length <= 2) {
            return true;
        }
        for (const a of this.forbiddenDirs) {
            if (dp.search(new RegExp(a, 'g')) != -1) {
                return false;
            }
        }
        return true;
    }
    getStates(str) {
        const result = {};
        for (const dp in this.stateDataBase) {
            if (dp.search(new RegExp(str, 'g')) != -1) {
                result[dp] = this.stateDataBase[dp];
            }
        }
        return result;
    }
    async cleanUpTree(hold, filter, deep) {
        let del = [];
        for (const dp in this.stateDataBase) {
            if (filter && filter.filter(a => dp.startsWith(a) || a.startsWith(dp)).length == 0) {
                continue;
            }
            if (hold.filter(a => dp.startsWith(a) || a.startsWith(dp)).length > 0) {
                continue;
            }
            delete this.stateDataBase[dp];
            del.push(dp.split('.').slice(0, deep).join('.'));
        }
        del = del.filter((item, pos, arr) => {
            return arr.indexOf(item) == pos;
        });
        for (const a of del) {
            await this.adapter.delObjectAsync(a, { recursive: true });
            this.log.debug(`Clean up tree delete: ${a}`);
        }
    }
    /**
     * Remove forbidden chars from datapoint string.
     *
     * @param string Datapoint string to clean
     * @param lowerCase lowerCase() first param.
     * @param removePoints remove . from dp
     * @returns void
     */
    cleandp(string, lowerCase = false, removePoints = false) {
        if (!string && typeof string != 'string') {
            return string;
        }
        string = string.replace(this.adapter.FORBIDDEN_CHARS, '_');
        // hardliner
        if (removePoints) {
            string = string.replace(/[^0-9A-Za-z_-]/gu, '_');
        }
        else {
            string = string.replace(/[^0-9A-Za-z._-]/gu, '_');
        }
        return lowerCase ? string.toLowerCase() : string;
    }
    /* Convert a value to the given type
     * @param {string|boolean|number} value 	then value to convert
     * @param {string}   type  					the target type
     * @returns
     */
    convertToType(value, type) {
        if (value === null) {
            return null;
        }
        if (type === 'undefined') {
            throw new Error('convertToType type undefined not allowed!');
        }
        if (value === undefined) {
            value = '';
        }
        const old_type = typeof value;
        let newValue = typeof value == 'object' ? JSON.stringify(value) : value;
        if (type !== old_type) {
            switch (type) {
                case 'string':
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    newValue = value.toString() || '';
                    break;
                case 'number':
                    newValue = value ? parseFloat(value) : 0;
                    break;
                case 'boolean':
                    newValue = !!value;
                    break;
                case 'array':
                case 'json':
                    newValue = JSON.stringify(value);
                    break;
            }
        }
        return newValue;
    }
    readdb(dp) {
        return this.stateDataBase[this.cleandp(dp)];
    }
    setdb(dp, type, val = undefined, stateType = undefined, ack = true, ts = Date.now(), obj = undefined, init = false) {
        if (typeof type == 'object') {
            type = type;
            this.stateDataBase[dp] = type;
        }
        else {
            type = type;
            this.stateDataBase[dp] = {
                type: type,
                stateTyp: stateType !== undefined
                    ? stateType
                    : this.stateDataBase[dp] !== undefined && this.stateDataBase[dp].stateTyp !== undefined
                        ? this.stateDataBase[dp].stateTyp
                        : undefined,
                val: val,
                ack: ack,
                ts: ts ? ts : Date.now(),
                obj: obj !== undefined
                    ? obj
                    : this.stateDataBase[dp] !== undefined && this.stateDataBase[dp].obj !== undefined
                        ? this.stateDataBase[dp].obj
                        : undefined,
                init: init,
            };
        }
        return this.stateDataBase[dp];
    }
    async memberDeleteAsync(data) {
        if (this.unknownTokensInterval) {
            this.adapter.clearInterval(this.unknownTokensInterval);
        }
        for (const d of data) {
            await d.delete();
        }
    }
    cloneObject(obj) {
        if (typeof obj !== 'object') {
            this.log.error(`Error clone object target is type: ${typeof obj}`);
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    }
    cloneGenericObject(obj) {
        if (typeof obj !== 'object') {
            this.log.error(`Error clone object target is type: ${typeof obj}`);
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    }
    async fileExistAsync(file) {
        if (fs_1.default.existsSync(`./admin/${file}`)) {
            return true;
        }
        return false;
    }
    /**
     * Initialise the database with the states to prevent unnecessary creation and writing.
     *
     * @param states States that are to be read into the database during initialisation.
     * @returns void
     */
    async initStates(states) {
        if (!states) {
            return;
        }
        this.stateDataBase = {};
        const removedChannels = [];
        for (const state in states) {
            const dp = state.replace(`${this.adapter.name}.${this.adapter.instance}.`, '');
            const del = !this.isDirAllowed(dp);
            if (!del) {
                const obj = await this.adapter.getObjectAsync(dp);
                this.setdb(dp, 'state', states[state] ? states[state].val : undefined, obj && obj.common && obj.common.type ? obj.common.type : undefined, states[state] && states[state].ack, states[state] && states[state].ts ? states[state].ts : Date.now(), obj == null ? undefined : obj, true);
            }
            else {
                if (!removedChannels.every(a => !dp.startsWith(a))) {
                    continue;
                }
                const channel = dp.split('.').slice(0, 4).join('.');
                removedChannels.push(channel);
                await this.adapter.delObjectAsync(channel, { recursive: true });
                this.log.debug(`Delete channel with dp:${channel}`);
            }
        }
    }
    /**
     * Resets states that have not been updated in the database in offset time.
     *
     * @param prefix String with which states begin that are reset.
     * @param offset Time in ms since last update.
     * @param del Delete the state if it is not updated.
     * @returns void
     */
    async garbageColleting(prefix, offset = 2000, del = false) {
        if (!prefix) {
            return;
        }
        if (this.stateDataBase) {
            for (const id in this.stateDataBase) {
                if (id.startsWith(prefix)) {
                    const state = this.stateDataBase[id];
                    if (!state || state.val == undefined) {
                        continue;
                    }
                    if (state.ts < Date.now() - offset) {
                        if (del) {
                            await this.cleanUpTree([], [id], -1);
                            continue;
                        }
                        let newVal;
                        switch (state.stateTyp) {
                            case 'string':
                                if (typeof state.val == 'string') {
                                    if (state.val.startsWith('{') && state.val.endsWith('}')) {
                                        newVal = '{}';
                                    }
                                    else if (state.val.startsWith('[') && state.val.endsWith(']')) {
                                        newVal = '[]';
                                    }
                                    else {
                                        newVal = '';
                                    }
                                }
                                else {
                                    newVal = '';
                                }
                                break;
                            case 'bigint':
                            case 'number':
                                newVal = -1;
                                break;
                            case 'boolean':
                                newVal = false;
                                break;
                            case 'symbol':
                            case 'object':
                            case 'function':
                                newVal = null;
                                break;
                            case 'undefined':
                                newVal = undefined;
                                break;
                        }
                        await this.writedp(id, newVal);
                    }
                }
            }
        }
    }
    getLocalLanguage() {
        if (this.adapter.language) {
            return this.adapter.language;
        }
        return 'en';
    }
    getTranslation(key) {
        if (!key) {
            return '';
        }
        if (this.translation[key] !== undefined) {
            return this.translation[key];
        }
        /*if (this.adapter.config.logUnknownTokens) {
            this.unknownTokens[key] = '';
        }*/
        return key;
    }
    existTranslation(key) {
        return this.translation[key] !== undefined;
    }
    async getTranslationObj(key) {
        const language = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
        const result = {};
        for (const l of language) {
            try {
                const i = await Promise.resolve(`${`../../../admin/i18n/${l}/translations.json`}`).then(s => __importStar(require(s)));
                if (i[key] !== undefined) {
                    result[l] = i[key];
                }
            }
            catch {
                /*if (this.adapter.config.logUnknownTokens) {
                    this.unknownTokens[key] = '';
                }*/
                return key;
            }
        }
        if (result.en == undefined) {
            /*if (this.adapter.config.logUnknownTokens) {
                this.unknownTokens[key] = '';
            }*/
            return key;
        }
        return result;
    }
    async checkLanguage() {
        try {
            this.log.debug(`Load language ${this.adapter.language}`);
            this.translation = await Promise.resolve(`${`../../admin/i18n/${this.adapter.language}/translations.json`}`).then(s => __importStar(require(s)));
        }
        catch {
            this.log.warn(`Language ${this.adapter.language} not exist!`);
        }
    }
    sortText(text) {
        text.sort((a, b) => {
            const nameA = a.toUpperCase(); // ignore upper and lowercase
            const nameB = b.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
        return text;
    }
    /**
     *
     * @param text string to replace a Date
     * @param noti appendix to translation key
     * @param day true = Mo, 12.05 - false = 12.05
     * @returns Monday first March
     */
    convertSpeakDate(text, noti = '', day = false) {
        if (!text || typeof text !== `string`) {
            return ``;
        }
        const b = text.split(`.`);
        if (day) {
            b[0] = b[0].split(' ')[2];
        }
        return ` ${`${new Date(`${b[1]}/${b[0]}/${new Date().getFullYear()}`).toLocaleString(this.getLocalLanguage(), {
            weekday: day ? 'long' : undefined,
            day: 'numeric',
            month: `long`,
        })} `.replace(/([0-9]+\.)/gu, x => {
            const result = this.getTranslation(x + noti);
            if (result != x + noti) {
                return result;
            }
            return this.getTranslation(x);
        })}`;
    }
}
exports.Library = Library;
