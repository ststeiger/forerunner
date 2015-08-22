This folder contains all the files needed to generate the Forerunner SDK - Rest API documentation.
You will need to install the doxygen.exe program which can be obtained from here:

  http://www.doxygen.org

In order to generate the html pages just run the command:

  doxygen

From the folder: 
  ...\GitHub\<branch>\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\doxygen

doxygen uses the configuration file doxyfile for all the runtime settings. doxygen will
output all the generated files to the folder: 
  ...\GitHub\<branch>\ForerunnerSW\ForerunnerSW\APIDocs

The doxygen installation also contains:
  - The configration file GUI editing program named doxywizard.exe
  - HTML based help here:
      file:///C:/Program%20Files/doxygen/html/index.html
