(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tracer_1 = require("./tracer");
const logger_1 = require("./logger");
setTimeout(() => {
    try {
        tracer_1.trace({
            onEnter(methodName) {
                console.log("onEnter", methodName);
            },
            onLeave(methodName) {
            }
        });
    }
    catch (error) {
        logger_1.log("Oups --------> " + error.stack);
    }
}, 2000);

},{"./logger":2,"./tracer":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogPriority;
(function (LogPriority) {
    LogPriority[LogPriority["Verbose"] = 2] = "Verbose";
    LogPriority[LogPriority["Debug"] = 3] = "Debug";
    LogPriority[LogPriority["Info"] = 4] = "Info";
    LogPriority[LogPriority["Warn"] = 5] = "Warn";
    LogPriority[LogPriority["Error"] = 6] = "Error";
    LogPriority[LogPriority["Fatal"] = 7] = "Fatal";
})(LogPriority || (LogPriority = {}));
;
//var liblog:NativePointerValue =   Module.findExportByName("liblog.so", "__android_log_write") as NativePointerValue;
const androidLogWrite = new NativeFunction(Module.findExportByName("liblog.so", "__android_log_write"), "int", ["int", "pointer", "pointer"]);
const logTagBuf = Memory.allocUtf8String("frida");
function log(message) {
    const messageBuf = Memory.allocUtf8String(message);
    androidLogWrite(LogPriority.Info, logTagBuf, messageBuf);
}
exports.log = log;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const android_1 = require("frida-java/lib/android");
const logger_1 = require("./logger");
const api = android_1.getApi();
var InstrumentationEvent;
(function (InstrumentationEvent) {
    InstrumentationEvent[InstrumentationEvent["MethodEntered"] = 1] = "MethodEntered";
    InstrumentationEvent[InstrumentationEvent["MethodExited"] = 2] = "MethodExited";
    InstrumentationEvent[InstrumentationEvent["MethodUnwind"] = 4] = "MethodUnwind";
    InstrumentationEvent[InstrumentationEvent["DexPcMoved"] = 8] = "DexPcMoved";
    InstrumentationEvent[InstrumentationEvent["FieldRead"] = 16] = "FieldRead";
    InstrumentationEvent[InstrumentationEvent["FieldWritten"] = 32] = "FieldWritten";
    InstrumentationEvent[InstrumentationEvent["ExceptionCaught"] = 64] = "ExceptionCaught";
    InstrumentationEvent[InstrumentationEvent["Branch"] = 128] = "Branch";
    InstrumentationEvent[InstrumentationEvent["InvokeVirtualOrInterface"] = 256] = "InvokeVirtualOrInterface";
})(InstrumentationEvent || (InstrumentationEvent = {}));
/*interface JValue {
    z: number,
    b: number;
    c: number;
    s: number;
    i: number;
    j: number;
    f: number;
    d: number;
    l: NativePointer;
}*/
function trace(callbacks) {
    logger_1.log("--------> before api___: " + JSON.stringify(api));
    const runtime = api.artRuntime;
    const instrumentation = runtime.add(488);
    const addListener = new NativeFunction(Module.findExportByName('libart.so', '_ZN3art15instrumentation15Instrumentation11AddListenerEPNS0_23InstrumentationListenerEj'), 'void', ['pointer', 'pointer', 'uint32'], { exceptions: "propagate" /* Propagate */ });
    const numVirtuals = 10;
    const listener = Memory.alloc(Process.pointerSize);
    const vtable = Memory.alloc(numVirtuals * Process.pointerSize);
    Memory.writePointer(listener, vtable);
    for (let i = 0; i !== numVirtuals; i++) {
        switch (i) {
            case 2: {
                const method = makeMethodEntered();
                Memory.writePointer(vtable.add(i * Process.pointerSize), method);
                break;
            }
            case 3: {
                const method = makeMethodExited();
                Memory.writePointer(vtable.add(i * Process.pointerSize), method);
                break;
            }
            default: {
                const method = makeListenerMethod("vmethod" + i);
                Memory.writePointer(vtable.add(i * Process.pointerSize), method);
                break;
            }
        }
        //const method = (i === 2) ? makeEnterMethod() : makeListenerMethod("vmethod" + i);
        //Memory.writePointer(vtable.add(i * Process.pointerSize), method);
    }
    addListener(instrumentation, listener, InstrumentationEvent.MethodEntered | InstrumentationEvent.MethodExited);
    logger_1.log("--------> after api: " + JSON.stringify(api));
    //488 
    // can call user callbacks
    //console.log("api: " + JSON.stringify(api));
}
exports.trace = trace;
const cbs = [];
function makeMethodEntered() {
    const callback = new NativeCallback((self, thread, thisObject, method, dexPc) => {
        logger_1.log("MethodEntered() thisObject=" + thisObject + " method=" + method);
    }, 'void', ['pointer', 'pointer', 'pointer', 'pointer', 'uint32']);
    cbs.push(callback);
    return callback;
}
function makeMethodExited() {
    const callback = new NativeCallback((self, thread, thisObject, method, dexPc, returnValue) => {
        logger_1.log("MethodEntered() thisObject=" + thisObject + " method=" + method + " JValue=" + returnValue);
    }, 'void', ['pointer', 'pointer', 'pointer', 'pointer', 'uint32', 'pointer']);
    cbs.push(callback);
    return callback;
}
function makeListenerMethod(name) {
    const callback = new NativeCallback((self, thread) => {
        logger_1.log(name + " was called!");
    }, 'void', ['pointer', 'pointer']);
    cbs.push(callback);
    return callback;
}

},{"./logger":2,"frida-java/lib/android":4}],4:[function(require,module,exports){
'use strict';

const {checkJniResult} = require('./result');
const VM = require('./vm');

const jsizeSize = 4;
const pointerSize = Process.pointerSize;

const kAccPublic = 0x0001;
const kAccStatic = 0x0008;
const kAccFinal = 0x0010;
const kAccNative = 0x0100;
const kAccPublicApi = 0x10000000;

const STD_STRING_SIZE = (pointerSize === 4) ? 12 : 24;

const getArtRuntimeSpec = memoize(_getArtRuntimeSpec);
const getArtClassLinkerSpec = memoize(_getArtClassLinkerSpec);
const getArtMethodSpec = memoize(_getArtMethodSpec);
const getArtThreadSpec = memoize(_getArtThreadSpec);
const getArtThreadStateTransitionImpl = memoize(_getArtThreadStateTransitionImpl);
const getAndroidVersion = memoize(_getAndroidVersion);
const getAndroidApiLevel = memoize(_getAndroidApiLevel);

const makeCxxMethodWrapperReturningPointerByValue =
    (Process.arch === 'ia32')
    ? makeCxxMethodWrapperReturningPointerByValueInFirstArg
    : makeCxxMethodWrapperReturningPointerByValueGeneric;

const nativeFunctionOptions = {
  exceptions: 'propagate'
};

const artThreadStateTransitions = {};

let cachedApi = null;

function getApi () {
  if (cachedApi === null) {
    cachedApi = _getApi();
  }
  return cachedApi;
}

function _getApi () {
  const vmModules = Process.enumerateModulesSync()
    .filter(m => /^lib(art|dvm).so$/.test(m.name))
    .filter(m => !/\/system\/fake-libs/.test(m.path));
  if (vmModules.length === 0) {
    return null;
  }
  const vmModule = vmModules[0];

  const flavor = (vmModule.name.indexOf('art') !== -1) ? 'art' : 'dalvik';
  const isArt = flavor === 'art';

  const temporaryApi = {
    addLocalReference: null,
    flavor: flavor
  };

  const pending = isArt ? [{
    module: vmModule.path,
    functions: {
      'JNI_GetCreatedJavaVMs': ['JNI_GetCreatedJavaVMs', 'int', ['pointer', 'int', 'pointer']],

      // Android < 7
      'artInterpreterToCompiledCodeBridge': function (address) {
        this.artInterpreterToCompiledCodeBridge = address;
      },

      // Android >= 8
      '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE': ['art::JavaVMExt::AddGlobalRef', 'pointer', ['pointer', 'pointer', 'pointer']],
      // Android >= 6
      '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE': ['art::JavaVMExt::AddGlobalRef', 'pointer', ['pointer', 'pointer', 'pointer']],
      // Android < 6: makeAddGlobalRefFallbackForAndroid5() needs these:
      '_ZN3art17ReaderWriterMutex13ExclusiveLockEPNS_6ThreadE': ['art::ReaderWriterMutex::ExclusiveLock', 'void', ['pointer', 'pointer']],
      '_ZN3art17ReaderWriterMutex15ExclusiveUnlockEPNS_6ThreadE': ['art::ReaderWriterMutex::ExclusiveUnlock', 'void', ['pointer', 'pointer']],

      // Android <= 7
      '_ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE' : function (address) {
        this['art::IndirectReferenceTable::Add'] = new NativeFunction(address, 'pointer', ['pointer', 'uint', 'pointer'], nativeFunctionOptions);
      },
      // Android > 7
      '_ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE' : function (address) {
        this['art::IndirectReferenceTable::Add'] = new NativeFunction(address, 'pointer', ['pointer', 'uint', 'pointer'], nativeFunctionOptions);
      },

      // Android >= 7
      '_ZN3art9JavaVMExt12DecodeGlobalEPv': function (address) {
        let decodeGlobal;
        if (getAndroidApiLevel() >= 26) {
          // Returns ObjPtr<mirror::Object>
          decodeGlobal = makeCxxMethodWrapperReturningPointerByValue(address, ['pointer', 'pointer']);
        } else {
          // Returns mirror::Object *
          decodeGlobal = new NativeFunction(address, 'pointer', ['pointer', 'pointer'], nativeFunctionOptions);
        }
        this['art::JavaVMExt::DecodeGlobal'] = function (vm, thread, ref) {
          return decodeGlobal(vm, ref);
        };
      },
      // Android >= 6
      '_ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv': ['art::JavaVMExt::DecodeGlobal', 'pointer', ['pointer', 'pointer', 'pointer']],
      // Android < 6: makeDecodeGlobalFallbackForAndroid5() fallback uses:
      '_ZNK3art6Thread13DecodeJObjectEP8_jobject': ['art::Thread::DecodeJObject', 'pointer', ['pointer', 'pointer']],

      // Android >= 6
      '_ZN3art10ThreadList10SuspendAllEPKcb': ['art::ThreadList::SuspendAll', 'void', ['pointer', 'pointer', 'bool']],
      // or fallback:
      '_ZN3art10ThreadList10SuspendAllEv': function (address) {
        const suspendAll = new NativeFunction(address, 'void', ['pointer'], nativeFunctionOptions);
        this['art::ThreadList::SuspendAll'] = function (threadList, cause, longSuspend) {
          return suspendAll(threadList);
        };
      },

      '_ZN3art10ThreadList9ResumeAllEv': ['art::ThreadList::ResumeAll', 'void', ['pointer']],

      // Android >= 7
      '_ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE': ['art::ClassLinker::VisitClasses', 'void', ['pointer', 'pointer']],
      // Android < 7
      '_ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_': function (address) {
        const visitClasses = new NativeFunction(address, 'void', ['pointer', 'pointer', 'pointer'], nativeFunctionOptions);
        this['art::ClassLinker::VisitClasses'] = function (classLinker, visitor) {
          visitClasses(classLinker, visitor, NULL);
        };
      },

      '_ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE': ['art::ClassLinker::VisitClassLoaders', 'void', ['pointer', 'pointer']],

      '_ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_': ['art::gc::Heap::VisitObjects', 'void', ['pointer', 'pointer', 'pointer']],
      '_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE': ['art::gc::Heap::GetInstances', 'void', ['pointer', 'pointer', 'pointer', 'int', 'pointer']],

      // Android < 6 for cloneArtMethod()
      '_ZN3art6Thread14CurrentFromGdbEv': ['art::Thread::CurrentFromGdb', 'pointer', []],
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadE': function (address) {
        this['art::mirror::Object::Clone'] = new NativeFunction(address, 'pointer', ['pointer', 'pointer'], nativeFunctionOptions);
      },
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadEm': function (address) {
        const nativeFn = new NativeFunction(address, 'pointer', ['pointer', 'pointer', 'pointer'], nativeFunctionOptions);
        this['art::mirror::Object::Clone'] = function (thisPtr, threadPtr) {
          const numTargetBytes = NULL;
          return nativeFn(thisPtr, threadPtr, numTargetBytes);
        };
      },
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadEj': function (address) {
        const nativeFn = new NativeFunction(address, 'pointer', ['pointer', 'pointer', 'uint'], nativeFunctionOptions);
        this['art::mirror::Object::Clone'] = function (thisPtr, threadPtr) {
          const numTargetBytes = 0;
          return nativeFn(thisPtr, threadPtr, numTargetBytes);
        };
      }
    },
    optionals: [
      'artInterpreterToCompiledCodeBridge',
      '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE',
      '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE',
      '_ZN3art9JavaVMExt12DecodeGlobalEPv',
      '_ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv',
      '_ZN3art10ThreadList10SuspendAllEPKcb',
      '_ZN3art10ThreadList10SuspendAllEv',
      '_ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE',
      '_ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_',
      '_ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE',
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadE',
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadEm',
      '_ZN3art6mirror6Object5CloneEPNS_6ThreadEj',
      '_ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE',
      '_ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE',
      '_ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_',
      '_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE'
    ]
  }] : [{
    module: vmModule.path,
    functions: {
      /*
       * Converts an indirect reference to to an object reference.
       */
      '_Z20dvmDecodeIndirectRefP6ThreadP8_jobject': ['dvmDecodeIndirectRef', 'pointer', ['pointer', 'pointer']],

      '_Z15dvmUseJNIBridgeP6MethodPv': ['dvmUseJNIBridge', 'void', ['pointer', 'pointer']],

      /*
       * Returns the base of the HeapSource.
       */
      '_Z20dvmHeapSourceGetBasev': ['dvmHeapSourceGetBase', 'pointer', []],

      /*
       * Returns the limit of the HeapSource.
       */
      '_Z21dvmHeapSourceGetLimitv': ['dvmHeapSourceGetLimit', 'pointer', []],

      /*
       *  Returns true if the pointer points to a valid object.
       */
      '_Z16dvmIsValidObjectPK6Object': ['dvmIsValidObject', 'uint8', ['pointer']],
      'JNI_GetCreatedJavaVMs': ['JNI_GetCreatedJavaVMs', 'int', ['pointer', 'int', 'pointer']]
    },
    variables: {
      'gDvmJni': function (address) {
        this.gDvmJni = address;
      },
      'gDvm': function (address) {
        this.gDvm = address;
      }
    }
  }
  ];

  const missing = [];
  let total = 0;

  pending.forEach(function (api) {
    const functions = api.functions || {};
    const variables = api.variables || {};
    const optionals = new Set(api.optionals || []);

    total += Object.keys(functions).length + Object.keys(variables).length;

    const exportByName = Module
      .enumerateExportsSync(api.module)
      .reduce(function (result, exp) {
        result[exp.name] = exp;
        return result;
      }, {});

    Object.keys(functions)
      .forEach(function (name) {
        const exp = exportByName[name];
        if (exp !== undefined && exp.type === 'function') {
          const signature = functions[name];
          if (typeof signature === 'function') {
            signature.call(temporaryApi, exp.address);
          } else {
            temporaryApi[signature[0]] = new NativeFunction(exp.address, signature[1], signature[2], nativeFunctionOptions);
          }
        } else {
          if (!optionals.has(name)) {
            missing.push(name);
          }
        }
      });

    Object.keys(variables)
      .forEach(function (name) {
        const exp = exportByName[name];
        if (exp !== undefined && exp.type === 'variable') {
          const handler = variables[name];
          handler.call(temporaryApi, exp.address);
        } else {
          missing.push(name);
        }
      });
  });

  if (missing.length > 0) {
    throw new Error('Java API only partially available; please file a bug. Missing: ' + missing.join(', '));
  }

  const vms = Memory.alloc(pointerSize);
  const vmCount = Memory.alloc(jsizeSize);
  checkJniResult('JNI_GetCreatedJavaVMs', temporaryApi.JNI_GetCreatedJavaVMs(vms, 1, vmCount));
  if (Memory.readInt(vmCount) === 0) {
    return null;
  }
  temporaryApi.vm = Memory.readPointer(vms);

  if (isArt) {
    const artRuntime = Memory.readPointer(temporaryApi.vm.add(pointerSize));
    temporaryApi.artRuntime = artRuntime;

    const runtimeSpec = getArtRuntimeSpec(temporaryApi);

    temporaryApi.artHeap = Memory.readPointer(artRuntime.add(runtimeSpec.offset.heap));
    temporaryApi.artThreadList = Memory.readPointer(artRuntime.add(runtimeSpec.offset.threadList));

    /*
     * We must use the *correct* copy (or address) of art_quick_generic_jni_trampoline
     * in order for the stack trace to recognize the JNI stub quick frame.
     *
     * For ARTs for Android 6.x we can just use the JNI trampoline built into ART.
     */
    const classLinker = Memory.readPointer(artRuntime.add(runtimeSpec.offset.classLinker));
    temporaryApi.artClassLinker = classLinker;
    temporaryApi.artQuickGenericJniTrampoline = Memory.readPointer(classLinker.add(getArtClassLinkerSpec(temporaryApi).offset.quickGenericJniTrampoline));

    if (temporaryApi['art::JavaVMExt::AddGlobalRef'] === undefined) {
      temporaryApi['art::JavaVMExt::AddGlobalRef'] = makeAddGlobalRefFallbackForAndroid5(temporaryApi);
    }
    if (temporaryApi['art::JavaVMExt::DecodeGlobal'] === undefined) {
      temporaryApi['art::JavaVMExt::DecodeGlobal'] = makeDecodeGlobalFallbackForAndroid5(temporaryApi);
    }
  }

  const cxxImports = Module.enumerateImportsSync(vmModule.path)
    .filter(imp => imp.name.indexOf('_Z') === 0)
    .reduce((result, imp) => {
      result[imp.name] = imp.address;
      return result;
    }, {});
  temporaryApi['$new'] = new NativeFunction(cxxImports['_Znwm'] || cxxImports['_Znwj'], 'pointer', ['ulong'], nativeFunctionOptions);
  temporaryApi['$delete'] = new NativeFunction(cxxImports['_ZdlPv'], 'void', ['pointer'], nativeFunctionOptions);

  return temporaryApi;
}

function ensureClassInitialized (env, classRef) {
  const api = getApi();

  if (api.flavor !== 'art') {
    return;
  }

  env.getFieldId(classRef, 'x', 'Z');
  env.exceptionClear();
}

function getArtVMSpec (api) {
  return {
    offset: (pointerSize === 4) ? {
      globalsLock: 32,
      globals: 72
    } : {
      globalsLock: 64,
      globals: 112
    }
  };
}

function _getArtRuntimeSpec (api) {
  /*
   * class Runtime {
   * ...
   * gc::Heap* heap_;                <-- we need to find this
   * std::unique_ptr<ArenaPool> jit_arena_pool_;     <----- API level >= 24
   * std::unique_ptr<ArenaPool> arena_pool_;             __
   * std::unique_ptr<ArenaPool> low_4gb_arena_pool_; <--|__ API level >= 23
   * std::unique_ptr<LinearAlloc> linear_alloc_;         \_
   * size_t max_spins_before_thin_lock_inflation_;
   * MonitorList* monitor_list_;
   * MonitorPool* monitor_pool_;
   * ThreadList* thread_list_;        <--- and these
   * InternTable* intern_table_;      <--/
   * ClassLinker* class_linker_;      <-/
   * SignalCatcher* signal_catcher_;
   * bool use_tombstoned_traces_;     <-------------------- API level >= 27
   * std::string stack_trace_file_;
   * JavaVMExt* java_vm_;             <-- so we find this then calculate our way backwards
   * ...
   * }
   */

  const vm = api.vm;
  const runtime = api.artRuntime;

  const startOffset = (pointerSize === 4) ? 200 : 384;
  const endOffset = startOffset + (100 * pointerSize);

  const apiLevel = getAndroidApiLevel();

  let spec = null;

  for (let offset = startOffset; offset !== endOffset; offset += pointerSize) {
    const value = Memory.readPointer(runtime.add(offset));
    if (value.equals(vm)) {
      let classLinkerOffset = offset - STD_STRING_SIZE - (2 * pointerSize);
      if (apiLevel >= 27) {
        classLinkerOffset -= pointerSize;
      }
      const internTableOffset = classLinkerOffset - pointerSize;
      const threadListOffset = internTableOffset - pointerSize;

      let heapOffset = threadListOffset - (4 * pointerSize);
      if (apiLevel >= 23) {
        heapOffset -= 3 * pointerSize;
      }
      if (apiLevel >= 24) {
        heapOffset -= pointerSize;
      }

      spec = {
        offset: {
          heap: heapOffset,
          threadList: threadListOffset,
          internTable: internTableOffset,
          classLinker: classLinkerOffset
        }
      };
      break;
    }
  }

  if (spec === null) {
    throw new Error('Unable to determine Runtime field offsets');
  }

  return spec;
}

function _getArtClassLinkerSpec (api) {
  /*
   * On Android 5.x:
   *
   * class ClassLinker {
   * ...
   * InternTable* intern_table_;                          <-- We find this then calculate our way forwards
   * const void* portable_resolution_trampoline_;
   * const void* quick_resolution_trampoline_;
   * const void* portable_imt_conflict_trampoline_;
   * const void* quick_imt_conflict_trampoline_;
   * const void* quick_generic_jni_trampoline_;           <-- ...to this
   * const void* quick_to_interpreter_bridge_trampoline_;
   * ...
   * }
   *
   * On Android 6.x and above:
   *
   * class ClassLinker {
   * ...
   * InternTable* intern_table_;                          <-- We find this then calculate our way forwards
   * const void* quick_resolution_trampoline_;
   * const void* quick_imt_conflict_trampoline_;
   * const void* quick_generic_jni_trampoline_;           <-- ...to this
   * const void* quick_to_interpreter_bridge_trampoline_;
   * ...
   * }
   */

  const runtime = api.artRuntime;
  const runtimeSpec = getArtRuntimeSpec(api);

  const classLinker = Memory.readPointer(runtime.add(runtimeSpec.offset.classLinker));
  const internTable = Memory.readPointer(runtime.add(runtimeSpec.offset.internTable));

  const startOffset = (pointerSize === 4) ? 100 : 200;
  const endOffset = startOffset + (100 * pointerSize);

  let spec = null;

  for (let offset = startOffset; offset !== endOffset; offset += pointerSize) {
    const value = Memory.readPointer(classLinker.add(offset));
    if (value.equals(internTable)) {
      const delta = (getAndroidApiLevel() >= 23) ? 3 : 5;

      spec = {
        offset: {
          quickGenericJniTrampoline: offset + (delta * pointerSize)
        }
      };

      break;
    }
  }

  if (spec === null) {
    throw new Error('Unable to determine ClassLinker field offsets');
  }

  return spec;
}

function _getArtMethodSpec (vm) {
  const api = getApi();
  let spec;

  vm.perform(() => {
    const env = vm.getEnv();
    const process = env.findClass('android/os/Process');
    const setArgV0 = env.getStaticMethodId(process, 'setArgV0', '(Ljava/lang/String;)V');

    const runtimeModule = Process.getModuleByName('libandroid_runtime.so');
    const runtimeStart = runtimeModule.base;
    const runtimeEnd = runtimeStart.add(runtimeModule.size);

    const apiLevel = getAndroidApiLevel();

    const entrypointFieldSize = (apiLevel <= 21) ? 8 : pointerSize;

    const expectedAccessFlags = kAccPublic | kAccStatic | kAccFinal | kAccNative | (apiLevel >= 28 ? kAccPublicApi : 0);

    let jniCodeOffset = null;
    let accessFlagsOffset = null;
    let remaining = 2;
    for (let offset = 0; offset !== 64 && remaining !== 0; offset += 4) {
      const field = setArgV0.add(offset);

      if (jniCodeOffset === null) {
        const address = Memory.readPointer(field);
        if (address.compare(runtimeStart) >= 0 && address.compare(runtimeEnd) < 0) {
          jniCodeOffset = offset;
          remaining--;
        }
      }

      if (accessFlagsOffset === null) {
        const flags = Memory.readU32(field);
        if (flags === expectedAccessFlags) {
          accessFlagsOffset = offset;
          remaining--;
        }
      }
    }

    if (remaining !== 0) {
      throw new Error('Unable to determine ArtMethod field offsets');
    }

    const quickCodeOffset = jniCodeOffset + entrypointFieldSize;

    const size = (apiLevel <= 21) ? (quickCodeOffset + 32) : (quickCodeOffset + pointerSize);

    spec = {
      size: size,
      offset: {
        jniCode: jniCodeOffset,
        quickCode: quickCodeOffset,
        accessFlags: accessFlagsOffset
      }
    };

    if ('artInterpreterToCompiledCodeBridge' in api) {
      spec.offset.interpreterCode = jniCodeOffset - entrypointFieldSize;
    }
  });

  return spec;
}

function _getArtThreadSpec (vm) {
  /*
   * bool32_t is_exception_reported_to_instrumentation_; <-- We need this on API level <= 22
   * ...
   * mirror::Throwable* exception;                       <-- ...and this on all versions
   * uint8_t* stack_end;
   * ManagedStack managed_stack;
   * uintptr_t* suspend_trigger;
   * JNIEnvExt* jni_env;                                 <-- We find this then calculate our way backwards/forwards
   * JNIEnvExt* tmp_jni_env;                             <-- API level >= 23
   * Thread* self;
   * mirror::Object* opeer;
   * jobject jpeer;
   * uint8_t* stack_begin;
   * size_t stack_size;
   * ThrowLocation throw_location;                       <-- ...and this on API level <= 22
   * union DepsOrStackTraceSample {
   *   DepsOrStackTraceSample() {
   *     verifier_deps = nullptr;
   *     stack_trace_sample = nullptr;
   *   }
   *   std::vector<ArtMethod*>* stack_trace_sample;
   *   verifier::VerifierDeps* verifier_deps;
   * } deps_or_stack_trace_sample;
   * Thread* wait_next;
   * mirror::Object* monitor_enter_object;
   * BaseHandleScope* top_handle_scope;                  <-- ...and to this on all versions
   */

  const api = getApi();
  const apiLevel = getAndroidApiLevel();

  let spec;

  vm.perform(() => {
    const env = vm.getEnv();

    const threadHandle = getArtThreadFromEnv(env);
    const envHandle = env.handle;

    let isExceptionReportedOffset = null;
    let exceptionOffset = null;
    let throwLocationOffset = null;
    let topHandleScopeOffset = null;

    for (let offset = 144; offset !== 256; offset += pointerSize) {
      const field = threadHandle.add(offset);

      const value = Memory.readPointer(field);
      if (value.equals(envHandle)) {
        exceptionOffset = offset - (6 * pointerSize);
        if (apiLevel <= 22) {
          exceptionOffset -= pointerSize;

          isExceptionReportedOffset = exceptionOffset - pointerSize - (9 * 8) - (3 * 4);

          throwLocationOffset = offset + (6 * pointerSize);
        }

        topHandleScopeOffset = offset + (9 * pointerSize);
        if (apiLevel <= 22) {
          topHandleScopeOffset += (2 * pointerSize) + 4;
          if (pointerSize === 8) {
            topHandleScopeOffset += 4;
          }
        }
        if (apiLevel >= 23) {
          topHandleScopeOffset += pointerSize;
        }

        break;
      }
    }

    if (topHandleScopeOffset === null) {
      throw new Error('Unable to determine ArtThread field offsets');
    }

    spec = {
      offset: {
        isExceptionReportedToInstrumentation: isExceptionReportedOffset,
        exception: exceptionOffset,
        throwLocation: throwLocationOffset,
        topHandleScope: topHandleScopeOffset
      }
    };
  });

  return spec;
}

function getArtThreadFromEnv (env) {
  return Memory.readPointer(env.handle.add(pointerSize));
}

function _getAndroidVersion () {
  return getAndroidSystemProperty('ro.build.version.release');
}

function _getAndroidApiLevel () {
  return parseInt(getAndroidSystemProperty('ro.build.version.sdk'), 10);
}

let systemPropertyGet = null;
const PROP_VALUE_MAX = 92;

function getAndroidSystemProperty (name) {
  if (systemPropertyGet === null) {
    systemPropertyGet = new NativeFunction(Module.findExportByName('libc.so', '__system_property_get'), 'int', ['pointer', 'pointer'], nativeFunctionOptions);
  }
  const buf = Memory.alloc(PROP_VALUE_MAX);
  systemPropertyGet(Memory.allocUtf8String(name), buf);
  return Memory.readUtf8String(buf);
}

function withRunnableArtThread (vm, env, fn) {
  const perform = getArtThreadStateTransitionImpl(vm, env);

  const id = getArtThreadFromEnv(env).toString();
  artThreadStateTransitions[id] = fn;

  perform(env.handle);

  if (artThreadStateTransitions[id] !== undefined) {
    delete artThreadStateTransitions[id];
    throw new Error('Unable to perform state transition; please file a bug at https://github.com/frida/frida-java');
  }
}

function onThreadStateTransitionComplete (thread) {
  const id = thread.toString();

  const fn = artThreadStateTransitions[id];
  delete artThreadStateTransitions[id];
  fn(thread);
}

function withAllArtThreadsSuspended (fn) {
  const api = getApi();

  const threadList = api.artThreadList;
  const longSuspend = false;
  api['art::ThreadList::SuspendAll'](threadList, Memory.allocUtf8String('frida'), longSuspend ? 1 : 0);
  try {
    fn();
  } finally {
    api['art::ThreadList::ResumeAll'](threadList);
  }
}

class ArtClassVisitor {
  constructor (visit) {
    const visitor = Memory.alloc(4 * pointerSize);

    const vtable = visitor.add(pointerSize);
    Memory.writePointer(visitor, vtable);

    const onVisit = new NativeCallback((self, klass) => {
      return visit(klass) === true ? 1 : 0;
    }, 'bool', ['pointer', 'pointer']);
    Memory.writePointer(vtable.add(2 * pointerSize), onVisit);

    this.handle = visitor;
    this._onVisit = onVisit;
  }
}

function makeArtClassVisitor (visit) {
  const api = getApi();

  if (api['art::ClassLinker::VisitClasses'] instanceof NativeFunction) {
    return new ArtClassVisitor(visit);
  }

  return new NativeCallback(klass => {
    return visit(klass) === true ? 1 : 0;
  }, 'bool', ['pointer', 'pointer']);
}

class ArtClassLoaderVisitor {
  constructor (visit) {
    const visitor = Memory.alloc(4 * pointerSize);

    const vtable = visitor.add(pointerSize);
    Memory.writePointer(visitor, vtable);

    const onVisit = new NativeCallback((self, klass) => {
      visit(klass);
    }, 'void', ['pointer', 'pointer']);
    Memory.writePointer(vtable.add(2 * pointerSize), onVisit);

    this.handle = visitor;
    this._onVisit = onVisit;
  }
}

function makeArtClassLoaderVisitor (visit) {
  return new ArtClassLoaderVisitor(visit);
}

function cloneArtMethod (method) {
  const api = getApi();

  if (getAndroidApiLevel() < 23) {
    const thread = api['art::Thread::CurrentFromGdb']();
    return api['art::mirror::Object::Clone'](method, thread);
  }

  return Memory.dup(method, getArtMethodSpec(api.vm).size);
}

function makeAddGlobalRefFallbackForAndroid5 (api) {
  const offset = getArtVMSpec().offset;
  const lock = api.vm.add(offset.globalsLock);
  const table = api.vm.add(offset.globals);

  const add = api['art::IndirectReferenceTable::Add'];
  const acquire = api['art::ReaderWriterMutex::ExclusiveLock'];
  const release = api['art::ReaderWriterMutex::ExclusiveUnlock'];

  const IRT_FIRST_SEGMENT = 0;

  return function (vm, thread, obj) {
    acquire(lock, thread);
    try {
      return add(table, IRT_FIRST_SEGMENT, obj);
    } finally {
      release(lock, thread);
    }
  };
}

function makeDecodeGlobalFallbackForAndroid5 (api) {
  const decode = api['art::Thread::DecodeJObject'];

  return function (vm, thread, ref) {
    return decode(thread, ref);
  };
}

const threadStateTransitionRecompilers = {
  ia32: recompileExceptionClearForX86,
  x64: recompileExceptionClearForX86,
  arm: recompileExceptionClearForArm,
  arm64: recompileExceptionClearForArm64,
};

function _getArtThreadStateTransitionImpl (vm, env) {
  let exceptionClearImpl = null;
  const exceptionClearSymbol = Module.enumerateSymbolsSync('libart.so').filter(s => s.name === '_ZN3art3JNI14ExceptionClearEP7_JNIEnv')[0];
  if (exceptionClearSymbol !== undefined) {
    exceptionClearImpl = exceptionClearSymbol.address;
  } else {
    const envVtable = Memory.readPointer(env.handle);
    exceptionClearImpl = Memory.readPointer(envVtable.add(17 * pointerSize));
  }

  const recompile = threadStateTransitionRecompilers[Process.arch];
  if (recompile === undefined) {
    throw new Error('Not yet implemented for ' + Process.arch);
  }

  let perform = null;
  const callback = new NativeCallback(onThreadStateTransitionComplete, 'void', ['pointer']);

  const threadOffsets = getArtThreadSpec(vm).offset;

  const exceptionOffset = threadOffsets.exception;

  const neuteredOffsets = new Set();
  const isReportedOffset = threadOffsets.isExceptionReportedToInstrumentation;
  if (isReportedOffset !== null) {
    neuteredOffsets.add(isReportedOffset);
  }
  const throwLocationStartOffset = threadOffsets.throwLocation;
  if (throwLocationStartOffset !== null) {
    neuteredOffsets.add(throwLocationStartOffset);
    neuteredOffsets.add(throwLocationStartOffset + pointerSize);
    neuteredOffsets.add(throwLocationStartOffset + (2 * pointerSize));
  }

  const codeSize = 65536;
  const code = Memory.alloc(codeSize);
  Memory.patchCode(code, codeSize, buffer => {
    perform = recompile(buffer, code, exceptionClearImpl, exceptionOffset, neuteredOffsets, callback);
  });

  perform._code = code;
  perform._callback = callback;

  return perform;
}

function recompileExceptionClearForX86 (buffer, pc, exceptionClearImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const blockByInstruction = {};
  const branchTargets = new Set();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const blockAddressKey = current.toString();

    if (blockByInstruction[blockAddressKey] !== undefined) {
      continue;
    }

    let block = {
      begin: current
    };
    const instructionAddressIds = [];

    let reachedEndOfBlock = false;
    do {
      const insn = Instruction.parse(current);
      const insnAddressId = insn.address.toString();
      const {mnemonic} = insn;

      instructionAddressIds.push(insnAddressId);

      const existingBlock = blocks[insnAddressId];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockAddressKey] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      let branchTarget = null;
      switch (mnemonic) {
        case 'jmp':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = true;
          break;
        case 'je':
        case 'jg':
        case 'jle':
        case 'jne':
        case 'js':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'ret':
          reachedEndOfBlock = true;
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget);
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = ptr(instructionAddressIds[instructionAddressIds.length - 1]);

      blocks[blockAddressKey] = block;
      instructionAddressIds.forEach(id => {
        blockByInstruction[id] = block;
      });
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new X86Writer(buffer, { pc });

  let exceptionClearInstructionFound = false;
  let threadReg = null;

  blocksOrdered.forEach(block => {
    const relocator = new X86Relocator(block.begin, writer);

    let offset;
    while ((offset = relocator.readOne()) !== 0) {
      const insn = relocator.input;
      const {mnemonic} = insn;

      const insnAddressId = insn.address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      switch (mnemonic) {
        case 'jmp':
          writer.putJmpNearLabel(branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'je':
        case 'jg':
        case 'jle':
        case 'jne':
        case 'js':
          writer.putJccNearLabel(mnemonic, branchLabelFromOperand(insn.operands[0]), 'no-hint');
          relocator.skipOne();
          break;
        case 'mov': {
          const [dst, src] = insn.operands;

          if (dst.type === 'mem' && src.type === 'imm') {
            const dstValue = dst.value;
            const dstOffset = dstValue.disp;

            if (dstOffset === exceptionOffset && src.value.valueOf() === 0) {
              threadReg = dstValue.base;

              writer.putPushfx();
              writer.putPushax();
              writer.putMovRegReg('xbp', 'xsp');
              if (pointerSize === 4) {
                writer.putAndRegU32('esp', 0xfffffff0);
              } else {
                writer.putMovRegU64('rax', uint64('0xfffffffffffffff0'));
                writer.putAndRegReg('rsp', 'rax');
              }
              writer.putCallAddressWithAlignedArguments(callback, [ threadReg ]);
              writer.putMovRegReg('xsp', 'xbp');
              writer.putPopax();
              writer.putPopfx();

              relocator.skipOne();

              exceptionClearInstructionFound = true;

              break;
            }

            if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
              relocator.skipOne();

              break;
            }
          }
        }
        default:
          relocator.writeAll();
      }
    }

    relocator.dispose();
  });

  writer.dispose();

  if (!exceptionClearInstructionFound) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc, 'void', ['pointer'], nativeFunctionOptions);
}

function recompileExceptionClearForArm (buffer, pc, exceptionClearImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const blockByInstruction = {};
  const branchTargets = new Set();
  const unsupportedInstructions = {};

  const thumbBitRemovalMask = ptr(1).not();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const begin = current.and(thumbBitRemovalMask);
    const blockId = begin.toString();
    const thumbBit = current.and(1);

    if (blockByInstruction[blockId] !== undefined) {
      continue;
    }

    let block = {
      begin
    };
    const instructionAddressIds = [];

    let reachedEndOfBlock = false;
    let ifThenBlockRemaining = 0;
    do {
      const currentAddress = current.and(thumbBitRemovalMask);
      const insnId = currentAddress.toString();

      instructionAddressIds.push(insnId);

      let insn;
      try {
        insn = Instruction.parse(current);
      } catch (e) {
        const first = Memory.readU16(currentAddress);
        const second = Memory.readU16(currentAddress.add(2));

        // TODO: fix this in Capstone
        const firstUpperBits = (first & 0xfff0);
        const isLdaex = firstUpperBits === 0xe8d0 && (second & 0x0fff) === 0x0fef;
        const isStlex = firstUpperBits === 0xe8c0 && (second & 0x0ff0) === 0x0fe0;
        if (isLdaex || isStlex) {
          current = current.add(4);
          unsupportedInstructions[insnId] = [first, second];
          continue;
        }

        throw e;
      }
      const {mnemonic} = insn;

      const existingBlock = blocks[insnId];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockId] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      const isOutsideIfThenBlock = ifThenBlockRemaining === 0;

      let branchTarget = null;

      switch (mnemonic) {
        case 'b':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = isOutsideIfThenBlock;
          break;
        case 'beq.w':
        case 'beq':
        case 'bne':
        case 'bgt':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'cbz':
        case 'cbnz':
          branchTarget = ptr(insn.operands[1].value);
          break;
        case 'pop.w':
          if (isOutsideIfThenBlock) {
            reachedEndOfBlock = insn.operands.filter(op => op.value === 'pc').length === 1;
          }
          break;
      }

      switch (mnemonic) {
        case 'it':
          ifThenBlockRemaining = 1;
          break;
        case 'itt':
          ifThenBlockRemaining = 2;
          break;
        case 'ittt':
          ifThenBlockRemaining = 3;
          break;
        case 'itttt':
          ifThenBlockRemaining = 4;
          break;
        default:
          if (ifThenBlockRemaining > 0) {
            ifThenBlockRemaining--;
          }
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget.or(thumbBit));
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = ptr(instructionAddressIds[instructionAddressIds.length - 1]);

      blocks[blockId] = block;
      instructionAddressIds.forEach(id => {
        blockByInstruction[id] = block;
      });
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.and(thumbBitRemovalMask).toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new ThumbWriter(buffer, { pc });

  let exceptionClearInstructionFound = false;
  let threadReg = null;

  blocksOrdered.forEach(block => {
    const relocator = new ThumbRelocator(block.begin, writer);

    let address = block.begin;
    const end = block.end;
    let size = 0;
    do {
      const offset = relocator.readOne();
      if (offset === 0) {
        const next = address.add(size);
        const instructions = unsupportedInstructions[next.toString()];
        if (instructions !== undefined) {
          instructions.forEach(rawInsn => writer.putInstruction(rawInsn));
          relocator.reset(next.add(instructions.length * 2), writer);
          continue;
        }
        throw new Error('Unexpected end of block');
      }
      const insn = relocator.input;
      address = insn.address;
      size = insn.size;
      const {mnemonic} = insn;

      const insnAddressId = address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      switch (mnemonic) {
        case 'b':
          writer.putBLabel(branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'beq.w':
          writer.putBCondLabelWide('eq', branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'beq':
        case 'bne':
        case 'bgt':
          writer.putBCondLabelWide(mnemonic.substr(1), branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'cbz': {
          const ops = insn.operands;
          writer.putCbzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          relocator.skipOne();
          break;
        }
        case 'cbnz': {
          const ops = insn.operands;
          writer.putCbnzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          relocator.skipOne();
          break;
        }
        case 'str':
        case 'str.w': {
          const dstValue = insn.operands[1].value;
          const dstOffset = dstValue.disp;

          if (dstOffset === exceptionOffset) {
            threadReg = dstValue.base;

            const nzcvqReg = (threadReg !== 'r4') ? 'r4' : 'r5';
            const clobberedRegs = ['r0', 'r1', 'r2', 'r3', nzcvqReg, 'r9', 'r12', 'lr'];

            writer.putPushRegs(clobberedRegs);
            writer.putMrsRegReg(nzcvqReg, 'apsr_nzcvq');

            writer.putCallAddressWithArguments(callback, [ threadReg ]);

            writer.putMsrRegReg('apsr_nzcvq', nzcvqReg);
            writer.putPopRegs(clobberedRegs);

            relocator.skipOne();

            exceptionClearInstructionFound = true;

            break;
          }

          if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
            relocator.skipOne();

            break;
          }
        }
        default:
          relocator.writeAll();
          break;
      }
    } while (!address.equals(end));

    relocator.dispose();
  });

  writer.dispose();

  if (!exceptionClearInstructionFound) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc.or(1), 'void', ['pointer'], nativeFunctionOptions);
}

function recompileExceptionClearForArm64 (buffer, pc, exceptionClearImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const blockByInstruction = {};
  const branchTargets = new Set();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const blockAddressKey = current.toString();

    if (blockByInstruction[blockAddressKey] !== undefined) {
      continue;
    }

    let block = {
      begin: current
    };
    const instructionAddressIds = [];

    let reachedEndOfBlock = false;
    do {
      const insn = Instruction.parse(current);
      const insnAddressId = insn.address.toString();
      const {mnemonic} = insn;

      instructionAddressIds.push(insnAddressId);

      const existingBlock = blocks[insnAddressId];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockAddressKey] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      let branchTarget = null;
      switch (mnemonic) {
        case 'b':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = true;
          break;
        case 'b.eq':
        case 'b.ne':
        case 'b.gt':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'cbz':
        case 'cbnz':
          branchTarget = ptr(insn.operands[1].value);
          break;
        case 'tbz':
        case 'tbnz':
          branchTarget = ptr(insn.operands[2].value);
          break;
        case 'ret':
          reachedEndOfBlock = true;
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget);
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = ptr(instructionAddressIds[instructionAddressIds.length - 1]);

      blocks[blockAddressKey] = block;
      instructionAddressIds.forEach(id => {
        blockByInstruction[id] = block;
      });
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new Arm64Writer(buffer, { pc });

  writer.putBLabel('performTransition');

  const invokeCallback = pc.add(writer.offset);
  writer.putPushAllXRegisters();
  writer.putCallAddressWithArguments(callback, ['x0']);
  writer.putPopAllXRegisters();
  writer.putRet();

  writer.putLabel('performTransition');

  let exceptionClearInstructionFound = false;
  let threadReg = null;

  blocksOrdered.forEach(block => {
    const relocator = new Arm64Relocator(block.begin, writer);

    let offset;
    while ((offset = relocator.readOne()) !== 0) {
      const insn = relocator.input;
      const {mnemonic} = insn;

      const insnAddressId = insn.address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      switch (mnemonic) {
        case 'b':
          writer.putBLabel(branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'b.eq':
        case 'b.ne':
        case 'b.gt':
          writer.putBCondLabel(mnemonic.substr(2), branchLabelFromOperand(insn.operands[0]));
          relocator.skipOne();
          break;
        case 'cbz': {
          const ops = insn.operands;
          writer.putCbzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          relocator.skipOne();
          break;
        }
        case 'cbnz': {
          const ops = insn.operands;
          writer.putCbnzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          relocator.skipOne();
          break;
        }
        case 'tbz': {
          const ops = insn.operands;
          writer.putTbzRegImmLabel(ops[0].value, ops[1].value.valueOf(), branchLabelFromOperand(ops[2]));
          relocator.skipOne();
          break;
        }
        case 'tbnz': {
          const ops = insn.operands;
          writer.putTbnzRegImmLabel(ops[0].value, ops[1].value.valueOf(), branchLabelFromOperand(ops[2]));
          relocator.skipOne();
          break;
        }
        case 'str': {
          const ops = insn.operands;
          const srcReg = ops[0].value;
          const dstValue = ops[1].value;
          const dstOffset = dstValue.disp;

          if (srcReg === 'xzr' && dstOffset === exceptionOffset) {
            threadReg = dstValue.base;

            writer.putPushRegReg('x0', 'lr');
            writer.putMovRegReg('x0', threadReg);
            writer.putBlImm(invokeCallback);
            writer.putPopRegReg('x0', 'lr');

            relocator.skipOne();

            exceptionClearInstructionFound = true;

            break;
          }

          if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
            relocator.skipOne();

            break;
          }
        }
        default:
          relocator.writeAll();
      }
    }

    relocator.dispose();
  });

  writer.dispose();

  if (!exceptionClearInstructionFound) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc, 'void', ['pointer'], nativeFunctionOptions);
}

function throwThreadStateTransitionParseError () {
  throw new Error('Unable to parse ART internals; please file a bug at https://github.com/frida/frida-java');
}

function branchLabelFromOperand (op) {
  return ptr(op.value).toString();
}

function memoize (compute) {
  let value = null;
  let computed = false;

  return function (...args) {
    if (!computed) {
      value = compute(...args);
      computed = true;
    }

    return value;
  };
}

function makeCxxMethodWrapperReturningPointerByValueGeneric (address, argTypes) {
  return new NativeFunction(address, 'pointer', argTypes, nativeFunctionOptions);
}

function makeCxxMethodWrapperReturningPointerByValueInFirstArg (address, argTypes) {
  const impl = new NativeFunction(address, 'void', ['pointer'].concat(argTypes), nativeFunctionOptions);
  return function () {
    const resultPtr = Memory.alloc(pointerSize);
    impl(resultPtr, ...arguments);
    return Memory.readPointer(resultPtr);
  };
}

module.exports = {
  getApi,
  ensureClassInitialized,
  getAndroidVersion,
  getAndroidApiLevel,
  getArtMethodSpec,
  getArtThreadSpec,
  getArtThreadFromEnv,
  withRunnableArtThread,
  withAllArtThreadsSuspended,
  makeArtClassVisitor,
  makeArtClassLoaderVisitor,
  cloneArtMethod
};

/* global Memory, Module, NativeCallback, NativeFunction, NULL, Process */

},{"./result":6,"./vm":7}],5:[function(require,module,exports){
'use strict';

function Env (handle, vm) {
  this.handle = handle;
  this.vm = vm;
}

const pointerSize = Process.pointerSize;

const JNI_ABORT = 2;

const CALL_CONSTRUCTOR_METHOD_OFFSET = 28;

const CALL_OBJECT_METHOD_OFFSET = 34;
const CALL_BOOLEAN_METHOD_OFFSET = 37;
const CALL_BYTE_METHOD_OFFSET = 40;
const CALL_CHAR_METHOD_OFFSET = 43;
const CALL_SHORT_METHOD_OFFSET = 46;
const CALL_INT_METHOD_OFFSET = 49;
const CALL_LONG_METHOD_OFFSET = 52;
const CALL_FLOAT_METHOD_OFFSET = 55;
const CALL_DOUBLE_METHOD_OFFSET = 58;
const CALL_VOID_METHOD_OFFSET = 61;

const CALL_NONVIRTUAL_OBJECT_METHOD_OFFSET = 64;
const CALL_NONVIRTUAL_BOOLEAN_METHOD_OFFSET = 67;
const CALL_NONVIRTUAL_BYTE_METHOD_OFFSET = 70;
const CALL_NONVIRTUAL_CHAR_METHOD_OFFSET = 73;
const CALL_NONVIRTUAL_SHORT_METHOD_OFFSET = 76;
const CALL_NONVIRTUAL_INT_METHOD_OFFSET = 79;
const CALL_NONVIRTUAL_LONG_METHOD_OFFSET = 82;
const CALL_NONVIRTUAL_FLOAT_METHOD_OFFSET = 85;
const CALL_NONVIRTUAL_DOUBLE_METHOD_OFFSET = 88;
const CALL_NONVIRTUAL_VOID_METHOD_OFFSET = 91;

const CALL_STATIC_OBJECT_METHOD_OFFSET = 114;
const CALL_STATIC_BOOLEAN_METHOD_OFFSET = 117;
const CALL_STATIC_BYTE_METHOD_OFFSET = 120;
const CALL_STATIC_CHAR_METHOD_OFFSET = 123;
const CALL_STATIC_SHORT_METHOD_OFFSET = 126;
const CALL_STATIC_INT_METHOD_OFFSET = 129;
const CALL_STATIC_LONG_METHOD_OFFSET = 132;
const CALL_STATIC_FLOAT_METHOD_OFFSET = 135;
const CALL_STATIC_DOUBLE_METHOD_OFFSET = 138;
const CALL_STATIC_VOID_METHOD_OFFSET = 141;

const GET_OBJECT_FIELD_OFFSET = 95;
const GET_BOOLEAN_FIELD_OFFSET = 96;
const GET_BYTE_FIELD_OFFSET = 97;
const GET_CHAR_FIELD_OFFSET = 98;
const GET_SHORT_FIELD_OFFSET = 99;
const GET_INT_FIELD_OFFSET = 100;
const GET_LONG_FIELD_OFFSET = 101;
const GET_FLOAT_FIELD_OFFSET = 102;
const GET_DOUBLE_FIELD_OFFSET = 103;

const SET_OBJECT_FIELD_OFFSET = 104;
const SET_BOOLEAN_FIELD_OFFSET = 105;
const SET_BYTE_FIELD_OFFSET = 106;
const SET_CHAR_FIELD_OFFSET = 107;
const SET_SHORT_FIELD_OFFSET = 108;
const SET_INT_FIELD_OFFSET = 109;
const SET_LONG_FIELD_OFFSET = 110;
const SET_FLOAT_FIELD_OFFSET = 111;
const SET_DOUBLE_FIELD_OFFSET = 112;

const GET_STATIC_OBJECT_FIELD_OFFSET = 145;
const GET_STATIC_BOOLEAN_FIELD_OFFSET = 146;
const GET_STATIC_BYTE_FIELD_OFFSET = 147;
const GET_STATIC_CHAR_FIELD_OFFSET = 148;
const GET_STATIC_SHORT_FIELD_OFFSET = 149;
const GET_STATIC_INT_FIELD_OFFSET = 150;
const GET_STATIC_LONG_FIELD_OFFSET = 151;
const GET_STATIC_FLOAT_FIELD_OFFSET = 152;
const GET_STATIC_DOUBLE_FIELD_OFFSET = 153;

const SET_STATIC_OBJECT_FIELD_OFFSET = 154;
const SET_STATIC_BOOLEAN_FIELD_OFFSET = 155;
const SET_STATIC_BYTE_FIELD_OFFSET = 156;
const SET_STATIC_CHAR_FIELD_OFFSET = 157;
const SET_STATIC_SHORT_FIELD_OFFSET = 158;
const SET_STATIC_INT_FIELD_OFFSET = 159;
const SET_STATIC_LONG_FIELD_OFFSET = 160;
const SET_STATIC_FLOAT_FIELD_OFFSET = 161;
const SET_STATIC_DOUBLE_FIELD_OFFSET = 162;

const callMethodOffset = {
  'pointer': CALL_OBJECT_METHOD_OFFSET,
  'uint8': CALL_BOOLEAN_METHOD_OFFSET,
  'int8': CALL_BYTE_METHOD_OFFSET,
  'uint16': CALL_CHAR_METHOD_OFFSET,
  'int16': CALL_SHORT_METHOD_OFFSET,
  'int32': CALL_INT_METHOD_OFFSET,
  'int64': CALL_LONG_METHOD_OFFSET,
  'float': CALL_FLOAT_METHOD_OFFSET,
  'double': CALL_DOUBLE_METHOD_OFFSET,
  'void': CALL_VOID_METHOD_OFFSET
};

const callNonvirtualMethodOffset = {
  'pointer': CALL_NONVIRTUAL_OBJECT_METHOD_OFFSET,
  'uint8': CALL_NONVIRTUAL_BOOLEAN_METHOD_OFFSET,
  'int8': CALL_NONVIRTUAL_BYTE_METHOD_OFFSET,
  'uint16': CALL_NONVIRTUAL_CHAR_METHOD_OFFSET,
  'int16': CALL_NONVIRTUAL_SHORT_METHOD_OFFSET,
  'int32': CALL_NONVIRTUAL_INT_METHOD_OFFSET,
  'int64': CALL_NONVIRTUAL_LONG_METHOD_OFFSET,
  'float': CALL_NONVIRTUAL_FLOAT_METHOD_OFFSET,
  'double': CALL_NONVIRTUAL_DOUBLE_METHOD_OFFSET,
  'void': CALL_NONVIRTUAL_VOID_METHOD_OFFSET
};

const callStaticMethodOffset = {
  'pointer': CALL_STATIC_OBJECT_METHOD_OFFSET,
  'uint8': CALL_STATIC_BOOLEAN_METHOD_OFFSET,
  'int8': CALL_STATIC_BYTE_METHOD_OFFSET,
  'uint16': CALL_STATIC_CHAR_METHOD_OFFSET,
  'int16': CALL_STATIC_SHORT_METHOD_OFFSET,
  'int32': CALL_STATIC_INT_METHOD_OFFSET,
  'int64': CALL_STATIC_LONG_METHOD_OFFSET,
  'float': CALL_STATIC_FLOAT_METHOD_OFFSET,
  'double': CALL_STATIC_DOUBLE_METHOD_OFFSET,
  'void': CALL_STATIC_VOID_METHOD_OFFSET
};

const getFieldOffset = {
  'pointer': GET_OBJECT_FIELD_OFFSET,
  'uint8': GET_BOOLEAN_FIELD_OFFSET,
  'int8': GET_BYTE_FIELD_OFFSET,
  'uint16': GET_CHAR_FIELD_OFFSET,
  'int16': GET_SHORT_FIELD_OFFSET,
  'int32': GET_INT_FIELD_OFFSET,
  'int64': GET_LONG_FIELD_OFFSET,
  'float': GET_FLOAT_FIELD_OFFSET,
  'double': GET_DOUBLE_FIELD_OFFSET
};

const setFieldOffset = {
  'pointer': SET_OBJECT_FIELD_OFFSET,
  'uint8': SET_BOOLEAN_FIELD_OFFSET,
  'int8': SET_BYTE_FIELD_OFFSET,
  'uint16': SET_CHAR_FIELD_OFFSET,
  'int16': SET_SHORT_FIELD_OFFSET,
  'int32': SET_INT_FIELD_OFFSET,
  'int64': SET_LONG_FIELD_OFFSET,
  'float': SET_FLOAT_FIELD_OFFSET,
  'double': SET_DOUBLE_FIELD_OFFSET
};

const getStaticFieldOffset = {
  'pointer': GET_STATIC_OBJECT_FIELD_OFFSET,
  'uint8': GET_STATIC_BOOLEAN_FIELD_OFFSET,
  'int8': GET_STATIC_BYTE_FIELD_OFFSET,
  'uint16': GET_STATIC_CHAR_FIELD_OFFSET,
  'int16': GET_STATIC_SHORT_FIELD_OFFSET,
  'int32': GET_STATIC_INT_FIELD_OFFSET,
  'int64': GET_STATIC_LONG_FIELD_OFFSET,
  'float': GET_STATIC_FLOAT_FIELD_OFFSET,
  'double': GET_STATIC_DOUBLE_FIELD_OFFSET
};

const setStaticFieldOffset = {
  'pointer': SET_STATIC_OBJECT_FIELD_OFFSET,
  'uint8': SET_STATIC_BOOLEAN_FIELD_OFFSET,
  'int8': SET_STATIC_BYTE_FIELD_OFFSET,
  'uint16': SET_STATIC_CHAR_FIELD_OFFSET,
  'int16': SET_STATIC_SHORT_FIELD_OFFSET,
  'int32': SET_STATIC_INT_FIELD_OFFSET,
  'int64': SET_STATIC_LONG_FIELD_OFFSET,
  'float': SET_STATIC_FLOAT_FIELD_OFFSET,
  'double': SET_STATIC_DOUBLE_FIELD_OFFSET
};

const nativeFunctionOptions = {
  exceptions: 'propagate'
};

let cachedVtable = null;
let globalRefs = [];
Env.dispose = function (env) {
  globalRefs.forEach(env.deleteGlobalRef, env);
  globalRefs = [];
};

function register (globalRef) {
  globalRefs.push(globalRef);
  return globalRef;
}

function vtable (instance) {
  if (cachedVtable === null) {
    cachedVtable = Memory.readPointer(instance.handle);
  }
  return cachedVtable;
}

function proxy (offset, retType, argTypes, wrapper) {
  let impl = null;
  return function () {
    if (impl === null) {
      impl = new NativeFunction(Memory.readPointer(vtable(this).add(offset * pointerSize)), retType, argTypes, nativeFunctionOptions);
    }
    let args = [impl];
    args = args.concat.apply(args, arguments);
    return wrapper.apply(this, args);
  };
}

Env.prototype.findClass = proxy(6, 'pointer', ['pointer', 'pointer'], function (impl, name) {
  const result = impl(this.handle, Memory.allocUtf8String(name));
  this.checkForExceptionAndThrowIt();
  return result;
});

Env.prototype.checkForExceptionAndThrowIt = function () {
  const throwable = this.exceptionOccurred();
  if (!throwable.isNull()) {
    try {
      this.exceptionClear();
      const description = this.vaMethod('pointer', [])(this.handle, throwable, this.javaLangObject().toString);
      try {
        const descriptionStr = this.stringFromJni(description);

        const error = new Error(descriptionStr);

        const handle = this.newGlobalRef(throwable);
        error.$handle = handle;
        WeakRef.bind(error, makeErrorHandleDestructor(this.vm, handle));

        throw error;
      } finally {
        this.deleteLocalRef(description);
      }
    } finally {
      this.deleteLocalRef(throwable);
    }
  }
};

function makeErrorHandleDestructor (vm, handle) {
  return function () {
    vm.perform(function () {
      const env = vm.getEnv();
      env.deleteGlobalRef(handle);
    });
  };
}

Env.prototype.fromReflectedMethod = proxy(7, 'pointer', ['pointer', 'pointer'], function (impl, method) {
  return impl(this.handle, method);
});

Env.prototype.fromReflectedField = proxy(8, 'pointer', ['pointer', 'pointer'], function (impl, method) {
  return impl(this.handle, method);
});

Env.prototype.toReflectedMethod = proxy(9, 'pointer', ['pointer', 'pointer', 'pointer', 'uint8'], function (impl, klass, methodId, isStatic) {
  return impl(this.handle, klass, methodId, isStatic);
});

Env.prototype.getSuperclass = proxy(10, 'pointer', ['pointer', 'pointer'], function (impl, klass) {
  return impl(this.handle, klass);
});

Env.prototype.isAssignableFrom = proxy(11, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, klass1, klass2) {
  return !!impl(this.handle, klass1, klass2);
});

Env.prototype.toReflectedField = proxy(12, 'pointer', ['pointer', 'pointer', 'pointer', 'uint8'], function (impl, klass, fieldId, isStatic) {
  return impl(this.handle, klass, fieldId, isStatic);
});

Env.prototype.throw = proxy(13, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.exceptionOccurred = proxy(15, 'pointer', ['pointer'], function (impl) {
  return impl(this.handle);
});

Env.prototype.exceptionDescribe = proxy(16, 'void', ['pointer'], function (impl) {
  impl(this.handle);
});

Env.prototype.exceptionClear = proxy(17, 'void', ['pointer'], function (impl) {
  impl(this.handle);
});

Env.prototype.pushLocalFrame = proxy(19, 'int32', ['pointer', 'int32'], function (impl, capacity) {
  return impl(this.handle, capacity);
});

Env.prototype.popLocalFrame = proxy(20, 'pointer', ['pointer', 'pointer'], function (impl, result) {
  return impl(this.handle, result);
});

Env.prototype.newGlobalRef = proxy(21, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.deleteGlobalRef = proxy(22, 'void', ['pointer', 'pointer'], function (impl, globalRef) {
  impl(this.handle, globalRef);
});

Env.prototype.deleteLocalRef = proxy(23, 'void', ['pointer', 'pointer'], function (impl, localRef) {
  impl(this.handle, localRef);
});

Env.prototype.isSameObject = proxy(24, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, ref1, ref2) {
  return !!impl(this.handle, ref1, ref2);
});

Env.prototype.allocObject = proxy(27, 'pointer', ['pointer', 'pointer'], function (impl, clazz) {
  return impl(this.handle, clazz);
});

Env.prototype.getObjectClass = proxy(31, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.isInstanceOf = proxy(32, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, obj, klass) {
  return !!impl(this.handle, obj, klass);
});

Env.prototype.getMethodId = proxy(33, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getFieldId = proxy(94, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getIntField = proxy(100, 'int32', ['pointer', 'pointer', 'pointer'], function (impl, obj, fieldId) {
  return impl(this.handle, obj, fieldId);
});

Env.prototype.getStaticMethodId = proxy(113, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getStaticFieldId = proxy(144, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getStaticIntField = proxy(150, 'int32', ['pointer', 'pointer', 'pointer'], function (impl, obj, fieldId) {
  return impl(this.handle, obj, fieldId);
});

Env.prototype.newStringUtf = proxy(167, 'pointer', ['pointer', 'pointer'], function (impl, str) {
  const utf = Memory.allocUtf8String(str);
  return impl(this.handle, utf);
});

Env.prototype.getStringUtfChars = proxy(169, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, str) {
  return impl(this.handle, str, NULL);
});

Env.prototype.releaseStringUtfChars = proxy(170, 'void', ['pointer', 'pointer', 'pointer'], function (impl, str, utf) {
  impl(this.handle, str, utf);
});

Env.prototype.getArrayLength = proxy(171, 'int32', ['pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array);
});

Env.prototype.newObjectArray = proxy(172, 'pointer', ['pointer', 'int32', 'pointer', 'pointer'], function (impl, length, elementClass, initialElement) {
  return impl(this.handle, length, elementClass, initialElement);
});

Env.prototype.getObjectArrayElement = proxy(173, 'pointer', ['pointer', 'pointer', 'int32'], function (impl, array, index) {
  return impl(this.handle, array, index);
});

Env.prototype.setObjectArrayElement = proxy(174, 'void', ['pointer', 'pointer', 'int32', 'pointer'], function (impl, array, index, value) {
  impl(this.handle, array, index, value);
});

Env.prototype.newBooleanArray = proxy(175, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newByteArray = proxy(176, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newCharArray = proxy(177, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newShortArray = proxy(178, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newIntArray = proxy(179, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newLongArray = proxy(180, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newFloatArray = proxy(181, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newDoubleArray = proxy(182, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.getBooleanArrayElements = proxy(183, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getByteArrayElements = proxy(184, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getCharArrayElements = proxy(185, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getShortArrayElements = proxy(186, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getIntArrayElements = proxy(187, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getLongArrayElements = proxy(188, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getFloatArrayElements = proxy(189, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getDoubleArrayElements = proxy(190, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.releaseBooleanArrayElements = proxy(191, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseByteArrayElements = proxy(192, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseCharArrayElements = proxy(193, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseShortArrayElements = proxy(194, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseIntArrayElements = proxy(195, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseLongArrayElements = proxy(196, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseFloatArrayElements = proxy(197, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseDoubleArrayElements = proxy(198, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.setBooleanArrayRegion = proxy(207, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setByteArrayRegion = proxy(208, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setCharArrayRegion = proxy(209, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setShortArrayRegion = proxy(210, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setIntArrayRegion = proxy(211, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setLongArrayRegion = proxy(212, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setFloatArrayRegion = proxy(213, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setDoubleArrayRegion = proxy(214, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.registerNatives = proxy(215, 'int32', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, klass, methods, numMethods) {
  return impl(this.handle, klass, methods, numMethods);
});

Env.prototype.monitorEnter = proxy(217, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.monitorExit = proxy(218, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.getObjectRefType = proxy(232, 'int32', ['pointer', 'pointer'], function (impl, ref) {
  return impl(this.handle, ref);
});

const cachedPlainMethods = {};
const cachedVaMethods = {};

function plainMethod (offset, retType, argTypes) {
  const key = offset + 'v' + retType + '|' + argTypes.join(':');
  let m = cachedPlainMethods[key];
  if (!m) {
    /* jshint validthis: true */
    m = new NativeFunction(Memory.readPointer(vtable(this).add(offset * pointerSize)), retType, ['pointer', 'pointer', 'pointer'].concat(argTypes),
        nativeFunctionOptions);
    cachedPlainMethods[key] = m;
  }
  return m;
}

function vaMethod (offset, retType, argTypes) {
  const key = offset + 'v' + retType + '|' + argTypes.join(':');
  let m = cachedVaMethods[key];
  if (!m) {
    /* jshint validthis: true */
    m = new NativeFunction(Memory.readPointer(vtable(this).add(offset * pointerSize)), retType, ['pointer', 'pointer', 'pointer', '...'].concat(argTypes),
        nativeFunctionOptions);
    cachedVaMethods[key] = m;
  }
  return m;
}

function nonvirtualVaMethod (offset, retType, argTypes) {
  const key = offset + 'n' + retType + '|' + argTypes.join(':');
  let m = cachedVaMethods[key];
  if (!m) {
    /* jshint validthis: true */
    m = new NativeFunction(Memory.readPointer(vtable(this).add(offset * pointerSize)), retType, ['pointer', 'pointer', 'pointer', 'pointer', '...'].concat(argTypes),
        nativeFunctionOptions);
    cachedVaMethods[key] = m;
  }
  return m;
}

Env.prototype.constructor = function (argTypes) {
  return vaMethod.call(this, CALL_CONSTRUCTOR_METHOD_OFFSET, 'pointer', argTypes);
};

Env.prototype.vaMethod = function (retType, argTypes) {
  const offset = callMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return vaMethod.call(this, offset, retType, argTypes);
};

Env.prototype.nonvirtualVaMethod = function (retType, argTypes) {
  const offset = callNonvirtualMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return nonvirtualVaMethod.call(this, offset, retType, argTypes);
};

Env.prototype.staticVaMethod = function (retType, argTypes) {
  const offset = callStaticMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return vaMethod.call(this, offset, retType, argTypes);
};

Env.prototype.getField = function (fieldType) {
  const offset = getFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, fieldType, []);
};

Env.prototype.getStaticField = function (fieldType) {
  const offset = getStaticFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, fieldType, []);
};

Env.prototype.setField = function (fieldType) {
  const offset = setFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, 'void', [fieldType]);
};

Env.prototype.setStaticField = function (fieldType) {
  const offset = setStaticFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, 'void', [fieldType]);
};

let javaLangClass = null;
Env.prototype.javaLangClass = function () {
  if (javaLangClass === null) {
    const handle = this.findClass('java/lang/Class');
    try {
      javaLangClass = {
        handle: register(this.newGlobalRef(handle)),
        getName: this.getMethodId(handle, 'getName', '()Ljava/lang/String;'),
        getSimpleName: this.getMethodId(handle, 'getSimpleName', '()Ljava/lang/String;'),
        getGenericSuperclass: this.getMethodId(handle, 'getGenericSuperclass', '()Ljava/lang/reflect/Type;'),
        getDeclaredConstructors: this.getMethodId(handle, 'getDeclaredConstructors', '()[Ljava/lang/reflect/Constructor;'),
        getDeclaredMethods: this.getMethodId(handle, 'getDeclaredMethods', '()[Ljava/lang/reflect/Method;'),
        getDeclaredFields: this.getMethodId(handle, 'getDeclaredFields', '()[Ljava/lang/reflect/Field;'),
        isArray: this.getMethodId(handle, 'isArray', '()Z'),
        isPrimitive: this.getMethodId(handle, 'isPrimitive', '()Z'),
        getComponentType: this.getMethodId(handle, 'getComponentType', '()Ljava/lang/Class;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangClass;
};

let javaLangObject = null;
Env.prototype.javaLangObject = function () {
  if (javaLangObject === null) {
    const handle = this.findClass('java/lang/Object');
    try {
      javaLangObject = {
        toString: this.getMethodId(handle, 'toString', '()Ljava/lang/String;'),
        getClass: this.getMethodId(handle, 'getClass', '()Ljava/lang/Class;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangObject;
};

let javaLangReflectConstructor = null;
Env.prototype.javaLangReflectConstructor = function () {
  if (javaLangReflectConstructor === null) {
    const handle = this.findClass('java/lang/reflect/Constructor');
    try {
      javaLangReflectConstructor = {
        getGenericParameterTypes: this.getMethodId(handle, 'getGenericParameterTypes', '()[Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectConstructor;
};

let javaLangReflectMethod = null;
Env.prototype.javaLangReflectMethod = function () {
  if (javaLangReflectMethod === null) {
    const handle = this.findClass('java/lang/reflect/Method');
    try {
      javaLangReflectMethod = {
        getName: this.getMethodId(handle, 'getName', '()Ljava/lang/String;'),
        getGenericParameterTypes: this.getMethodId(handle, 'getGenericParameterTypes', '()[Ljava/lang/reflect/Type;'),
        getParameterTypes: this.getMethodId(handle, 'getParameterTypes', '()[Ljava/lang/Class;'),
        getGenericReturnType: this.getMethodId(handle, 'getGenericReturnType', '()Ljava/lang/reflect/Type;'),
        getGenericExceptionTypes: this.getMethodId(handle, 'getGenericExceptionTypes', '()[Ljava/lang/reflect/Type;'),
        getModifiers: this.getMethodId(handle, 'getModifiers', '()I'),
        isVarArgs: this.getMethodId(handle, 'isVarArgs', '()Z')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectMethod;
};

let javaLangReflectField = null;
Env.prototype.javaLangReflectField = function () {
  if (javaLangReflectField === null) {
    const handle = this.findClass('java/lang/reflect/Field');
    try {
      javaLangReflectField = {
        getName: this.getMethodId(handle, 'getName', '()Ljava/lang/String;'),
        getType: this.getMethodId(handle, 'getType', '()Ljava/lang/Class;'),
        getGenericType: this.getMethodId(handle, 'getGenericType', '()Ljava/lang/reflect/Type;'),
        getModifiers: this.getMethodId(handle, 'getModifiers', '()I'),
        toString: this.getMethodId(handle, 'toString', '()Ljava/lang/String;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectField;
};

let javaLangReflectModifier = null;
Env.prototype.javaLangReflectModifier = function () {
  if (javaLangReflectModifier === null) {
    const handle = this.findClass('java/lang/reflect/Modifier');
    try {
      javaLangReflectModifier = {
        PUBLIC: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'PUBLIC', 'I')),
        PRIVATE: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'PRIVATE', 'I')),
        PROTECTED: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'PROTECTED', 'I')),
        STATIC: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'STATIC', 'I')),
        FINAL: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'FINAL', 'I')),
        SYNCHRONIZED: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'SYNCHRONIZED', 'I')),
        VOLATILE: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'VOLATILE', 'I')),
        TRANSIENT: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'TRANSIENT', 'I')),
        NATIVE: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'NATIVE', 'I')),
        INTERFACE: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'INTERFACE', 'I')),
        ABSTRACT: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'ABSTRACT', 'I')),
        STRICT: this.getStaticIntField(handle, this.getStaticFieldId(handle, 'STRICT', 'I'))
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectModifier;
};

let javaLangReflectTypeVariable = null;
Env.prototype.javaLangReflectTypeVariable = function () {
  if (javaLangReflectTypeVariable === null) {
    const handle = this.findClass('java/lang/reflect/TypeVariable');
    try {
      javaLangReflectTypeVariable = {
        handle: register(this.newGlobalRef(handle)),
        getName: this.getMethodId(handle, 'getName', '()Ljava/lang/String;'),
        getBounds: this.getMethodId(handle, 'getBounds', '()[Ljava/lang/reflect/Type;'),
        getGenericDeclaration: this.getMethodId(handle, 'getGenericDeclaration', '()Ljava/lang/reflect/GenericDeclaration;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectTypeVariable;
};

let javaLangReflectWildcardType = null;
Env.prototype.javaLangReflectWildcardType = function () {
  if (javaLangReflectWildcardType === null) {
    const handle = this.findClass('java/lang/reflect/WildcardType');
    try {
      javaLangReflectWildcardType = {
        handle: register(this.newGlobalRef(handle)),
        getLowerBounds: this.getMethodId(handle, 'getLowerBounds', '()[Ljava/lang/reflect/Type;'),
        getUpperBounds: this.getMethodId(handle, 'getUpperBounds', '()[Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectWildcardType;
};

let javaLangReflectGenericArrayType = null;
Env.prototype.javaLangReflectGenericArrayType = function () {
  if (javaLangReflectGenericArrayType === null) {
    const handle = this.findClass('java/lang/reflect/GenericArrayType');
    try {
      javaLangReflectGenericArrayType = {
        handle: register(this.newGlobalRef(handle)),
        getGenericComponentType: this.getMethodId(handle, 'getGenericComponentType', '()Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectGenericArrayType;
};

let javaLangReflectParameterizedType = null;
Env.prototype.javaLangReflectParameterizedType = function () {
  if (javaLangReflectParameterizedType === null) {
    const handle = this.findClass('java/lang/reflect/ParameterizedType');
    try {
      javaLangReflectParameterizedType = {
        handle: register(this.newGlobalRef(handle)),
        getActualTypeArguments: this.getMethodId(handle, 'getActualTypeArguments', '()[Ljava/lang/reflect/Type;'),
        getRawType: this.getMethodId(handle, 'getRawType', '()Ljava/lang/reflect/Type;'),
        getOwnerType: this.getMethodId(handle, 'getOwnerType', '()Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectParameterizedType;
};

let javaLangString = null;
Env.prototype.javaLangString = function () {
  if (javaLangString === null) {
    const handle = this.findClass('java/lang/String');
    try {
      javaLangString = {
        handle: register(this.newGlobalRef(handle))
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangString;
};

Env.prototype.getClassName = function (classHandle) {
  const name = this.vaMethod('pointer', [])(this.handle, classHandle, this.javaLangClass().getName);
  try {
    return this.stringFromJni(name);
  } finally {
    this.deleteLocalRef(name);
  }
};

Env.prototype.getObjectClassName = function (objHandle) {
  const jklass = this.getObjectClass(objHandle);
  try {
    return this.getClassName(jklass);
  } finally {
    this.deleteLocalRef(jklass);
  }
};

Env.prototype.getActualTypeArgument = function (type) {
  const actualTypeArguments = this.vaMethod('pointer', [])(this.handle, type, this.javaLangReflectParameterizedType().getActualTypeArguments);
  this.checkForExceptionAndThrowIt();
  if (!actualTypeArguments.isNull()) {
    try {
      return this.getTypeNameFromFirstTypeElement(actualTypeArguments);
    } finally {
      this.deleteLocalRef(actualTypeArguments);
    }
  }
};

Env.prototype.getTypeNameFromFirstTypeElement = function (typeArray) {
  const length = this.getArrayLength(typeArray);
  if (length > 0) {
    const typeArgument0 = this.getObjectArrayElement(typeArray, 0);
    try {
      return this.getTypeName(typeArgument0);
    } finally {
      this.deleteLocalRef(typeArgument0);
    }
  } else {
    // TODO
    return 'java.lang.Object';
  }
};

Env.prototype.getTypeName = function (type, getGenericsInformation) {
  const invokeObjectMethodNoArgs = this.vaMethod('pointer', []);

  if (this.isInstanceOf(type, this.javaLangClass().handle)) {
    return this.getClassName(type);
  } else if (this.isInstanceOf(type, this.javaLangReflectParameterizedType().handle)) {
    const rawType = invokeObjectMethodNoArgs(this.handle, type, this.javaLangReflectParameterizedType().getRawType);
    this.checkForExceptionAndThrowIt();
    let result;
    try {
      result = this.getTypeName(rawType);
    } finally {
      this.deleteLocalRef(rawType);
    }

    if (result === 'java.lang.Class' && !getGenericsInformation) {
      return this.getActualTypeArgument(type);
    }

    if (getGenericsInformation) {
      result += '<' + this.getActualTypeArgument(type) + '>';
    }
    return result;
  } else if (this.isInstanceOf(type, this.javaLangReflectTypeVariable().handle)) {
    // TODO
    return 'java.lang.Object';
  } else if (this.isInstanceOf(type, this.javaLangReflectWildcardType().handle)) {
    // TODO
    return 'java.lang.Object';
  } else {
    return 'java.lang.Object';
  }
};

Env.prototype.getArrayTypeName = function (type) {
  const invokeObjectMethodNoArgs = this.vaMethod('pointer', []);

  if (this.isInstanceOf(type, this.javaLangClass().handle)) {
    return this.getClassName(type);
  } else if (this.isInstanceOf(type, this.javaLangReflectGenericArrayType().handle)) {
    const componentType = invokeObjectMethodNoArgs(this.handle, type, this.javaLangReflectGenericArrayType().getGenericComponentType);
    // check for TypeNotPresentException and MalformedParameterizedTypeException
    this.checkForExceptionAndThrowIt();
    try {
      return '[L' + this.getTypeName(componentType) + ';';
    } finally {
      this.deleteLocalRef(componentType);
    }
  } else {
    return '[Ljava.lang.Object;';
  }
};

Env.prototype.stringFromJni = function (str) {
  const utf = this.getStringUtfChars(str);
  if (utf.isNull()) {
    throw new Error("Can't access the string.");
  }
  try {
    return Memory.readUtf8String(utf);
  } finally {
    this.releaseStringUtfChars(str, utf);
  }
};

module.exports = Env;

/* global Memory, NativeFunction, NULL, Process, WeakRef */

},{}],6:[function(require,module,exports){
'use strict';

const JNI_OK = 0;

function checkJniResult (name, result) {
  if (result !== JNI_OK) {
    throw new Error(name + ' failed: ' + result);
  }
}

module.exports = {
  checkJniResult: checkJniResult,
  JNI_OK: 0
};

},{}],7:[function(require,module,exports){
'use strict';

const Env = require('./env');
const {JNI_OK, checkJniResult} = require('./result');

const JNI_VERSION_1_6 = 0x00010006;

const pointerSize = Process.pointerSize;

function VM (api) {
  let handle = null;
  let attachCurrentThread = null;
  let detachCurrentThread = null;
  let getEnv = null;
  const attachedThreads = {};

  function initialize () {
    handle = api.vm;

    const vtable = Memory.readPointer(handle);
    const options = {
      exceptions: 'propagate'
    };
    attachCurrentThread = new NativeFunction(Memory.readPointer(vtable.add(4 * pointerSize)), 'int32', ['pointer', 'pointer', 'pointer'], options);
    detachCurrentThread = new NativeFunction(Memory.readPointer(vtable.add(5 * pointerSize)), 'int32', ['pointer'], options);
    getEnv = new NativeFunction(Memory.readPointer(vtable.add(6 * pointerSize)), 'int32', ['pointer', 'pointer', 'int32'], options);
  }

  this.perform = function (fn) {
    let threadId = null;

    let env = this.tryGetEnv();
    const alreadyAttached = env !== null;
    if (!alreadyAttached) {
      env = this.attachCurrentThread();

      threadId = Process.getCurrentThreadId();
      attachedThreads[threadId] = true;
    }

    try {
      fn();
    } finally {
      if (!alreadyAttached) {
        const allowedToDetach = attachedThreads[threadId];
        delete attachedThreads[threadId];

        if (allowedToDetach) {
          this.detachCurrentThread();
        }
      }
    }
  };

  this.attachCurrentThread = function () {
    const envBuf = Memory.alloc(pointerSize);
    checkJniResult('VM::AttachCurrentThread', attachCurrentThread(handle, envBuf, NULL));
    return new Env(Memory.readPointer(envBuf), this);
  };

  this.detachCurrentThread = function () {
    checkJniResult('VM::DetachCurrentThread', detachCurrentThread(handle));
  };

  this.preventDetachDueToClassLoader = function () {
    const threadId = Process.getCurrentThreadId();
    if (threadId in attachedThreads) {
      attachedThreads[threadId] = false;
    }
  };

  this.getEnv = function () {
    const envBuf = Memory.alloc(pointerSize);
    checkJniResult('VM::GetEnv', getEnv(handle, envBuf, JNI_VERSION_1_6));
    return new Env(Memory.readPointer(envBuf), this);
  };

  this.tryGetEnv = function () {
    const envBuf = Memory.alloc(pointerSize);
    const result = getEnv(handle, envBuf, JNI_VERSION_1_6);
    if (result !== JNI_OK) {
      return null;
    }
    return new Env(Memory.readPointer(envBuf), this);
  };

  initialize.call(this);
}

module.exports = VM;

/* global Memory, NativeFunction, NULL, Process */

},{"./env":5,"./result":6}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhZ2VudC9pbmRleC50cyIsImFnZW50L2xvZ2dlci50cyIsImFnZW50L3RyYWNlci50cyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhL2xpYi9hbmRyb2lkLmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWphdmEvbGliL2Vudi5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhL2xpYi9yZXN1bHQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS9saWIvdm0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLHFDQUFpQztBQUNqQyxxQ0FBK0I7QUFFL0IsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNaLElBQUk7UUFDQSxjQUFLLENBQUM7WUFDRixPQUFPLENBQUMsVUFBVTtnQkFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsT0FBTyxDQUFDLFVBQVU7WUFDbEIsQ0FBQztTQUNKLENBQUMsQ0FBQztLQUNOO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixZQUFHLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hDO0FBQ0wsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOzs7OztBQ2ZULElBQUssV0FPSjtBQVBELFdBQUssV0FBVztJQUNaLG1EQUFXLENBQUE7SUFDWCwrQ0FBUyxDQUFBO0lBQ1QsNkNBQVEsQ0FBQTtJQUNSLDZDQUFRLENBQUE7SUFDUiwrQ0FBUyxDQUFBO0lBQ1QsK0NBQVMsQ0FBQTtBQUNiLENBQUMsRUFQSSxXQUFXLEtBQVgsV0FBVyxRQU9mO0FBQUEsQ0FBQztBQUNGLHNIQUFzSDtBQUN0SCxNQUFNLGVBQWUsR0FBUSxJQUFJLGNBQWMsQ0FDM0MsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxxQkFBcUIsQ0FBdUIsRUFDakYsS0FBSyxFQUNMLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBRW5DLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFbEQsU0FBZ0IsR0FBRyxDQUFDLE9BQWU7SUFDL0IsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuRCxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUhELGtCQUdDOzs7OztBQ25CRCxvREFBZ0Q7QUFDaEQscUNBQStCO0FBQy9CLE1BQU0sR0FBRyxHQUFHLGdCQUFNLEVBQUUsQ0FBQztBQU1yQixJQUFLLG9CQVVKO0FBVkQsV0FBSyxvQkFBb0I7SUFDckIsaUZBQW1CLENBQUE7SUFDbkIsK0VBQWtCLENBQUE7SUFDbEIsK0VBQWtCLENBQUE7SUFDbEIsMkVBQWdCLENBQUE7SUFDaEIsMEVBQWdCLENBQUE7SUFDaEIsZ0ZBQW1CLENBQUE7SUFDbkIsc0ZBQXNCLENBQUE7SUFDdEIscUVBQWEsQ0FBQTtJQUNiLHlHQUFnQyxDQUFBO0FBQ3BDLENBQUMsRUFWSSxvQkFBb0IsS0FBcEIsb0JBQW9CLFFBVXhCO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUVILFNBQWdCLEtBQUssQ0FBQyxTQUF5QjtJQUMzQyxZQUFHLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUM7SUFDL0IsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUV6QyxNQUFNLFdBQVcsR0FBUyxJQUFJLGNBQWMsQ0FDeEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBQyx5RkFBeUYsQ0FBdUIsRUFBQyxNQUFNLEVBQUMsQ0FBQyxTQUFTLEVBQUMsU0FBUyxFQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUMsVUFBVSw2QkFBOEIsRUFBQyxDQUFDLENBQUM7SUFHNU8sTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBRXZCLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRW5ELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMvRCxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUd0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBRXBDLFFBQU8sQ0FBQyxFQUFFO1lBQ04sS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakUsTUFBTTthQUNUO1lBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakUsTUFBTTthQUNUO1lBQ0QsT0FBTyxDQUFDLENBQUM7Z0JBQ0wsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDakUsTUFBTTthQUNUO1NBQ0o7UUFFRCxtRkFBbUY7UUFDbkYsbUVBQW1FO0tBQ3RFO0lBRUQsV0FBVyxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLENBQUMsYUFBYSxHQUFHLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQy9HLFlBQUcsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFLbkQsTUFBTTtJQUdOLDBCQUEwQjtJQUMxQiw2Q0FBNkM7QUFDakQsQ0FBQztBQXBERCxzQkFvREM7QUFFRCxNQUFNLEdBQUcsR0FBcUIsRUFBRSxDQUFDO0FBRWpDLFNBQVMsaUJBQWlCO0lBQ3RCLE1BQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFDLENBQUMsSUFBbUIsRUFBRSxNQUFxQixFQUFFLFVBQXlCLEVBQUUsTUFBcUIsRUFBRSxLQUFhLEVBQVEsRUFBRTtRQUN0SixZQUFHLENBQUMsNkJBQTZCLEdBQUcsVUFBVSxHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUMxRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVuQixPQUFPLFFBQVEsQ0FBQztBQUNwQixDQUFDO0FBQ0QsU0FBUyxnQkFBZ0I7SUFDckIsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQUMsQ0FBQyxJQUFtQixFQUFFLE1BQXFCLEVBQUUsVUFBeUIsRUFBRSxNQUFxQixFQUFFLEtBQWEsRUFBRSxXQUEwQixFQUFRLEVBQUU7UUFDbEwsWUFBRyxDQUFDLDZCQUE2QixHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsTUFBTSxHQUFHLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQztJQUNyRyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzdFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFbkIsT0FBTyxRQUFRLENBQUM7QUFDcEIsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsSUFBWTtJQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FBQyxDQUFDLElBQW1CLEVBQUUsTUFBcUIsRUFBUSxFQUFFO1FBQ3JGLFlBQUcsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFbkIsT0FBTyxRQUFRLENBQUM7QUFDcEIsQ0FBQzs7O0FDaEhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzE4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzE2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIn0=
