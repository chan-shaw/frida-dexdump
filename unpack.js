function getFunctionName() {
    var functionName = "";
    // android 5和之后的壳
    var artExports =  Module.enumerateExportsSync('libart.so');
    var i = 0;
    for (i = 0; i < artExports.length; i++) {
        if(artExports[i].name.indexOf("OpenMemory") !== -1) {
            functionName = artExports[i].name;
            console.log("index " + i + " function name: "+ functionName);
            break;
        } else if (artExports[i].name.indexOf("OpenCommon") !== -1) {
            functionName = artExports[i].name;
            console.log("index " + i + " function name: "+ functionName);
            break;
        }
    }
    return functionName;
}

function getProcessName() {
    var processName = "";

    var fopenPtr = Module.findExportByName("libc.so", "fopen");
    var fopenFunc = new NativeFunction(fopenPtr, 'pointer', ['pointer', 'pointer']);
    var fgetsPtr = Module.findExportByName("libc.so", "fgets");
    var fgetsFunc = new NativeFunction(fgetsPtr, 'int', ['pointer', 'int', 'pointer']);
    var fclosePtr = Module.findExportByName("libc.so", "fclose");
    var fcloseFunc = new NativeFunction(fclosePtr, 'int', ['pointer']);

    var pathPtr = Memory.allocUtf8String("/proc/self/cmdline");
    var openFlagsPtr = Memory.allocUtf8String("r");

    var fp = fopenFunc(pathPtr, openFlagsPtr);
    if(fp.isNull() === false){
        var buffData = Memory.alloc(128);
        var ret = fgetsFunc(buffData, 128, fp);
        if(ret !== 0){
            processName = Memory.readCString(buffData);
            send(processName)
        }
        fcloseFunc(fp);
    }
    return processName;
}

var i = 0;
Interceptor.attach(Module.findExportByName("libart.so",getFunctionName()), {
    onEnter: function (args) {
        console.log("base: "+ args[1]);
        console.log("size: "+ args[2].toInt32());
        console.log(hexdump(
            args[1],{
                offset: 0,
                length: 64,
                header: true,
                ansi: true
            }
            ));
        send("begin unpack!");
        var begin = args[1];

        console.log("magic : " + Memory.readUtf8String(begin));
        var address = parseInt(begin,16) + 0x20;
        var dex_size = Memory.readInt(ptr(address));
        console.log("dex_size :" + dex_size);
        var processName = getProcessName();
        var dex_path = "/data/data/" + processName + "/" + "dex"+ i + ".dex";
        i++;
        var dex_file = new File(dex_path, "wb");
        dex_file.write(Memory.readByteArray(begin, dex_size));
        dex_file.flush();
        dex_file.close();
        var send_data = {};
        send_data.base = parseInt(begin,16);
        send_data.size = dex_size;
        send(send_data)
    },
    onLeave: function (retval) {
        if (retval.toInt32() > 0) {
        }
    }
});
