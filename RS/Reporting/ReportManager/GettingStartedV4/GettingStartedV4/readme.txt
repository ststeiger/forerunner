ForerunnerGettingStartedV4

Verify the install-package ran through successfully. If you see any errors
in the "Package Manager Console", look at the forum article here:

https://forerunnersw.com/SMForum/index.php?topic=92.msg179#msg179

After you have installed the ForerunnerGettingStartedV4 package you
will need to configure the settings. A Package Manager Console command
has been supplied to make this as easy as possible.

The new command is named Set-FRConfig and you run it  from the
Package Manager console window:

"Tools" -> "NuGet Package Manager" -> "Package Manager Console".

You can run Set-FRConfig as follows:

Set-FRConfig -Verbose

Set-FRConfig will prompt you for any / all input it needs to configure
the Forerunner SDK in your application. If you are interested in more information
about Set-FRConfig you can get help as follows:

Set-FRConfig -?

You will need a trial license to evaluate ForerunnerSDK. You can get a free 30
day trial license key here:

https://www.forerunnersw.com/registerTrial

You can find samples of how to create the report viewer and report explorer widgets
here:

http://forerunnersw.com/samplesV4

Your done, enjoy!
