
Forerunner SDK
--------------

The Forerunner SDK is comprised of a collection of JQuery Widgets and JavaScript namespaces. All 
Forerunner Widgets are defined as part of the [$](/Docs/$.html) namespace. All Forerunner namspaces 
are defined under the [forerunner](/Docs/forerunner.html) namespace. As an example, all the buttons 
used in the [$.forerunner.toolbar](/Docs/$.forerunner.toolbar.html) widget are defined in the 
[forerunner.ssr.tools.toolbar](/Docs/forerunner.ssr.tools.toolbar.html) namespace. All the code used 
to create the Forerunner Mobilizer product is available in the SDK via widgets. In point of fact, 
Mobilizer is built from Forerunner SDK itself. Additionally all Forerunner widgets use cascading style 
sheets. These .css files can be used as is or modified in your own web applications.

Folder Structure
----------------
When the Forerunner Mobilizer setup program is run, the Mobilizer product is ready to use out of the box. 
As part of Mobilizer product installation, the SDK files are installed as well. The default destination 
folder is:

c:\Program Files (x86)\Forerunner Mobilizer\ForerunnerMobilizer\

But this can be changed during installation. From the destination folder, the SDK folders are as follows:

	destination\
		Forerunner\
			Bundles\
			Common\
			Lib\
			ReportExplorer\
			ReportViewer\

Where:

	Forerunner
		In order to use the Forerunner SDK in your own pages you will need to
		copy this folder and all subfolders to your web application. Everything
		you need is under this folder.

	Forerunner\Bundles
		Containes the JavaScript files that need to be included in your pages as
		follows:
			Forerunner.min.js
			Forerunner-tools.min.js
			Forerunner-widgets.min.js

		In addition to the minified files above, the un-minified version of
		Forerunner-tools.js is included as an example of how to setup buttons.

	Forerunner\Common
		Contains the css file: css\Forerunner-all.css. This is the only Forerunner
		specific .css file you will need to include in any new pages you create.

	Forerunner\Lib
		Contains the external frameworks needed by the forerunner SDK such as jQuery.

	Forerunner\ReportExplorer
		Contains the resource files (E.g., css and image files) needed by the ReportExplorerEZ widget.

	Forerunner\ReportViewer
		Contains the resource files needed by the ReportViewerEZ widget.

Tutorials / Sample Code
-----------------------

See the "[Getting Started](tutorial-GettingStarted.html)" tutorial to get some hands on creating your own Forerunner enabled 
web applications.
