import frida
import sys
import codecs


def on_message(message, data):
    if message['type'] == 'send':
        print("[*] {0}".format(message['payload']))
    else:
        print(message)


if __name__ == '__main__':
    # package = sys.argv[1]
    package = "com.a.sample.loopcrypto"
    print("dex 导出目录为: /data/data/{0}".format(package))
    device = frida.get_usb_device()
    pid = device.spawn(package)
    process = device.attach(pid)
    # 不用名称的原因是app动态加载dex是在onCreate的时候
    # 而使用名称attach时在app运行时，而不是我们对Activity进行操作时
    # process = device.attach(package)
    # 可以直接定义变量jscode如下
    # jscode = '''
    #  what we want to do
    # '''
    with codecs.open('unpack.js', 'r', 'utf-8') as f:
        source = f.read()
    script = process.create_script(source)
    script.on('message', on_message)
    script.load()
    device.resume(pid)
    sys.stdin.read()