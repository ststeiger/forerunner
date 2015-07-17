Forerunner_AllSamplesV4

Verify the install-package ran through successfully. If you see any errors
in the "Package Manager Console", look at the forum article here:

https://forerunnersw.com/SMForum/index.php?topic=92.msg179#msg179

After you have installed the Forerunner_AllSamplesV4 package you
will need to configure the settings. Two Package Manager Console commands
have been supplied to make this as easy as possible.

Open the Package Manager console window as follows:

"Tools" -> "NuGet Package Manager" -> "Package Manager Console"

Step 1:
  Run the command: Set-FRConfig -Verbose

    Set-FRConfig will prompt you for the minimum set of parameters
    needed to configure the Forerunner SDK. Specifically you will
    need to supply your license key and your report server URL.

    You will need a trial license to evaluate All Samples V4. You
    can get a free 30 day trial license key here:

    https://www.forerunnersw.com/registerTrial

Step 2:
  Run the command: Set-ASConfig - Verbose

    Set-ASConfig will also prompt for parameters needed to configure
    the All Samples application. Specifically it will prompt you for
    three report paths.

    After you have supplied the three report paths all samples will
    run. The application should be self explanatory. The one exception
    is the parameters sample. You will need to setup the parameters
    to work with the specific parameters for the report path 1.

    If you look at the file ~/lib/samples/js/Parameters.js it should
    be clear what you will need to do to modify the sample to work
    properly with your own report.

Your done, enjoy!

Note that you must successfully (I.e., no errors) install the package,
and run the two config commands above. If any step fails you need to
stop and fix whatever the issue might be and re-run the installation
or command. Make sure your version of Visual Studio is up to date. If
you get stuck, you can contact us at:

    Support@ForerunnerSW.com
