import {ArgParser} from "/scripts/lib/arg-parser";

/**
 * Display an ASCII banner, optionally automatically after reboots.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('banner.js', 'Display an ASCII banner.', [
        {name: 'reboot', desc: 'Automatically display after game reboots', flags: ['-r', '--reboot'], default: false}
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'].length)
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    ns.tprint(`

                &&&&&&&&  O  &&&&&&&&
             &&& & &&   CDDDD  &&&&&&&&&&
          &&&& &&&   &&  &&&  &&&&&&&&&&&&&
        &&&&& && &&   & .&&&.  &&&&&&&&&&&&&&
      &&&&&&&&&& &&  && &&&&&  &&&&&&&&&&&&&&&
     &&&&&&&&  &&    &  &&&&&  &&&&&&&&&&&&&&&&
    &&&&&&&&&& &&&      &&&&&  &&&&&&&&&&&&&&&&
   &&&&&&&&&&&&&&&&     *&&&*  *&&&&&&&&&&&&&&&
   &&&&&&&&&&&&&      &&&&&&&&&  *&&&&&&*   .&&
  &&&&&&&&&&&       &&&  & &  &&&  &&*     .&&&
  &&&&&&&&&&             & &  ,,,,,*      .&&&&
  &&&&&                  & &  &&&&&&&&&&&&&&&&
  &&  &&&&               & &  & &&&&&&&&&&&&&&
   &&     &&&&&&&        & &  &  &&&&&*   &&&&&
   &&       &&&&&&&&     & &  &&&&&&&*    &&&*
    &&      &&&&&&&&&&&  & &  &&&& &* 
     &&       &&&&&&&&&  & &   && &&
      &&&       &&&&&&   & &   && &&
        &&&      &&&&    & &   && &&
          &&&&   &&&     & &   && &&
             &&&&&&&     \\&/   && &&
                 &&&&&&   V    &* &*

	`);

    // Prevent from exiting so the banner will automatically display on startup.
    if(args['reboot']) while(true) { await ns.sleep(1000 * 60); }
}
