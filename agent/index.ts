/**
 * This template is the one we copy to generate the index.ts file.
 * The  file generated (index.ts) will be used to compile the tracer and the result 
 * will be integrated in the application for tests. 
 * We trace all functions, in the test bash script (reapet_experiment.....sh) we can decide to choose the short path or the long
 * one, each has his tracer_x86 
 */
import { trace_x86 } from "./tracer_x86";
import { log } from "./logger";

function wait(ms: number)
{
    var d = new Date().getTime();
    var d2 = null;
    do { d2 = new Date().getTime(); }
    while(d2 - d < ms);
}
//wait(10000);

setTimeout(() => {
    if(Process.arch == "ia32") {
        log(" !!! We are on  processor " + Process.arch);
        try {
            trace_x86({
                onEnter(methodName) {
                    console.log("onEnter", methodName);
                },
                onLeave(methodName) {
                }
            },
            /*InstallReceiver ->
onReceive() (2808), ScanQueue -> addPackage() , ScanQueue
-> addNew(), ScanHandler -> doScan(), Scanner ->
scan(), DexParser -> scanAPK()  (2838), ActScanResults
-> onBound()*/
            
            new RegExp (['com\.zoner\.android\.antivirus\.svc\.ZapService(.|\$)*InstallReceiver',
            '|com\.zoner\.android\.antivirus\.scan(.|\$)*',
         
            
            '|com\.zoner\.android\.antivirus\.scan\.DexParser(.|\$)*',
            '|com\.zoner\.android\.antivirus\.ui\.ActScanResults(.|\$)*',

            /*
            'com\.zoner\.android\.antivirus\.svc\.NetMonitor',
            '|com\.zoner\.android\.antivirus\.scan\.Scanner(.|\$)*',
               '|com\.zoner\.android\.antivirus\.scan\.ScanQueue(.|\$)*',
            '|com\.zoner\.android\.antivirus\.scan\.ScanHandler(.|\$)*',
            '|com\.zoner\.android\.antivirus\.svc\.ServiceBinder',
            '|com\.zoner\.android\.antivirus\.ui\.ActScanResults',
            '|com\.zoner\.android\.antivirus\.svc\.ZapService',
            
            '|com\.zoner\.android\.antivirus\.svc\.ZapService\.MountReceiver',
            '|com\.zoner\.android\.antivirus\.svc\.ZapService\.NetworkStateReceiver',
            '|com\.zoner\.android\.antivirus\.svc\.ZapService\.InstallReceiver',
            '|com\.zoner\.android\.library\.common\.gcm\.CloudReceiver',
            '|com\.zoner\.android\.library\.common\.gcm\.CloudMessaging',
            '|com\.zoner\.android\.library\.common\.gcm\.CloudNotifier',
            '|com\.zoner\.android\.antivirus\.ui\.WidgetStatus',
            '|com\.zoner\.android\.antivirus\.scan\.CloudScanner',
            '|com\.zoner\.android\.antivirus\.ui\.ActScanResults'*/
         
        ].join('')),
        new RegExp (['\bonReceive$',
            '|\baddPackage$',
            '|\baddNew$',
            '|\bdoScan$',
            '|\bscan$',
            '|\bscanAPK$',
            '|\bonBound$',

            /*'|scanPackages',
            '|addDemand',
            '|onReceive',
            '|',
            '|checkWifiSecurity',
            '|consumeMessage',
            '|notifyNow',
            '|onStartCommand',
            '|demandResolved',
            '|onBound',
            '|notifyCloud',
            '|updateStatus',
            '|update',
            '|run',
            '|send',
            '|nextRequest',
            '|ignoreSelected',
            '|resultsResolved',
            '|removeSelected',
            '|resultsResolved',
            '|onScanFinish',
            '|showResults',
            '|stopScan',
            '|resumeScan'*/
        ].join('')),
            );
        } catch (error) {
            log("Odile_Error --------> " + error.stack);
        }    
    } else {
        log(" !!! We are on another processor " + Process.arch);
    }  
}, 1000);

